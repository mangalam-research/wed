/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var input_trigger = require("wed/input-trigger");
  var DLoc = require("wed/dloc").DLoc;
  var wed = require("wed/wed");
  var key = require("wed/key");
  var key_constants = require("wed/key-constants");
  var input_trigger_factory = require("wed/input-trigger-factory");
  var salve = require("salve");
  var global = require("browser_test/global");
  var schema = require("text!../../build/schemas/tei-simplified-rng.js");
  var globalConfig = require("global-config");
  var mergeOptions = require("merge-options");
  var source = require("text!test-files/input_trigger_test_data/source_converted.xml");

  var assert = chai.assert;
  var InputTrigger = input_trigger.InputTrigger;

  var options = {
    schema: undefined,
    mode: {
      path: "wed/modes/generic/generic",
      options: {
        meta: {
          path: "wed/modes/generic/metas/tei-meta",
          options: {
            metadata: "/build/schemas/tei-metadata.json",
          },
        },
      },
    },
  };

  // This is an ad-hoc function meant for these tests *only*. The XML
  // serialization adds an xmlns declaration that we don't care
  // for. So...
  function cleanNamespace(str) {
    return str.replace(/ xmlns=".*?"/, "");
  }

  describe("InputTrigger", function InputTriggerBlock() {
    var editor;

    before(function before() {
      // Resolve the schema to a grammar.
      options.schema = salve.constructTree(schema);
    });

    beforeEach(function beforeEach(done) {
      editor = new wed.Editor();
      editor.addEventListener("initialized", function cb() {
        done();
      });
      var wedroot = window.parent.document.getElementById("wedframe")
            .contentWindow.document.getElementById("wedroot");
      editor.init(wedroot, mergeOptions({}, globalConfig.config, options),
                  source);
    });

    afterEach(function afterEach() {
      if (editor) {
        editor.destroy();
      }
      editor = undefined;
    });

    it("triggers on paste events", function tests() {
      var trigger = new InputTrigger(editor, "p");
      var seen = 0;
      var ps = editor.data_root.getElementsByTagName("p");
      var p = ps[ps.length - 1];
      trigger.addKeyHandler(key.makeKey(";"), function keyHandler(type, el) {
        assert.equal(type, "paste");
        assert.equal(el, p);
        seen++;
      });
      // Synthetic event
      var event = global.makeFakePasteEvent({
        types: ["text/plain"],
        getData: function getData() {
          return "abc;def";
        },
      });
      editor.caretManager.setCaret(p, 0);
      editor.$gui_root.trigger(event);
      assert.equal(seen, 1);
    });

    it("triggers on keydown events", function test() {
      var trigger = new InputTrigger(editor, "p");
      var seen = 0;
      var ps = editor.data_root.getElementsByTagName("p");
      var p = ps[ps.length - 1];
      trigger.addKeyHandler(key_constants.ENTER,
                            function keyHandler(type, el, ev) {
                              assert.equal(type, "keydown");
                              assert.equal(el, p);
                              ev.stopImmediatePropagation();
                              seen++;
                            });

      // Synthetic event
      editor.caretManager.setCaret(p, 0);
      editor.type(key_constants.ENTER);
      assert.equal(seen, 1);
    });

    it("triggers on keypress events", function test() {
      var trigger = new InputTrigger(editor, "p");
      var seen = 0;
      var ps = editor.data_root.getElementsByTagName("p");
      var p = ps[ps.length - 1];
      trigger.addKeyHandler(key.makeKey(";"),
                            function keypress(type, el, ev) {
                              assert.equal(type, "keypress");
                              assert.equal(el, p);
                              ev.stopImmediatePropagation();
                              seen++;
                            });

      editor.caretManager.setCaret(p, 0);
      editor.type(";");
      assert.equal(seen, 1);
    });


    it("does not trigger on unimportant input events", function test() {
      var trigger = new InputTrigger(editor, "p");
      var seen = 0;
      var ps = editor.data_root.getElementsByTagName("p");
      var p = ps[ps.length - 1];
      trigger.addKeyHandler(key.makeKey(";"), function keypress() {
        seen++;
      });

      editor.caretManager.setCaret(p, 0);
      editor.type(":");
      assert.equal(seen, 0);
    });

    // The following tests need to modify the document in significant ways, so
    // we use input_trigger_factory to create an input_trigger that does
    // something significant.
    it("does not try to act on undo/redo changes", function test() {
      input_trigger_factory.makeSplitMergeInputTrigger(
        editor, "p", key.makeKey(";"),
        key_constants.BACKSPACE, key_constants.DELETE);
      var ps = editor.data_root.querySelectorAll("body p");
      assert.equal(ps.length, 1);
      editor.caretManager.setCaret(ps[0], 0);
      // Synthetic event
      var event = global.makeFakePasteEvent({
        types: ["text/plain"],
        getData: function getData() {
          return "ab;cd;ef";
        },
      });
      editor.$gui_root.trigger(event);

      ps = editor.data_root.querySelectorAll("body p");
      assert.equal(ps.length, 3);
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>");
      assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>");
      assert.equal(cleanNamespace(ps[2].outerHTML),
                   "<p>efBlah blah <term>blah</term>" +
                   "<term>blah2</term> blah.</p>",
                   "first split: 3rd part");

      editor.undo();
      ps = editor.data_root.querySelectorAll("body p");
      assert.equal(ps.length, 1);
      assert.equal(cleanNamespace(ps[0].outerHTML),
                   "<p>Blah blah <term>blah</term>" +
                   "<term>blah2</term> blah.</p>",
                   "after undo");

      editor.redo();
      ps = editor.data_root.querySelectorAll("body p");
      assert.equal(ps.length, 3, "after redo: length");
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>",
                   "after redo: 1st part");
      assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>",
                   "after redo: 2nd part");
      assert.equal(cleanNamespace(ps[2].outerHTML),
                   "<p>efBlah blah <term>blah</term>" +
                   "<term>blah2</term> blah.</p>",
                   "after redo: 3rd part");
    });
  });
});

//  LocalWords:  requirejs wedroot wedframe metas js rng RequireJS cd
//  LocalWords:  Mangalam MPL Dubeau jquery jQuery tei keypress chai
//  LocalWords:  keydown InputTrigger
