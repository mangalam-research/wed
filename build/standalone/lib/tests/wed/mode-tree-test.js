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
define(["require", "exports", "module", "chai", "merge-options", "sinon", "sinon-chai", "wed/mode-tree", "../base-config", "../util", "../wed-test-util"], function (require, exports, module, chai_1, mergeOptions, sinon, sinonChai, mode_tree_1, globalConfig, util_1, wed_test_util_1) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    chai_1.use(sinonChai);
    var options = {
        schema: "/base/build/schemas/tei-simplified-rng.js",
        mode: {
            path: "wed/modes/generic/generic",
            options: {
                metadata: "/base/build/schemas/tei-metadata.json",
            },
            // We set a submode that operates on teiHeader so as to be able to test
            // that input triggers operate only on their own region.
            submode: {
                method: "selector",
                selector: "p",
                mode: {
                    path: "wed/modes/test/test-mode",
                    options: {
                        metadata: "/base/build/schemas/tei-metadata.json",
                        nameSuffix: "1",
                        hide_attributes: true,
                        stylesheets: ["a.css", "b.css"],
                    },
                    submode: {
                        method: "selector",
                        selector: "teiHeader",
                        mode: {
                            path: "wed/modes/test/test-mode",
                            options: {
                                metadata: "/base/build/schemas/tei-metadata.json",
                                nameSuffix: "2",
                                stylesheets: ["b.css", "c.css"],
                            },
                        },
                    },
                },
            },
        },
    };
    describe("ModeTree", function () {
        var setup;
        var editor;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", mergeOptions(globalConfig.config, options), document);
            (editor = setup.editor);
            return setup.init();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        // tslint:disable-next-line:no-empty
        describe("#init", function () {
            it("resolves to the mode tree", function () { return __awaiter(_this, void 0, void 0, function () {
                var tree, resolved;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            resolved = _a.sent();
                            chai_1.expect(resolved).to.equal(tree);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("rejects if there are any wedOptions errors", function () { return __awaiter(_this, void 0, void 0, function () {
                var newOptions, path, tree;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            newOptions = mergeOptions({}, options.mode);
                            path = "tests/modes/failing-init";
                            newOptions.path = path;
                            tree = new mode_tree_1.ModeTree(editor, newOptions);
                            return [4 /*yield*/, util_1.expectError(function () { return tree.init(); }, Error, /^failed init$/)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("#getMode", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns the top mode for the top GUI node", function () {
                var mode = tree.getMode(editor.guiRoot);
                chai_1.expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
                    .equal("Generic");
            });
            it("returns the top mode for the top data node", function () {
                var mode = tree.getMode(editor.dataRoot);
                chai_1.expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
                    .equal("Generic");
            });
            it("returns a submode for a GUI node governed by a submode", function () {
                var p = editor.guiRoot.querySelector(".p._real");
                var mode = tree.getMode(p);
                chai_1.expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
                    .equal("Test1");
            });
            it("returns a submode for a data node governed by a submode", function () {
                var p = editor.dataRoot.querySelector("p");
                var mode = tree.getMode(p);
                chai_1.expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
                    .equal("Test1");
            });
            it("returns the same submode for nodes governed by same submode", function () {
                var ps = editor.dataRoot.querySelectorAll("p");
                var mode = tree.getMode(ps[0]);
                chai_1.expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
                    .equal("Test1");
                for (var _i = 0, _a = Array.from(ps); _i < _a.length; _i++) {
                    var p = _a[_i];
                    chai_1.expect(mode).to.equal(tree.getMode(p));
                }
            });
            it("constrain submodes to the region of their parent mode", function () {
                // We have set a submode that matches teiHeader but that submode is a
                // child of a mode that matches p. The one teiHeader in the document is
                // not a child of p and so should not match the submode. teiHeader should
                // be governed by the top mode.
                var el = editor.dataRoot.querySelector("teiHeader");
                var mode = tree.getMode(el);
                chai_1.expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
                    .equal("Generic");
            });
            it("fails if the node passed was not in the GUI or data trees", function () {
                chai_1.expect(tree.getMode.bind(tree, editor.guiRoot.parentNode)).to.throw(Error, /^did not pass a node in the GUI or data tree$/);
            });
        });
        describe("#getWedOptions", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns the top options for the top GUI node", function () {
                var opts = tree.getWedOptions(editor.guiRoot);
                chai_1.expect(opts).to.have.deep.property("metadata.name").equal("Generic");
            });
            it("returns the top options for the top data node", function () {
                var opts = tree.getWedOptions(editor.dataRoot);
                chai_1.expect(opts).to.have.deep.property("metadata.name").equal("Generic");
            });
            it("returns the submode options for a GUI node governed by a submode", function () {
                var p = editor.guiRoot.querySelector(".p._real");
                var opts = tree.getWedOptions(p);
                chai_1.expect(opts).to.have.deep.property("metadata.name").equal("Test1");
            });
            it("returns the submode options for a data node governed by a submode", function () {
                var p = editor.dataRoot.querySelector("p");
                var opts = tree.getWedOptions(p);
                chai_1.expect(opts).have.deep.property("metadata.name").equal("Test1");
            });
            it("returns the same submode options for nodes governed by same submode", function () {
                var ps = editor.dataRoot.querySelectorAll("p");
                var opts = tree.getWedOptions(ps[0]);
                chai_1.expect(opts).to.have.deep.property("metadata.name")
                    .equal("Test1");
                for (var _i = 0, _a = Array.from(ps); _i < _a.length; _i++) {
                    var p = _a[_i];
                    chai_1.expect(opts).to.equal(tree.getWedOptions(p));
                }
            });
            it("constrain submodes to the region of their parent mode", function () {
                // We have set a submode that matches teiHeader but that submode is a
                // child of a mode that matches p. The one teiHeader in the document is
                // not a child of p and so should not match the submode. teiHeader should
                // be governed by the top mode.
                var el = editor.dataRoot.querySelector("teiHeader");
                var opts = tree.getWedOptions(el);
                chai_1.expect(opts).to.have.deep.property("metadata.name").equal("Generic");
            });
            it("fails if the node passed was not in the GUI or data trees", function () {
                chai_1.expect(tree.getMode.bind(tree, editor.guiRoot.parentNode)).to.throw(Error, /^did not pass a node in the GUI or data tree$/);
            });
        });
        describe("#getAttributeHandling", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns the right value for the top GUI node", function () {
                var handling = tree.getAttributeHandling(editor.guiRoot);
                chai_1.expect(handling).to.equal("edit");
            });
            it("returns the right value for the top data node", function () {
                var handling = tree.getAttributeHandling(editor.guiRoot);
                chai_1.expect(handling).to.equal("edit");
            });
            it("returns the right value for a GUI node governed by a submode", function () {
                var p = editor.guiRoot.querySelector(".p._real");
                var handling = tree.getAttributeHandling(p);
                chai_1.expect(handling).to.equal("hide");
            });
            it("returns the right value for a data node governed by a submode", function () {
                var p = editor.dataRoot.querySelector("p");
                var handling = tree.getAttributeHandling(p);
                chai_1.expect(handling).to.equal("hide");
            });
        });
        describe("#getAttributeHidingSpecs", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                var localOptions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            localOptions = mergeOptions({}, options);
                            localOptions.mode.submode.mode.options.hide_attributes = false;
                            tree = new mode_tree_1.ModeTree(editor, localOptions.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns the right value for the top GUI node", function () {
                var handling = tree.getAttributeHidingSpecs(editor.guiRoot);
                chai_1.expect(handling).to.be.null;
            });
            it("returns the right value for the top data node", function () {
                var handling = tree.getAttributeHidingSpecs(editor.guiRoot);
                chai_1.expect(handling).to.be.null;
            });
            it("returns the right value for a GUI node governed by a submode", function () {
                var p = editor.guiRoot.querySelector(".p._real");
                var handling = tree.getAttributeHidingSpecs(p);
                chai_1.expect(handling).to.not.be.null;
            });
            it("returns the right value for a data node governed by a submode", function () {
                var p = editor.dataRoot.querySelector("p");
                var handling = tree.getAttributeHidingSpecs(p);
                chai_1.expect(handling).to.not.be.null;
            });
        });
        describe("#getStylesheets", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns the stylesheets used, without duplicates", function () {
                chai_1.expect(tree.getStylesheets()).to.have
                    .members(["a.css", "b.css", "c.css"]);
            });
        });
        describe("#getStylesheets", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns the stylesheets used, without duplicates", function () {
                chai_1.expect(tree.getStylesheets()).to.have
                    .members(["a.css", "b.css", "c.css"]);
            });
        });
        describe("#getMaxLabelLevel", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns the maximum level set", function () {
                chai_1.expect(tree.getMaxLabelLevel()).to.equal(2);
            });
        });
        describe("#getInitialLabelLevel", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns the level set by the same mode as the maximum", function () {
                chai_1.expect(tree.getInitialLabelLevel()).to.equal(1);
            });
        });
        describe("#getValidators", function () {
            var tree;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("returns all the validators", function () {
                // We have two validators because the generic mode does not define one.
                // We use test-mode twice. So two validators.
                var validators = tree.getValidators();
                chai_1.expect(validators).to.have.length(2);
                chai_1.expect(validators).to.have.deep.property("[0].validateDocument");
            });
        });
        describe("#addDecoratorHandlers", function () {
            var tree;
            var sandbox;
            before(function () {
                sandbox = sinon.sandbox.create();
            });
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            afterEach(function () {
                sandbox.restore();
            });
            it("calls addHandlers on all decorators", function () {
                // tslint:disable-next-line:no-any
                var root = tree.root;
                var decorators = 
                // tslint:disable-next-line:no-any
                root.reduceTopFirst(function (accumulator, node) {
                    return accumulator.concat(node.decorator);
                }, []);
                var spies = [];
                for (var _i = 0, decorators_1 = decorators; _i < decorators_1.length; _i++) {
                    var decorator = decorators_1[_i];
                    spies.push(sandbox.spy(decorator, "addHandlers"));
                }
                tree.addDecoratorHandlers();
                for (var _a = 0, spies_1 = spies; _a < spies_1.length; _a++) {
                    var spy = spies_1[_a];
                    chai_1.expect(spy).to.have.been.calledOnce;
                }
            });
        });
        describe("#startListening", function () {
            var tree;
            var sandbox;
            before(function () {
                sandbox = sinon.sandbox.create();
            });
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tree = new mode_tree_1.ModeTree(editor, options.mode);
                            return [4 /*yield*/, tree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            afterEach(function () {
                sandbox.restore();
            });
            it("calls startListening on all decorators", function () {
                // tslint:disable-next-line:no-any
                var root = tree.root;
                var decorators = 
                // tslint:disable-next-line:no-any
                root.reduceTopFirst(function (accumulator, node) {
                    return accumulator.concat(node.decorator);
                }, []);
                var spies = [];
                for (var _i = 0, decorators_2 = decorators; _i < decorators_2.length; _i++) {
                    var decorator = decorators_2[_i];
                    spies.push(sandbox.spy(decorator, "startListening"));
                }
                tree.startListening();
                for (var _a = 0, spies_2 = spies; _a < spies_2.length; _a++) {
                    var spy = spies_2[_a];
                    chai_1.expect(spy).to.have.been.calledOnce;
                }
            });
        });
    });
});

//# sourceMappingURL=mode-tree-test.js.map
