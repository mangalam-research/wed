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
define(["require", "exports", "wed/browsers", "wed/domtypeguards", "wed/key-constants", "../base-config", "../util", "../wed-test-util"], function (require, exports, browsers, domtypeguards_1, keyConstants, globalConfig, util_1, wed_test_util_1) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    var _slice = Array.prototype.slice;
    describe("wed validation errors:", function () {
        var setup;
        var editor;
        var caretManager;
        var controller;
        var processRunner;
        var refreshRunner;
        var guiRoot;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                // tslint:disable-next-line:no-any
                processRunner = editor.validationController.processErrorsRunner;
                // tslint:disable-next-line:no-any
                refreshRunner = editor.validationController.refreshErrorsRunner;
                caretManager = editor.caretManager;
                // tslint:disable-next-line:no-any
                controller = editor.validationController;
                guiRoot = editor.guiRoot;
            });
        });
        beforeEach(function () {
            // Force the processing of errors
            controller.processErrors();
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
            controller = undefined;
        });
        it("validation errors added by the mode", function () {
            var errors = controller.copyErrorList();
            var last = errors[errors.length - 1];
            assert.equal(last.ev.error.toString(), "Test");
        });
        it("refreshErrors does not change the number of errors", function () { return __awaiter(_this, void 0, void 0, function () {
            var count, listCount, markerCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, processRunner.onCompleted()];
                    case 1:
                        _a.sent();
                        count = controller.copyErrorList().length;
                        listCount = editor.$errorList.children("li").length;
                        markerCount = guiRoot.getElementsByClassName("wed-validation-error")
                            .length;
                        controller.refreshErrors();
                        return [4 /*yield*/, refreshRunner.onCompleted()];
                    case 2:
                        _a.sent();
                        assert.equal(count, controller.copyErrorList().length, "the number of recorded errors should be the same");
                        assert.equal(listCount, editor.$errorList.children("li").length, "the number of errors in the panel should be the same");
                        assert.equal(markerCount, guiRoot.getElementsByClassName("wed-validation-error").length, "the number of markers should be the same");
                        return [2 /*return*/];
                }
            });
        }); });
        // tslint:disable-next-line:mocha-no-side-effect-code
        var itNoIE = browsers.MSIE ? it.skip : it;
        // This cannot be run on IE due to the way IE screws up the
        // formatting of contenteditable elements.
        // tslint:disable-next-line:mocha-no-side-effect-code
        itNoIE("errors for inline elements in a correct position", function () { return __awaiter(_this, void 0, void 0, function () {
            var p, dataP, dataMonogr, monogr, pError, pErrorIx, monogrError, monogrErrorIx, i, _i, _a, error, markers, pMarker, monogrMarker, pMarkerRect, pStartLabel, pStartLabelRect, monogrStartLabel, monogrStartLabelRect, monogrMarkerRect;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, processRunner.onCompleted()];
                    case 1:
                        _b.sent();
                        p = guiRoot.querySelectorAll(".body .p")[12];
                        dataP = editor.toDataNode(p);
                        dataMonogr = dataP.childNodes[0];
                        monogr = $.data(dataMonogr, "wed_mirror_node");
                        assert.equal(dataMonogr.tagName, "monogr");
                        pErrorIx = 0;
                        monogrErrorIx = 0;
                        i = 0;
                        for (_i = 0, _a = controller.copyErrorList(); _i < _a.length; _i++) {
                            error = _a[_i];
                            if (pError === undefined && error.ev.node === dataP) {
                                pError = error;
                                pErrorIx = i;
                            }
                            if (monogrError === undefined && error.ev.node === dataMonogr) {
                                monogrError = error;
                                monogrErrorIx = i;
                            }
                            i++;
                        }
                        // Make sure we found our errors.
                        assert.isDefined(pError, "no error for our paragraph");
                        assert.isDefined(monogrError, "no error for our monogr");
                        markers = editor.errorLayer.el.children;
                        pMarker = markers[pErrorIx];
                        monogrMarker = markers[monogrErrorIx];
                        assert.isDefined(pMarker, "should have an error for our paragraph");
                        assert.isDefined(monogrMarker, "should have an error for our monogr");
                        pMarkerRect = pMarker.getBoundingClientRect();
                        pStartLabel = wed_test_util_1.firstGUI(p);
                        assert.isTrue(pStartLabel.classList.contains("__start_label"), "should should have a start label for the paragraph");
                        pStartLabelRect = pStartLabel.getBoundingClientRect();
                        assert.isTrue(pMarkerRect.left >= pStartLabelRect.right, "the paragraph error marker should be to the right of the \
start label for the paragraph");
                        assert.isTrue(Math.abs(pMarkerRect.bottom - pStartLabelRect.bottom) <= 5, "the paragraph error marker should have a bottom which is \
within 5 pixels of the bottom of the start label for the paragraph");
                        assert.isTrue(Math.abs(pMarkerRect.top - pStartLabelRect.top) <= 5, "the paragraph error marker should have a top which is \
within 5 pixels of the top of the start label for the paragraph");
                        monogrStartLabel = wed_test_util_1.firstGUI(monogr);
                        assert.isTrue(monogrStartLabel.classList.contains("__start_label"), "should should have a start label for the paragraph");
                        monogrStartLabelRect = monogrStartLabel.getBoundingClientRect();
                        assert.isTrue(Math.abs(pMarkerRect.left - monogrStartLabelRect.left) <= 5, "the paragraph error marker have a left side within 5 pixels \
of the left side of the start label for the monogr");
                        monogrMarkerRect = monogrMarker.getBoundingClientRect();
                        assert.isTrue(monogrMarkerRect.left >= monogrStartLabelRect.right, "the monogr error marker should be to the right of the \
start label for the monogr");
                        monogrMarker.scrollIntoView();
                        assert.isTrue(Math.abs(monogrMarkerRect.bottom -
                            monogrStartLabelRect.bottom) <= 5, "the monogr error marker should have a bottom which is \
within 5 pixels of the bottom of the start label for the monogr");
                        assert.isTrue(Math.abs(monogrMarkerRect.top -
                            monogrStartLabelRect.top) <= 5, "the monogr error marker should have a top which is within \
5 pixels of the top of the start label for the monogr");
                        return [2 /*return*/];
                }
            });
        }); });
        it("the attributes error are not linked", function () { return __awaiter(_this, void 0, void 0, function () {
            var cases, _i, _a, _b, ev, item;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        editor.setLabelVisibilityLevel(0);
                        return [4 /*yield*/, processRunner.onCompleted()];
                    case 1:
                        _c.sent();
                        cases = 0;
                        for (_i = 0, _a = controller.copyErrorList(); _i < _a.length; _i++) {
                            _b = _a[_i], ev = _b.ev, item = _b.item;
                            if (!domtypeguards_1.isAttr(ev.node)) {
                                continue;
                            }
                            assert.isTrue(item.getElementsByTagName("a").length === 0, "there should be no link in the item");
                            assert.equal(item.title, "This error belongs to an attribute which is not currently displayed.", "the item should have the right title");
                            cases++;
                        }
                        assert.equal(cases, 5);
                        return [2 /*return*/];
                }
            });
        }); });
        function assertNewMarkers(orig, after, event) {
            // Make sure all markers are new.
            var note = " after " + event;
            for (var _i = 0, orig_1 = orig; _i < orig_1.length; _i++) {
                var item = orig_1[_i];
                assert.notInclude(after, item, "the list of markers should be new" + note);
            }
            // We do not compare the number of errors, because changing the label
            // visibility may change the number of errors shown to the user.
        }
        describe("recreates errors when", function () {
            it("changing label visibility level", function () { return __awaiter(_this, void 0, void 0, function () {
                var errorLayer, orig, after;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Changing label visibility does not merely refresh the errors but
                        // recreates them because errors that were visible may become invisible or
                        // errors that were invisible may become visible.
                        return [4 /*yield*/, processRunner.onCompleted()];
                        case 1:
                            // Changing label visibility does not merely refresh the errors but
                            // recreates them because errors that were visible may become invisible or
                            // errors that were invisible may become visible.
                            _a.sent();
                            errorLayer = editor.errorLayer.el;
                            orig = _slice.call(errorLayer.children);
                            // Reduce the visibility level.
                            editor.type(keyConstants.LOWER_LABEL_VISIBILITY);
                            return [4 /*yield*/, util_1.waitForSuccess(function () {
                                    after = _slice.call(errorLayer.children);
                                    assertNewMarkers(orig, after, "decreasing the level");
                                })];
                        case 2:
                            _a.sent();
                            orig = after;
                            // Increase visibility level
                            editor.type(keyConstants.INCREASE_LABEL_VISIBILITY);
                            return [4 /*yield*/, util_1.waitForSuccess(function () {
                                    assertNewMarkers(orig, _slice.call(errorLayer.children), "increasing the level");
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("moving into or out of a label with autohidden attributes", function () { return __awaiter(_this, void 0, void 0, function () {
                // Moving into or ouot of a label with autohidden attributes does not
                // merely refresh the errors but recreates them because errors that were
                // visible may become invisible or errors that were invisible may become
                // visible.
                function getError() {
                    var errors = controller.copyErrorList();
                    var found;
                    for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                        var error = errors_1[_i];
                        if (error.item.textContent === "attribute not allowed here: xxx") {
                            found = error;
                        }
                    }
                    assert.isDefined(found);
                    return found;
                }
                var errorLayer, orig, divs, div, after;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, processRunner.onCompleted()];
                        case 1:
                            _a.sent();
                            errorLayer = editor.errorLayer.el;
                            orig = _slice.call(errorLayer.children);
                            divs = editor.dataRoot.querySelectorAll("body>div");
                            div = divs[divs.length - 1];
                            // We check that there is an error for the "xxx" attribute, which has no
                            // link (=== no marker).
                            assert.isUndefined(getError().marker);
                            // Move into the label.
                            editor.caretManager.setCaret(div, 0);
                            editor.caretManager.move("left");
                            return [4 /*yield*/, processRunner.onCompleted()];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, util_1.waitForSuccess(function () {
                                    after = _slice.call(errorLayer.children);
                                    assertNewMarkers(orig, after, "moving into the label");
                                    // Now it has a link (=== has a marker).
                                    assert.isDefined(getError().marker);
                                })];
                        case 3:
                            _a.sent();
                            orig = after;
                            // Move out of the label.
                            editor.caretManager.move("right");
                            return [4 /*yield*/, processRunner.onCompleted()];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, util_1.waitForSuccess(function () {
                                    assertNewMarkers(orig, _slice.call(errorLayer.children), "moving out of the label");
                                    // No link again.
                                    assert.isUndefined(getError().marker);
                                })];
                        case 5:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        it("refreshes error positions when pasting", function () { return __awaiter(_this, void 0, void 0, function () {
            var initial, initialValue, event;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refreshRunner.onCompleted()];
                    case 1:
                        _a.sent();
                        initial = editor.dataRoot.querySelector("body>p").firstChild;
                        caretManager.setCaret(initial, 0);
                        initialValue = initial.textContent;
                        event = util_1.makeFakePasteEvent({
                            types: ["text/plain"],
                            getData: function () { return "abcdef"; },
                        });
                        editor.$guiRoot.trigger(event);
                        assert.equal(initial.nodeValue, "abcdef" + initialValue);
                        // refreshRunner returns to an incomplete states, which means there will be
                        // a refresh.
                        assert.isFalse(refreshRunner.completed);
                        return [2 /*return*/];
                }
            });
        }); });
        it("refreshes error positions when typing text", function () { return __awaiter(_this, void 0, void 0, function () {
            var initial, parent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refreshRunner.onCompleted()];
                    case 1:
                        _a.sent();
                        initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
                        parent = initial.parentNode;
                        caretManager.setCaret(initial, 0);
                        editor.type("blah");
                        assert.equal(initial.nodeValue, "blahabcd");
                        assert.equal(parent.childNodes.length, 3);
                        // refreshRunner returns to an incomplete states, which means there will be
                        // a refresh.
                        assert.isFalse(refreshRunner.completed);
                        return [2 /*return*/];
                }
            });
        }); });
        it("refreshes error positions when typing DELETE", function () { return __awaiter(_this, void 0, void 0, function () {
            var initial, parent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refreshRunner.onCompleted()];
                    case 1:
                        _a.sent();
                        initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
                        parent = initial.parentNode;
                        caretManager.setCaret(initial, 0);
                        editor.type(keyConstants.DELETE);
                        assert.equal(initial.nodeValue, "bcd");
                        assert.equal(parent.childNodes.length, 3);
                        // refreshRunner returns to an incomplete states, which means there will be
                        // a refresh.
                        assert.isFalse(refreshRunner.completed);
                        return [2 /*return*/];
                }
            });
        }); });
        it("refreshes error positions when typing BACKSPACE", function () { return __awaiter(_this, void 0, void 0, function () {
            var initial, parent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refreshRunner.onCompleted()];
                    case 1:
                        _a.sent();
                        initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
                        parent = initial.parentNode;
                        caretManager.setCaret(initial, 4);
                        editor.type(keyConstants.BACKSPACE);
                        assert.equal(initial.nodeValue, "abc");
                        assert.equal(parent.childNodes.length, 3);
                        // refreshRunner returns to an incomplete states, which means there will be
                        // a refresh.
                        assert.isFalse(refreshRunner.completed);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=wed-validation-error-test.js.map