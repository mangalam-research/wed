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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "chai", "sinon", "sinon-chai", "tests/util", "wed/mode-loader"], function (require, exports, chai_1, sinon, sinon_chai_1, util_1, mode_loader_1) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    sinon = __importStar(sinon);
    sinon_chai_1 = __importDefault(sinon_chai_1);
    chai_1.use(sinon_chai_1.default);
    // tslint:disable-next-line:completed-docs
    var FakeMode = /** @class */ (function () {
        // tslint:disable-next-line:no-any
        function FakeMode(editor, options) {
            this.editor = editor;
            this.options = options;
            this.initialized = false;
        }
        FakeMode.prototype.init = function () {
            this.initialized = true;
            return Promise.resolve();
        };
        return FakeMode;
    }());
    // tslint:disable-next-line:missing-jsdoc
    describe("ModeLoader", function () {
        var loader;
        // tslint:disable-next-line:no-any
        var runtime;
        // Yes, we cheat with a typecast.
        // tslint:disable-next-line:no-any mocha-no-side-effect-code
        var editor = { editor: true };
        var options = { options: true };
        beforeEach(function () {
            var runtime_ = sinon.stub({
                // tslint:disable-next-line:no-empty
                resolveModules: function () { },
            });
            runtime = runtime_;
            loader = new mode_loader_1.ModeLoader(editor, runtime);
        });
        describe("#initMode", function () {
            it("fails if we cannot load", function () { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            runtime.resolveModules.throws(new Error("cannot load"));
                            return [4 /*yield*/, util_1.expectError(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                    return [2 /*return*/, loader.initMode("moo", options)];
                                }); }); }, Error, "cannot load")];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("by default, tries multiple module names", function () { return __awaiter(_this, void 0, void 0, function () {
                var ex_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            runtime.resolveModules.throws(new Error("cannot load"));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, loader.initMode("moo", {})];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            ex_1 = _a.sent();
                            return [3 /*break*/, 4];
                        case 4:
                            chai_1.expect(runtime).to.have.property("resolveModules").to.have.callCount(4);
                            chai_1.expect(runtime.resolveModules.firstCall).to.have.been.calledWith("moo");
                            chai_1.expect(runtime.resolveModules.secondCall)
                                .to.have.been.calledWith("wed/modes/moo/moo");
                            chai_1.expect(runtime.resolveModules.thirdCall)
                                .to.have.been.calledWith("wed/modes/moo/moo-mode");
                            chai_1.expect(runtime.resolveModules.lastCall)
                                .to.have.been.calledWith("wed/modes/moo/moo_mode");
                            return [2 /*return*/];
                    }
                });
            }); });
            it("fails on first attempt if the path has a forward slash", function () { return __awaiter(_this, void 0, void 0, function () {
                var ex_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            runtime.resolveModules.throws(new Error("cannot load"));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, loader.initMode("moo/foo", options)];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            ex_2 = _a.sent();
                            return [3 /*break*/, 4];
                        case 4:
                            chai_1.expect(runtime).to.have.property("resolveModules").to.have.callCount(1);
                            chai_1.expect(runtime.resolveModules).to.have.been.calledWith("moo/foo");
                            return [2 /*return*/];
                    }
                });
            }); });
            it("initializes the module after loading it", function () { return __awaiter(_this, void 0, void 0, function () {
                var loaded;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            runtime.resolveModules.returns([{
                                    Mode: FakeMode,
                                }]);
                            return [4 /*yield*/, loader.initMode("moo/foo", options)];
                        case 1:
                            loaded = _a.sent();
                            chai_1.expect(loaded).to.be.instanceof(FakeMode);
                            chai_1.expect(loaded).to.have.property("initialized").be.true;
                            return [2 /*return*/];
                    }
                });
            }); });
            it("creates the mode with correct parameters", function () { return __awaiter(_this, void 0, void 0, function () {
                var ModeConstructor;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ModeConstructor = sinon.spy(function Mode() {
                                return sinon.createStubInstance(FakeMode);
                            });
                            runtime.resolveModules.returns([{
                                    Mode: ModeConstructor,
                                }]);
                            return [4 /*yield*/, loader.initMode("moo/foo", options)];
                        case 1:
                            _a.sent();
                            chai_1.expect(ModeConstructor).to.have.been.calledOnce;
                            chai_1.expect(ModeConstructor).to.have.been.calledWith(editor, options);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("fails if the module fails to init", function () { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            runtime.resolveModules.returns([{
                                    Mode: function Mode() {
                                        var ret = sinon.createStubInstance(FakeMode);
                                        ret.init.returns(Promise.reject(new Error("failed")));
                                        return ret;
                                    },
                                }]);
                            return [4 /*yield*/, util_1.expectError(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                    return [2 /*return*/, loader.initMode("moo/foo", options)];
                                }); }); }, Error, "failed")];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=mode-loader-test.js.map