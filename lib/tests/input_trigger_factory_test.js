/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var input_trigger_factory = require("wed/input-trigger-factory");
  var wed = require("wed/wed");
  var key = require("wed/key");
  var key_constants = require("wed/key-constants");
  var salve = require("salve");
  var global = require("./global");
  var onerror = require("wed/onerror");
  var log = require("wed/log");
  var GUISelector = require("wed/gui-selector").GUISelector;
  var schema = require("text!../../../schemas/tei-simplified-rng.js");
  var generic_src =
        require("text!./input_trigger_test_data/source_converted.xml");
  var source2 =
        require("text!./input_trigger_test_data/source2_converted.xml");
  var source3 =
        require("text!./input_trigger_test_data/source3_converted.xml");

  var assert = chai.assert;

  var options = {
    schema: undefined,
    mode: {
      path: "wed/modes/generic/generic",
      options: {
        metadata: "/build/schemas/tei-metadata.json",
      },
    },
  };

// Yes, we use *input_trigger* test data.
  var src_stack = [generic_src];

// This is an ad-hoc function meant for these tests *only*. The XML
// serialization adds an xmlns declaration that we don't care
// for. So...
  function cleanNamespace(str) {
    return str.replace(/ xmlns=".*?"/, "");
  }

  describe("input_trigger_factory", function input_trigger_factoryBlock() {
    var editor;
    var mode;
    var pSelector = GUISelector.fromDataSelector(
      "p",
      { "": "http://www.tei-c.org/ns/1.0" });

    before(function before() {
        // Resolve the schema to a grammar.
      options.schema = salve.constructTree(schema);
    });

    beforeEach(function beforeEach() {
      editor = new wed.Editor();
      var wedroot = window.parent.document.getElementById("wedframe")
            .contentWindow.document.getElementById("wedroot");
      return editor.init(wedroot, options, src_stack[0]).then(function cb() {
        mode = editor.modeTree.getMode(editor.guiRoot);
      });
    });

    afterEach(function afterEach() {
      if (editor) {
        editor.destroy();
      }
      editor = undefined;
      assert.isFalse(onerror.is_terminating(),
                     "test caused an unhandled exception to occur");
        // We don't reload our page so we need to do this.
      onerror.__test.reset();
      log.clearAppenders();
    });

    function mit(name, fn) {
      it(name, function test() {
        fn();
        // We want to make sure the changes do not screw up validation and we
        // want to catch these errors in the test, rather than the hook.
        editor.validator._validateUpTo(editor.dataRoot, -1);
      });
    }

    describe("makeSplitMergeInputTrigger", function makeSplitMerge() {
      mit("creates an InputTrigger that handles a split triggered by a " +
          "keypress event",
          function test() {
            input_trigger_factory.makeSplitMergeInputTrigger(
              editor, mode, pSelector, key.makeKey(";"),
              key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.dataRoot.getElementsByTagName("p");
            editor.caretManager.setCaret(ps[ps.length - 1].firstChild, 4);
            editor.type(";");

            ps = editor.dataRoot.querySelectorAll("body p");
            assert.equal(ps.length, 2);
            assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah</p>");
            assert.equal(ps.length, 2);
            assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah</p>");
            assert.equal(cleanNamespace(ps[1].outerHTML),
                         "<p> blah <term>blah</term>" +
                         "<term>blah2</term> blah.</p>");
          });

      mit("creates an InputTrigger that handles a split triggered by a " +
          "keydown event",
          function test() {
            input_trigger_factory.makeSplitMergeInputTrigger(
              editor, mode, pSelector, key_constants.ENTER,
              key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.dataRoot.getElementsByTagName("p");
            editor.caretManager.setCaret(ps[ps.length - 1].firstChild, 4);
            editor.type(key_constants.ENTER);

            ps = editor.dataRoot.querySelectorAll("body p");
            assert.equal(ps.length, 2);
            assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah</p>");
            assert.equal(ps.length, 2);
            assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah</p>");
            assert.equal(cleanNamespace(ps[1].outerHTML),
                         "<p> blah <term>blah</term>" +
                         "<term>blah2</term> blah.</p>");
          });


      mit("creates an InputTrigger that handles a split triggered by a " +
           "paste event",
           function test() {
             input_trigger_factory.makeSplitMergeInputTrigger(
               editor, mode, pSelector, key.makeKey(";"),
               key_constants.BACKSPACE, key_constants.DELETE);

             var ps = editor.dataRoot.querySelectorAll("body p");
             assert.equal(ps.length, 1);

             // Synthetic event
             var event = global.makeFakePasteEvent({
               types: ["text/plain"],
               getData: function getData() {
                 return "ab;cd;ef";
               },
             });
             editor.caretManager.setCaret(ps[0], 0);
             editor.$guiRoot.trigger(event);

             ps = editor.dataRoot.querySelectorAll("body p");
             assert.equal(ps.length, 3);
             assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>");
             assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>");
             assert.equal(cleanNamespace(ps[2].outerHTML),
                          "<p>efBlah blah <term>blah</term>" +
                          "<term>blah2</term> blah.</p>");
           });
    });

    describe("makeSplitMergeInputTrigger", function makeSplitMerge() {
      before(function before() {
        src_stack.unshift(source2);
      });
      after(function after() {
        src_stack.shift();
      });

      mit("creates an InputTrigger that backspaces in phantom text",
          function test() {
            input_trigger_factory.makeSplitMergeInputTrigger(
              editor, mode, pSelector, key_constants.ENTER,
              key_constants.BACKSPACE, key_constants.DELETE);

            editor.caretManager.setCaret(
              editor.guiRoot.querySelector(".p>.ref").firstChild, 1);
            editor.type(key_constants.BACKSPACE);

            var ps = editor.dataRoot.querySelectorAll("body>p");
            assert.equal(ps.length, 1);
          });

      mit("creates an InputTrigger that deletes in phantom text",
          function test() {
            input_trigger_factory.makeSplitMergeInputTrigger(
              editor, mode, pSelector, key_constants.ENTER,
              key_constants.BACKSPACE, key_constants.DELETE);

            editor.caretManager.setCaret(
              editor.guiRoot.querySelector(".p>.ref")
                .lastChild.previousSibling, 0);
            editor.type(key_constants.DELETE);

            var ps = editor.dataRoot.querySelectorAll("body>p");
            assert.equal(ps.length, 1);
          });
    });

    describe("makeSplitMergeInputTrigger", function makeSplitMerge() {
      before(function before() {
        src_stack.unshift(source3);
      });
      after(function after() {
        src_stack.shift();
      });

      mit("creates an InputTrigger that merges on BACKSPACE", function test() {
        input_trigger_factory.makeSplitMergeInputTrigger(
          editor, mode, pSelector, key_constants.ENTER,
          key_constants.BACKSPACE, key_constants.DELETE);

        var ps = editor.dataRoot.querySelectorAll("body>p");
        assert.equal(ps.length, 2,
                     "there should be 2 paragraphs before backspacing");

        editor.caretManager.setCaret(ps[1].firstChild, 0);
        editor.type(key_constants.BACKSPACE);

        ps = editor.dataRoot.querySelectorAll("body>p");
        assert.equal(ps.length, 1,
                     "there should be 1 paragraph after backspacing");
        assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");
      });

      mit("creates an InputTrigger that merges on BACKSPACE, and can undo",
          function test() {
            input_trigger_factory.makeSplitMergeInputTrigger(
              editor, mode, pSelector, key_constants.ENTER,
              key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.dataRoot.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs before backspacing");

            editor.caretManager.setCaret(ps[1].firstChild, 0);
            editor.type(key_constants.BACKSPACE);

            ps = editor.dataRoot.querySelectorAll("body>p");
            assert.equal(ps.length, 1,
                         "there should be 1 paragraph after backspacing");
            assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");

            editor.undo();

            ps = editor.dataRoot.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs after undo");
            assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Bar</p>");
            assert.equal(cleanNamespace(ps[1].outerHTML), "<p>Foo</p>");
          });

      mit("creates an InputTrigger that merges on DELETE", function test() {
        input_trigger_factory.makeSplitMergeInputTrigger(
          editor, mode, pSelector, key_constants.ENTER,
          key_constants.BACKSPACE, key_constants.DELETE);

        var ps = editor.dataRoot.querySelectorAll("body>p");
        assert.equal(ps.length, 2,
                     "there should be 2 paragraphs before backspacing");

        editor.caretManager.setCaret(ps[0].lastChild,
                                     ps[0].lastChild.nodeValue.length);
        editor.type(key_constants.DELETE);

        ps = editor.dataRoot.querySelectorAll("body>p");
        assert.equal(ps.length, 1,
                     "there should be 1 paragraph after backspacing");
        assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");
      });

      mit("creates an InputTrigger that merges on DELETE, and can undo",
          function test() {
            input_trigger_factory.makeSplitMergeInputTrigger(
              editor, mode, pSelector, key_constants.ENTER,
              key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.dataRoot.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs before backspacing");

            editor.caretManager.setCaret(ps[0].lastChild,
                                         ps[0].lastChild.nodeValue.length);
            editor.type(key_constants.DELETE);

            ps = editor.dataRoot.querySelectorAll("body>p");
            assert.equal(ps.length, 1,
                         "there should be 1 paragraph after backspacing");
            assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");

            editor.undo();
            ps = editor.dataRoot.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs before backspacing");
            assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Bar</p>");
            assert.equal(cleanNamespace(ps[1].outerHTML), "<p>Foo</p>");
          });
    });
  });
});

// LocalWords:  chai jquery tei InputTrigger
