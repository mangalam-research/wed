define(["require", "exports", "module", "chai", "merge-options", "wed/gui-selector", "wed/input-trigger", "wed/input-trigger-factory", "wed/key", "wed/key-constants", "../base-config", "../util", "../wed-test-util"], function (require, exports, module, chai_1, mergeOptions, gui_selector_1, input_trigger_1, input_trigger_factory_1, key, key_constants_1, globalConfig, util_1, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var options = {
        schema: "/base/build/schemas/tei-simplified-rng.js",
        mode: {
            path: "wed/modes/generic/generic",
            options: {
                metadata: "/base/build/schemas/tei-metadata.json",
            },
            // We set a submode that operates on teiHeader so as to be able to test that
            // input triggers operate only on their own region.
            submode: {
                method: "selector",
                selector: "TEI>teiHeader",
                mode: {
                    path: "wed/modes/generic/generic",
                    options: {
                        metadata: "/base/build/schemas/tei-metadata.json",
                    },
                },
            },
        },
    };
    // This is an ad-hoc function meant for these tests *only*. The XML
    // serialization adds an xmlns declaration that we don't care for. So...
    function cleanNamespace(str) {
        return str.replace(/ xmlns=".*?"/, "");
    }
    describe("InputTrigger", function () {
        var setup;
        var editor;
        var mode;
        var mappings = 
        // tslint:disable-next-line:no-http-string
        { "": "http://www.tei-c.org/ns/1.0" };
        var pSelector;
        var pInBody;
        before(function () {
            pSelector = gui_selector_1.GUISelector.fromDataSelector("p", mappings);
        });
        beforeEach(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/input_trigger_test_data/\
source_converted.xml", mergeOptions(globalConfig.config, options), document);
            (editor = setup.editor);
            return setup.init().then(function () {
                mode = editor.modeTree.getMode(editor.guiRoot);
                pInBody = editor.dataRoot.querySelector("body p");
            });
        });
        afterEach(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        function pasteTest(p) {
            var trigger = new input_trigger_1.InputTrigger(editor, mode, pSelector);
            var seen = 0;
            trigger.addKeyHandler(key.makeKey(";"), function (evType, el) {
                chai_1.assert.equal(evType, "paste");
                chai_1.assert.equal(el, p);
                seen++;
            });
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function () { return "abc;def"; },
            });
            editor.caretManager.setCaret(p, 0);
            editor.$guiRoot.trigger(event);
            return seen;
        }
        function keydownTest(p) {
            var trigger = new input_trigger_1.InputTrigger(editor, mode, pSelector);
            var seen = 0;
            trigger.addKeyHandler(key_constants_1.ENTER, function (evType, el, ev) {
                chai_1.assert.equal(evType, "keydown");
                chai_1.assert.equal(el, p);
                ev.stopImmediatePropagation();
                seen++;
            });
            // Synthetic event
            editor.caretManager.setCaret(p, 0);
            editor.type(key_constants_1.ENTER);
            return seen;
        }
        function keypressTest(p) {
            var trigger = new input_trigger_1.InputTrigger(editor, mode, pSelector);
            var seen = 0;
            trigger.addKeyHandler(key.makeKey(";"), function (evType, el, ev) {
                chai_1.assert.equal(evType, "keypress");
                chai_1.assert.equal(el, p);
                ev.stopImmediatePropagation();
                seen++;
            });
            editor.caretManager.setCaret(p, 0);
            editor.type(";");
            return seen;
        }
        it("triggers on paste events", function () {
            chai_1.assert.equal(pasteTest(pInBody), 1);
        });
        it("triggers on keydown events", function () {
            chai_1.assert.equal(keydownTest(pInBody), 1);
        });
        it("triggers on keypress events", function () {
            chai_1.assert.equal(keypressTest(pInBody), 1);
        });
        it("does not trigger on unimportant input events", function () {
            var trigger = new input_trigger_1.InputTrigger(editor, mode, pSelector);
            var seen = 0;
            var p = pInBody;
            trigger.addKeyHandler(key.makeKey(";"), function () {
                seen++;
            });
            editor.caretManager.setCaret(p, 0);
            editor.type(":");
            chai_1.assert.equal(seen, 0);
        });
        // The following tests need to modify the document in significant ways, so we
        // use input_trigger_factory to create an input_trigger that does something
        // significant.
        it("does not try to act on undo/redo changes", function () {
            input_trigger_factory_1.makeSplitMergeInputTrigger(editor, mode, pSelector, key.makeKey(";"), key_constants_1.BACKSPACE, key_constants_1.DELETE);
            var ps = editor.dataRoot.querySelectorAll("body p");
            chai_1.assert.equal(ps.length, 1);
            editor.caretManager.setCaret(ps[0], 0);
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function () { return "ab;cd;ef"; },
            });
            editor.$guiRoot.trigger(event);
            ps = editor.dataRoot.querySelectorAll("body p");
            chai_1.assert.equal(ps.length, 3);
            chai_1.assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>");
            chai_1.assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>");
            chai_1.assert.equal(cleanNamespace(ps[2].outerHTML), "<p>efBlah blah <term>blah</term><term>blah2</term> blah.</p>", "first split: 3rd part");
            editor.undo();
            ps = editor.dataRoot.querySelectorAll("body p");
            chai_1.assert.equal(ps.length, 1);
            chai_1.assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah blah <term>blah</term><term>blah2</term> blah.</p>", "after undo");
            editor.redo();
            ps = editor.dataRoot.querySelectorAll("body p");
            chai_1.assert.equal(ps.length, 3, "after redo: length");
            chai_1.assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>", "after redo: 1st part");
            chai_1.assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>", "after redo: 2nd part");
            chai_1.assert.equal(cleanNamespace(ps[2].outerHTML), "<p>efBlah blah <term>blah</term><term>blah2</term> blah.</p>", "after redo: 3rd part");
        });
        describe("respects mode regions", function () {
            var pInHeader;
            beforeEach(function () {
                pInHeader = editor.dataRoot.querySelector("teiHeader p");
                chai_1.assert.isDefined(pInHeader);
            });
            it("ignores paste events in the wrong region", function () {
                chai_1.assert.equal(pasteTest(pInHeader), 0);
            });
            it("ignores on keydown events in the wrong region", function () {
                chai_1.assert.equal(keydownTest(pInHeader), 0);
            });
            it("ignores on keypress events in the wrong region", function () {
                chai_1.assert.equal(keypressTest(pInHeader), 0);
            });
        });
    });
});
//  LocalWords:  requirejs wedroot wedframe metas js rng RequireJS cd
//  LocalWords:  Mangalam MPL Dubeau jquery jQuery tei keypress chai
//  LocalWords:  keydown InputTrigger

//# sourceMappingURL=input-trigger-test.js.map
