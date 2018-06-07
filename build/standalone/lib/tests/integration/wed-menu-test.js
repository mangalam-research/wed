var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "wed/key-constants", "wed/util", "../base-config", "../util", "../wed-test-util"], function (require, exports, keyConstants, util_1, globalConfig, util_2, wed_test_util_1) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    keyConstants = __importStar(keyConstants);
    globalConfig = __importStar(globalConfig);
    var assert = chai.assert;
    describe("wed menus:", function () {
        var setup;
        var editor;
        var caretManager;
        var ps;
        var guiRoot;
        var menuManager;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
                guiRoot = editor.guiRoot;
                ps = guiRoot.querySelectorAll(".body .p");
                menuManager = editor.editingMenuManager;
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
        function contextMenuHasAttributeOption(myEditor) {
            wed_test_util_1.contextMenuHasOption(myEditor, /^Add @/);
        }
        describe("has context menus", function () {
            it("when there is no caret", function () { return __awaiter(_this, void 0, void 0, function () {
                var initial;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
                            assert.isUndefined(caretManager.getNormalizedCaret());
                            wed_test_util_1.activateContextMenu(editor, initial.parentNode);
                            return [4 /*yield*/, util_2.delay(1)];
                        case 1:
                            _a.sent();
                            // tslint:disable-next-line:no-any
                            assert.isDefined(menuManager.currentDropdown, "dropdown defined");
                            assert.isDefined(caretManager.getNormalizedCaret(), "caret defined");
                            return [2 /*return*/];
                    }
                });
            }); });
            it("when the user tries to bring up a contextual menu when the caret is " +
                "outside wed", function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            caretManager.clearSelection(); // Also clears the caret.
                            assert.isUndefined(caretManager.getNormalizedCaret());
                            wed_test_util_1.activateContextMenu(editor, guiRoot.getElementsByClassName("title")[0]);
                            return [4 /*yield*/, util_2.delay(1)];
                        case 1:
                            _a.sent();
                            // tslint:disable-next-line:no-any
                            assert.isDefined(menuManager.currentDropdown);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("when there is a caret", function () { return __awaiter(_this, void 0, void 0, function () {
                var initial;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
                            caretManager.setCaret(initial, 0);
                            wed_test_util_1.activateContextMenu(editor, initial.parentNode);
                            return [4 /*yield*/, util_2.delay(1)];
                        case 1:
                            _a.sent();
                            // tslint:disable-next-line:no-any
                            assert.isDefined(menuManager.currentDropdown);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("with attribute options, when invoked on a start label", function () {
                wed_test_util_1.activateContextMenu(editor, guiRoot.querySelector(".__start_label._title_label ._element_name"));
                contextMenuHasAttributeOption(editor);
            });
            it("with attribute options, when invoked in an attribute", function () {
                wed_test_util_1.activateContextMenu(editor, guiRoot.querySelector(".__start_label._p_label ._attribute_value"));
                contextMenuHasAttributeOption(editor);
            });
            it("on elements inside _phantom_wrap", function () {
                var p = guiRoot.querySelector(".body .p[" + util_1.encodeAttrName("rend") + "='wrap']");
                var dataNode = $.data(p, "wed_mirror_node");
                var rend = dataNode.getAttribute("rend");
                // Make sure the paragraph has rend="wrap".
                assert.equal(rend, "wrap");
                wed_test_util_1.activateContextMenu(editor, p);
            });
        });
        describe("has a completion menu when the caret is in an attribute", function () {
            it("that takes completions", function () {
                var p = ps[9];
                var attrVals = wed_test_util_1.getAttributeValuesFor(p);
                caretManager.setCaret(attrVals[0].firstChild, 0);
                // This is an arbitrary menu item we check for.
                wed_test_util_1.contextMenuHasOption(editor, /^Y$/);
            });
            it("for which the mode provides completion", function () {
                var p = ps[13];
                var attrVals = wed_test_util_1.getAttributeValuesFor(p);
                caretManager.setCaret(attrVals[0].firstChild, 0);
                // This is an arbitrary menu item we check for.
                wed_test_util_1.contextMenuHasOption(editor, /^completion1$/);
            });
        });
        describe("does not have completion menu", function () {
            it("when the caret is in an attribute that takes completions but the " +
                "attribute is not visible", function () {
                // Reduce visibility to 0 so that no attribute is visible.
                editor.setLabelVisibilityLevel(0);
                var attrVals = wed_test_util_1.getAttributeValuesFor(ps[9]);
                caretManager.setCaret(attrVals[0].firstChild, 0);
                var menu = editor.window.document.
                    getElementsByClassName("wed-context-menu")[0];
                assert.isUndefined(menu, "the menu should not exist");
            });
        });
        describe("has a replacement menu when the caret is in an attribute", function () {
            it("that takes completions", function () {
                var p = ps[9];
                var attrVals = wed_test_util_1.getAttributeValuesFor(p);
                caretManager.setCaret(attrVals[0].firstChild, 0);
                wed_test_util_1.contextMenuHasOption(editor, /^Y$/);
                editor.type("Y");
                // The context menu should be gone.
                var menu = editor.window.document.
                    getElementsByClassName("wed-context-menu")[0];
                assert.isUndefined(menu, "the menu should not exist");
                editor.type(keyConstants.REPLACEMENT_MENU);
                wed_test_util_1.contextMenuHasOption(editor, /^Y$/);
            });
            it("for which the mode provides completion", function () {
                var p = ps[13];
                var attrVals = wed_test_util_1.getAttributeValuesFor(p);
                caretManager.setCaret(attrVals[0].firstChild, 0);
                // This is an arbitrary menu item we check for.
                wed_test_util_1.contextMenuHasOption(editor, /^completion1$/);
                editor.type("completion1");
                // The context menu should be gone.
                var menu = editor.window.document.
                    getElementsByClassName("wed-context-menu")[0];
                assert.isUndefined(menu, "the menu should not exist");
                editor.type(keyConstants.REPLACEMENT_MENU);
                wed_test_util_1.contextMenuHasOption(editor, /^completion1$/);
            });
        });
        describe("does not have a replacement menu", function () {
            it("when the caret is in an attribute that takes completions but the " +
                "attribute is not visible", function () {
                // Reduce visibility to 0 so that no attribute is visible.
                editor.setLabelVisibilityLevel(0);
                var attrVals = wed_test_util_1.getAttributeValuesFor(ps[9]);
                caretManager.setCaret(attrVals[0].firstChild, 0);
                var menu = editor.window.document.
                    getElementsByClassName("wed-context-menu")[0];
                assert.isUndefined(menu, "the menu should not exist");
                // The menu won't come up with a the shortcut.
                editor.type(keyConstants.REPLACEMENT_MENU);
                menu = editor.window.document.
                    getElementsByClassName("wed-context-menu")[0];
                assert.isUndefined(menu, "the menu should not exist");
            });
        });
    });
});
//# sourceMappingURL=wed-menu-test.js.map