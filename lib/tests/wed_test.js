/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var global = require("./global");
  var $ = require("jquery");
  var wed = require("wed/wed");
  var domutil = require("wed/domutil");
  var util = require("wed/util");
  var key_constants = require("wed/key-constants");
  var onerror = require("wed/onerror");
  var log = require("wed/log");
  var key = require("wed/key");
  var salve = require("salve");
  var browsers = require("wed/browsers");
  var globalConfig = require("global-config");
  var mergeOptions = require("merge-options");
  var source = require("text!./wed_test_data/source_converted.xml");

  var _indexOf = Array.prototype.indexOf;
  var _slice = Array.prototype.slice;
  var isAttr = domutil.isAttr;
  var waitForSuccess = global.waitForSuccess;

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
  var src_stack = ["./wed_test_data/source_converted.xml"];
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

  function caretCheck(editor, container, offset, msg) {
    var caret = editor.caretManager.caret;
    assert.isTrue(!!caret, "there should be a caret");
    if (offset !== null) {
      assert.equal(caret.node, container, msg + " (container)");
      assert.equal(caret.offset, offset, msg + " (offset)");
    }
    else {
      // A null offset means we are not interested in the specific
      // offset.  We just want to know that the caret is *inside*
      // container either directly or indirectly.
      assert.isTrue($(caret.node).closest(container).length !== 0,
                    msg + " (container)");
    }
  }

  function dataCaretCheck(editor, container, offset, msg) {
    var data_caret = editor.caretManager.getDataCaret();
    assert.equal(data_caret.node, container, msg + " (container)");
    assert.equal(data_caret.offset, offset, msg + " (offset)");
  }

  function firstGUI(container) {
    return domutil.childByClass(container, "_gui");
  }

  function getAttributeValuesFor(container) {
    return firstGUI(container).getElementsByClassName("_attribute_value");
  }

  function getAttributeNamesFor(container) {
    return firstGUI(container).getElementsByClassName("_attribute_name");
  }

  function getElementNameFor(container) {
    return firstGUI(container).getElementsByClassName("_element_name")[0];
  }


  function lastGUI(container) {
    var children = domutil.childrenByClass(container, "_gui");
    return children[children.length - 1] || null;
  }

  function activateContextMenu(editor, el) {
    function computeValues() {
      el.scrollIntoView();
      var rect = el.getBoundingClientRect();
      var left = rect.left + (rect.width / 2);
      var top = rect.top + (rect.height / 2);
      var scroll_top = editor.my_window.document.body.scrollTop;
      var scroll_left = editor.my_window.document.body.scrollLeft;
      return {
        which: 3,
        pageX: left + scroll_left,
        pageY: top + scroll_top,
        clientX: left,
        clientY: top,
        target: el,
      };
    }

    var values = computeValues();
    var event = new $.Event("mousedown", values);
    editor.$gui_root.trigger(event);

    values = computeValues();
    event = new $.Event("mouseup", values);
    editor.$gui_root.trigger(event);
  }

  function contextMenuHasOption(editor, pattern, expected_count) {
    if (expected_count === 0) {
      throw new Error("it makes no sense to call contextMenuHasOption " +
                      "with an expected_count of 0");
    }
    var menu = editor.my_window.document.getElementsByClassName(
      "wed-context-menu")[0];
    assert.isDefined(menu, "the menu should exist");
    var items = menu.querySelectorAll("li>a");
    var found = 0;
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      if (pattern.test(item.textContent.trim())) {
        found++;
      }

      if (!expected_count && found) {
        break;
      }
    }

    if (!expected_count) {
      assert.isTrue(found > 0, "should have found the option");
    }
    else {
      assert.equal(found, expected_count,
                   "should have seen the option a number of times equal " +
                   "to the expected count");
    }
  }

  function contextMenuHasAttributeOption(editor) {
    contextMenuHasOption(editor, /^Add @/);
  }

  function contextMenuHasNoTransforms(editor) {
    var menu = editor.my_window.document.getElementsByClassName(
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
          editor = new wed.Editor();
          editor.addEventListener("initialized", function initialized() {
            caretManager = editor.caretManager;
            done();
          });
          var wedroot = wedwin.document.getElementById("wedroot");
          editor.init(wedroot, mergeWithGlobal(option_stack[0]), data);
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
             editor._$modification_status.hasClass("label-success"));
         });

      it("has a modification status showing an modified document " +
         "when the document is modified",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);
           // Text node inside title.
           var initial = editor.gui_root.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);
           editor.type(" ");

           assert.isTrue(editor._$modification_status.hasClass("label-warning"));
         });

      it("onbeforeunload returns falsy on unmodified doc", function test() {
        assert.isFalse(!!editor.my_window.onbeforeunload());
      });

      it("onbeforeunload returns truthy on modified doc", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        // Text node inside title.
        var initial = editor.gui_root.getElementsByClassName("title")[0]
              .childNodes[1];
        caretManager.setCaret(initial, 0);
        editor.type(" ");

        assert.isTrue(!!editor.my_window.onbeforeunload());
      });

      it("has a modification status showing an unmodified document " +
         "when the document is modified but saved",
         function test(done) {
           editor.validator._validateUpTo(editor.data_root, -1);
           // Text node inside title.
           var initial = editor.gui_root.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);
           editor.type(" ");

           assert.isTrue(editor._$modification_status.hasClass("label-warning"));
           editor.addEventListener("saved", function saved() {
             assert.isTrue(
               editor._$modification_status.hasClass("label-success"));
             done();
           });
           editor.type(key_constants.CTRLEQ_S);
         });

      it("has a save status showing an unsaved document when starting",
         function test() {
           assert.isTrue(editor._$save_status.hasClass("label-default"));
           assert.equal(editor._$save_status.children("span").text(), "");
         });

      it("has a save status showing a saved document after a save",
         function test(done) {
           assert.isTrue(editor._$save_status.hasClass("label-default"));
           assert.equal(editor._$save_status.children("span").text(), "");

           editor.addEventListener("saved", function saved() {
             assert.isTrue(editor._$save_status.hasClass("label-success"));
             assert.equal(editor._$save_status.children("span").text(),
                          "moments ago");
             // We also check the tooltip text.
             assert.equal(editor._$save_status.data("bs.tooltip").getTitle(),
                          "The last save was a manual save.");
             done();
           });
           editor.type(key_constants.CTRLEQ_S);
         });

      it("has a save status showing a saved document after an autosave",
         function test(done) {
           assert.isTrue(editor._$save_status.hasClass("label-default"));
           assert.equal(editor._$save_status.children("span").text(), "");

           editor.addEventListener("autosaved", function saved() {
             assert.isTrue(editor._$save_status.hasClass("label-info"));
             assert.equal(editor._$save_status.children("span").text(),
                          "moments ago");
             // We also check the tooltip text.
             assert.equal(editor._$save_status.data("bs.tooltip").getTitle(),
                          "The last save was an autosave.");
             done();
           });

           editor.validator._validateUpTo(editor.data_root, -1);
           // Text node inside title.
           var initial = editor.gui_root.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);
           editor.type(" ");
           editor._saver.setAutosaveInterval(50);
         });

      it("has a save status tooltip is updated after a different kind of " +
         "save occurs",
         function test(done) {
           editor.addEventListener("autosaved", function saved() {
             // We check the initial tooltip text.
             assert.equal(editor._$save_status.data("bs.tooltip").getTitle(),
                          "The last save was an autosave.");

             // Now perform a save.
             editor.type(key_constants.CTRLEQ_S);
           });

           editor.addEventListener("saved", function saved() {
             // We check the tooltip changed.
             assert.equal(editor._$save_status.data("bs.tooltip").getTitle(),
                          "The last save was a manual save.");
             done();
           });

           editor.validator._validateUpTo(editor.data_root, -1);
           // Text node inside title.
           var initial = editor.gui_root.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);
           editor.type(" ");
           editor._saver.setAutosaveInterval(50);
         });

      it("typing BACKSPACE without caret does not crash", function test() {
        assert.equal(caretManager.caret, undefined, "no caret");
        editor.type(key_constants.BACKSPACE);
      });

      it("typing DELETE without caret does not crash", function test() {
        assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
        editor.type(key_constants.DELETE);
      });

      it("typing text works", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        // Text node inside title.
        var initial = editor.gui_root.getElementsByClassName("title")[0]
              .childNodes[1];
        var parent = initial.parentNode;
        caretManager.setCaret(initial, 0);

        // There was a version of wed which would fail this test. The fake caret
        // would be inserted inside the text node, which would throw off the
        // nodeToPath/pathToNode calculations.

        editor.type("1");
        assert.equal(initial.nodeValue, "1abcd");
        assert.equal(parent.childNodes.length, 3);

        editor.type("1");
        assert.equal(initial.nodeValue, "11abcd");
        assert.equal(parent.childNodes.length, 3);

        // This is where wed used to fail.
        editor.type("1");
        assert.equal(initial.nodeValue, "111abcd");
        assert.equal(parent.childNodes.length, 3);
      });

      it("typing adjancent spaces inserts only one space", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        // Text node inside title.
        var initial = editor.gui_root.getElementsByClassName("title")[0]
              .childNodes[1];
        var parent = initial.parentNode;
        caretManager.setCaret(initial, 0);

        editor.type(" ");
        assert.equal(initial.nodeValue, " abcd");
        assert.equal(parent.childNodes.length, 3);

        editor.type(" ");
        assert.equal(initial.nodeValue, " abcd");
        assert.equal(parent.childNodes.length, 3);

        caretManager.setCaret(initial, 5);
        editor.type(" ");
        assert.equal(initial.nodeValue, " abcd ");
        assert.equal(parent.childNodes.length, 3);

        editor.type(" ");
        assert.equal(initial.nodeValue, " abcd ");
        assert.equal(parent.childNodes.length, 3);
      });

      it("typing text when the caret is adjacent to text works (before text)",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);
           // Text node inside title.
           var initial = editor.data_root.querySelectorAll("body>p")[3];
           var his = initial.getElementsByTagName("hi");
           var hi = his[his.length - 1];

           // We put the caret just after the last <hi>, which means it is just
           // before the last text node.
           caretManager.setCaret(initial,
                                 _indexOf.call(initial.childNodes, hi) + 1);

           var initial_length = initial.childNodes.length;

           editor.type(" ");
           assert.equal(initial.lastChild.nodeValue, " c");
           assert.equal(initial.childNodes.length, initial_length);
         });

      it("typing text when the caret is adjacent to text works (after text)",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);
           // Text node inside title.
           var initial = editor.data_root.querySelectorAll("body>p")[3];

           // We put the caret just after the last child, a text node.
           caretManager.setCaret(initial, initial.childNodes.length);

           var initial_length = initial.childNodes.length;

           editor.type(" ");
           assert.equal(initial.lastChild.nodeValue, "c ");
           assert.equal(initial.childNodes.length, initial_length);
         });

      it("typing longer than the length of a text undo works", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        // Text node inside title.
        var initial = editor.gui_root
              .getElementsByClassName("title")[0].childNodes[1];
        var parent = initial.parentNode;
        caretManager.setCaret(initial, 0);

        var text = new Array(editor._text_undo_max_length + 1).join("a");
        editor.type(text);
        assert.equal(initial.nodeValue, text + "abcd");
        assert.equal(parent.childNodes.length, 3);
      });

      it("typing text after an element works", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        var initial = editor.data_root.querySelectorAll("body>p")[1];
        caretManager.setCaret(initial, 1);

        editor.type(" ");
        assert.equal(initial.childNodes.length, 2);
      });

      it("typing text in phantom text does nothing", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        var ref = domutil.childByClass(
          editor.gui_root.querySelectorAll(".body>.p")[2], "ref");
        var initial = ref.childNodes[1];

        // Make sure we're looking at the right thing.
        assert.isTrue(initial.classList &&
                      initial.classList.contains("_phantom"),
                      " initial is phantom");
        assert.equal(initial.textContent, "(", "initial's value");
        caretManager.setCaret(initial, 1);

        editor.type(" ");
        assert.equal(initial.textContent, "(", "initial's value after");
      });


      it("typing text moves the caret", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var initial = editor.gui_root.getElementsByClassName("title")[0]
              .childNodes[1];
        var parent = initial.parentNode;
        caretManager.setCaret(initial, 0);

        // There was a version of wed which would fail this test. The fake caret
        // would be inserted inside the text node, which would throw off the
        // nodeToPath/pathToNode calculations.

        editor.type("blah");
        assert.equal(initial.nodeValue, "blahabcd");
        assert.equal(parent.childNodes.length, 3);
        caretCheck(editor, initial, 4, "caret after text insertion");
      });

      it("typing text in an attribute inserts text", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var ps = editor.gui_root.querySelectorAll(".body>.p");
        var first_gui = firstGUI(ps[7]);
        var initial = first_gui.getElementsByClassName("_attribute_value")[0]
              .firstChild;
        caretManager.setCaret(initial, 0);
        assert.equal(initial.data, "rend_value");
        editor.type("blah");

        // We have to refetch because the decorations have been
        // redone.
        first_gui = firstGUI(ps[7]);
        initial = first_gui.getElementsByClassName("_attribute_value")[0]
          .firstChild;
        assert.equal(initial.data, "blahrend_value");
        caretCheck(editor, initial, 4, "caret after text insertion");

        // Check that the data is also modified
        var data_node = editor.toDataNode(initial);
        assert.equal(data_node.value, "blahrend_value");
      });

      it("typing multiple spaces in an attribute normalizes the space",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var ps = editor.gui_root.querySelectorAll(".body>.p");
           var first_gui = firstGUI(ps[7]);
           var initial = first_gui.getElementsByClassName("_attribute_value")[0]
                 .firstChild;
           caretManager.setCaret(initial, 0);
           assert.equal(initial.data, "rend_value");

           editor.type(" ");

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, " rend_value");
           caretCheck(editor, initial, 1, "caret after text insertion");

           // Check that the data is also modified
           var data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, " rend_value");

           editor.type(" ");

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, " rend_value");
           caretCheck(editor, initial, 1, "caret after text insertion");

           // Check that the data is also modified
           assert.equal(data_node.value, " rend_value");

           caretManager.setCaret(initial, 11);

           editor.type(" ");

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, " rend_value ");
           caretCheck(editor, initial, 12, "caret after text insertion");

           // Check that the data is also modified
           assert.equal(data_node.value, " rend_value ");

           editor.type(" ");

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, " rend_value ");
           caretCheck(editor, initial, 12, "caret after text insertion");

           // Check that the data is also modified
           assert.equal(data_node.value, " rend_value ");
         });

      it("typing text in an empty attribute inserts text", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var ps = editor.gui_root.querySelectorAll(".body>.p");
        var first_gui = firstGUI(ps[9]);
        var initial = first_gui.getElementsByClassName("_attribute_value")[0]
              .firstChild;
        assert.isTrue(initial.classList.contains("_placeholder"));
        caretManager.setCaret(initial, 0);
        editor.type("blah");

        // We have to refetch because the decorations have been redone.
        first_gui = firstGUI(ps[9]);
        initial = first_gui.getElementsByClassName("_attribute_value")[0]
          .firstChild;
        assert.equal(initial.data, "blah");
        caretCheck(editor, initial, 4, "caret after text insertion");

        // Check that the data is also modified
        var data_node = editor.toDataNode(initial);
        assert.equal(data_node.value, "blah");
      });

      it("typing a double quote in an attribute inserts a double quote",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var ps = editor.gui_root.querySelectorAll(".body>.p");
           var first_gui = firstGUI(ps[7]);
           var initial = first_gui.getElementsByClassName("_attribute_value")[0]
                 .firstChild;
           caretManager.setCaret(initial, 0);
           assert.equal(initial.data, "rend_value");
           editor.type("\"");

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, "\"rend_value");
           caretCheck(editor, initial, 1, "caret after text insertion");

           // Check that the data is also modified
           var data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, "\"rend_value");
         });

      it("typing a single quote in an attribute inserts a single quote",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var ps = editor.gui_root.querySelectorAll(".body>.p");
           var first_gui = firstGUI(ps[7]);
           var initial = first_gui.getElementsByClassName("_attribute_value")[0]
                 .firstChild;
           caretManager.setCaret(initial, 0);
           assert.equal(initial.data, "rend_value");
           editor.type("'");

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, "'rend_value");
           caretCheck(editor, initial, 1, "caret after text insertion");

           // Check that the data is also modified
           var data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, "'rend_value");
         });

      it("typing an open angle bracket in an attribute inserts an open " +
         "angle bracket",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var ps = editor.gui_root.querySelectorAll(".body>.p");
           var first_gui = firstGUI(ps[7]);
           var initial = first_gui.getElementsByClassName("_attribute_value")[0]
                 .firstChild;
           caretManager.setCaret(initial, 0);
           assert.equal(initial.data, "rend_value");
           editor.type("<");

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, "<rend_value");
           caretCheck(editor, initial, 1, "caret after text insertion");

           // Check that the data is also modified
           var data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, "<rend_value");
         });

      it("typing DELETE in an attribute deletes text", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var ps = editor.gui_root.querySelectorAll(".body>.p");
        var first_gui = firstGUI(ps[7]);
        var initial = first_gui.getElementsByClassName("_attribute_value")[0]
              .firstChild;
        caretManager.setCaret(initial, 0);
        assert.equal(initial.data, "rend_value");
        editor.type(key_constants.DELETE);

        // We have to refetch because the decorations have been redone.
        first_gui = firstGUI(ps[7]);
        initial = first_gui.getElementsByClassName("_attribute_value")[0]
          .firstChild;
        assert.equal(initial.data, "end_value");
        caretCheck(editor, initial, 0, "caret after deletion");

        // Check that the data is also modified
        var data_node = editor.toDataNode(initial);
        assert.equal(data_node.value, "end_value");
      });

      it("typing DELETE in an attribute when no more can be deleted is a " +
         "noop",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var ps = editor.gui_root.querySelectorAll(".body>.p");
           var p = ps[8];
           var first_gui = firstGUI(p);
           var initial = first_gui.getElementsByClassName("_attribute_value")[0]
                 .firstChild;
           caretManager.setCaret(initial, 0);
           assert.equal(initial.data, "abc");
           editor.type(key_constants.DELETE);
           editor.type(key_constants.DELETE);
           editor.type(key_constants.DELETE);

           // We have to refetch because the decorations have been
           // redone.
           first_gui = firstGUI(p);
           initial = first_gui.getElementsByClassName("_attribute_value")[0];
           assert.isTrue(initial.firstChild.classList.contains("_placeholder"));
           assert.equal(initial.childNodes.length, 1);
           caretCheck(editor, initial.firstChild, 0, "caret after deletion");


           // Check that the data is also modified
           var data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, "");

           // Overdeleting
           editor.type(key_constants.DELETE);

           first_gui = firstGUI(p);
           initial = first_gui.getElementsByClassName("_attribute_value")[0];
           assert.isTrue(initial.firstChild.classList.contains("_placeholder"));
           assert.equal(initial.childNodes.length, 1);
           caretCheck(editor, initial.firstChild, 0, "caret after deletion");

           // Check that the data is also modified
           data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, "");
         });

      it("typing BACKSPACE in an attribute deletes text", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var ps = editor.gui_root.querySelectorAll(".body>.p");
        var first_gui = firstGUI(ps[7]);
        var initial = first_gui.getElementsByClassName("_attribute_value")[0]
              .firstChild;
        caretManager.setCaret(initial, 4);
        assert.equal(initial.data, "rend_value");
        editor.type(key_constants.BACKSPACE);

        // We have to refetch because the decorations have been redone.
        first_gui = firstGUI(ps[7]);
        initial = first_gui.getElementsByClassName("_attribute_value")[0]
          .firstChild;
        assert.equal(initial.data, "ren_value");
        caretCheck(editor, initial, 3, "caret after deletion");

        // Check that the data is also modified
        var data_node = editor.toDataNode(initial);
        assert.equal(data_node.value, "ren_value");
      });

      it("typing BACKSPACE in an attribute when no more can be deleted is " +
         "a noop",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var ps = editor.gui_root.querySelectorAll(".body>.p");
           var p = ps[8];
           var first_gui = firstGUI(p);
           var initial = first_gui.getElementsByClassName("_attribute_value")[0]
                 .firstChild;
           caretManager.setCaret(initial, 3);
           assert.equal(initial.data, "abc");
           editor.type(key_constants.BACKSPACE);
           editor.type(key_constants.BACKSPACE);
           editor.type(key_constants.BACKSPACE);

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(p);
           initial = first_gui.getElementsByClassName("_attribute_value")[0];
           assert.isTrue(initial.firstChild.classList.contains("_placeholder"));
           assert.equal(initial.childNodes.length, 1);
           caretCheck(editor, initial.firstChild, 0, "caret after deletion");

           // Check that the data is also modified
           var data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, "");

           // Overdeleting
           editor.type(key_constants.BACKSPACE);

           first_gui = firstGUI(p);
           initial = first_gui.getElementsByClassName("_attribute_value")[0];
           assert.isTrue(initial.firstChild.classList.contains("_placeholder"));
           assert.equal(initial.childNodes.length, 1);
           caretCheck(editor, initial.firstChild, 0, "caret after deletion");

           // Check that the data is also modified
           data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, "");
         });

      it("typing a non-breaking space converts it to a regular space",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var initial = editor.gui_root.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);

           editor.type("\u00A0");
           assert.equal(initial.nodeValue, " abcd");
         });

      it("typing a zero-width space is a no-op", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var initial = editor.gui_root.getElementsByClassName("title")[0]
              .childNodes[1];
        caretManager.setCaret(initial, 0);

        editor.type("\u200B");
        assert.equal(initial.nodeValue, "abcd");
      });

      it("typing a control character in a placeholder works",
         function test(done) {
           editor.validator._validateUpTo(editor.data_root, -1);

           var ph = editor.gui_root.getElementsByClassName("_placeholder")[0];
           caretManager.setCaret(ph, 0);
           var ctrl_something = key.makeCtrlEqKey("A");
           $(editor.widget).on("wed-global-keydown.btw-mode",
                               function keydown(wed_ev, ev) {
                                 if (ctrl_something.matchesEvent(ev)) {
                                   done();
                                 }
                               });
           editor.type(ctrl_something);
         });

      it("undo undoes typed text as a group", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var initial = editor.gui_root.getElementsByClassName("title")[0]
              .childNodes[1];
        var parent = initial.parentNode;
        caretManager.setCaret(initial, 0);

        // There was a version of wed which would fail this
        // test. The fake caret would be inserted inside the text
        // node, which would throw off the nodeToPath/pathToNode
        // calculations.

        editor.type("blah");
        assert.equal(initial.nodeValue, "blahabcd", "text after edit");
        assert.equal(parent.childNodes.length, 3);

        editor.undo();
        assert.equal(initial.nodeValue, "abcd", "text after undo");
        assert.equal(parent.childNodes.length, 3);
        caretCheck(editor, initial, 0, "caret after undo");
      });

      it("undo undoes typed text as a group (inside element)", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var title = editor.gui_root.getElementsByClassName("title")[0];
        var title_data = $.data(title, "wed_mirror_node");

        var trs = editor.mode.getContextualActions(
          ["insert"], "hi", title_data.firstChild, 2);

        var tr = trs[0];
        var data = { node: undefined, name: "hi" };
        caretManager.setCaret(title_data.firstChild, 2);

        tr.execute(data);

        editor.type("a");
        var hi = title_data.firstElementChild;
        var hi_text = hi.firstChild;
        assert.equal(hi_text.nodeValue, "a", "text after edit");
        assert.equal(title_data.childNodes.length, 3);

        editor.undo();
        // Once upon a time, this crashed wed.
        editor.dumpUndo();
        editor.type(key_constants.CTRLEQ_Z);
      });

      it("redo redoes typed text as a group", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        // Text node inside title.
        var initial = editor.gui_root.getElementsByClassName("title")[0]
              .childNodes[1];
        var parent = initial.parentNode;
        caretManager.setCaret(initial, 0);

        // There was a version of wed which would fail this test. The fake caret
        // would be inserted inside the text node, which would throw off the
        // nodeToPath/pathToNode calculations.

        editor.type("blah");
        assert.equal(initial.nodeValue, "blahabcd", "text after edit");
        assert.equal(parent.childNodes.length, 3);

        editor.undo();
        assert.equal(initial.nodeValue, "abcd", "text after undo");
        assert.equal(parent.childNodes.length, 3);
        caretCheck(editor, initial, 0, "caret after undo");

        editor.redo();
        assert.equal(initial.nodeValue, "blahabcd", "text after undo");
        assert.equal(parent.childNodes.length, 3);
        caretCheck(editor, initial, 4, "caret after redo");
      });

      it("undoing an attribute value change undoes the value change",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var ps = editor.gui_root.querySelectorAll(".body>.p");
           var first_gui = firstGUI(ps[7]);
           var initial = first_gui.getElementsByClassName("_attribute_value")[0]
                 .firstChild;
           caretManager.setCaret(initial, 4);
           assert.equal(initial.data, "rend_value");
           editor.type("blah");

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, "rendblah_value");
           caretCheck(editor, initial, 8, "caret after text insertion");

           // Check that the data is also modified
           var data_node = editor.toDataNode(initial);
           assert.equal(data_node.value, "rendblah_value");

           editor.undo();

           // We have to refetch because the decorations have been redone.
           first_gui = firstGUI(ps[7]);
           initial = first_gui.getElementsByClassName("_attribute_value")[0]
             .firstChild;
           assert.equal(initial.data, "rend_value");
           caretCheck(editor, initial, 4, "caret after undo");

           // Check that the data change has been undone.
           assert.equal(data_node.value, "rend_value");
         });

      it("undoing an attribute addition undoes the addition", function test() {
        var p = editor.gui_root.querySelector(".body>.p");
        var data_p = editor.toDataNode(p);
        editor.validator._validateUpTo(data_p.firstChild ||
                                       data_p.nextElementSibling, 0);
        var el_name = getElementNameFor(p);
        assert.equal(getAttributeValuesFor(p).length, 0, "no attributes");
        var trs = editor.mode.getContextualActions(
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

        editor.undo();
        assert.equal(getAttributeValuesFor(p).length, 0, "no attributes");
        // We would ideally want the caret to be back in the element name but
        // there's currently an issue with doing this.
        caretCheck(editor, p, 1,
                   "the caret should be in a reasonable position");
      });

      it("undoing an attribute deletion undoes the deletion", function test() {
        var ps = editor.gui_root.querySelectorAll(".body>.p");
        var p = ps[7];
        var data_p = editor.toDataNode(p);
        editor.validator._validateUpTo(data_p.firstChild ||
                                       data_p.nextElementSibling, 0);
        var attr_names = getAttributeNamesFor(p);
        var attr_values = getAttributeValuesFor(p);
        var initial_value = attr_values[0].textContent;
        var initial_length = attr_values.length;
        assert.isTrue(initial_length > 0,
                      "the paragraph should have attributes");
        var attr = editor.toDataNode(attr_values[0]);
        var decoded_name = attr_names[0].textContent;
        var trs = editor.mode.getContextualActions(
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

        editor.undo();

        attr_values = getAttributeValuesFor(p);
        attr_names = getAttributeNamesFor(p);
        assert.equal(attr_values.length, initial_length,
                     "the attribute should be back");
        assert.equal(attr_names[0].textContent, decoded_name,
                     "the first attribute should be the one that was deleted");
        assert.equal(attr_values[0].textContent, initial_value,
                     "the attribute should have its initial value");
        caretCheck(editor, attr_values[0].firstChild, 0,
                   "the caret should be in the first attribute value");
      });

      it("doing an attribute addition changes the data", function test() {
        var p = editor.gui_root.querySelector(".body>.p");
        var data_p = editor.toDataNode(p);
        editor.validator._validateUpTo(data_p.firstChild ||
                                       data_p.nextElementSibling, 0);
        var el_name = getElementNameFor(p);
        assert.equal(getAttributeValuesFor(p).length, 0, "no attributes");
        var trs = editor.mode.getContextualActions(
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
        var ps = editor.gui_root.querySelectorAll(".body>.p");
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
        var trs = editor.mode.getContextualActions(
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

      it("clicking a gui element after typing text works", function test(done) {
        editor.whenCondition(
          "initialized",
          function initialized() {
            // Text node inside paragraph.
            var initial = editor.data_root.querySelector("body>p");
            caretManager.setCaret(initial.firstChild, 1);

            editor.type(" ");
            assert.equal(initial.firstChild.nodeValue, "B lah blah ");

            var caret = caretManager.getNormalizedCaret();
            var last_gui = domutil.closestByClass(caret.node, "p")
                  .lastElementChild;
            assert.isTrue(last_gui.classList.contains("_gui"));
            var last_gui_span = last_gui.firstElementChild;

            // We're simulating how Chrome would handle it. When a mousedown
            // event occurs, Chrome moves the caret *after* the mousedown event
            // is processed.
            var event = new $.Event("mousedown");
            event.target = last_gui_span;
            caretManager.setCaret(caret);

            // This simulates the movement of the caret after the mousedown
            // event is processed. This will be processed after the mousedown
            // handler but before _seekCaret is run.
            window.setTimeout(log.wrap(function timeout() {
              caretManager.setCaret(last_gui_span, 0);
            }), 0);

            // We trigger the event here so that the order specified above is
            // respected.
            $(last_gui_span).trigger(event);

            window.setTimeout(log.wrap(function timeout() {
              event = new $.Event("click");
              var offset = $(last_gui_span).offset();
              event.pageX = offset.left;
              event.pageY = offset.top;
              event.target = last_gui_span;
              $(last_gui_span).trigger(event);
              done();
            }), 1);
          });
      });

      it("clicking a phantom element after typing text works",
         function test(done) {
           editor.whenCondition(
             "initialized",
             function initialized() {
               // We create a special phantom element because the generic
               // mode does not create any.
               var title = editor.gui_root.getElementsByClassName("title")[0];
               var phantom = title.ownerDocument.createElement("span");
               phantom.className = "_phantom";
               phantom.textContent = "phantom";
               title.insertBefore(phantom, null);

               // Text node inside paragraph.
               var initial = editor.data_root.querySelector("body>p");
               caretManager.setCaret(initial.firstChild, 1);

               editor.type(" ");
               assert.equal(initial.firstChild.nodeValue, "B lah blah ");

               var caret = caretManager.getNormalizedCaret();

               // We're simulating how Chrome would handle it. When a mousedown
               // event occurs, Chrome moves the caret *after* the mousedown
               // event is processed.
               var event = new $.Event("mousedown");
               event.target = phantom;
               caretManager.setCaret(caret);

               // This simulates the movement of the caret after the mousedown
               // event is process. This will be processed after the mousedown
               // handler but before _seekCaret is run.
               window.setTimeout(log.wrap(function timeout() {
                 caretManager.setCaret(phantom, 0);
               }), 0);

               // We trigger the event here so that the order specified above is
               // respected.
               $(phantom).trigger(event);

               window.setTimeout(log.wrap(function timeout() {
                 event = new $.Event("click");
                 event.target = phantom;
                 $(phantom).trigger(event);
                 done();
               }), 1);
             });
         });


      it("an element that becomes empty acquires a placeholder",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var initial = editor.data_root.getElementsByTagName("title")[0];

           // Make sure we are looking at the right thing.
           assert.equal(initial.childNodes.length, 1);
           assert.equal(initial.firstChild.nodeValue, "abcd");
           caretManager.setCaret(initial, 0);
           var caret = caretManager.getNormalizedCaret();
           assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");

           // Delete all contents.
           editor.data_updater.removeNode(initial.firstChild);

           // We should have a placeholder now, between the two labels.
           assert.equal(caret.node.childNodes.length, 3);
           assert.isTrue(caret.node.childNodes[1].classList.contains(
             "_placeholder"));
         });

      it("an element that goes from empty to not empty is properly decorated",
         function test() {
           editor.validator._validateUpTo(editor.data_root, -1);

           var initial = editor.gui_root.querySelector(".publicationStmt>.p");
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
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var initial = editor.data_root.getElementsByTagName("title")[0];

        // Make sure we are looking at the right thing.
        assert.equal(initial.childNodes.length, 1);
        assert.equal(initial.firstChild.nodeValue, "abcd");
        caretManager.setCaret(initial, 0);
        var caret = caretManager.getNormalizedCaret();
        assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");

        var trs = editor.mode.getContextualActions(["wrap"], "hi", initial, 0);

        var tr = trs[0];
        var data = { node: undefined, name: "hi" };
        caretManager.setCaret(initial.firstChild, 1);
        caret = caretManager.getNormalizedCaret();
        caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

        tr.execute(data);

        var node = initial.getElementsByTagName("hi")[0];
        trs = editor.mode.getContextualActions(["unwrap"], "hi", node, 0);

        tr = trs[0];
        data = { node: node, element_name: "hi" };
        tr.execute(data);
        assert.equal(initial.childNodes.length, 1, "length after unwrap");
        assert.equal(initial.firstChild.nodeValue, "abcd");
      });

      it("wraps elements in elements (offset 0)", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var initial = editor.data_root.querySelectorAll("body>p")[4];

        // Make sure we are looking at the right thing.
        assert.equal(initial.childNodes.length, 1);
        assert.equal(initial.firstChild.nodeValue, "abcdefghij");

        var trs = editor.mode.getContextualActions(["wrap"], "hi", initial, 0);

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
           editor.validator._validateUpTo(editor.data_root, -1);

           // Text node inside title.
           var initial = editor.data_root.querySelectorAll("body>p")[4];

           // Make sure we are looking at the right thing.
           assert.equal(initial.childNodes.length, 1);
           assert.equal(initial.firstChild.nodeValue, "abcdefghij");

           var trs = editor.mode.getContextualActions(
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
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var initial = editor.data_root.querySelectorAll("body>p")[4];

        // Make sure we are looking at the right thing.
        assert.equal(initial.childNodes.length, 1);
        assert.equal(initial.firstChild.nodeValue, "abcdefghij");

        var trs = editor.mode.getContextualActions(["wrap"], "hi", initial, 0);

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
        editor.validator._validateUpTo(editor.data_root, -1);

        // Text node inside title.
        var initial = editor.data_root.querySelectorAll("body>p")[4];

        // Make sure we are looking at the right thing.
        assert.equal(initial.childNodes.length, 1);
        assert.equal(initial.firstChild.data, "abcdefghij");

        var trs = editor.mode.getContextualActions(["wrap"], "hi", initial, 0);

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


      it("brings up a contextual menu even when there is no caret",
         function test(done) {
           editor.validator._validateUpTo(editor.data_root, -1);
           var initial = editor.gui_root.getElementsByClassName("title")[0]
               .childNodes[1];
           assert.isUndefined(caretManager.getNormalizedCaret());
           activateContextMenu(editor, initial.parentNode);
           window.setTimeout(function timeout() {
             assert.isDefined(editor.editingMenuManager.currentDropdown,
                              "dropdown defined");
             assert.isDefined(caretManager.getNormalizedCaret(), "caret defined");
             done();
           }, 100);
         });

      it("does not crash when the user tries to bring up a contextual menu " +
         "when the caret is outside wed",
         function test(done) {
           editor.validator._validateUpTo(editor.data_root, -1);
           caretManager.clearSelection(); // Also clears the caret.
           assert.isUndefined(caretManager.getNormalizedCaret());
           activateContextMenu(editor,
                               editor.gui_root
                               .getElementsByClassName("title")[0]);
           window.setTimeout(function timeout() {
             assert.isDefined(editor.editingMenuManager.currentDropdown);
             done();
           }, 1);
         });

      it("brings up a contextual menu when there is a caret",
         function test(done) {
           editor.validator._validateUpTo(editor.data_root, -1);

           var initial = editor.gui_root.getElementsByClassName("title")[0]
                 .childNodes[1];
           caretManager.setCaret(initial, 0);

           activateContextMenu(editor, initial.parentNode);
           window.setTimeout(function timeout() {
             assert.isDefined(editor.editingMenuManager.currentDropdown);
             done();
           }, 1);
         });

      it("handles pasting simple text", function test() {
        var initial = editor.data_root.querySelector("body>p").firstChild;
        caretManager.setCaret(initial, 0);
        var initial_value = initial.nodeValue;

        // Synthetic event
        var event = global.makeFakePasteEvent({
          types: ["text/plain"],
          getData: function getData() {
            return "abcdef";
          },
        });
        editor.$gui_root.trigger(event);
        assert.equal(initial.nodeValue, "abcdef" + initial_value);
        dataCaretCheck(editor, initial, 6, "final position");
      });

      it("pasting spaces pastes a single space", function test() {
        var initial = editor.data_root.querySelector("body>p").firstChild;
        caretManager.setCaret(initial, 0);
        var initial_value = initial.nodeValue;

        // Synthetic event
        var event = global.makeFakePasteEvent({
          types: ["text/plain"],
          getData: function getData() {
            return "    \u00A0  ";
          },
        });
        editor.$gui_root.trigger(event);
        assert.equal(initial.nodeValue, " " + initial_value);
        dataCaretCheck(editor, initial, 1, "final position");
      });

      it("pasting zero-width space pastes nothing", function test() {
        var initial = editor.data_root.querySelector("body>p").firstChild;
        caretManager.setCaret(initial, 0);
        var initial_value = initial.nodeValue;

        // Synthetic event
        var event = global.makeFakePasteEvent({
          types: ["text/plain"],
          getData: function getData() {
            return "\u200B\u200B";
          },
        });
        editor.$gui_root.trigger(event);
        assert.equal(initial.nodeValue, initial_value);
        dataCaretCheck(editor, initial, 0, "final position");
      });

      it("handles pasting structured text", function test() {
        var p = editor.data_root.querySelector("body>p");
        var initial = p.firstChild;
        caretManager.setCaret(initial, 0);
        var initial_value = p.innerHTML;

        var to_paste = "Blah <term xmlns=\"http://www.tei-c.org/ns/1.0\">" +
              "blah</term> blah.";
        // Synthetic event
        var event = global.makeFakePasteEvent({
          types: ["text/html", "text/plain"],
          getData: function getData() {
            // We add the zero-width space for the heck of it.  It will be
            // stripped.
            return to_paste + "\u200B";
          },
        });
        editor.$gui_root.trigger(event);
        var expected = to_paste + initial_value;
        if (browsers.MSIE) {
          expected = expected.replace(" xmlns=\"http://www.tei-c.org/ns/1.0\"",
                                      "");
        }
        assert.equal(p.innerHTML, expected);
        dataCaretCheck(editor, p.childNodes[2], 6, "final position");
      });

      it("handles pasting structured text: invalid, decline pasting as text",
         function test(done) {
           var p = editor.data_root.querySelector("body>p");
           var initial = p.firstChild;
           caretManager.setCaret(initial, 0);
           var initial_value = p.innerHTML;

           // Synthetic event
           var event = global.makeFakePasteEvent({
             types: ["text/html", "text/plain"],
             getData: function getData() {
               return p.outerHTML;
             },
           });
           var $top = editor._paste_modal.getTopLevel();
           $top.one("shown.bs.modal", function shown() {
             // Wait until visible to add this handler so that it is run after
             // the callback that wed sets on the modal.
             $top.one("hidden.bs.modal",
                      function hidden() {
                        assert.equal(p.innerHTML, initial_value);
                        dataCaretCheck(editor, initial, 0, "final position");
                        done();
                      });
           });
           editor.$gui_root.trigger(event);
           // This clicks "No".
           editor._paste_modal._$footer.find(".btn")[1].click();
         });

      it("handles pasting structured text: invalid, accept pasting as text",
         function test(done) {
           var p = editor.data_root.querySelector("body>p");
           var initial = p.firstChild;
           caretManager.setCaret(initial, 0);
           var initial_value = p.innerHTML;
           var initial_outer = p.outerHTML;
           var x = document.createElement("div");
           x.textContent = initial_outer;
           var initial_outer_from_text_to_html = x.innerHTML;

           // Synthetic event
           var event = global.makeFakePasteEvent({
             types: ["text/html", "text/plain"],
             getData: function getData() {
               return initial_outer;
             },
           });

           var $top = editor._paste_modal.getTopLevel();
           $top.one("shown.bs.modal", function shown() {
             // Wait until visible to add this handler so that it is run after
             // the callback that wed sets on the modal.
             $top.one("hidden.bs.modal", function hidden() {
               assert.equal(p.innerHTML,
                            initial_outer_from_text_to_html + initial_value);
               dataCaretCheck(editor, p.firstChild,
                              initial_outer.length, "final position");
               done();
             });
             // This clicks "Yes".
             var button = editor._paste_modal._$footer[0]
                   .getElementsByClassName("btn-primary")[0];
             button.click();
           });
           editor.$gui_root.trigger(event);
         });

      it("handles pasting simple text into an attribute", function test() {
        var p = editor.data_root.querySelector("body>p:nth-of-type(8)");
        var initial = p.getAttributeNode("rend");
        caretManager.setCaret(initial, 0);
        var initial_value = initial.value;

        // Synthetic event
        var event = global.makeFakePasteEvent({
          types: ["text/plain"],
          getData: function getData() {
            return "abcdef";
          },
        });
        editor.$gui_root.trigger(event);
        assert.equal(initial.value, "abcdef" + initial_value);
        dataCaretCheck(editor, initial, 6, "final position");
      });

      it("handles cutting a well formed selection", function test(done) {
        force_reload = true;
        var p = editor.data_root.querySelector("body>p");
        var gui_start = caretManager.fromDataLocation(p.firstChild, 4);
        caretManager.setCaret(gui_start);
        caretManager.setRange(
          gui_start,
          caretManager.fromDataLocation(p.childNodes[2], 5));

        // Synthetic event
        var event = new $.Event("cut");
        editor.$gui_root.trigger(event);
        window.setTimeout(function timeout() {
          try {
            assert.equal(p.innerHTML, "Blah.");
          }
          catch (ex) {
            done(ex);
            return;
          }
          done();
        }, 1);
      });

      it("handles cutting a bad selection", function test(done) {
        var p = editor.data_root.querySelector("body>p");
        var original_inner_html = p.innerHTML;
        // Start caret is inside the term element.
        var gui_start = caretManager.fromDataLocation(p.childNodes[1].firstChild, 1);
        var gui_end = caretManager.fromDataLocation(p.childNodes[2], 5);
        caretManager.setRange(gui_start, gui_end);

        assert.equal(p.innerHTML, original_inner_html);
        var $top = editor.straddling_modal.getTopLevel();
        $top.one("shown.bs.modal", function shown() {
          // Wait until visible to add this handler so that it is run after the
          // callback that wed sets on the modal.
          $top.one("hidden.bs.modal",
                   function hidden() {
                     assert.equal(p.innerHTML, original_inner_html);
                     caretCheck(editor, gui_end.node, gui_end.offset,
                                "final position");
                     done();
                   });
        });
        // Synthetic event
        var event = new $.Event("cut");
        editor.$gui_root.trigger(event);
        // This clicks dismisses the modal
        editor.straddling_modal._$footer.find(".btn-primary")[0].click();
      });

      it("handles cutting in attributes", function test(done) {
        force_reload = true;
        var p = editor.data_root.querySelector("body>p:nth-of-type(8)");
        var initial = p.getAttributeNode("rend");
        var initial_value = initial.value;
        var start = caretManager.fromDataLocation(initial, 2);
        var end = caretManager.fromDataLocation(initial, 4);

        caretManager.setRange(start, end);

        // Synthetic event
        var event = new $.Event("cut");
        editor.$gui_root.trigger(event);
        window.setTimeout(function timeout() {
          try {
            assert.equal(initial.value, initial_value.slice(0, 2) +
                         initial_value.slice(4));
          }
          catch (ex) {
            done(ex);
            return;
          }
          done();
        }, 1);
      });

      it("handles properly caret position for words that are too " +
         "long to word wrap",
         function test() {
           var p = editor.data_root.getElementsByTagName("p")[0];
           editor.data_updater.insertText(
             p, 0,
             "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
               "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
               "AAAAAAAAAAAAA");
           caretManager.setCaret(p, 0);
           var range = editor.my_window.document.createRange();
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
          var p = editor.data_root.querySelectorAll("body>p")[5];
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
          var scroll_top = editor.my_window.document.body.scrollTop;
          var scroll_left = editor.my_window.document.body.scrollLeft;
          event.pageX = rect.left + scroll_left;
          event.pageY = ((rect.top + rect.bottom) / 2) + scroll_top;
          event.clientX = rect.left;
          event.clientY = ((rect.top + rect.bottom) / 2);
          event.which = 1; // First mouse button.
          editor.$gui_root.trigger(event);
          caretCheck(editor, text_loc.node, text_loc.offset,
                     "the caret should be in the text node");
        });

      // This test only checks that the editor does not crash.
      it("autofills in the midst of text", function test() {
        var p = editor.data_root.querySelector("body>p");
        assert.isTrue(p.firstChild.nodeType === Node.TEXT_NODE,
                      "we should set our caret in a text node");
        caretManager.setCaret(p.firstChild, 3);
        var trs = editor.mode.getContextualActions(
          ["insert"], "biblFull", p.firstChild, 0);

        var tr = trs[0];
        var data = { node: undefined, name: "biblFull" };
        tr.execute(data);
      });

      function assertNewMarkers(orig, after, event) {
        // Make sure all markers are new.
        var note = event ? " after " + event : "";
        for (var i = 0; i < orig.length; ++i) {
          var item = orig[i];
          assert.notInclude(after, item,
                            "the list of markers should be new" + note);
        }

        assert.equal(orig.count, after.count,
                     "the number of recorded errors should be the same" + note);
      }

      it("recreates errors when changing label visibility level",
         function test() {
           // Changing label visibility does not merely refresh the errors
           // but recreates them because errors that were visible may become
           // invisible or errors that were invisible may become visible.
           editor.validator._validateUpTo(editor.data_root, -1);
           var runner = editor.validationController.processErrorsRunner;
           return runner.onCompleted().then(function complete() {
             var orig = _slice.call(editor._errorLayer.el.children);

             // Reduce the visibility level.
             editor.type(key_constants.CTRLEQ_OPEN_BRACKET);
             var after;

             return waitForSuccess(function check() {
               after = _slice.call(editor._errorLayer.el.children);
               assertNewMarkers(orig, after, "decreasing the level");
             })
               .then(function then() {
                 orig = after;

                 // Increase visibility level
                 editor.type(key_constants.CTRLEQ_CLOSE_BRACKET);
                 return waitForSuccess(function check() {
                   assertNewMarkers(orig,
                                    _slice.call(editor._errorLayer.el.children),
                                    "increasing the level");
                 });
               });
           });
         });

      it("refreshes error positions when pasting", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        var runner = editor.validationController.processErrorsRunner;
        var refreshRunner = editor.validationController.refreshErrorsRunner;
        return runner.onCompleted().then(function complete() {
          assert.isFalse(refreshRunner.running);

          // Paste.
          var initial = editor.data_root.querySelector("body>p").firstChild;
          caretManager.setCaret(initial, 0);
          var initial_value = initial.nodeValue;

          // Synthetic event
          var event = global.makeFakePasteEvent({
            types: ["text/plain"],
            getData: function getData() {
              return "abcdef";
            },
          });
          editor.$gui_root.trigger(event);
          assert.equal(initial.nodeValue, "abcdef" + initial_value);
          dataCaretCheck(editor, initial, 6, "final position");

          return refreshRunner.onCompleted();
        });
      });

      it("refreshes error positions when typing text", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        var runner = editor.validationController.processErrorsRunner;
        var refreshRunner = editor.validationController.refreshErrorsRunner;
        return runner.onCompleted().then(function complete() {
          assert.isFalse(refreshRunner.running);

          // Text node inside title.
          var initial = editor.gui_root.getElementsByClassName("title")[0]
            .childNodes[1];
          var parent = initial.parentNode;
          caretManager.setCaret(initial, 0);

          editor.type("blah");
          assert.equal(initial.nodeValue, "blahabcd");
          assert.equal(parent.childNodes.length, 3);
          caretCheck(editor, initial, 4, "caret after text insertion");

          return refreshRunner.onCompleted();
        });
      });


      it("refreshes error positions when typing DELETE", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        var runner = editor.validationController.processErrorsRunner;
        var refreshRunner = editor.validationController.refreshErrorsRunner;
        return runner.onCompleted().then(function complete() {
          assert.isFalse(refreshRunner.running);

          // Text node inside title.
          var initial = editor.gui_root.getElementsByClassName("title")[0]
            .childNodes[1];
          var parent = initial.parentNode;
          caretManager.setCaret(initial, 0);

          editor.type(key_constants.DELETE);
          assert.equal(initial.nodeValue, "bcd");
          assert.equal(parent.childNodes.length, 3);
          caretCheck(editor, initial, 0, "caret after text deletion");

          return refreshRunner.onCompleted();
        });
      });

      it("refreshes error positions when typing BACKSPACE", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        var runner = editor.validationController.processErrorsRunner;
        var refreshRunner = editor.validationController.refreshErrorsRunner;
        return runner.onCompleted().then(function complete() {
          assert.isFalse(refreshRunner.running);

          // Text node inside title.
          var initial = editor.gui_root.getElementsByClassName("title")[0]
            .childNodes[1];
          var parent = initial.parentNode;
          caretManager.setCaret(initial, 4);

          editor.type(key_constants.BACKSPACE);
          assert.equal(initial.nodeValue, "abc");
          assert.equal(parent.childNodes.length, 3);
          caretCheck(editor, initial, 3, "caret after text deletion");

          return refreshRunner.onCompleted();
        });
      });

      describe("", function simplifiedSchema() {
        before(function before() {
          var new_options = $.extend(true, {}, option_stack[0]);
          new_options.schema = "/build/schemas/simplified-rng.js";
          option_stack.unshift(new_options);
          src_stack.unshift(
            "./wed_test_data/wildcard_converted.xml");
        });

        after(function after() {
          option_stack.shift();
          src_stack.shift();
        });

        it("marks elements and attributes allowed due to wildcards as " +
           "readonly",
           function test() {
             editor.validator._validateUpTo(editor.data_root, -1);
             var bar = editor.data_root.querySelector("bar");
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
             editor.validator._validateUpTo(editor.data_root, -1);
             var bar = editor.data_root.querySelector("bar");
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
             editor.validator._validateUpTo(editor.data_root, -1);
             var initial = editor.data_root.querySelector("bar");
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
             editor.$gui_root.trigger(event);
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

             editor.$gui_root.trigger(event);
             assert.equal(initial.textContent, "a" + initial_value);
             dataCaretCheck(editor, initial.firstChild, 4, "final position");
           });

        it("prevents cutting from readonly elements", function test(done) {
          editor.validator._validateUpTo(editor.data_root, -1);
          var initial = editor.data_root.querySelector("bar");
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
          editor.$gui_root.trigger(event);
          window.setTimeout(function timeout() {
            assert.equal(initial.textContent, initial_value);
            // Try again, after removing _readonly so that we prove the only
            // reason the cut did not work is that _readonly was present.
            initial_gui.classList.remove("_readonly");
            event = new $.Event("cut");
            editor.$gui_root.trigger(event);
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
             editor.validator._validateUpTo(editor.data_root, -1);
             activateContextMenu(
               editor,
               editor.gui_root.querySelector("._readonly ._element_name"));
             contextMenuHasOption(editor, /Complex name pattern/, 1);
           });

        it("a context menu has the complex pattern action, when " +
           "invoked on an attribute allowed due to a complex pattern",
           function test() {
             editor.validator._validateUpTo(editor.data_root, -1);
             activateContextMenu(
               editor,
               editor.gui_root.querySelector("._readonly ._attribute_value"));
             contextMenuHasOption(editor, /Complex name pattern/, 1);
           });


        it("a context menu invoked on a readonly element has no " +
           "actions that can transform the document",
           function test() {
             editor.validator._validateUpTo(editor.data_root, -1);
             activateContextMenu(
               editor,
               editor.gui_root.querySelector("._readonly ._element_name"));
             contextMenuHasNoTransforms(editor);
           });

        it("a context menu invoked on a readonly attribute has no " +
           "actions that can transform the document",
           function test() {
             editor.validator._validateUpTo(editor.data_root, -1);
             activateContextMenu(
               editor,
               editor.gui_root.querySelector("._readonly ._attribute_value"));
             contextMenuHasNoTransforms(editor);
           });
      });

      describe("interacts with the server:", function serverInteraction() {
        before(function before() {
          src_stack.unshift("./wed_test_data/server_interaction_converted.xml");
        });

        after(function after() {
          src_stack.shift();
        });

        beforeEach(function beforeEach(done) {
          global.reset(done);
        });

        it("saves", function test(done) {
          editor.addEventListener("saved", function saved() {
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
          editor.addEventListener("saved", function saved() {
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
          var p = editor.data_root.querySelector("p");
          caretManager.setCaret(p, 0);
          var trs = editor.mode.getContextualActions("insert", "abbr", p, 0);
          var tr = trs[0];
          tr.execute({ name: "abbr" });
          editor.type(key_constants.CTRLEQ_S);
        });

        it("does not autosave if not modified", function test(done) {
          editor.addEventListener("autosaved", function saved() {
            throw new Error("autosaved!");
          });
          editor._saver.setAutosaveInterval(50);
          setTimeout(done, 500);
        });

        it("autosaves when the document is modified", function test(done) {
          // We're testing that autosave is not called again
          // after the first time.
          var autosaved = false;
          var start;
          editor.addEventListener("autosaved", function saved() {
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
          editor.data_updater.removeNode(editor.data_root.querySelector("p"));
          editor._saver.setAutosaveInterval(50);
        });

        it("autosaves when the document is modified after a " +
           "first autosave timeout that did nothing",
           function test(done) {
             // We're testing that autosave is not called again
             // after the first time.
             var autosaved = false;
             var start;
             editor.addEventListener("autosaved", function saved() {
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
             editor._saver.setAutosaveInterval(interval);
             setTimeout(function timeout() {
               assert.isFalse(autosaved, "should not have been saved yet");
               start = Date.now();
               editor.data_updater.removeNode(
                 editor.data_root.querySelector("p"));
             }, interval * 2);
           });
      });


      describe("fails as needed and recovers:", function failsAndRecovers() {
        before(function before() {
          src_stack.unshift("./wed_test_data/server_interaction_converted.xml");
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
               var $modal = editor._disconnect_modal.getTopLevel();
               $modal.on("shown.bs.modal", function shown() {
                 editor.addEventListener("saved", function saved() {
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
               var $modal = editor._edited_by_other_modal.getTopLevel();
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
               var $modal = editor._too_old_modal.getTopLevel();
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

                 it("is able to start", function test(done) {
                   editor.whenCondition("first-validation-complete",
                                        function complete() {
                                          done();
                                        });
                 });
               });

      describe("attribute errors without attributes " +
               "shown (because of the label visibility level)",
               function attributesShown() {
                 beforeEach(function beforeEach(done) {
                   editor.whenCondition("first-validation-complete",
                                        function complete() {
                                          done();
                                        });
                 });
                 it("the attributes error are not linked", function test() {
                   while (editor._current_label_level) {
                     editor.decreaseLabelVisiblityLevel();
                   }

                   var controller = editor.validationController;
                   controller.processErrors();
                   return controller.processErrorsRunner.onCompleted()
                     .then(function complete() {
                       var errors = controller._errors;
                       var cases = 0;
                       for (var i = 0; i < errors.length; ++i) {
                         var error = errors[i];
                         if (isAttr(error.ev.node)) {
                           assert.isTrue(
                             error.item.getElementsByTagName("a").length === 0,
                             "there should be no link in the item");
                           assert.equal(error.item.title,
                                        "This error belongs to an attribute " +
                                        "which is not currently displayed.",
                                        "the item should have the right title");
                           cases++;
                         }
                       }
                       assert.equal(cases, 2);
                     });
                 });
               });

      describe("does not have completion menu", function noCompletion() {
        it("when the caret is in an attribute that takes " +
           "completions but the attribute is not visible",
           function test() {
             // Reduce visibility to 0 so that no attribute is visible.
             while (editor._current_label_level) {
               editor.decreaseLabelVisiblityLevel();
             }
             var p = editor.gui_root.querySelectorAll(".body>.p")[9];
             var attr_vals = getAttributeValuesFor(p);
             caretManager.setCaret(attr_vals[0].firstChild, 0);
             // This is an arbitrary menu item we check for.

             var menu = editor.my_window.document
                   .getElementsByClassName("wed-context-menu")[0];
             assert.isUndefined(menu, "the menu should not exist");
           });
      });
    });

    describe("(not state-sensitive)", function nonStateSensitive() {
      var editor;
      var caretManager;
      var ps;
      before(function before(done) {
        editor = new wed.Editor();
        editor.addEventListener("initialized", function initialized() {
          editor.validator._validateUpTo(editor.data_root, -1);
          ps = editor.gui_root.querySelectorAll(".body .p");
          caretManager = editor.caretManager;
          done();
        });
        var wedroot = wedwin.document.getElementById("wedroot");
        editor.init(wedroot, mergeWithGlobal(option_stack[0]), source);
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

      describe("has context menus", function hasContextMenus() {
        it("with attribute options, when invoked on a start label",
           function test() {
             activateContextMenu(
               editor,
               editor.gui_root.querySelector(
                 ".__start_label._title_label ._element_name"));
             contextMenuHasAttributeOption(editor);
           });

        it("with attribute options, when invoked in an attribute",
           function test() {
             activateContextMenu(
               editor,
               editor.gui_root.querySelector(
                 ".__start_label._p_label ._attribute_value"));
             contextMenuHasAttributeOption(editor);
           });

        it("on elements inside _phantom_wrap", function test() {
          var p = editor.gui_root
                .querySelector(".body .p[data-wed-rend='wrap']");
          var data_node = $.data(p, "wed_mirror_node");
          var rend = data_node.attributes.rend;
          if (rend) {
            rend = rend.value;
          }
          // Make sure the paragraph has rend="wrap".
          assert.equal(rend, "wrap");
          activateContextMenu(editor, p);
        });
      });

      describe("has a completion menu", function hasCompletion() {
        it("when the caret is in an attribute that takes completions",
           function test() {
             var p = ps[9];
             var attr_vals = getAttributeValuesFor(p);
             caretManager.setCaret(attr_vals[0].firstChild, 0);
             // This is an arbitrary menu item we check for.
             contextMenuHasOption(editor, /^Y$/);
           });
      });

      describe("has a completion menu", function hasCompletion() {
        it("when the caret is in an attribute for which the mode provides " +
           "completion",
           function test() {
             var p = ps[13];
             var attr_vals = getAttributeValuesFor(p);
             caretManager.setCaret(attr_vals[0].firstChild, 0);
             // This is an arbitrary menu item we check for.
             contextMenuHasOption(editor, /^completion1$/);
           });
      });

      describe("autohides attributes", function autohides() {
        it("autohidden attributes are hidden when the caret is not " +
           "in the element",
           function test() {
             var div = editor.gui_root.querySelectorAll(".body .div")[1];
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
             var div = editor.gui_root.querySelectorAll(".body .div")[1];
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
          assert.equal(editor._$navigation_panel.css("display"),
                       "none", "the list is not displayed");
          editor.setNavigationList("foo");
          assert.equal(editor._$navigation_panel.css("display"),
                       "block", "the list is displayed");
        });
      });

      function assertIsTextPhantom(node) {
        var cl;
        assert.isTrue(node && (cl = node.classList) &&
                      cl.contains("_text") && cl.contains("_phantom"));
      }

      describe("moveCaretRight", function moveCaretRight() {
        it("works even if there is no caret defined", function test() {
          editor.caretManager.onBlur();
          assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
          caretManager.move("right");
          assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
        });

        it("moves right into gui elements", function test() {
          // The 6th paragraph contains a test case.
          var initial = editor.gui_root.querySelectorAll(".body>.p")[5]
                .childNodes[1];
          assert.equal(initial.nodeType, Node.TEXT_NODE);
          caretManager.setCaret(initial, initial.length);
          caretCheck(editor, initial, initial.length, "initial");
          caretManager.move("right");
          var first_gui = firstGUI(initial.nextElementSibling);
          // It is now located inside the text inside the label.
          var element_name =
                first_gui.getElementsByClassName("_element_name")[0];
          caretCheck(editor, element_name, 0, "moved once");
          assert.equal(element_name.textContent, "hi");
        });


        it("moves into the first attribute of a start label", function test() {
          // Start label of last paragraph...
          var first_gui = firstGUI(ps[7]);
          var initial = first_gui.parentNode;
          var offset = _indexOf.call(initial.childNodes, first_gui);
          caretManager.setCaret(initial, offset);
          caretCheck(editor, initial, offset, "initial");
          caretManager.move("right");
          first_gui = firstGUI(initial);
          // It is now located inside the text inside the label which marks the
          // start of the TEI element.
          caretCheck(editor,
                     first_gui.getElementsByClassName("_element_name")[0], 0,
                     "moved once");

          caretManager.move("right");
          caretCheck(editor,
                     first_gui.getElementsByClassName("_attribute_value")[0]
                     .firstChild, 0, "moved twice");

          caretManager.move("right");
          caretCheck(editor,
                     first_gui.getElementsByClassName("_attribute_value")[0]
                     .firstChild, 1, "moved thrice");
        });

        it("moves into empty attributes", function test() {
          // Start label of last paragraph...
          var first_gui = firstGUI(ps[9]);
          var initial = first_gui.parentNode;
          var offset = _indexOf.call(initial.childNodes, first_gui);
          caretManager.setCaret(initial, offset);
          caretCheck(editor, initial, offset, "initial");
          caretManager.move("right");
          // It is w located inside the text inside the label which marks the
          // start of the TEI element.
          caretCheck(editor,
                     first_gui.getElementsByClassName("_element_name")[0], 0,
                     "moved once");

          caretManager.move("right");
          caretCheck(editor,
                     first_gui.getElementsByClassName("_attribute_value")[0]
                     .firstChild, 0, "moved twice");
        });

        it("moves from attribute to attribute", function test() {
          // First attribute of the start label of last paragraph...
          var first_gui = firstGUI(ps[7]);
          var initial = first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
          caretManager.setCaret(initial, initial.length);
          caretCheck(editor, initial, initial.length, "initial");
          caretManager.move("right");
          caretCheck(editor,
                     first_gui.getElementsByClassName("_attribute_value")[1]
                     .firstChild, 0, "moved");
        });

        it("moves out of attributes", function test() {
          // First attribute of the start label of last paragraph...
          var first_gui = firstGUI(ps[7]);
          var attributes = first_gui.getElementsByClassName("_attribute_value");
          var initial = attributes[attributes.length - 1].firstChild;
          caretManager.setCaret(initial, initial.length);
          caretCheck(editor, initial, initial.length, "initial");
          caretManager.move("right");
          caretCheck(editor, first_gui.nextSibling, 0, "moved");
        });

        it("moves right into text", function test() {
          var initial = editor.gui_root.getElementsByClassName("title")[0];
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("right");
          // It is now located inside the text inside
          // the label which marks the start of the TEI
          // element.
          caretCheck(editor,
                     firstGUI(initial)
                     .getElementsByClassName("_element_name")[0],
                     0, "moved once");
          caretManager.move("right");
          // It is now inside the text
          var text_node = domutil.childByClass(initial, "_gui").nextSibling;
          caretCheck(editor, text_node, 0, "moved 2 times");
          caretManager.move("right");
          // move through text
          caretCheck(editor, text_node, 1, "moved 3 times");
          caretManager.move("right");
          caretManager.move("right");
          caretManager.move("right");
          // move through text
          caretCheck(editor, text_node, 4, "moved 6 times");
          caretManager.move("right");
          // It is now inside the final gui element.
          caretCheck(editor,
                     lastGUI(initial).getElementsByClassName("_element_name")[0],
                     0, "moved 7 times");
        });

        it("moves right from text to text", function test() {
          var term = editor.gui_root.querySelector(".body>.p>.term");
          var initial = term.previousSibling;
          // Make sure we are on the right element.
          assert.equal(initial.nodeType, Node.TEXT_NODE);
          assert.equal(initial.nodeValue, "Blah blah ");

          caretManager.setCaret(initial, initial.nodeValue.length - 1);
          caretCheck(editor, initial, initial.nodeValue.length - 1, "initial");

          caretManager.move("right");
          caretCheck(editor, initial, initial.nodeValue.length, "moved once");

          caretManager.move("right");
          // The first child node is an invisible element label.
          caretCheck(editor, term.childNodes[1], 0, "moved twice");
        });

        it("moves right out of elements", function test() {
          var title = editor.gui_root.getElementsByClassName("title")[0];
          // Text node inside title.
          var initial = title.childNodes[1];
          caretManager.setCaret(initial, initial.nodeValue.length);
          caretCheck(editor, initial, initial.nodeValue.length, "initial");
          caretManager.move("right");
          // It is now inside the final gui element.
          caretCheck(editor, lastGUI(initial.parentNode)
                     .getElementsByClassName("_element_name")[0],
                     0, "moved once");
          caretManager.move("right");
          // It is now before the gui element at end of the title's parent.
          var last_gui = lastGUI(title.parentNode);
          caretCheck(editor, last_gui.parentNode,
                     last_gui.parentNode.childNodes.length - 1,
                     "moved twice");
        });

        it("moves past the initial nodes around editable contents",
           function test() {
             var child = editor.gui_root.getElementsByClassName("ref")[0];
             var initial = child.parentNode;
             var offset = _indexOf.call(initial.childNodes, child);
             caretManager.setCaret(initial, offset);
             caretCheck(editor, initial, offset, "initial");

             caretManager.move("right");

             var final_offset = 2;
             var caret_node = child.childNodes[final_offset];
             assertIsTextPhantom(caret_node);
             assertIsTextPhantom(caret_node.previousSibling);
             caretCheck(editor, child, final_offset, "moved once");
           });

        it("moves out of an element when past the last node around " +
           "editable contents",
           function test() {
             var initial = editor.gui_root.getElementsByClassName("ref")[0];
             // Check that what we are expecting to be around the caret is
             // correct.
             var offset = 2;
             var caret_node = initial.childNodes[offset];
             assertIsTextPhantom(caret_node);
             assertIsTextPhantom(caret_node.previousSibling);

             caretManager.setCaret(initial, offset);
             caretCheck(editor, initial, offset, "initial");

             caretManager.move("right");

             caretCheck(editor, initial.parentNode,
                        _indexOf.call(initial.parentNode.childNodes,
                                      initial) + 1, "moved once");
           });

        it("does not move when at end of document", function test() {
          var initial = lastGUI(domutil.childByClass(editor.gui_root, "TEI"));
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("right");
          // Same position
          caretCheck(editor, initial, 0, "moved once");
        });
      });

      describe("caretManager.newPosition left", function positionLeft() {
        it("returns the first position in the element name if it starts " +
           "from any other position in the element name",
           function test() {
             var first_gui =
                   editor.gui_root.getElementsByClassName("__start_label")[0];
             var el_name = first_gui.getElementsByClassName("_element_name")[0];
             var before = caretManager.makeCaret(el_name.firstChild, 1);
             var after = caretManager.newPosition(before, "left");
             assert.equal(after.node, el_name);
             assert.equal(after.offset, 0);
           });

        it("returns the position before the element if it starts " +
           "in the first position in the element name",
           function test() {
             var el_name = getElementNameFor(ps[7]);
             var before = caretManager.makeCaret(el_name, 0);
             var after = caretManager.newPosition(before, "left");
             var parent = ps[7].parentNode;
             assert.equal(after.node, parent);
             assert.equal(after.offset, _indexOf.call(parent.childNodes, ps[7]));
           });
      });

      describe("caretManager.move('left')", function moveCaretLeft() {
        it("works even if there is no caret defined", function test() {
          editor.caretManager.onBlur();
          assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
          caretManager.move("left");
          assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
        });

        it("moves left into gui elements", function test() {
          var initial = editor.gui_root.firstChild;
          var offset = initial.childNodes.length;
          caretManager.setCaret(initial, offset);
          caretCheck(editor, initial, offset, "initial");
          var last_gui = lastGUI(initial);

          caretManager.move("left");
          // It is now located inside the text inside the label which marks the
          // end of the TEI element.
          caretCheck(editor,
                     last_gui.getElementsByClassName("_element_name")[0],
                     0, "moved once");

          caretManager.move("left");
          caretCheck(editor, last_gui.parentNode,
                     last_gui.parentNode.childNodes.length - 1,
                     "moved twice");

          caretManager.move("left");
          // It is now in the gui element of the 1st child.
          var texts = initial.getElementsByClassName("text");
          caretCheck(editor, lastGUI(texts[texts.length - 1])
                     .getElementsByClassName("_element_name")[0],
                     0, "moved 3 times");
        });

        it("moves into the last attribute of a start label", function test() {
          // Start label of last paragraph...
          var first_gui = firstGUI(ps[7]);
          var initial = first_gui.parentNode;
          var offset = _indexOf.call(initial.childNodes, first_gui) + 1;
          // Set the caret just after the start label
          caretManager.setCaret(initial, offset);
          caretCheck(editor, initial, offset, "initial");

          var attrs =
                first_gui.getElementsByClassName("_attribute_value");
          var last_attr_text = attrs[attrs.length - 1].firstChild;
          caretManager.move("left");
          caretCheck(editor, last_attr_text, last_attr_text.length,
                     "moved once");

          caretManager.move("left");
          caretCheck(editor, last_attr_text, last_attr_text.length - 1,
                     "moved twice");
        });

        it("moves into empty attributes", function test() {
          // Start label of last paragraph...
          var first_gui = firstGUI(ps[9]);
          var initial = first_gui.parentNode;
          var offset = _indexOf.call(initial.childNodes, first_gui) + 1;
          // Set the caret just after the start label
          caretManager.setCaret(initial, offset);
          caretCheck(editor, initial, offset, "initial");

          var attrs = first_gui.getElementsByClassName("_attribute_value");
          var last_attr = attrs[attrs.length - 1];
          caretManager.move("left");
          caretCheck(editor, last_attr.firstChild, 0, "moved once");
        });

        it("moves from attribute to attribute", function test() {
          // Start label of last paragraph...
          var first_gui = firstGUI(ps[7]);
          var attrs = first_gui.getElementsByClassName("_attribute_value");
          var initial = attrs[attrs.length - 1].firstChild;
          // Set the caret at the start of the last attribute.
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");

          caretManager.move("left");
          var next_to_last_attr_text = attrs[attrs.length - 2].firstChild;
          caretCheck(editor, next_to_last_attr_text,
                     next_to_last_attr_text.length,
                     "moved once");
        });

        it("moves out of attributes", function test() {
          // Start label of last paragraph...
          var first_gui = firstGUI(ps[7]);
          var attrs = first_gui.getElementsByClassName("_attribute_value");
          // Set the caret at the start of the first attribute.
          var initial = attrs[0].firstChild;
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");

          caretManager.move("left");
          caretCheck(editor,
                     first_gui.getElementsByClassName("_element_name")[0], 0,
                     "moved once");
        });

        it("moves out of a start label", function test() {
          var p = ps[7];
          // Start label of last paragraph...
          var first_gui = firstGUI(p);
          // Set the caret at the start of the first attribute.
          var initial = first_gui.getElementsByClassName("_element_name")[0];
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");

          var parent = p.parentNode;
          caretManager.move("left");
          caretCheck(editor, parent,
                     _indexOf.call(parent.childNodes, p), "moved once");
        });

        it("moves left into text", function test() {
          var last_gui =
                lastGUI(editor.gui_root.getElementsByClassName("title")[0]);
          var initial = last_gui.getElementsByClassName("_element_name")[0];
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("left");
          // It is now inside the text
          var text_node = last_gui.previousSibling;
          var offset = text_node.length;
          caretCheck(editor, text_node, offset, "moved once");
          caretManager.move("left");
          // move through text
          offset--;
          caretCheck(editor, text_node, offset, "moved twice");
          caretManager.move("left");
          caretManager.move("left");
          caretManager.move("left");
          caretCheck(editor, text_node, 0, "moved 5 times");
          caretManager.move("left");
          // It is now inside the first gui element.
          caretCheck(editor, firstGUI(editor.gui_root
                                      .getElementsByClassName("title")[0])
                     .getElementsByClassName("_element_name")[0],
                     0, "moved 6 times");
        });

        it("moves left out of elements", function test() {
          var title = editor.gui_root.getElementsByClassName("title")[0];
          var initial = firstGUI(title);
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("left");
          // It is now after the gui element at start of the title's parent.
          var first_gui = firstGUI(title.parentNode);

          caretCheck(editor, first_gui.parentNode, 1, "moved once");
        });

        it("moves left from text to text", function test() {
          var term = editor.gui_root.querySelector(".body>.p>.term");
          var initial = term.nextSibling;
          // Make sure we are on the right element.
          assert.equal(initial.nodeType, Node.TEXT_NODE);
          assert.equal(initial.nodeValue, " blah.");

          caretManager.setCaret(initial, 1);
          caretCheck(editor, initial, 1, "initial");

          caretManager.move("left");
          caretCheck(editor, initial, 0, "moved once");

          caretManager.move("left");
          caretCheck(editor, term.childNodes[1],
                     term.childNodes[1].nodeValue.length, "moved twice");
        });

        it("moves past the final nodes around editable contents",
           function test() {
             var child = editor.gui_root.getElementsByClassName("ref")[0];
             var initial = child.parentNode;
             var offset = _indexOf.call(initial.childNodes, child) + 1;
             caretManager.setCaret(initial, offset);
             caretCheck(editor, initial, offset, "initial");

             caretManager.move("left");

             var final_offset = 2;
             var caret_node = child.childNodes[final_offset];
             assertIsTextPhantom(caret_node);
             assertIsTextPhantom(caret_node.previousSibling);
             caretCheck(editor, child, final_offset, "moved once");
           });

        it("moves out of an element when past the first node around " +
           "editable contents",
           function test() {
             var initial = editor.gui_root.getElementsByClassName("ref")[0];
             // Check that what we are expecting to be around the caret is
             // correct.
             var offset = 2;
             var caret_node = initial.childNodes[offset];
             assertIsTextPhantom(caret_node);
             assertIsTextPhantom(caret_node.previousSibling);

             caretManager.setCaret(initial, offset);
             caretCheck(editor, initial, offset, "initial");

             caretManager.move("left");

             caretCheck(editor, initial.parentNode,
                        _indexOf.call(initial.parentNode.childNodes,
                                      initial), "moved once");
           });


        it("does not move when at start of document", function test() {
          var initial = firstGUI(domutil.childByClass(editor.gui_root, "TEI"));
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("left");
          // Same position
          caretCheck(editor, initial, 0, "moved once");
        });
      });

      describe("caretManager.move('up')", function moveCaretUp() {
        it("does not move when at the start of a document", function test() {
          var initial = firstGUI(domutil.childByClass(editor.gui_root, "TEI"));
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("up");
          // Same position
          caretCheck(editor, initial, 0, "moved once");
        });

        it("does not crash when moving from 2nd line", function test() {
          var tei = getElementNameFor(
            domutil.childByClass(editor.gui_root, "TEI"));
          var initial = firstGUI(
            editor.gui_root.getElementsByClassName("teiHeader")[0]);
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("up");
          // It will be in the element name of TEI.
          caretCheck(editor, tei, 0, "moved once");
        });
      });

      describe("caretManager.move('down')", function moveCaretDown() {
        it("does not move when at end of document", function test() {
          var initial = lastGUI(domutil.childByClass(editor.gui_root, "TEI"));
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("down");
          // Same position
          caretCheck(editor, initial, 0, "moved once");
        });

        it("does not crash when moving from 2nd to last line", function test() {
          var initial = lastGUI(
            editor.gui_root.getElementsByClassName("text")[0]);
          caretManager.setCaret(initial, 0);
          caretCheck(editor, initial, 0, "initial");
          caretManager.move("down");
          // It will be in the element name of TEI.
          var tei = lastGUI(
            domutil.childByClass(editor.gui_root, "TEI"))
              .getElementsByClassName("_element_name")[0];
          caretCheck(editor, tei, 0, "moved once");
        });
      });

      describe("down arrow", function downArrow() {
        it("moves the caret to the next line", function test() {
          // Text node inside paragraph.
          var initial = editor.data_root.querySelector("body>p");
          caretManager.setCaret(initial.firstChild, 0);

          editor.type(key_constants.DOWN_ARROW);

          // We end up in the next paragraph.
          dataCaretCheck(editor,
                         domutil.firstDescendantOrSelf(
                           initial.nextElementSibling),
                         0, "moved down");
        });
      });

      describe("up arrow", function upArrow() {
        it("moves the caret to the previous line", function test() {
          // Text node inside 2nd paragraph.
          var initial = editor.data_root.querySelectorAll("body>p")[1];
          caretManager.setCaret(initial.firstChild, 0);

          editor.type(key_constants.UP_ARROW);

          // We end up in the previous paragraph.
          dataCaretCheck(editor,
                         domutil.firstDescendantOrSelf(
                           initial.previousElementSibling),
                         0, "moved up");
        });
      });

      it("moving the caret scrolls the pane", function moving(done) {
        var initial = editor.data_root;
        caretManager.setCaret(initial.firstChild, 0);

        var initialScroll = editor._scroller.scrollTop;

        editor._scroller.events.first().subscribe(function scroll() {
          // We need to wait until the scroller has fired the scroll event.
          assert.isTrue(initialScroll < editor._scroller.scrollTop);
          var caretRect = editor.caretManager.mark.getBoundingClientRect();
          var scrollerRect = editor._scroller.getBoundingClientRect();
          assert.equal(util.distFromRect(caretRect.left, caretRect.top,
                                         scrollerRect.left, scrollerRect.top,
                                         scrollerRect.right,
                                         scrollerRect.bottom),
                       0, "caret should be in visible space");
          done();
        });

        caretManager.setCaret(initial.firstChild,
                        initial.firstChild.childNodes.length);
      });

      it("processes validation errors added by the mode", function test() {
        editor.validator._validateUpTo(editor.data_root, -1);
        var errors = editor.validationController._errors;
        var last = errors[errors.length - 1];
        assert.equal(last.ev.error.toString(), "Test");
      });

      it("refreshErrors does not change the number of errors",
         function test() {
           var gui_root = editor.gui_root;
           editor.validator._validateUpTo(editor.data_root, -1);
           var controller = editor.validationController;
           // Force the processing of errors
           controller.processErrors();
           return controller.processErrorsRunner.onCompleted()
             .then(function completed() {
               var count = controller._errors.length;
               var list_count = editor.$error_list.children("li").length;
               var marker_count =
                   gui_root.getElementsByClassName("wed-validation-error")
                   .length;

               controller.refreshErrors();
               return controller.refreshErrorsRunner.onCompleted()
                 .then(function refreshed() {
                   assert.equal(
                     count, controller._errors.length,
                     "the number of recorded errors should be the same");
                   assert.equal(
                     list_count, editor.$error_list.children("li").length,
                     "the number of errors in the panel should be the " +
                       "same");
                   assert.equal(
                     marker_count,
                     gui_root.getElementsByClassName("wed-validation-error")
                       .length,
                     "the number of markers should be the same");
                 });
             });
         });

      // This cannot be run on IE due to the way IE screws up the
      // formatting of contenteditable elements.
      itNoIE("shows validation errors for inline elements in a correct " +
             "position",
             function test() {
               editor.validator._validateUpTo(editor.data_root, -1);
               var controller = editor.validationController;
               // Force the processing of errors
               controller.processErrors();

               return controller.processErrorsRunner.onCompleted()
                 .then(function completed() {
                   var p = ps[12];
                   var data_p = editor.toDataNode(p);
                   var data_monogr = data_p.childNodes[0];
                   var monogr = $.data(data_monogr, "wed_mirror_node");
                   assert.equal(data_monogr.tagName, "monogr");

                   var errors = controller._errors;
                   var p_error;
                   var p_error_ix;
                   var monogr_error;
                   var monogr_error_ix;
                   for (var i = 0; i < errors.length; ++i) {
                     var error = errors[i];
                     if (!p_error && error.ev.node === data_p) {
                       p_error = error;
                       p_error_ix = i;
                     }

                     if (!monogr_error && error.ev.node === data_monogr) {
                       monogr_error = error;
                       monogr_error_ix = i;
                     }
                   }

                   // Make sure we found our errors.
                   assert.isDefined(p_error, "no error for our paragraph");
                   assert.isDefined(monogr_error, "no error for our monogr");

                   // Find the corresponding markers
                   var markers = editor._errorLayer.el.children;
                   var p_marker = markers[p_error_ix];
                   var monogr_marker = markers[monogr_error_ix];
                   assert.isDefined(p_marker,
                                    "should have an error for our paragraph");
                   assert.isDefined(monogr_marker,
                                    "should have an error for our monogr");

                   var p_marker_rect = p_marker.getBoundingClientRect();

                   // The p_marker should appear to the right of the start
                   // label for the paragraph and overlap with the start
                   // label for monogr.
                   var p_start_label = firstGUI(p);
                   assert.isTrue(
                     p_start_label.classList.contains("__start_label"),
                     "should should have a start label for the paragraph");
                   var p_start_label_rect =
                       p_start_label.getBoundingClientRect();
                   assert.isTrue(p_marker_rect.left >= p_start_label_rect.right,
                                 "the paragraph error marker should be to " +
                                 "the right of the start label for the " +
                                 "paragraph");
                   assert.isTrue(Math.abs(p_marker_rect.bottom -
                                          p_start_label_rect.bottom) <= 5,
                                 "the paragraph error marker should have " +
                                 "a bottom which is within 5 pixels of the " +
                                 "bottom of the start label for the paragraph");
                   assert.isTrue(Math.abs(p_marker_rect.top -
                                          p_start_label_rect.top) <= 5,
                                 "the paragraph error marker should have " +
                                 "a top which is within 5 pixels of the " +
                                 "top of the start label for the paragraph");

                   var monogr_start_label = firstGUI(monogr);
                   assert.isTrue(
                     monogr_start_label.classList.contains("__start_label"),
                     "should should have a start label for the paragraph");
                   var monogr_start_label_rect =
                     monogr_start_label.getBoundingClientRect();
                   assert.isTrue(Math.abs(p_marker_rect.left -
                                          monogr_start_label_rect.left) <= 5,
                                 "the paragraph error marker have a left side " +
                                 "within 5 pixels of the left side of the " +
                                 "start label for the monogr");


                   // The monogr_marker should be to the right of the
                   // monogr_start_label.

                   var monogr_marker_rect = monogr_marker.getBoundingClientRect();

                   assert.isTrue(monogr_marker_rect.left >=
                                 monogr_start_label_rect.right,
                                 "the monogr error marker should be to " +
                                 "the right of the start label for the monogr");
                   monogr_marker.scrollIntoView();
                   assert.isTrue(Math.abs(monogr_marker_rect.bottom -
                                          monogr_start_label_rect.bottom) <= 5,
                                 "the monogr error marker should have " +
                                 "a bottom which is within 5 pixels of the " +
                                 "bottom of the start label for the monogr");
                   assert.isTrue(Math.abs(monogr_marker_rect.top -
                                          monogr_start_label_rect.top) <= 5,
                                 "the monogr error marker should have " +
                                 "a top which is within 5 pixels of the " +
                                 "top of the start label for the monogr");
                 });
             });

      describe("the location bar", function locationBar() {
        it("ignores placeholders", function test() {
          var ph = editor.gui_root.getElementsByClassName("_placeholder")[0];
          caretManager.setCaret(ph, 0);
          assert.equal(
            // Normalize all spaces to a regular space with ``replace``.
            editor._wed_location_bar.textContent.replace(/\s+/g, " "),
            " TEI / teiHeader / fileDesc / publicationStmt / p ");
        });

        it("ignores phantom parents", function test() {
          var p = editor.gui_root.querySelector(".ref>._text._phantom");
          // We are cheating here. Instead of creating a mode what would put
          // children elements inside of a phantom element we manually add a
          // child.
          p.innerHTML = "<span>foo</span>" + p.innerHTML;
          var child = p.firstChild;

          caretManager.setCaret(child, 0);
          assert.equal(
            // Normalize all spaces to a regular space with ``replace``.
            editor._wed_location_bar.textContent.replace(/\s+/g, " "),
            " TEI / text / body / p / ref ");
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
