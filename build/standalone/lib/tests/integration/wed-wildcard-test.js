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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "merge-options", "../base-config", "../util", "../wed-test-util"], function (require, exports, merge_options_1, globalConfig, util_1, wed_test_util_1) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    merge_options_1 = __importDefault(merge_options_1);
    globalConfig = __importStar(globalConfig);
    var options = {
        schema: "/base/build/schemas/simplified-rng.js",
    };
    var assert = chai.assert;
    describe("wed wildcard support:", function () {
        var setup;
        var editor;
        var caretManager;
        var guiRoot;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/wildcard_converted.xml", merge_options_1.default(globalConfig.config, options), document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
                guiRoot = editor.guiRoot;
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
        it("elements and attributes allowed due to wildcards are readonly", function () {
            var bar = editor.dataRoot.querySelector("bar");
            var barGUI = caretManager.fromDataLocation(bar, 0).node;
            assert.isTrue(barGUI.classList.contains("_readonly"));
            var attrNames = wed_test_util_1.getAttributeNamesFor(barGUI);
            var attrName;
            for (var ix = 0; ix < attrNames.length; ++ix) {
                attrName = attrNames[ix];
                if (attrName.textContent === "foo:baz") {
                    break;
                }
            }
            // tslint:disable-next-line:no-unnecessary-type-assertion
            var attr = attrName.closest("._attribute");
            assert.isTrue(attr.classList.contains("_readonly"));
        });
        it("prevent typing in readonly elements and attributes", function () {
            var bar = editor.dataRoot.querySelector("bar");
            var barGUI = caretManager.fromDataLocation(bar, 0).node;
            assert.isTrue(barGUI.classList.contains("_readonly"));
            caretManager.setCaret(bar, 0);
            editor.type("foo");
            assert.equal(bar.textContent, "abc");
            var attrNames = wed_test_util_1.getAttributeNamesFor(barGUI);
            var attrName;
            for (var ix = 0; ix < attrNames.length; ++ix) {
                attrName = attrNames[ix];
                if (attrName.textContent === "foo:baz") {
                    break;
                }
            }
            // tslint:disable-next-line:no-unnecessary-type-assertion
            var attr = attrName.closest("._attribute");
            assert.isTrue(attr.classList.contains("_readonly"));
            var fooBaz = bar.getAttributeNode("foo:baz");
            caretManager.setCaret(fooBaz, 0);
            editor.type("foo");
            assert.equal(fooBaz.value, "x");
            // We drop the _readonly classes to make sure that we're testing what we
            // think we're testing. Note that the classes will be added right back as we
            // change the file because it is revalidated. This is why we type only one
            // character.
            barGUI.classList.remove("_readonly");
            attr.classList.remove("_readonly");
            caretManager.setCaret(fooBaz, 0);
            editor.type("f");
            assert.equal(fooBaz.value, "fx");
            barGUI.classList.remove("_readonly");
            caretManager.setCaret(bar, 0);
            editor.type("f");
            assert.equal(bar.textContent, "fabc");
        });
        it("prevents pasting in readonly elements and attributes", function () {
            var initial = editor.dataRoot.querySelector("bar");
            var initialGUI = caretManager.fromDataLocation(initial, 0).node;
            assert.isTrue(initialGUI.classList.contains("_readonly"));
            caretManager.setCaret(initial, 0);
            var initialValue = initial.textContent;
            // Synthetic event
            var event = util_1.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function () { return "a"; },
            });
            editor.$guiRoot.trigger(event);
            assert.equal(initial.textContent, initialValue);
            wed_test_util_1.dataCaretCheck(editor, initial, 0, "final position");
            // Check that removing _readonly would make the paste work. This proves that
            // the only thing that was preventing pasting was _readonly.
            initialGUI.classList.remove("_readonly");
            caretManager.setCaret(initial, 0);
            // We have to create a new event.
            event = util_1.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function () { return "a"; },
            });
            editor.$guiRoot.trigger(event);
            assert.equal(initial.textContent, "a" + initialValue);
            wed_test_util_1.dataCaretCheck(editor, initial.firstChild, 1, "final position");
        });
        it("prevents cutting from readonly elements", function () { return __awaiter(_this, void 0, void 0, function () {
            var initial, initialGUI, initialValue, guiStart;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        initial = editor.dataRoot.querySelector("bar");
                        initialGUI = caretManager.fromDataLocation(initial, 0).node;
                        assert.isTrue(initialGUI.classList.contains("_readonly"));
                        initialValue = initial.textContent;
                        guiStart = caretManager.fromDataLocation(initial.firstChild, 1);
                        caretManager.setCaret(guiStart);
                        caretManager.setRange(guiStart, caretManager.fromDataLocation(initial.firstChild, 2));
                        // Synthetic event
                        editor.$guiRoot.trigger(new $.Event("cut"));
                        return [4 /*yield*/, util_1.delay(1)];
                    case 1:
                        _a.sent();
                        assert.equal(initial.textContent, initialValue);
                        // Try again, after removing _readonly so that we prove the only reason the
                        // cut did not work is that _readonly was present.
                        initialGUI.classList.remove("_readonly");
                        editor.$guiRoot.trigger(new $.Event("cut"));
                        return [4 /*yield*/, util_1.delay(1)];
                    case 2:
                        _a.sent();
                        assert.equal(initial.textContent, initialValue.slice(0, 1) + initialValue.slice(2));
                        return [2 /*return*/];
                }
            });
        }); });
        describe("a context menu has the complex pattern action", function () {
            it("when invoked on an element allowed due to a complex pattern", function () {
                wed_test_util_1.activateContextMenu(editor, guiRoot.querySelector("._readonly ._element_name"));
                wed_test_util_1.contextMenuHasOption(editor, /Complex name pattern/, 1);
            });
            it("when invoked on an attribute allowed due to a complex pattern", function () {
                wed_test_util_1.activateContextMenu(editor, guiRoot.querySelector("._readonly ._attribute_value"));
                wed_test_util_1.contextMenuHasOption(editor, /Complex name pattern/, 1);
            });
        });
        function contextMenuHasNoTransforms() {
            var menu = editor.window.document.getElementsByClassName("wed-context-menu")[0];
            assert.isDefined(menu, "the menu should exist");
            var items = menu.querySelectorAll("li[data-kind]");
            assert.equal(items.length, 0, "there should be no items that can transform the document");
        }
        describe("a context menu invoked on a readonly", function () {
            it("element has no actions that can transform the document", function () {
                wed_test_util_1.activateContextMenu(editor, guiRoot.querySelector("._readonly ._element_name"));
                contextMenuHasNoTransforms();
            });
            it("attribute has no actions that can transform the document", function () {
                wed_test_util_1.activateContextMenu(editor, guiRoot.querySelector("._readonly ._attribute_value"));
                contextMenuHasNoTransforms();
            });
        });
    });
});
//# sourceMappingURL=wed-wildcard-test.js.map