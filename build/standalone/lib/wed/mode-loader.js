/**
 * Load and initialize modes.
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
define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A class that can load modes.
     */
    var ModeLoader = /** @class */ (function () {
        /**
         * @param runtime The runtime to use to load the mode module.
         */
        function ModeLoader(editor, runtime) {
            this.editor = editor;
            this.runtime = runtime;
        }
        /**
         * Load and initialize a mode.
         *
         * @param path The path to the mode.
         *
         * @param options The mode's options.
         *
         * @returns A promise that resolves to the initialized [[Mode]] object.
         */
        ModeLoader.prototype.initMode = function (path, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var mmodule, mode;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.loadMode(path)];
                        case 1:
                            mmodule = _a.sent();
                            mode = new mmodule.Mode(this.editor, options);
                            return [4 /*yield*/, mode.init()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, mode];
                    }
                });
            });
        };
        /**
         * Loads a mode.
         *
         * @param path The path to the mode.
         *
         * @returns A promise that resolves to the module that holds the mode.
         */
        ModeLoader.prototype.loadMode = function (path) {
            return __awaiter(this, void 0, void 0, function () {
                var runtime, ex_1, ex_2, ex_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            runtime = this.runtime;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, runtime.resolveModules(path)];
                        case 2: return [2 /*return*/, (_a.sent())[0]];
                        case 3:
                            ex_1 = _a.sent();
                            return [3 /*break*/, 4];
                        case 4:
                            if (path.indexOf("/") !== -1) {
                                // It is an actual path so don't try any further loading.
                                throw new Error("can't load mode " + path);
                            }
                            path = "./modes/" + path + "/" + path;
                            _a.label = 5;
                        case 5:
                            _a.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, runtime.resolveModules(path)];
                        case 6: return [2 /*return*/, (_a.sent())[0]];
                        case 7:
                            ex_2 = _a.sent();
                            return [3 /*break*/, 8];
                        case 8:
                            _a.trys.push([8, 10, , 11]);
                            return [4 /*yield*/, runtime.resolveModules(path + "-mode")];
                        case 9: return [2 /*return*/, (_a.sent())[0]];
                        case 10:
                            ex_3 = _a.sent();
                            return [3 /*break*/, 11];
                        case 11: return [4 /*yield*/, runtime.resolveModules(path + "_mode")];
                        case 12: return [2 /*return*/, (_a.sent())[0]];
                    }
                });
            });
        };
        return ModeLoader;
    }());
    exports.ModeLoader = ModeLoader;
});
//  LocalWords:  MPL runtime

//# sourceMappingURL=mode-loader.js.map
