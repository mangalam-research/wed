/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var global = require("../global");
  var testutil = require("../util");
  var wedTestUtil = require("../wed-test-util");
  var $ = require("jquery");
  var wed = require("wed/wed");
  var key_constants = require("wed/key-constants");
  var onerror = require("wed/onerror");
  var log = require("wed/log");
  var salve = require("salve");
  var browsers = require("wed/browsers");
  var globalConfig = require("global-config");
  var mergeOptions = require("merge-options");
  var source = require("text!../wed_test_data/source_converted.xml");

  var _slice = Array.prototype.slice;
  var waitForSuccess = testutil.waitForSuccess;
  var activateContextMenu = wedTestUtil.activateContextMenu;
  var contextMenuHasOption = wedTestUtil.contextMenuHasOption;
  var firstGUI = wedTestUtil.firstGUI;
  var lastGUI = wedTestUtil.lastGUI;
  var getElementNameFor = wedTestUtil.getElementNameFor;
  var caretCheck = wedTestUtil.caretCheck;
  var dataCaretCheck = wedTestUtil.dataCaretCheck;
  var getAttributeValuesFor = wedTestUtil.getAttributeValuesFor;
  var getAttributeNamesFor = wedTestUtil.getAttributeNamesFor;

  var base_options = {
    schema: "/build/schemas/tei-simplified-rng.js",
    mode: {
      path: "wed/modes/test/test-mode",
      options: {
        metadata: "/build/schemas/tei-metadata.json",
      },
    },
  };
  var assert = chai.assert;

  var wedframe = window.parent.document.getElementById("wedframe");
  var wedwin = wedframe.contentWindow;
  var src_stack = ["../wed_test_data/source_converted.xml"];
  var option_stack = [base_options];

  function mergeWithGlobal(options) {
    var ret;
    // Simulate the old ignore_module_config.
    if (options.ignore_module_config) {
      ret = mergeOptions({}, options);
      delete ret.ignore_module_config;
    }
    else {
      ret = mergeOptions({}, globalConfig.config, options);
    }
    return ret;
  }

  function contextMenuHasNoTransforms(editor) {
    var menu = editor.window.document.getElementsByClassName(
      "wed-context-menu")[0];
    assert.isDefined(menu, "the menu should exist");
    var items = menu.querySelectorAll("li[data-kind]");
    assert.equal(items.length, 0, "there should be no items that can " +
                 "transform the document");
  }

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  var itNoIE = browsers.MSIE ? it.skip : it;

  // Utility to check whether we have stray timeouts. This is usually not used
  // but we want to have it at hand for diagnosis. So:
  //
  // eslint-disable-next-line no-unused-vars
  function patchTimeouts(window) {
    var timeouts = [];

    var old_st = window.setTimeout;
    window.setTimeout = function setTimeout() {
      var ret;
      if (typeof arguments[0] === "function") {
        var fn = arguments[0];
        var fn_args = _slice.call(arguments, 2);
        ret = old_st(function timeout() {
          /* eslint-disable no-console */
          console.log("timeout executed", ret);
          /* eslint-enable */

          // Remove the timeout from the list.
          var ix = timeouts.indexOf(ret);
          if (ix >= 0) {
            timeouts.splice(ix, ret);
          }
          fn.apply(this, fn_args);
        }, arguments[1]);
      }
      else {
        // We don't support the first argument being something
        // else than a function. We'll get erroneous uncleared
        // timeouts but, oh well.
        ret = old_st.apply(this, arguments);
      }
      /* eslint-disable no-console */
      console.log("setTimeout returned", ret, "from", arguments);
      console.log(new Error().stack);
      /* eslint-enable */
      timeouts.push(ret);
      return ret;
    };

    var old_ct = window.clearTimeout;
    window.clearTimeout = function clearTimeout() {
      /* eslint-disable no-console */
      console.log("clearTimeout", arguments);
      console.log(new Error().stack);
      /* eslint-enable */
      var ix = timeouts.indexOf(arguments[0]);
      if (ix >= 0) {
        timeouts.splice(ix, 1);
      }
      return old_ct.apply(this, arguments);
    };

    window.checkTimeouts = function checkTimeouts() {
      /* eslint-disable no-console */
      console.log("uncleared", timeouts);
      /* eslint-enable */
      timeouts = [];
    };
  }

  describe("wed", function wedBlock() {
    describe("(state-sensitive)", function stateSensitive() {
      // These are tests that required a brand new editor. Since it is costly to
      // create a new editor for each individual test, we don't want to put in
      // this `describe` the tests that don't need such initialization.

      before(function before(done) {
        // Resolve the schema to a grammar.
        $.get(require.toUrl(base_options.schema), function success(x) {
          base_options.schema = salve.constructTree(x);
          done();
        }, "text").fail(
          function fail(jqXHR, textStatus, errorThrown) {
            throw new Error(textStatus + " " + errorThrown);
          });
      });

      var force_reload = false;
      var editor;
      var caretManager;
      beforeEach(function beforeEach(done) {
        require(["text!" + src_stack[0]], function loaded(data) {
          var wedroot = wedwin.document.getElementById("wedroot");
          editor = new wed.Editor(wedroot, mergeWithGlobal(option_stack[0]));
          editor.init(data)
            .then(function initialized() {
              caretManager = editor.caretManager;
              done();
            });
        });
        force_reload = false;
      });

      afterEach(function afterEach(done) {
        if (editor) {
          editor.destroy();
        }
        editor = undefined;
        caretManager = undefined;

        // We read the state, reset, and do the assertion later so
        // that if the assertion fails, we still have our reset.
        var was_terminating = onerror.is_terminating();

        // We don't reload our page so we need to do this.
        onerror.__test.reset();
        log.clearAppenders();
        assert.isFalse(was_terminating,
                       "test caused an unhandled exception to occur");

        if (force_reload) {
          wedframe.onload = function onload() {
            wedframe.onload = undefined;
            done();
          };
          wedwin.location.reload();
        }
        else {
          done();
        }
      });

      it("starts with undefined carets and selection ranges", function test() {
        assert.isUndefined(caretManager.caret, "no gui caret");
        assert.isUndefined(caretManager.getDataCaret(), "no data caret");
        assert.isUndefined(caretManager.range, "no gui selection range");
      });

      it("has a modification status showing an unmodified document " +
         "when starting",
         function test() {
           assert.isTrue(
             editor.$modificationStatus.hasClass("label-success"));
         });

      it("has a modification status showing an modified document " +
         "when the document is modified",
         function test() {
           editor.validator._validateUpTo(editor.dataRoot, -1);
           // Text node inside title.
           var initial = editor.guiRoot.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);
           editor.type(" ");

           assert.isTrue(editor.$modificationStatus.hasClass("label-warning"));
         });

      it("onbeforeunload returns falsy on unmodified doc", function test() {
        assert.isFalse(!!editor.window.onbeforeunload());
      });

      it("onbeforeunload returns truthy on modified doc", function test() {
        editor.validator._validateUpTo(editor.dataRoot, -1);
        // Text node inside title.
        var initial = editor.guiRoot.getElementsByClassName("title")[0]
              .childNodes[1];
        caretManager.setCaret(initial, 0);
        editor.type(" ");

        assert.isTrue(!!editor.window.onbeforeunload());
      });

      it("has a modification status showing an unmodified document " +
         "when the document is modified but saved",
         function test() {
           editor.validator._validateUpTo(editor.dataRoot, -1);
           // Text node inside title.
           var initial = editor.guiRoot.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);
           editor.type(" ");

           assert.isTrue(editor.$modificationStatus.hasClass("label-warning"));
           editor.type(key_constants.CTRLEQ_S);
           return waitForSuccess(function check() {
             assert.isTrue(
               editor.$modificationStatus.hasClass("label-success"));
           });
         });

      it("has a save status showing an unsaved document when starting",
         function test() {
           assert.isTrue(editor.$saveStatus.hasClass("label-default"));
           assert.equal(editor.$saveStatus.children("span").text(), "");
         });

      it("has a save status showing a saved document after a save",
         function test() {
           assert.isTrue(editor.$saveStatus.hasClass("label-default"));
           assert.equal(editor.$saveStatus.children("span").text(), "");

           editor.type(key_constants.CTRLEQ_S);
           return waitForSuccess(function check() {
             assert.isTrue(editor.$saveStatus.hasClass("label-success"));
             assert.equal(editor.$saveStatus.children("span").text(),
                          "moments ago");
             // We also check the tooltip text.
             assert.equal(editor.$saveStatus.data("bs.tooltip").getTitle(),
                          "The last save was a manual save.");
           });
         });

      it("has a save status showing a saved document after an autosave",
         function test() {
           assert.isTrue(editor.$saveStatus.hasClass("label-default"));
           assert.equal(editor.$saveStatus.children("span").text(), "");

           editor.validator._validateUpTo(editor.dataRoot, -1);
           // Text node inside title.
           var initial = editor.guiRoot.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);
           editor.type(" ");
           editor.saver.setAutosaveInterval(50);
           return waitForSuccess(function check() {
             assert.isTrue(editor.$saveStatus.hasClass("label-info"));
             assert.equal(editor.$saveStatus.children("span").text(),
                          "moments ago");
             // We also check the tooltip text.
             assert.equal(editor.$saveStatus.data("bs.tooltip").getTitle(),
                          "The last save was an autosave.");
           });
         });

      it("has a save status tooltip is updated after a different kind of " +
         "save occurs",
         function test() {
           editor.validator._validateUpTo(editor.dataRoot, -1);
           // Text node inside title.
           var initial = editor.guiRoot.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);
           editor.type(" ");
           editor.saver.setAutosaveInterval(50);
           return waitForSuccess(function check() {
             // We check the initial tooltip text.
             var tooltip = editor.$saveStatus.data("bs.tooltip");
             assert.isDefined(tooltip);
             assert.equal(tooltip.getTitle(), "The last save was an autosave.");
           })
             .then(function afterAutoSave() {
               // Now perform a save.
               editor.type(key_constants.CTRLEQ_S);
               return waitForSuccess(function check() {
                 // We check the tooltip changed.
                 var tooltip = editor.$saveStatus.data("bs.tooltip");
                 assert.isDefined(tooltip);
                 assert.equal(tooltip.getTitle(),
                              "The last save was a manual save.");
               });
             });
         });

      it("doing an attribute addition changes the data", function test() {
        var p = editor.guiRoot.querySelector(".body>.p");
        var data_p = editor.toDataNode(p);
        editor.validator._validateUpTo(data_p.firstChild ||
                                       data_p.nextElementSibling, 0);
        var el_name = getElementNameFor(p);
        assert.equal(getAttributeValuesFor(p).length, 0, "no attributes");
        var trs = editor.modeTree.getMode(el_name).getContextualActions(
          ["add-attribute"], undefined, el_name, 0);
        var tr = trs[0];
        var data = { node: data_p, name: "abbr" };

        caretManager.setCaret(el_name.firstChild, 0);
        caretCheck(editor, el_name.firstChild, 0,
                   "the caret should be in the element name");
        tr.execute(data);
        var attr_vals = getAttributeValuesFor(p);
        assert.equal(attr_vals.length, 1, "one attribute");
        caretCheck(editor, attr_vals[0].firstChild, 0,
                   "the caret should be in the attribute value");

        var data_node = editor.toDataNode(attr_vals[0]);
        assert.isTrue(!!data_node);
        assert.equal(data_node.value, "");
        assert.equal(data_node.name, "abbr");
      });

      it("doing an attribute deletion changes the data", function test() {
        var ps = editor.guiRoot.querySelectorAll(".body>.p");
        var p = ps[7];
        var data_p = editor.toDataNode(p);
        editor.validator._validateUpTo(data_p.firstChild ||
                                       data_p.nextElementSibling, 0);
        var attr_names = getAttributeNamesFor(p);
        var attr_values = getAttributeValuesFor(p);
        var initial_length = attr_values.length;
        assert.isTrue(initial_length > 0,
                      "the paragraph should have attributes");
        var attr = editor.toDataNode(attr_values[0]);
        var decoded_name = attr_names[0].textContent;
        var trs = editor.modeTree.getMode(attr).getContextualActions(
          ["delete-attribute"], decoded_name, attr);
        var tr = trs[0];
        var data = { node: attr, name: decoded_name };

        caretManager.setCaret(attr, 0);
        caretCheck(editor, attr_values[0].firstChild, 0,
                   "the caret should be in the attribute");
        tr.execute(data);
        attr_values = getAttributeValuesFor(p);
        assert.equal(attr_values.length, initial_length - 1,
                     "one attribute should be gone");
        caretCheck(editor, attr_values[0].firstChild, 0,
                   "the caret should be in the first attribute value");

        assert.isNull(attr.ownerElement,
                      "the old attribute should not have an onwer element");
        assert.isNull(data_p.getAttribute(attr.name));
      });

      it("an element that becomes empty acquires a placeholder",
         function test() {
           editor.validator._validateUpTo(editor.dataRoot, -1);

           // Text node inside title.
           var initial = editor.dataRoot.getElementsByTagName("title")[0];

           // Make sure we are looking at the right thing.
           assert.equal(initial.childNodes.length, 1);
           assert.equal(initial.firstChild.nodeValue, "abcd");
           caretManager.setCaret(initial, 0);
           var caret = caretManager.getNormalizedCaret();
           assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");

           // Delete all contents.
           editor.dataUpdater.removeNode(initial.firstChild);

           // We should have a placeholder now, between the two labels.
           assert.equal(caret.node.childNodes.length, 3);
           assert.isTrue(caret.node.childNodes[1].classList.contains(
             "_placeholder"));
         });

      it("an element that goes from empty to not empty is properly decorated",
         function test() {
           editor.validator._validateUpTo(editor.dataRoot, -1);

           var initial = editor.guiRoot.querySelector(".publicationStmt>.p");
           var initial_data = editor.toDataNode(initial);

           // Make sure we are looking at the right thing.
           assert.equal(initial_data.childNodes.length, 0);
           caretManager.setCaret(initial_data, 0);
           editor.type("a");
           assert.equal(initial_data.childNodes.length, 1);
           // Check the contents of the GUI tree to make sure it has a start,
           // end labels and one text node.
           assert.equal(initial.childNodes.length, 3);
           var cl;
           assert.isTrue((cl = initial.firstChild.classList) &&
                         cl.contains("_p_label") &&
                         cl.contains("__start_label"),
                         "should have a start label");
           assert.equal(initial.childNodes[1].nodeType, Node.TEXT_NODE);
           assert.isTrue((cl = initial.lastChild.classList) &&
                         cl.contains("_p_label") &&
                         cl.contains("__end_label"),
                         "should have an end label");
         });

      it("unwraps elements", function test() {
        editor.validator._validateUpTo(editor.dataRoot, -1);

        // Text node inside title.
        var initial = editor.dataRoot.getElementsByTagName("title")[0];

        // Make sure we are looking at the right thing.
        assert.equal(initial.childNodes.length, 1);
        assert.equal(initial.firstChild.nodeValue, "abcd");
        caretManager.setCaret(initial, 0);
        var caret = caretManager.getNormalizedCaret();
        assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");

        var trs = editor.modeTree.getMode(initial)
          .getContextualActions(["wrap"], "hi", initial, 0);

        var tr = trs[0];
        var data = { node: undefined, name: "hi" };
        caretManager.setCaret(initial.firstChild, 1);
        caret = caretManager.getNormalizedCaret();
        caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

        tr.execute(data);

        var node = initial.getElementsByTagName("hi")[0];
        trs = editor.modeTree.getMode(node)
          .getContextualActions(["unwrap"], "hi", node, 0);

        tr = trs[0];
        data = { node: node, element_name: "hi" };
        tr.execute(data);
        assert.equal(initial.childNodes.length, 1, "length after unwrap");
        assert.equal(initial.firstChild.nodeValue, "abcd");
      });

      it("wraps elements in elements (offset 0)", function test() {
        editor.validator._validateUpTo(editor.dataRoot, -1);

        // Text node inside title.
        var initial = editor.dataRoot.querySelectorAll("body>p")[4];

        // Make sure we are looking at the right thing.
        assert.equal(initial.childNodes.length, 1);
        assert.equal(initial.firstChild.nodeValue, "abcdefghij");

        var trs = editor.modeTree.getMode(initial)
          .getContextualActions(["wrap"], "hi", initial, 0);

        var tr = trs[0];
        var data = { node: undefined, name: "hi" };
        caretManager.setCaret(initial.firstChild, 3);
        var caret = caretManager.getNormalizedCaret();
        caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

        tr.execute(data);

        assert.equal(initial.outerHTML,
                     "<p xmlns=\"http://www.tei-c.org/ns/1.0\">abc<hi>de" +
                     "</hi>fghij</p>");
        assert.equal(initial.childNodes.length, 3, "length after first wrap");

        caret = caretManager.fromDataLocation(initial.firstChild, 0);
        caretManager.setRange(
          caret, caretManager.fromDataLocation(initial.lastChild, 0));

        tr.execute(data);

        assert.equal(initial.outerHTML,
                     "<p xmlns=\"http://www.tei-c.org/ns/1.0\"><hi>abc" +
                     "<hi>de</hi></hi>fghij</p>");
        assert.equal(initial.childNodes.length, 2, "length after second wrap");
      });

      it("wraps elements in elements (offset === nodeValue.length)",
         function test() {
           editor.validator._validateUpTo(editor.dataRoot, -1);

           // Text node inside title.
           var initial = editor.dataRoot.querySelectorAll("body>p")[4];

           // Make sure we are looking at the right thing.
           assert.equal(initial.childNodes.length, 1);
           assert.equal(initial.firstChild.nodeValue, "abcdefghij");

           var trs = editor.modeTree.getMode(initial).getContextualActions(
             ["wrap"], "hi", initial, 0);

           var tr = trs[0];
           var data = { node: undefined, name: "hi" };
           var caret = caretManager.fromDataLocation(initial.firstChild, 3);
           caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

           tr.execute(data);

           assert.equal(initial.outerHTML,
                        "<p xmlns=\"http://www.tei-c.org/ns/1.0\">abc<hi>de" +
                        "</hi>fghij</p>");
           assert.equal(initial.childNodes.length, 3,
                        "length after first wrap");

           // We can't set this to the full length of the node value on Chrome
           // because Chrome will move the range into the <div> that you see
           // above in the innerHTML test. :-/

           caret = caretManager.fromDataLocation(
             initial.firstChild,
             initial.firstChild.nodeValue.length - 1);
           caretManager.setRange(
             caret, caretManager.fromDataLocation(
               initial.lastChild,
               initial.lastChild.nodeValue.length));

           tr.execute(data);

           assert.equal(
             initial.outerHTML,
             "<p xmlns=\"http://www.tei-c.org/ns/1.0\">ab<hi>c<hi>de</hi>" +
               "fghij</hi></p>");
           assert.equal(initial.childNodes.length, 2,
                        "length after second wrap");
         });

      it("wraps elements in elements (no limit case)", function test() {
        editor.validator._validateUpTo(editor.dataRoot, -1);

        // Text node inside title.
        var initial = editor.dataRoot.querySelectorAll("body>p")[4];

        // Make sure we are looking at the right thing.
        assert.equal(initial.childNodes.length, 1);
        assert.equal(initial.firstChild.nodeValue, "abcdefghij");

        var trs = editor.modeTree.getMode(initial)
            .getContextualActions(["wrap"], "hi", initial, 0);

        var tr = trs[0];
        var data = { node: undefined, name: "hi" };
        var caret = caretManager.fromDataLocation(initial.firstChild, 3);
        caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

        tr.execute(data);

        assert.equal(initial.childNodes.length, 3, "length after first wrap");
        assert.equal(initial.outerHTML,
                     "<p xmlns=\"http://www.tei-c.org/ns/1.0\">abc<hi>de" +
                     "</hi>fghij</p>");

        caret = caretManager.fromDataLocation(initial.firstChild, 2);
        caretManager.setRange(
          caret,
          caretManager.fromDataLocation(initial.lastChild, 2));

        tr.execute(data);

        assert.equal(initial.childNodes.length, 3, "length after second wrap");
        assert.equal(initial.outerHTML,
                     "<p xmlns=\"http://www.tei-c.org/ns/1.0\">ab<hi>c" +
                     "<hi>de</hi>fg</hi>hij</p>");
      });


      it("wraps text in elements (no limit case)", function test() {
        editor.validator._validateUpTo(editor.dataRoot, -1);

        // Text node inside title.
        var initial = editor.dataRoot.querySelectorAll("body>p")[4];

        // Make sure we are looking at the right thing.
        assert.equal(initial.childNodes.length, 1);
        assert.equal(initial.firstChild.data, "abcdefghij");

        var trs = editor.modeTree.getMode(initial)
          .getContextualActions(["wrap"], "hi", initial, 0);

        var tr = trs[0];
        var data = { node: undefined, name: "hi" };
        var caret = caretManager.fromDataLocation(initial.firstChild, 0);
        caretManager.setRange(
          caret, caret.makeWithOffset(initial.firstChild.length));

        tr.execute(data);

        assert.equal(initial.childNodes.length, 1, "length after wrap");
        assert.equal(initial.outerHTML,
                     "<p xmlns=\"http://www.tei-c.org/ns/1.0\">" +
                     "<hi>abcdefghij</hi></p>");
      });

      it("handles properly caret position for words that are too " +
         "long to word wrap",
         function test() {
           var p = editor.dataRoot.getElementsByTagName("p")[0];
           editor.dataUpdater.insertText(
             p, 0,
             "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
               "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
               "AAAAAAAAAAAAA");
           caretManager.setCaret(p, 0);
           var range = editor.window.document.createRange();
           var gui_caret = caretManager.fromDataLocation(p.firstChild, 0);
           range.selectNode(gui_caret.node);
           var rect = range.getBoundingClientRect();
           // The caret should not be above the rectangle around the unbreakable
           // text.
           assert.isTrue(Math.round(rect.top) <=
                         Math.round(editor.caretManager.mark
                                    .getBoundingClientRect().top));
         });

      // We cannot right now run this on IE.
      itNoIE(
        "handles properly caret position for elements that span lines",
        function test() {
          var p = editor.dataRoot.querySelectorAll("body>p")[5];
          var text_loc = caretManager.fromDataLocation(p.lastChild, 2);
          assert.equal(text_loc.node.nodeType, Node.TEXT_NODE);

          // Check that we are testing what we want to test. The end
          // label for the hi element must be on the next line.
          var his = text_loc.node.parentNode.getElementsByClassName("hi");
          var hi = his[his.length - 1];
          var $start_l = $(firstGUI(hi));
          var $end_l = $(lastGUI(hi));
          hi.scrollIntoView(true);
          assert.isTrue($end_l.offset().top > $start_l.offset().top +
                        $start_l.height(),
                        "PRECONDITION FAILED: please update your test " +
                        "case so that the end label of the hi element is " +
                        "on a line under the line that has the start label " +
                        "of this same element");

          var event = new $.Event("mousedown");
          event.target = text_loc.node.parentNode;
          var rr = text_loc.makeRange(text_loc.make(text_loc.node, 3));
          var rect = rr.range.nativeRange.getBoundingClientRect();
          var scroll_top = editor.window.document.body.scrollTop;
          var scroll_left = editor.window.document.body.scrollLeft;
          event.pageX = rect.left + scroll_left;
          event.pageY = ((rect.top + rect.bottom) / 2) + scroll_top;
          event.clientX = rect.left;
          event.clientY = ((rect.top + rect.bottom) / 2);
          event.which = 1; // First mouse button.
          editor.$guiRoot.trigger(event);
          caretCheck(editor, text_loc.node, text_loc.offset,
                     "the caret should be in the text node");
        });

      // This test only checks that the editor does not crash.
      it("autofills in the midst of text", function test() {
        var p = editor.dataRoot.querySelector("body>p");
        assert.isTrue(p.firstChild.nodeType === Node.TEXT_NODE,
                      "we should set our caret in a text node");
        caretManager.setCaret(p.firstChild, 3);
        var trs = editor.modeTree.getMode(p.firstChild).getContextualActions(
          ["insert"], "biblFull", p.firstChild, 0);

        var tr = trs[0];
        var data = { node: undefined, name: "biblFull" };
        tr.execute(data);
      });

      describe("", function simplifiedSchema() {
        before(function before() {
          var new_options = $.extend(true, {}, option_stack[0]);
          new_options.schema = "/build/schemas/simplified-rng.js";
          option_stack.unshift(new_options);
          src_stack.unshift("../wed_test_data/wildcard_converted.xml");
        });

        after(function after() {
          option_stack.shift();
          src_stack.shift();
        });

        it("marks elements and attributes allowed due to wildcards as " +
           "readonly",
           function test() {
             editor.validator._validateUpTo(editor.dataRoot, -1);
             var bar = editor.dataRoot.querySelector("bar");
             var bar_gui = caretManager.fromDataLocation(bar, 0).node;
             assert.isTrue(bar_gui.classList.contains("_readonly"));
             var attr_names = getAttributeNamesFor(bar_gui);
             var attr_name;
             for (var ix = 0; ix < attr_names.length; ++ix) {
               attr_name = attr_names[ix];
               if (attr_name.textContent === "foo:baz") {
                 break;
               }
             }
             var attr = attr_name.closest("._attribute");
             assert.isTrue(attr.classList.contains("_readonly"));
           });

        it("prevents typing in readonly elements and attributes",
           function test() {
             editor.validator._validateUpTo(editor.dataRoot, -1);
             var bar = editor.dataRoot.querySelector("bar");
             var bar_gui = caretManager.fromDataLocation(bar, 0).node;
             assert.isTrue(bar_gui.classList.contains("_readonly"));

             caretManager.setCaret(bar, 0);
             editor.type("foo");
             assert.equal(bar.textContent, "abc");

             var attr_names = getAttributeNamesFor(bar_gui);
             var attr_name;
             for (var ix = 0; ix < attr_names.length; ++ix) {
               attr_name = attr_names[ix];
               if (attr_name.textContent === "foo:baz") {
                 break;
               }
             }
             var attr = attr_name.closest("._attribute");
             assert.isTrue(attr.classList.contains("_readonly"));

             var foo_baz = bar.attributes["foo:baz"];
             caretManager.setCaret(foo_baz, 0);
             editor.type("foo");
             assert.equal(foo_baz.value, "x");

             // We drop the _readonly classes to make sure that we're testing
             // what we think we're testing. Note that the classes will be added
             // right back as we change the file because it is revalidated. This
             // is why we type only one character.
             bar_gui.classList.remove("_readonly");
             attr.classList.remove("_readonly");

             caretManager.setCaret(foo_baz, 0);
             editor.type("f");
             assert.equal(foo_baz.value, "fx");

             bar_gui.classList.remove("_readonly");
             caretManager.setCaret(bar, 0);
             editor.type("f");
             assert.equal(bar.textContent, "fabc");
           });

        it("prevents pasting in readonly elements and attributes",
           function test() {
             editor.validator._validateUpTo(editor.dataRoot, -1);
             var initial = editor.dataRoot.querySelector("bar");
             var initial_gui = caretManager.fromDataLocation(initial, 0).node;
             assert.isTrue(initial_gui.classList.contains("_readonly"));
             caretManager.setCaret(initial, 0);
             var initial_value = initial.textContent;

             // Synthetic event
             var event = global.makeFakePasteEvent({
               types: ["text/plain"],
               getData: function getData() {
                 return "a";
               },
             });
             editor.$guiRoot.trigger(event);
             assert.equal(initial.textContent, initial_value);
             dataCaretCheck(editor, initial, 0, "final position");

             // Check that removing _readonly would make the paste work. This
             // proves that the only thing that was preventing pasting was
             // _readonly.
             initial_gui.classList.remove("_readonly");
             caretManager.setCaret(initial, 0);

             // We have to create a new event.
             event = global.makeFakePasteEvent({
               types: ["text/plain"],
               getData: function getData() {
                 return "a";
               },
             });

             editor.$guiRoot.trigger(event);
             assert.equal(initial.textContent, "a" + initial_value);
             dataCaretCheck(editor, initial.firstChild, 4, "final position");
           });

        it("prevents cutting from readonly elements", function test(done) {
          editor.validator._validateUpTo(editor.dataRoot, -1);
          var initial = editor.dataRoot.querySelector("bar");
          var initial_gui = caretManager.fromDataLocation(initial, 0).node;
          assert.isTrue(initial_gui.classList.contains("_readonly"));
          var initial_value = initial.textContent;

          var gui_start = caretManager.fromDataLocation(initial.firstChild, 1);
          caretManager.setCaret(gui_start);
          caretManager.setRange(
            gui_start,
            caretManager.fromDataLocation(initial.firstChild, 2));

          // Synthetic event
          var event = new $.Event("cut");
          editor.$guiRoot.trigger(event);
          window.setTimeout(function timeout() {
            assert.equal(initial.textContent, initial_value);
            // Try again, after removing _readonly so that we prove the only
            // reason the cut did not work is that _readonly was present.
            initial_gui.classList.remove("_readonly");
            event = new $.Event("cut");
            editor.$guiRoot.trigger(event);
            window.setTimeout(function timeout2() {
              assert.equal(initial.textContent,
                           initial_value.slice(0, 1) + initial_value.slice(2));
              done();
            }, 1);
          }, 1);
        });

        it("a context menu has the complex pattern action, when " +
           "invoked on an element allowed due to a complex pattern",
           function test() {
             editor.validator._validateUpTo(editor.dataRoot, -1);
             activateContextMenu(
               editor,
               editor.guiRoot.querySelector("._readonly ._element_name"));
             contextMenuHasOption(editor, /Complex name pattern/, 1);
           });

        it("a context menu has the complex pattern action, when " +
           "invoked on an attribute allowed due to a complex pattern",
           function test() {
             editor.validator._validateUpTo(editor.dataRoot, -1);
             activateContextMenu(
               editor,
               editor.guiRoot.querySelector("._readonly ._attribute_value"));
             contextMenuHasOption(editor, /Complex name pattern/, 1);
           });


        it("a context menu invoked on a readonly element has no " +
           "actions that can transform the document",
           function test() {
             editor.validator._validateUpTo(editor.dataRoot, -1);
             activateContextMenu(
               editor,
               editor.guiRoot.querySelector("._readonly ._element_name"));
             contextMenuHasNoTransforms(editor);
           });

        it("a context menu invoked on a readonly attribute has no " +
           "actions that can transform the document",
           function test() {
             editor.validator._validateUpTo(editor.dataRoot, -1);
             activateContextMenu(
               editor,
               editor.guiRoot.querySelector("._readonly ._attribute_value"));
             contextMenuHasNoTransforms(editor);
           });
      });

      describe("interacts with the server:", function serverInteraction() {
        before(function before() {
          src_stack.unshift(
            "../wed_test_data/server_interaction_converted.xml");
        });

        after(function after() {
          src_stack.shift();
        });

        beforeEach(function beforeEach(done) {
          global.reset(done);
        });

        it("saves", function test(done) {
          editor.saver.events.subscribe(function saved(ev) {
            if (ev.name !== "Saved") {
              return;
            }

            $.get("/build/ajax/save.txt", function success(data) {
              var obj = {
                command: "save",
                version: wed.version,
                data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
              };
              var expected = "\n***\n" + JSON.stringify(obj);
              assert.equal(data, expected);
              done();
            });
          });
          editor.type(key_constants.CTRLEQ_S);
        });

        it("serializes properly", function test(done) {
          editor.saver.events.subscribe(function saved(ev) {
            if (ev.name !== "Saved") {
              return;
            }

            $.get("/build/ajax/save.txt", function success(data) {
              var obj = {
                command: "save",
                version: wed.version,
                data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p><abbr/></p></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
              };
              var expected = "\n***\n" + JSON.stringify(obj);
              assert.equal(data, expected);
              done();
            });
          });
          var p = editor.dataRoot.querySelector("p");
          caretManager.setCaret(p, 0);
          var trs = editor.modeTree.getMode(p)
            .getContextualActions("insert", "abbr", p, 0);
          var tr = trs[0];
          tr.execute({ name: "abbr" });
          editor.type(key_constants.CTRLEQ_S);
        });

        it("does not autosave if not modified", function test(done) {
          editor.saver.events.subscribe(function saved(ev) {
            if (ev.name !== "Autosaved") {
              return;
            }

            throw new Error("autosaved!");
          });
          editor.saver.setAutosaveInterval(50);
          setTimeout(done, 500);
        });

        it("autosaves when the document is modified", function test(done) {
          // We're testing that autosave is not called again
          // after the first time.
          var autosaved = false;
          var start;
          editor.saver.events.subscribe(function saved(ev) {
            if (ev.name !== "Autosaved") {
              return;
            }

            var delay = Date.now() - start;
            if (autosaved) {
              throw new Error("autosaved more than once");
            }
            autosaved = true;
            $.get("/build/ajax/save.txt", function success(data) {
              var obj = {
                command: "autosave",
                version: wed.version,
                data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt/><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
              };
              var expected = "\n***\n" + JSON.stringify(obj);
              assert.equal(data, expected);
              // We use ``delay`` so that we can ajust for a case
              // where communications are slow.
              setTimeout(done, delay * 2);
            });
          });
          start = Date.now();
          editor.dataUpdater.removeNode(editor.dataRoot.querySelector("p"));
          editor.saver.setAutosaveInterval(50);
        });

        it("autosaves when the document is modified after a " +
           "first autosave timeout that did nothing",
           function test(done) {
             // We're testing that autosave is not called again
             // after the first time.
             var autosaved = false;
             var start;
             editor.saver.events.subscribe(function saved(ev) {
               if (ev.name !== "Autosaved") {
                 return;
               }

               var delay = Date.now() - start;
               if (autosaved) {
                 throw new Error("autosaved more than once");
               }
               autosaved = true;
               $.get("/build/ajax/save.txt", function success(data) {
                 var obj = {
                   command: "autosave",
                   version: wed.version,
                   data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt/><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
                 };
                 var expected = "\n***\n" + JSON.stringify(obj);
                 assert.equal(data, expected);
                 // We use ``delay`` so that we can ajust for a case
                 // where communications are slow.
                 setTimeout(done, delay * 2);
               });
             });
             var interval = 50;
             editor.saver.setAutosaveInterval(interval);
             setTimeout(function timeout() {
               assert.isFalse(autosaved, "should not have been saved yet");
               start = Date.now();
               editor.dataUpdater.removeNode(
                 editor.dataRoot.querySelector("p"));
             }, interval * 2);
           });
      });


      describe("fails as needed and recovers:", function failsAndRecovers() {
        before(function before() {
          src_stack.unshift(
            "../wed_test_data/server_interaction_converted.xml");
        });

        after(function after() {
          src_stack.shift();
        });

        // Yes, we reset before and after.
        beforeEach(function beforeEach(done) {
          global.reset(done);
        });

        afterEach(function afterEach(done) {
          global.reset(done);
        });

        it("tells the user to reload when save fails hard", function test(done) {
          function doit() {
            var $modal = onerror.__test.$modal;
            $modal.on("shown.bs.modal", function shown() {
              // Prevent a reload.
              onerror.__test.reset();
              done();
            });

            editor.type(key_constants.CTRLEQ_S);
          }

          global.no_response_on_save(doit);
        });

        it("warns of disconnection when the server returns a bad status",
           function test(done) {
             function doit() {
               var $modal = editor.modals.getModal("disconnect").getTopLevel();
               $modal.on("shown.bs.modal", function shown() {
                 editor.saver.events.subscribe(function saved(ev) {
                   if (ev.name !== "Saved") {
                     return;
                   }

                   // Was saved on retry!

                   // This allows us to let the whole save process run its
                   // course before we declare it done.
                   setTimeout(done, 0);
                 });
                 // Reset so that the next save works.
                 global.reset(function reset() {
                   // This triggers a retry.
                   $modal.modal("hide");
                 });
               });

               editor.type(key_constants.CTRLEQ_S);
             }

             global.fail_on_save(doit);
           });

        it("brings up a modal when the document was edited by someone else",
           function test(done) {
             function doit() {
               var $modal = editor.modals.getModal("editedByOther").getTopLevel();
               $modal.on("shown.bs.modal", function shown() {
                 // Prevent a reload.
                 $modal.off("hidden.bs.modal.modal");
                 $modal.modal("hide");
                 done();
               });

               editor.type(key_constants.CTRLEQ_S);
             }

             global.precondition_fail_on_save(doit);
           });

        it("brings up a modal when there is a new version of the editor",
           function test(done) {
             function doit() {
               var $modal = editor.modals.getModal("tooOld").getTopLevel();
               $modal.on("shown.bs.modal", function shown() {
                 // Prevent a reload.
                 $modal.off("hidden.bs.modal.modal");
                 $modal.modal("hide");
                 done();
               });

               editor.type(key_constants.CTRLEQ_S);
             }

             global.too_old_on_save(doit);
           });

        it("does not attempt recovery when save fails hard",
           function test(done) {
             function doit() {
               var $modal = onerror.__test.$modal;
               $modal.on("shown.bs.modal", function shown() {
                 // The data was saved even though the server
                 // replied with an HTTP error code.
                 $.get("/build/ajax/save.txt", function success(data) {
                   var obj = {
                     command: "save",
                     version: wed.version,
                     data:
                     "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
                   };
                   var expected = "\n***\n" + JSON.stringify(obj);
                   assert.equal(data, expected);
                   // Prevent a reload.
                   onerror.__test.reset();
                   done();
                 });
               });

               editor.type(key_constants.CTRLEQ_S);
             }

             global.no_response_on_save(doit);
           });

        it("attempts recovery on uncaught exception", function test(done) {
          // We can't just raise an exception because mocha will intercept it
          // and it will never get to the onerror handler. If we raise the error
          // in a timeout, it will go straight to onerror.

          window.setTimeout(function timeout() {
            window.setTimeout(function timeout2() {
              $.get("/build/ajax/save.txt", function success(data) {
                var obj = {
                  command: "recover",
                  version: wed.version,
                  data:
                  "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>" };
                var expected = "\n***\n" + JSON.stringify(obj);
                assert.equal(data, expected);
                onerror.__test.reset();
                done();
              });
            }, 1000);
            throw new Error("I'm failing!");
          }, 5);
        });
      });

      describe("without saver", function noSaver() {
        before(function before() {
          var new_options = {
            schema: "/build/schemas/tei-simplified-rng.js",
            mode: {
              path: "wed/modes/generic/generic",
              options: {
                metadata: "/build/schemas/tei-metadata.json",
              },
            },
            // You certainly do not want this in actual deployment.
            ajaxlog: {
              url: "/build/ajax/log.txt",
            },
          };
          new_options.ignore_module_config = true;
          option_stack.unshift(new_options);
        });

        after(function after() {
          option_stack.shift();
        });

        it("is able to start", function test() { });
      });

      // We don't put this with wed-validation-error-test because it is
      // not specifically checking the validation code but is an overall
      // smoketest.
      describe("attribute errors without attributes shown (due wed to options)",
               function noAttributes() {
                 before(function before() {
                   var new_options = $.extend(true, {}, option_stack[0]);
                   new_options.mode.options.hide_attributes = true;
                   option_stack.unshift(new_options);
                 });

                 after(function after() {
                   option_stack.shift();
                 });

                 it("is able to start", function test() {
                   return editor.firstValidationComplete;
                 });
               });
    });

    describe("(not state-sensitive)", function nonStateSensitive() {
      var editor;
      var caretManager;
      before(function before() {
        var wedroot = wedwin.document.getElementById("wedroot");
        editor = new wed.Editor(wedroot, mergeWithGlobal(option_stack[0]));
        return editor.init(source)
          .then(function initialized() {
            editor.validator._validateUpTo(editor.dataRoot, -1);
            caretManager = editor.caretManager;
          });
      });

      after(function after() {
        if (editor) {
          editor.destroy();
        }
        editor = undefined;
        caretManager = undefined;
        assert.isFalse(onerror.is_terminating(),
                       "test caused an unhandled exception to occur");
        // We don't reload our page so we need to do this.
        onerror.__test.reset();
      });

      afterEach(function afterEach() {
        assert.isFalse(onerror.is_terminating(),
                       "test caused an unhandled exception to occur");
        // We don't reload our page so we need to do this.
        onerror.__test.reset();
        editor.editingMenuManager.dismiss();
      });

      describe("autohides attributes", function autohides() {
        it("autohidden attributes are hidden when the caret is not " +
           "in the element",
           function test() {
             var div = editor.guiRoot.querySelectorAll(".body .div")[1];
             var attr_names = getAttributeNamesFor(div);
             for (var ix = 0; ix < attr_names.length; ++ix) {
               var name = attr_names[ix];
               var text = name.textContent;
               var autohidden = !!name.closest("._shown_when_caret_in_label");
               if (text === "type" || text === "subtype") {
                 assert.isFalse(autohidden);
                 assert.isTrue(isVisible(name), "should be visible");
               }
               else {
                 assert.isTrue(autohidden);
                 assert.isFalse(isVisible(name), "should be hidden");
               }
             }
           });

        it("autohidden attributes are shown when the caret is " +
           "in the element",
           function test() {
             var div = editor.guiRoot.querySelectorAll(".body .div")[1];
             var label = firstGUI(div);
             caretManager.setCaret(label, 0);
             var attr_names = getAttributeNamesFor(div);
             for (var ix = 0; ix < attr_names.length; ++ix) {
               var name = attr_names[ix];
               var text = name.textContent;
               var autohidden = !!name.closest("._shown_when_caret_in_label");
               assert.isTrue(isVisible(name), text + " should be visible");
               if (text === "type" || text === "subtype") {
                 assert.isFalse(autohidden);
               }
               else {
                 assert.isTrue(autohidden);
               }
             }
           });
      });

      describe("setNavigationList", function setNavigationList() {
        it("makes the navigation list appear", function test() {
          assert.equal(editor.$navigationPanel.css("display"),
                       "none", "the list is not displayed");
          editor.setNavigationList("foo");
          assert.equal(editor.$navigationPanel.css("display"),
                       "block", "the list is displayed");
        });
      });
    });
  });
});

//  LocalWords:  rng wedframe RequireJS dropdown Ctrl Mangalam MPL
//  LocalWords:  Dubeau previousSibling nextSibling abcd jQuery xmlns
//  LocalWords:  sourceDesc publicationStmt titleStmt fileDesc txt
//  LocalWords:  ajax xml moveCaretRight moveCaretLeft teiHeader html
//  LocalWords:  innerHTML nodeValue seekCaret nodeToPath pathToNode
//  LocalWords:  mouseup mousedown unhandled requirejs btn gui metas
//  LocalWords:  wedroot tei domutil onerror jquery chai
