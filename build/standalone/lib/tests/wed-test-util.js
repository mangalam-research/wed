/**
 * Utilities that require a DOM to run.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
define(["require", "exports", "blueimp-md5", "chai", "qs", "sinon", "wed", "wed/onerror", "./util"], function (require, exports, md5, chai_1, qs, sinon, wed_1, onerror, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    sinon = __importStar(sinon);
    onerror = __importStar(onerror);
    var childByClass = wed_1.domutil.childByClass, childrenByClass = wed_1.domutil.childrenByClass;
    function activateContextMenu(editor, el) {
        // tslint:disable-next-line:no-any
        function computeValues() {
            el.scrollIntoView();
            var rect = el.getBoundingClientRect();
            var left = rect.left + (rect.width / 2);
            var top = rect.top + (rect.height / 2);
            var scrollTop = editor.window.document.body.scrollTop;
            var scrollLeft = editor.window.document.body.scrollLeft;
            return {
                which: 3,
                pageX: left + scrollLeft,
                pageY: top + scrollTop,
                clientX: left,
                clientY: top,
                target: el,
            };
        }
        editor.$guiRoot.trigger(new $.Event("mousedown", computeValues()));
        editor.$guiRoot.trigger(new $.Event("mouseup", computeValues()));
    }
    exports.activateContextMenu = activateContextMenu;
    function contextMenuHasOption(editor, pattern, expectedCount) {
        var menu = editor.window.document.getElementsByClassName("wed-context-menu")[0];
        chai_1.expect(menu, "the menu should exist").to.not.be.undefined;
        var items = menu.querySelectorAll("li>a");
        var found = 0;
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            if (pattern.test(item.textContent.trim())) {
                found++;
            }
            if (expectedCount === undefined && found > 0) {
                break;
            }
        }
        if (expectedCount === undefined) {
            chai_1.expect(found).to.be.greaterThan(0);
        }
        else {
            chai_1.expect(found).to.equal(expectedCount, "should have seen the option a number of times \
equal to the expected count");
        }
    }
    exports.contextMenuHasOption = contextMenuHasOption;
    function firstGUI(container) {
        return childByClass(container, "_gui");
    }
    exports.firstGUI = firstGUI;
    function lastGUI(container) {
        var children = childrenByClass(container, "_gui");
        var last = children[children.length - 1];
        return last !== undefined ? last : null;
    }
    exports.lastGUI = lastGUI;
    function getElementNameFor(container, last) {
        if (last === void 0) { last = false; }
        var gui = last ? lastGUI(container) : firstGUI(container);
        return gui.getElementsByClassName("_element_name")[0];
    }
    exports.getElementNameFor = getElementNameFor;
    function getAttributeValuesFor(container) {
        return firstGUI(container).getElementsByClassName("_attribute_value");
    }
    exports.getAttributeValuesFor = getAttributeValuesFor;
    function getAttributeNamesFor(container) {
        return firstGUI(container).getElementsByClassName("_attribute_name");
    }
    exports.getAttributeNamesFor = getAttributeNamesFor;
    function caretCheck(editor, container, offset, msg) {
        var caret = editor.caretManager.caret;
        chai_1.expect(caret, "there should be a caret").to.not.be.undefined;
        if (offset !== null) {
            chai_1.expect(caret.toArray(), msg).to.deep.equal([container, offset]);
        }
        else {
            // A null offset means we are not interested in the specific offset.  We
            // just want to know that the caret is *inside* container either directly or
            // indirectly.
            chai_1.expect(container.contains(caret.node), msg).to.be.true;
        }
    }
    exports.caretCheck = caretCheck;
    function dataCaretCheck(editor, container, offset, msg) {
        var dataCaret = editor.caretManager.getDataCaret();
        chai_1.expect(dataCaret.toArray(), msg).to.deep.equal([container, offset]);
    }
    exports.dataCaretCheck = dataCaretCheck;
    // tslint:disable-next-line:completed-docs
    var WedServer = /** @class */ (function () {
        function WedServer(server) {
            this._saveRequests = [];
            this.emptyResponseOnSave = false;
            this.failOnSave = false;
            this.preconditionFailOnSave = false;
            this.tooOldOnSave = false;
            // tslint:disable-next-line:no-any
            var xhr = server.xhr;
            this.xhr = xhr;
            // We must save and restore the filter state ourselves because Sinon does
            // not do it. Fake servers don't restore it, nor do sandboxes.
            this.oldUseFilters = xhr.useFilters;
            // tslint:disable-next-line:no-any
            this.oldFilters = xhr.filters;
            xhr.useFilters = true;
            xhr.addFilter(function (_method, url) {
                return !/^\/build\/ajax\//.test(url);
            });
            server.respondImmediately = true;
            server.respondWith("POST", /^\/build\/ajax\/save\.txt$/, this.handleSave.bind(this));
            server.respondWith("POST", "/build/ajax/log.txt", [200, { "Content-Type": "application/json" }, "{}"]);
        }
        Object.defineProperty(WedServer.prototype, "saveRequests", {
            get: function () {
                return this._saveRequests;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WedServer.prototype, "lastSaveRequest", {
            get: function () {
                var reqs = this.saveRequests;
                return reqs[reqs.length - 1];
            },
            enumerable: true,
            configurable: true
        });
        WedServer.prototype.reset = function () {
            this._saveRequests = [];
            this.emptyResponseOnSave = false;
            this.failOnSave = false;
            this.preconditionFailOnSave = false;
            this.tooOldOnSave = false;
        };
        WedServer.prototype.restore = function () {
            var xhr = this.xhr;
            xhr.useFilters = this.oldUseFilters;
            // tslint:disable-next-line:no-any
            xhr.filters = this.oldFilters;
        };
        WedServer.prototype.decode = function (request) {
            var contentType = request.requestHeaders["Content-Type"];
            var requestBody = request.requestBody;
            switch (contentType) {
                case "application/x-www-form-urlencoded;charset=utf-8":
                    return qs.parse(requestBody);
                case "json":
                    return JSON.parse(requestBody);
                default:
                    throw new Error("unknown content type: " + contentType);
            }
        };
        WedServer.prototype.handleSave = function (request) {
            var decoded = this.decode(request);
            this._saveRequests.push(decoded);
            var status = 200;
            var headers = { "Content-Type": "application/json" };
            // tslint:disable-next-line:no-reserved-keywords
            var messages = [];
            function populateSaveResponse() {
                headers.ETag = btoa(md5(decoded.data, undefined, true));
                messages.push({ type: "save_successful" });
            }
            switch (decoded.command) {
                case "check":
                    break;
                case "save":
                case "autosave":
                    if (!this.emptyResponseOnSave) {
                        if (this.tooOldOnSave) {
                            messages.push({ type: "version_too_old_error" });
                        }
                        if (this.preconditionFailOnSave) {
                            status = 412;
                        }
                        else if (this.failOnSave) {
                            status = 400;
                        }
                        else {
                            populateSaveResponse();
                        }
                    }
                    break;
                case "recover":
                    populateSaveResponse();
                    break;
                default:
                    status = 400;
            }
            request.respond(status, headers, JSON.stringify({ messages: messages }));
        };
        return WedServer;
    }());
    exports.WedServer = WedServer;
    function makeWedRoot(doc) {
        var wedroot = doc.createElement("div");
        wedroot.className = "wed-widget container";
        return wedroot;
    }
    exports.makeWedRoot = makeWedRoot;
    function errorCheck() {
        // We read the state, reset, and do the assertion later so that if the
        // assertion fails, we still have our reset.
        var wasTerminating = onerror.is_terminating();
        // We don't reload our page so we need to do this.
        onerror.__test.reset();
        chai_1.expect(wasTerminating)
            .to.equal(false, "test caused an unhandled exception to occur");
    }
    exports.errorCheck = errorCheck;
    // tslint:disable-next-line:completed-docs
    var EditorSetup = /** @class */ (function () {
        function EditorSetup(source, options, doc) {
            this.source = source;
            this.sandbox = sinon.createSandbox({
                useFakeServer: true,
            });
            this.server = new WedServer(this.sandbox.server);
            this.wedroot = makeWedRoot(document);
            doc.body.appendChild(this.wedroot);
            this.editor = wed_1.makeEditor(this.wedroot, options);
        }
        EditorSetup.prototype.init = function () {
            return __awaiter(this, void 0, void 0, function () {
                var provider, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            provider = this.constructor.provider;
                            return [4 /*yield*/, provider.getText(this.source)];
                        case 1:
                            data = _a.sent();
                            return [2 /*return*/, this.editor.init(data)];
                    }
                });
            });
        };
        EditorSetup.prototype.reset = function () {
            var editor = this.editor;
            editor.undoAll();
            editor.resetLabelVisibilityLevel();
            editor.editingMenuManager.dismiss();
            // We set the caret to a position that will trigger some display changes
            // (e.g. hide attributes).
            editor.caretManager.setCaret(editor.caretManager.minCaret);
            // Then we clear the selection to reset the caret to undefined. The mark
            // will still be visible, but that's not an issue.
            editor.caretManager.clearSelection();
            this.server.reset();
            errorCheck();
        };
        EditorSetup.prototype.restore = function () {
            if (this.editor !== undefined) {
                this.editor.destroy();
            }
            this.server.restore();
            errorCheck();
            if (this.wedroot !== undefined) {
                document.body.removeChild(this.wedroot);
            }
            if (this.sandbox !== undefined) {
                this.sandbox.restore();
            }
            // Immediately destroy all notifications to prevent interfering with other
            // tests. ($.notifyClose is not drastic enough.)
            $("[data-notify=container]").remove();
        };
        EditorSetup.provider = new util_1.DataProvider("");
        return EditorSetup;
    }());
    exports.EditorSetup = EditorSetup;
});
//# sourceMappingURL=wed-test-util.js.map