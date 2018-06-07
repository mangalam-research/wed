var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "wed/domtypeguards", "../base-config", "../wed-test-util"], function (require, exports, domtypeguards_1, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    globalConfig = __importStar(globalConfig);
    var assert = chai.assert;
    describe("wed decoration:", function () {
        var setup;
        var editor;
        var caretManager;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
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
            // tslint:disable-next-line:no-any
        });
        it("element becoming empty acquires a placeholder", function () {
            // Text node inside title.
            var initial = editor.dataRoot.getElementsByTagName("title")[0];
            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.textContent, "abcd");
            caretManager.setCaret(initial, 0);
            var caret = caretManager.getNormalizedCaret();
            assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");
            // Delete all contents.
            editor.dataUpdater.removeNode(initial.firstChild);
            // We should have a placeholder now, between the two labels.
            assert.equal(caret.node.childNodes.length, 3);
            assert.isTrue(caret.node.childNodes[1].classList.contains("_placeholder"));
        });
        it("element getting filled is properly decorated", function () {
            var initial = editor.guiRoot.querySelector(".publicationStmt>.p");
            var initialData = editor.toDataNode(initial);
            // Make sure we are looking at the right thing.
            assert.equal(initialData.childNodes.length, 0);
            caretManager.setCaret(initialData, 0);
            editor.type("a");
            assert.equal(initialData.childNodes.length, 1);
            // Check the contents of the GUI tree to make sure it has a start, end
            // labels and one text node.
            assert.equal(initial.childNodes.length, 3);
            assert.isTrue(domtypeguards_1.isElement(initial.firstChild) &&
                initial.firstChild.matches("._p_label.__start_label"), "should have a start label");
            assert.equal(initial.childNodes[1].nodeType, Node.TEXT_NODE);
            assert.isTrue(domtypeguards_1.isElement(initial.lastChild) &&
                initial.lastChild.matches("._p_label.__end_label"), "should have an end label");
        });
        function isVisible(el) {
            return (el.offsetWidth !== 0 ||
                el.offsetHeight !== 0 ||
                el.getClientRects().length !== 0);
        }
        describe("autohidden attributes", function () {
            function checkHidden(div) {
                for (var _i = 0, _a = Array.from(wed_test_util_1.getAttributeNamesFor(div)); _i < _a.length; _i++) {
                    var name_1 = _a[_i];
                    var text = name_1.textContent;
                    var autohidden = name_1.closest("._shown_when_caret_in_label") !== null;
                    if (text === "type" || text === "subtype") {
                        assert.isFalse(autohidden);
                        assert.isTrue(isVisible(name_1), "should be visible");
                    }
                    else {
                        assert.isTrue(autohidden);
                        assert.isFalse(isVisible(name_1), "should be hidden");
                    }
                }
            }
            function checkVisible(div) {
                for (var _i = 0, _a = Array.from(wed_test_util_1.getAttributeNamesFor(div)); _i < _a.length; _i++) {
                    var name_2 = _a[_i];
                    var text = name_2.textContent;
                    var autohidden = name_2.closest("._shown_when_caret_in_label") !== null;
                    assert.isTrue(isVisible(name_2), text + " should be visible");
                    if (text === "type" || text === "subtype") {
                        assert.isFalse(autohidden);
                    }
                    else {
                        assert.isTrue(autohidden);
                    }
                }
            }
            it("are hidden when the caret is not in the element", function () {
                checkHidden(editor.guiRoot.querySelectorAll(".body .div")[1]);
            });
            it("are shown when the caret is in the element", function () {
                var div = editor.guiRoot.querySelectorAll(".body .div")[1];
                var label = wed_test_util_1.firstGUI(div);
                caretManager.setCaret(label, 0);
                checkVisible(div);
            });
            it("are shown and hidden using the toolbar", function () {
                var div = editor.guiRoot.querySelectorAll(".body .div")[1];
                // Initially hidden when the caret it outside the element.
                checkHidden(div);
                var button = editor.widget
                    .querySelector("[data-original-title='Toggle attribute hiding']");
                button.click();
                checkVisible(div);
                // Toggle again, and they should be all be invisible.
                button = editor.widget
                    .querySelector("[data-original-title='Toggle attribute hiding']");
                button.click();
                checkHidden(div);
            });
        });
    });
});
//# sourceMappingURL=wed-decoration-test.js.map