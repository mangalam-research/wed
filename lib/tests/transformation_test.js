/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var wed = require("wed/wed");
  var onerror = require("wed/onerror");
  var log = require("wed/log");
  var salve = require("salve");
  var transformation = require("wed/transformation");
  var schema = require("text!../../../../schemas/tei-simplified-rng.js");
  var source = require("text!./wed_test_data/source_converted.xml");
  var mergeOptions = require("merge-options");
  var globalConfig = require("global-config");

  var options = {
    schema: undefined,
    mode: {
      path: "wed/modes/test/test-mode",
      options: {
        metadata: "/build/schemas/tei-metadata.json",
      },
    },
  };
  var assert = chai.assert;

  var option_stack = [options];

  describe("transformation", function transformationBlock() {
    before(function before() {
      // Resolve the schema to a grammar.
      options.schema = salve.constructTree(schema);
    });

    var editor;
    beforeEach(function beforeEach() {
      editor = new wed.Editor();
      var wedroot = window.parent.document.getElementById("wedframe")
            .contentWindow.document.getElementById("wedroot");
      return editor.init(wedroot,
                         mergeOptions({}, globalConfig.config, option_stack[0]),
                         source);
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

    describe("swapWithPreviousHomogeneousSibling", function swapWithPrevious() {
      it("swaps", function test() {
        var ps = editor.data_root.querySelectorAll("body>p");
        transformation.swapWithPreviousHomogeneousSibling(editor, ps[1]);

        var ps2 = editor.data_root.querySelectorAll("body>p");
        assert.equal(ps[0], ps2[1]);
        assert.equal(ps2[1], ps[0]);
      });

      it("does nothing if the element is the first child", function test() {
        var ps = editor.data_root.querySelectorAll("publicationStmt>p");
        transformation.swapWithPreviousHomogeneousSibling(editor, ps[0]);

        var ps2 = editor.data_root.querySelectorAll("publicationStmt>p");
        assert.equal(ps[0], ps2[0]);
      });

      it("does nothing if the previous element is not homogeneous",
         function test() {
           var divs = editor.data_root.querySelectorAll("body>div");
           transformation.swapWithPreviousHomogeneousSibling(editor, divs[0]);

           var divs2 = editor.data_root.querySelectorAll("body>div");
           assert.equal(divs[0].previousSibling, divs2[0].previousSibling);
         });
    });

    describe("swapWithNextHomogeneousSibling", function swaptWithNext() {
      it("swaps", function test() {
        var ps = editor.data_root.querySelectorAll("body>p");
        transformation.swapWithNextHomogeneousSibling(editor, ps[0]);

        var ps2 = editor.data_root.querySelectorAll("body>p");
        assert.equal(ps[0], ps2[1]);
        assert.equal(ps2[1], ps[0]);
      });

      it("does nothing if the element is the last child", function test() {
        var ps = editor.data_root.querySelectorAll("publicationStmt>p");
        transformation.swapWithNextHomogeneousSibling(editor, ps[ps.length - 1]);

        var ps2 = editor.data_root.querySelectorAll("publicationStmt>p");
        assert.equal(ps[ps.length - 1], ps2[ps.length - 1]);
      });

      it("does nothing if the next element is not homogeneous", function test() {
        var divs = editor.data_root.querySelectorAll("body>div");
        transformation.swapWithNextHomogeneousSibling(editor, divs[0]);

        var divs2 = editor.data_root.querySelectorAll("body>div");
        assert.equal(divs[0].previousSibling, divs2[0].previousSibling);
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
