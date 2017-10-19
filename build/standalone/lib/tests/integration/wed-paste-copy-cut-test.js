define(["require", "exports", "module", "wed/browsers", "../base-config", "../util", "../wed-test-util"], function (require, exports, module, browsers, globalConfig, util_1, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("wed paste copy cut:", function () {
        var setup;
        var editor;
        var caretManager;
        var ps;
        var guiRoot;
        var titles;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
                guiRoot = editor.guiRoot;
                ps = guiRoot.querySelectorAll(".body .p");
                titles = guiRoot.getElementsByClassName("title");
            });
        });
        afterEach(function () {
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
            // tslint:disable-next-line:no-any
            caretManager = undefined;
        });
        it("pasting simple text", function () {
            var initial = editor.dataRoot.querySelector("body>p").firstChild;
            caretManager.setCaret(initial, 0);
            var initialValue = initial.nodeValue;
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function () { return "abcdef"; },
            });
            editor.$guiRoot.trigger(event);
            assert.equal(initial.nodeValue, "abcdef" + initialValue);
            wed_test_util_1.dataCaretCheck(editor, initial, 6, "final position");
        });
        it("pasting spaces pastes a single space", function () {
            var initial = editor.dataRoot.querySelector("body>p").firstChild;
            caretManager.setCaret(initial, 0);
            var initialValue = initial.nodeValue;
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function () { return "    \u00A0  "; },
            });
            editor.$guiRoot.trigger(event);
            assert.equal(initial.nodeValue, " " + initialValue);
            wed_test_util_1.dataCaretCheck(editor, initial, 1, "final position");
        });
        it("pasting zero-width space pastes nothing", function () {
            var initial = editor.dataRoot.querySelector("body>p").firstChild;
            caretManager.setCaret(initial, 0);
            var initialValue = initial.nodeValue;
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function () { return "\u200B\u200B"; },
            });
            editor.$guiRoot.trigger(event);
            assert.equal(initial.nodeValue, initialValue);
            wed_test_util_1.dataCaretCheck(editor, initial, 0, "final position");
        });
        it("pasting structured text", function () {
            var p = editor.dataRoot.querySelector("body>p");
            var initial = p.firstChild;
            caretManager.setCaret(initial, 0);
            var initialValue = p.innerHTML;
            var toPaste = "Blah <term xmlns=\"http://www.tei-c.org/ns/1.0\">blah</term> blah.";
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/html", "text/plain"],
                // We add the zero-width space for the heck of it.  It will be stripped.
                getData: function () { return toPaste + "\u200B"; },
            });
            editor.$guiRoot.trigger(event);
            var expected = toPaste + initialValue;
            if (browsers.MSIE) {
                expected = expected.replace(" xmlns=\"http://www.tei-c.org/ns/1.0\"", "");
            }
            assert.equal(p.innerHTML, expected);
            wed_test_util_1.dataCaretCheck(editor, p.childNodes[2], 6, "final position");
        });
        it("pasting structured text: invalid, decline pasting as text", function (done) {
            var p = editor.dataRoot.querySelector("body>p");
            var initial = p.firstChild;
            caretManager.setCaret(initial, 0);
            var initialValue = p.innerHTML;
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/html", "text/plain"],
                getData: function () { return p.outerHTML; },
            });
            var pasteModal = editor.modals.getModal("paste");
            var $top = pasteModal.getTopLevel();
            $top.one("shown.bs.modal", function () {
                // Wait until visible to add this handler so that it is run after the
                // callback that wed sets on the modal.
                $top.one("hidden.bs.modal", function () {
                    assert.equal(p.innerHTML, initialValue);
                    wed_test_util_1.dataCaretCheck(editor, initial, 0, "final position");
                    done();
                });
            });
            editor.$guiRoot.trigger(event);
            // This clicks "No".
            pasteModal.getTopLevel().find(".modal-footer .btn")[1].click();
        });
        it("pasting structured text: invalid, accept pasting as text", function (done) {
            var p = editor.dataRoot.querySelector("body>p");
            var initial = p.firstChild;
            caretManager.setCaret(initial, 0);
            var initialValue = p.innerHTML;
            var initialOuter = p.outerHTML;
            var x = document.createElement("div");
            x.textContent = initialOuter;
            var initialOuterFromTextToHtml = x.innerHTML;
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/html", "text/plain"],
                getData: function () { return initialOuter; },
            });
            var pasteModal = editor.modals.getModal("paste");
            var $top = pasteModal.getTopLevel();
            $top.one("shown.bs.modal", function () {
                // Wait until visible to add this handler so that it is run after the
                // callback that wed sets on the modal.
                $top.one("hidden.bs.modal", function () {
                    assert.equal(p.innerHTML, initialOuterFromTextToHtml + initialValue);
                    wed_test_util_1.dataCaretCheck(editor, p.firstChild, initialOuter.length, "final position");
                    done();
                });
                // This clicks "Yes".
                var button = pasteModal.getTopLevel()[0]
                    .getElementsByClassName("btn-primary")[0];
                button.click();
            });
            editor.$guiRoot.trigger(event);
        });
        it("handles pasting simple text into an attribute", function () {
            var p = editor.dataRoot.querySelector("body>p:nth-of-type(8)");
            var initial = p.getAttributeNode("rend");
            caretManager.setCaret(initial, 0);
            var initialValue = initial.value;
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function () { return "abcdef"; },
            });
            editor.$guiRoot.trigger(event);
            assert.equal(initial.value, "abcdef" + initialValue);
            wed_test_util_1.dataCaretCheck(editor, initial, 6, "final position");
        });
        it("handles cutting a well formed selection", function () {
            // force_reload = true;
            var p = editor.dataRoot.querySelector("body>p");
            var guiStart = caretManager.fromDataLocation(p.firstChild, 4);
            caretManager.setCaret(guiStart);
            caretManager.setRange(guiStart, caretManager.fromDataLocation(p.childNodes[2], 5));
            // Synthetic event
            var event = new $.Event("cut");
            editor.$guiRoot.trigger(event);
            return util_1.delay(1).then(function () {
                assert.equal(p.innerHTML, "Blah.");
            });
        });
        it("handles cutting a bad selection", function (done) {
            var p = editor.dataRoot.querySelector("body>p");
            var originalInnerHtml = p.innerHTML;
            // Start caret is inside the term element.
            var guiStart = caretManager.fromDataLocation(p.childNodes[1].firstChild, 1);
            var guiEnd = caretManager.fromDataLocation(p.childNodes[2], 5);
            caretManager.setRange(guiStart, guiEnd);
            assert.equal(p.innerHTML, originalInnerHtml);
            var straddlingModal = editor.modals.getModal("straddling");
            var $top = straddlingModal.getTopLevel();
            $top.one("shown.bs.modal", function () {
                // Wait until visible to add this handler so that it is run after the
                // callback that wed sets on the modal.
                $top.one("hidden.bs.modal", function () {
                    assert.equal(p.innerHTML, originalInnerHtml);
                    wed_test_util_1.caretCheck(editor, guiEnd.node, guiEnd.offset, "final position");
                    done();
                });
            });
            // Synthetic event
            var event = new $.Event("cut");
            editor.$guiRoot.trigger(event);
            // This clicks dismisses the modal
            straddlingModal.getTopLevel().find(".btn-primary")[0].click();
        });
        it("handles cutting in attributes", function () {
            // force_reload = true;
            var p = editor.dataRoot.querySelector("body>p:nth-of-type(8)");
            var initial = p.getAttributeNode("rend");
            var initialValue = initial.value;
            var start = caretManager.fromDataLocation(initial, 2);
            var end = caretManager.fromDataLocation(initial, 4);
            caretManager.setRange(start, end);
            // Synthetic event
            var event = new $.Event("cut");
            editor.$guiRoot.trigger(event);
            return util_1.delay(1).then(function () {
                assert.equal(initial.value, initialValue.slice(0, 2) +
                    initialValue.slice(4));
            });
        });
    });
});

//# sourceMappingURL=wed-paste-copy-cut-test.js.map
