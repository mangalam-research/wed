define(["require", "exports", "chai", "wed/util", "../submode-config", "../wed-test-util"], function (require, exports, chai_1, util_1, submode_config_1, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe("wed submodes", function () {
        var setup;
        var editor;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/\
source_for_submodes_converted.xml", submode_config_1.config, document);
            (editor = setup.editor);
            return setup.init();
        });
        after(function () {
            setup.restore();
        });
        it("dispatch to proper decorators", function () {
            var wrapped = editor.guiRoot.querySelectorAll("[" + util_1.encodeAttrName("rend") + "='wrap'].tei\\:p._real");
            chai_1.expect(wrapped).to.have.length(2);
            function parentTest(el, msg, expected) {
                var parent = el.parentNode;
                chai_1.expect(parent.classList.contains("_gui_test"), msg).to.equal(expected);
            }
            parentTest(wrapped[0], "the first paragraph with rend='wrap' should be decorated by \
the test mode", true);
            parentTest(wrapped[1], "the second paragraph with rend='wrap' should not be decorated \
by the test mode", false);
        });
        it("present a contextual menu showing mode-specific actions", function () {
            function check(el, custom) {
                chai_1.expect(el).to.not.be.null;
                wed_test_util_1.activateContextMenu(editor, el);
                wed_test_util_1.contextMenuHasOption(editor, /^Test draggable$/, custom ? 1 : 0);
                editor.editingMenuManager.dismiss();
            }
            var first = editor.guiRoot.querySelector(".tei\\:sourceDesc._real>.tei\\:p._real");
            check(first, true);
            var second = editor.guiRoot.querySelector(".tei\\:body._real>.tei\\:p._real");
            check(second, false);
        });
        it("present mode-specific completions", function () {
            function check(el, custom) {
                chai_1.expect(el).to.not.be.null;
                var attrVals = wed_test_util_1.getAttributeValuesFor(el);
                editor.caretManager.setCaret(attrVals[0].firstChild, 0);
                // This is an arbitrary menu item we check for.
                if (custom) {
                    wed_test_util_1.contextMenuHasOption(editor, /^completion1$/);
                }
                else {
                    var menu = editor.window.document
                        .getElementsByClassName("wed-context-menu")[0];
                    chai_1.expect(menu).to.be.undefined;
                }
            }
            var first = editor.guiRoot.querySelector(".tei\\:sourceDesc._real>.tei\\:p._real");
            check(first, true);
            var second = editor.guiRoot.querySelectorAll(".tei\\:body._real>.tei\\:p._real")[13];
            check(second, false);
        });
        it("adds mode-specific toolbar buttons", function () {
            function check(el, expected) {
                if (el !== null) {
                    editor.caretManager.setCaret(el, 0);
                }
                var span = editor.toolbar.top.lastElementChild;
                chai_1.expect(span.children).to.have.lengthOf(expected);
            }
            // Initially we are out and so no mode-specific button.
            check(null, 0);
            // Move into the submode, and check again.
            var inSubmode = editor.guiRoot.querySelector(".tei\\:sourceDesc._real>.tei\\:p._real");
            check(inSubmode, 1);
            // Move out, and check again.
            var outsideSubmode = editor.guiRoot.querySelectorAll(".tei\\:body._real>.tei\\:p._real")[13];
            check(outsideSubmode, 0);
        });
    });
});
//# sourceMappingURL=wed-submode-test.js.map