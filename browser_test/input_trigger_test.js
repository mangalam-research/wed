/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/input_trigger", "wed/wed",
        "wed/key", "wed/key_constants", "wed/input_trigger_factory",
        "wed/transformation", "salve", "browser_test/global",
        "text!../../build/schemas/tei-simplified-rng.js",
        "global-config", "merge-options",
        "text!test-files/input_trigger_test_data/source_converted.xml"],
function (mocha, chai, $, input_trigger, wed, key, key_constants,
          input_trigger_factory, transformation, salve, global, schema,
          globalConfig, mergeOptions, source) {
'use strict';
var assert = chai.assert;
var InputTrigger = input_trigger.InputTrigger;

var options = {
    schema: undefined,
    mode: {
        path: 'wed/modes/generic/generic',
        options: {
            meta: {
                path: 'wed/modes/generic/metas/tei_meta',
                options: {
                    metadata: '/build/schemas/tei-metadata.json'
                }
            }
        }
    }
};

// This is an ad-hoc function meant for these tests *only*. The XML
// serialization adds an xmlns declaration that we don't care
// for. So...
function cleanNamespace(str) {
    return str.replace(/ xmlns=".*?"/, '');
}

describe("InputTrigger", function () {
    var editor;

    before(function () {
        // Resolve the schema to a grammar.
        options.schema = salve.constructTree(schema);
    });

    beforeEach(function (done) {
        editor = new wed.Editor();
        editor.addEventListener("initialized", function () {
            done();
        });
        var wedroot = window.parent.document.getElementById("wedframe")
            .contentWindow.document.getElementById("wedroot");
        editor.init(wedroot,
                    mergeOptions({}, globalConfig.config, options),
                    source);
    });

    afterEach(function () {
        if (editor)
            editor.destroy();
        editor = undefined;
    });

    it("triggers on paste events", function () {
        var input_trigger = new InputTrigger(editor, "p");
        var seen = 0;
        var ps = editor.data_root.getElementsByTagName("p");
        var p = ps[ps.length - 1];
        input_trigger.addKeyHandler(key.makeKey(";"), function (type, el) {
            assert.equal(type, "paste");
            assert.equal(el, p);
            seen++;
        });
        // Synthetic event
        var event = global.makeFakePasteEvent({
            types: ["text/plain"],
            getData: function (type) {
                return "abc;def";
            }
        });
        editor.setDataCaret(p, 0);
        editor.$gui_root.trigger(event);
        assert.equal(seen, 1);
    });

    it("triggers on keydown events", function () {
        var input_trigger = new InputTrigger(editor, "p");
        var seen = 0;
        var ps = editor.data_root.getElementsByTagName("p");
        var p = ps[ps.length - 1];
        input_trigger.addKeyHandler(key_constants.ENTER,
                                    function (type, el, ev) {
            assert.equal(type, "keydown");
            assert.equal(el, p);
            ev.stopImmediatePropagation();
            seen++;
        });

        // Synthetic event
        editor.setDataCaret(p, 0);
        editor.type(key_constants.ENTER);
        assert.equal(seen, 1);
    });

    it("triggers on keypress events", function () {
        var input_trigger = new InputTrigger(editor, "p");
        var seen = 0;
        var ps = editor.data_root.getElementsByTagName("p");
        var p = ps[ps.length - 1];
        input_trigger.addKeyHandler(key.makeKey(";"),
                                    function (type, el, ev) {
            assert.equal(type, "keypress");
            assert.equal(el, p);
            ev.stopImmediatePropagation();
            seen++;
        });

        editor.setDataCaret(p, 0);
        editor.type(";");
        assert.equal(seen, 1);
    });


    it("does not trigger on unimportant input events", function () {
        var input_trigger = new InputTrigger(editor, "p");
        var seen = 0;
        var ps = editor.data_root.getElementsByTagName("p");
        var p = ps[ps.length - 1];
        input_trigger.addKeyHandler(key.makeKey(";"), function (type, el) {
            seen++;
        });

        editor.setDataCaret(p, 0);
        editor.type(":");
        assert.equal(seen, 0);
    });

    // The following tests need to modify the document in significant
    // ways, so we use input_trigger_factory to create an
    // input_trigger that does something significant.
    it("does not try to act on undo/redo changes", function () {
        input_trigger_factory.makeSplitMergeInputTrigger(
            editor, "p", key.makeKey(";"),
            key_constants.BACKSPACE, key_constants.DELETE);
        var ps = editor.data_root.querySelectorAll("body p");
        assert.equal(ps.length, 1);
        editor.setDataCaret(ps[0], 0);
        var text = ps[0].firstChild;
        // Synthetic event
        var event = global.makeFakePasteEvent({
            types: ["text/plain"],
            getData: function (type) {
                return "ab;cd;ef";
            }
        });
        editor.$gui_root.trigger(event);

        ps = editor.data_root.querySelectorAll("body p");
        assert.equal(ps.length, 3);
        assert.equal(cleanNamespace(ps[0].outerHTML), '<p>ab</p>');
        assert.equal(cleanNamespace(ps[1].outerHTML), '<p>cd</p>');
        assert.equal(cleanNamespace(ps[2].outerHTML),
                     '<p>efBlah blah <term>blah</term>'+
                     '<term>blah2</term> blah.</p>',
                    "first split: 3rd part");

        editor.undo();
        ps = editor.data_root.querySelectorAll("body p");
        assert.equal(ps.length, 1);
        assert.equal(cleanNamespace(ps[0].outerHTML),
                     '<p>Blah blah <term>blah</term>'+
                     '<term>blah2</term> blah.</p>',
                     "after undo");

        editor.redo();
        ps = editor.data_root.querySelectorAll("body p");
        assert.equal(ps.length, 3, "after redo: length");
        assert.equal(cleanNamespace(ps[0].outerHTML), '<p>ab</p>',
                     "after redo: 1st part");
        assert.equal(cleanNamespace(ps[1].outerHTML), '<p>cd</p>',
                     "after redo: 2nd part");
        assert.equal(cleanNamespace(ps[2].outerHTML),
                     '<p>efBlah blah <term>blah</term>'+
                     '<term>blah2</term> blah.</p>',
                     "after redo: 3rd part");
    });

});

});

//  LocalWords:  requirejs wedroot wedframe metas js rng RequireJS cd
//  LocalWords:  Mangalam MPL Dubeau jquery jQuery tei keypress chai
//  LocalWords:  keydown InputTrigger
