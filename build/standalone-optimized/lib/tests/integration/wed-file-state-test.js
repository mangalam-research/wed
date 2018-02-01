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
define(["require", "exports", "wed/key-constants", "../base-config", "../util", "../wed-test-util"], function (require, exports, keyConstants, globalConfig, util_1, wed_test_util_1) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("wed file state:", function () {
        var setup;
        var editor;
        var caretManager;
        var $modificationStatus;
        var $saveStatus;
        var titles;
        beforeEach(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
                // tslint:disable-next-line:no-any
                $modificationStatus = editor.$modificationStatus;
                // tslint:disable-next-line:no-any
                $saveStatus = editor.$saveStatus;
                titles = editor.guiRoot.getElementsByClassName("title");
            });
        });
        afterEach(function () {
            setup.restore();
        });
        it("modification status shows an unmodified document when starting", function () {
            assert.isTrue($modificationStatus.hasClass("label-success"));
        });
        it("save status shows an unsaved document when starting", function () {
            assert.isTrue($saveStatus.hasClass("label-default"));
            assert.equal($saveStatus.children("span").text(), "");
        });
        it("onbeforeunload returns falsy on unmodified doc", function () {
            assert.isFalse(!!editor.window.onbeforeunload
                .call(editor.window, undefined));
        });
        it("modification status shows a modified document after modification", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            caretManager.setCaret(initial, 0);
            editor.type(" ");
            assert.isTrue($modificationStatus.hasClass("label-warning"));
        });
        it("onbeforeunload returns truthy on modified doc", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            caretManager.setCaret(initial, 0);
            editor.type(" ");
            assert.isTrue(!!editor.window.onbeforeunload
                .call(editor.window, undefined));
        });
        it("modification status shows an unmodified document after save", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            caretManager.setCaret(initial, 0);
            editor.type(" ");
            assert.isTrue($modificationStatus.hasClass("label-warning"));
            editor.type(keyConstants.SAVE);
            return util_1.waitForSuccess(function () {
                assert.isTrue($modificationStatus.hasClass("label-success"));
            });
        });
        it("save status shows a saved document after a save", function () {
            assert.isTrue($saveStatus.hasClass("label-default"));
            assert.equal($saveStatus.children("span").text(), "");
            editor.type(keyConstants.SAVE);
            return util_1.waitForSuccess(function () {
                assert.isTrue($saveStatus.hasClass("label-success"));
                assert.equal($saveStatus.children("span").text(), "moments ago");
                // We also check the tooltip text.
                assert.equal($saveStatus.data("bs.tooltip").getTitle(), "The last save was a manual save.");
            });
        });
        it("save status shows a saved document after an autosave", function () {
            assert.isTrue($saveStatus.hasClass("label-default"));
            assert.equal($saveStatus.children("span").text(), "");
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            caretManager.setCaret(initial, 0);
            editor.type(" ");
            editor.saver.setAutosaveInterval(50);
            return util_1.waitForSuccess(function () {
                assert.isTrue($saveStatus.hasClass("label-info"));
                assert.equal($saveStatus.children("span").text(), "moments ago");
                // We also check the tooltip text.
                assert.equal($saveStatus.data("bs.tooltip").getTitle(), "The last save was an autosave.");
            });
        });
        it("save status tooltip updated after a different kind of save", function () { return __awaiter(_this, void 0, void 0, function () {
            var initial;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        initial = titles[0].childNodes[1];
                        caretManager.setCaret(initial, 0);
                        editor.type(" ");
                        editor.saver.setAutosaveInterval(50);
                        return [4 /*yield*/, util_1.waitForSuccess(function () {
                                // We check the initial tooltip text.
                                var tooltip = $saveStatus.data("bs.tooltip");
                                assert.isDefined(tooltip);
                                assert.equal(tooltip.getTitle(), "The last save was an autosave.");
                            })];
                    case 1:
                        _a.sent();
                        // Now perform a save.
                        editor.type(keyConstants.SAVE);
                        return [2 /*return*/, util_1.waitForSuccess(function () {
                                // We check the tooltip changed.
                                var tooltip = $saveStatus.data("bs.tooltip");
                                assert.isDefined(tooltip);
                                assert.equal(tooltip.getTitle(), "The last save was a manual save.");
                            })];
                }
            });
        }); });
    });
});
//# sourceMappingURL=wed-file-state-test.js.map