var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "wed/gui-selector", "wed/input-trigger-factory", "wed/key", "wed/key-constants", "../util", "../wed-test-util"], function (require, exports, gui_selector_1, inputTriggerFactory, key, key_constants_1, util_1, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    inputTriggerFactory = __importStar(inputTriggerFactory);
    key = __importStar(key);
    var assert = chai.assert;
    var options = {
        schema: "/base/build/schemas/tei-simplified-rng.js",
        mode: {
            path: "wed/modes/generic/generic",
            options: {
                metadata: "/base/build/schemas/tei-metadata.json",
            },
        },
    };
    // This is an ad-hoc function meant for these tests *only*. The XML
    // serialization adds an xmlns declaration that we don't care for. So...
    function cleanNamespace(str) {
        return str.replace(/ xmlns=".*?"/, "");
    }
    describe("input_trigger_factory", function () {
        var setup;
        var editor;
        var mode;
        var dataDir = "/base/build/standalone/lib/tests/input_trigger_test_data";
        // tslint:disable-next-line:mocha-no-side-effect-code
        var srcStack = [dataDir + "/source_converted.xml"];
        // tslint:disable-next-line:mocha-no-side-effect-code
        var source2 = dataDir + "/source2_converted.xml";
        // tslint:disable-next-line:mocha-no-side-effect-code
        var source3 = dataDir + "/source3_converted.xml";
        // tslint:disable-next-line:mocha-no-side-effect-code
        var pSelector = gui_selector_1.GUISelector.fromDataSelector("p", 
        // tslint:disable-next-line:no-http-string
        { "": "http://www.tei-c.org/ns/1.0" });
        beforeEach(function () {
            setup = new wed_test_util_1.EditorSetup(srcStack[0], options, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                mode = editor.modeTree.getMode(editor.guiRoot);
            });
        });
        afterEach(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        function mit(name, fn) {
            it(name, function () {
                fn();
                // We want to make sure the changes do not screw up validation and we
                // want to catch these errors in the test, rather than the hook.
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
            });
        }
        describe("makeSplitMergeInputTrigger creates an InputTrigger that", function () {
            // tslint:disable:mocha-no-side-effect-code
            mit("handles a split triggered by a keypress event", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key.makeKey(";"), key_constants_1.BACKSPACE, key_constants_1.DELETE);
                var ps = editor.dataRoot.querySelectorAll("p");
                editor.caretManager.setCaret(ps[ps.length - 1].firstChild, 4);
                editor.type(";");
                ps = editor.dataRoot.querySelectorAll("body p");
                assert.equal(ps.length, 2);
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah</p>");
                assert.equal(cleanNamespace(ps[1].outerHTML), "<p> blah <term>blah</term><term>blah2</term> blah.</p>");
            });
            mit("handles a split triggered by a keydown event", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key_constants_1.ENTER, key_constants_1.BACKSPACE, key_constants_1.DELETE);
                var ps = editor.dataRoot.getElementsByTagName("p");
                editor.caretManager.setCaret(ps[ps.length - 1].firstChild, 4);
                editor.type(key_constants_1.ENTER);
                ps = editor.dataRoot.querySelectorAll("body p");
                assert.equal(ps.length, 2);
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah</p>");
                assert.equal(cleanNamespace(ps[1].outerHTML), "<p> blah <term>blah</term><term>blah2</term> blah.</p>");
            });
            mit("handles a split triggered by a paste event", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key.makeKey(";"), key_constants_1.BACKSPACE, key_constants_1.DELETE);
                var ps = editor.dataRoot.querySelectorAll("body p");
                assert.equal(ps.length, 1);
                // Synthetic event
                var event = util_1.makeFakePasteEvent({
                    types: ["text/plain"],
                    getData: function () { return "ab;cd;ef"; },
                });
                editor.caretManager.setCaret(ps[0], 0);
                editor.$guiRoot.trigger(event);
                ps = editor.dataRoot.querySelectorAll("body p");
                assert.equal(ps.length, 3);
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>");
                assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>");
                assert.equal(cleanNamespace(ps[2].outerHTML), "<p>efBlah blah <term>blah</term><term>blah2</term> blah.</p>");
            });
        });
        describe("makeSplitMergeInputTrigger creates an InputTrigger that", function () {
            before(function () {
                srcStack.unshift(source2);
            });
            after(function () {
                srcStack.shift();
            });
            mit("backspaces in phantom text", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key_constants_1.ENTER, key_constants_1.BACKSPACE, key_constants_1.DELETE);
                editor.caretManager.setCaret(editor.guiRoot.querySelector(".p>.ref").firstChild, 1);
                editor.type(key_constants_1.BACKSPACE);
                assert.equal(editor.dataRoot.querySelectorAll("body>p").length, 1);
            });
            mit("deletes in phantom text", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key_constants_1.ENTER, key_constants_1.BACKSPACE, key_constants_1.DELETE);
                editor.caretManager.setCaret(editor.guiRoot.querySelector(".p>.ref").lastChild.previousSibling, 0);
                editor.type(key_constants_1.DELETE);
                assert.equal(editor.dataRoot.querySelectorAll("body>p").length, 1);
            });
        });
        describe("makeSplitMergeInputTrigger creates an InputTrigger that", function () {
            before(function () {
                srcStack.unshift(source3);
            });
            after(function () {
                srcStack.shift();
            });
            mit("merges on BACKSPACE", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key_constants_1.ENTER, key_constants_1.BACKSPACE, key_constants_1.DELETE);
                var ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 2, "there should be 2 paragraphs before backspacing");
                editor.caretManager.setCaret(ps[1].firstChild, 0);
                editor.type(key_constants_1.BACKSPACE);
                ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 1, "there should be 1 paragraph after backspacing");
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");
            });
            mit("merges on BACKSPACE, and can undo", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key_constants_1.ENTER, key_constants_1.BACKSPACE, key_constants_1.DELETE);
                var ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 2, "there should be 2 paragraphs before backspacing");
                editor.caretManager.setCaret(ps[1].firstChild, 0);
                editor.type(key_constants_1.BACKSPACE);
                ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 1, "there should be 1 paragraph after backspacing");
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");
                editor.undo();
                ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 2, "there should be 2 paragraphs after undo");
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Bar</p>");
                assert.equal(cleanNamespace(ps[1].outerHTML), "<p>Foo</p>");
            });
            mit("merges on DELETE", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key_constants_1.ENTER, key_constants_1.BACKSPACE, key_constants_1.DELETE);
                var ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 2, "there should be 2 paragraphs before delete");
                editor.caretManager.setCaret(ps[0].lastChild, ps[0].lastChild.nodeValue.length);
                editor.type(key_constants_1.DELETE);
                ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 1, "there should be 1 paragraph after delete");
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");
            });
            mit("merges on DELETE, and can undo", function () {
                inputTriggerFactory.makeSplitMergeInputTrigger(editor, mode, pSelector, key_constants_1.ENTER, key_constants_1.BACKSPACE, key_constants_1.DELETE);
                var ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 2, "there should be 2 paragraphs before delete");
                editor.caretManager.setCaret(ps[0].lastChild, ps[0].lastChild.nodeValue.length);
                editor.type(key_constants_1.DELETE);
                ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 1, "there should be 1 paragraph after delete");
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");
                editor.undo();
                ps = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps.length, 2, "there should be 2 paragraphs after undo");
                assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Bar</p>");
                assert.equal(cleanNamespace(ps[1].outerHTML), "<p>Foo</p>");
            });
        });
    });
});
// LocalWords:  chai jquery tei InputTrigger
//# sourceMappingURL=input-trigger-factory-test.js.map