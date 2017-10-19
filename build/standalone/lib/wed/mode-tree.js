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
define(["require", "exports", "module", "merge-options", "./domutil", "./mode-loader", "./wed-options-validation"], function (require, exports, module, mergeOptions, domutil_1, mode_loader_1, wed_options_validation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A node for the mode tree.
     */
    var ModeNode = /** @class */ (function () {
        /**
         * @param mode The mode that this node holds.
         *
         * @param editor The editor for which we are holding a mode.
         *
         * @param selector The selector that determines to what this modes apply. This
         * selector must have been converted to operate in the GUI tree.
         *
         * @param submodes The submodes set for this mode.
         *
         * @param wedOptions The cleaned up wed options that pertain to the mode held
         * by this node.
         */
        function ModeNode(mode, editor, selector, submodes, wedOptions) {
            this.mode = mode;
            this.editor = editor;
            this.selector = selector;
            this.submodes = submodes;
            this.wedOptions = wedOptions;
        }
        /**
         * Determines whether an element matched by the selector of this ``ModeNode``
         * node in the GUI tree contains a node. If it does, this means that the mode
         * that this ``ModeNode`` holds, or one of the submode, governs the node.
         *
         * @param parentScope The element from which the selector in this ``ModeNode``
         * is interpreted.
         *
         * @param node A GUI node to test.
         *
         * @returns The element that represents the top of the mode's region of
         * activity and contains ``node``. Returns ``null`` if no element contains the
         * node.
         */
        ModeNode.prototype.containingElement = function (parentScope, node) {
            if (!parentScope.contains(node)) {
                return null;
            }
            if (this.selector === "") {
                return parentScope;
            }
            var regions = parentScope.querySelectorAll(this.selector);
            for (var _i = 0, _a = Array.from(regions); _i < _a.length; _i++) {
                var region = _a[_i];
                if (region.contains(node)) {
                    return region;
                }
            }
            return null;
        };
        ModeNode.prototype.reduceTopFirst = function (fn, initialValue) {
            var value = fn(initialValue, this);
            for (var _i = 0, _a = this.submodes; _i < _a.length; _i++) {
                var submode = _a[_i];
                value = submode.reduceTopFirst(fn, value);
            }
            return value;
        };
        ModeNode.prototype.eachTopFirst = function (fn) {
            fn(this);
            for (var _i = 0, _a = this.submodes; _i < _a.length; _i++) {
                var submode = _a[_i];
                submode.eachTopFirst(fn);
            }
        };
        Object.defineProperty(ModeNode.prototype, "attributeHidingSpecs", {
            get: function () {
                if (this._attributeHidingSpecs === undefined) {
                    var attributeHiding = this.wedOptions.attributes.autohide;
                    if (attributeHiding === undefined) {
                        // No attribute hiding...
                        this._attributeHidingSpecs = null;
                    }
                    else {
                        var method = attributeHiding.method;
                        if (method !== "selector") {
                            throw new Error("unknown attribute hiding method: " + method);
                        }
                        var specs = {
                            elements: [],
                        };
                        for (var _i = 0, _a = attributeHiding.elements; _i < _a.length; _i++) {
                            var element = _a[_i];
                            var copy = mergeOptions({}, element);
                            copy.selector =
                                domutil_1.toGUISelector(copy.selector, this.mode.getAbsoluteNamespaceMappings());
                            specs.elements.push(copy);
                        }
                        this._attributeHidingSpecs = specs;
                    }
                }
                return this._attributeHidingSpecs;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ModeNode.prototype, "decorator", {
            get: function () {
                if (this._decorator === undefined) {
                    this._decorator = this.mode.makeDecorator();
                }
                return this._decorator;
            },
            enumerable: true,
            configurable: true
        });
        return ModeNode;
    }());
    /**
     * A tree containing the modes configured for the current editing session.
     */
    var ModeTree = /** @class */ (function () {
        /**
         * @param editor The editor for which we are building this tree.
         *
         * @param option The ``mode`` option from the options passed to the wed
         * instance. This object will construct a tree from this option.
         */
        function ModeTree(editor, option) {
            this.editor = editor;
            this.option = option;
            this.loader = new mode_loader_1.ModeLoader(editor, editor.runtime);
        }
        /**
         * Load the modes, initialize them and build the tree.
         *
         * @returns A promise that resolves to ``this`` once all the modes are loaded
         * and initialized.
         */
        ModeTree.prototype.init = function () {
            return __awaiter(this, void 0, void 0, function () {
                var combinedErrors, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            combinedErrors = [];
                            _a = this;
                            return [4 /*yield*/, this.makeNodes("", this.option, function (path, errors) {
                                    for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                                        var error = errors_1[_i];
                                        combinedErrors.push("mode at path " + path + " has an error in its wed options: " + error);
                                    }
                                })];
                        case 1:
                            _a.root = _b.sent();
                            if (combinedErrors.length > 0) {
                                throw new Error("wed options are incorrect: " + combinedErrors.join(""));
                            }
                            return [2 /*return*/, this];
                    }
                });
            });
        };
        /**
         * Make the nodes of the tree. This function operates recursively: it will
         * inspect ``option`` for a ``submode`` option and will call itself to create
         * the necessary child nodes.
         *
         * @param selector The selector associated with the options passed in the 2nd
         * argument.
         *
         * @param option The mode option being processed.
         *
         * @param errorHanler The handler to call on errors in processing the wed
         * options. If this handler is called at all, then the returned value should
         * not be used. We operate this way because we want to report all errors that
         * can be reported, rather than abort early.
         *
         * @returns A promise that resolves to the created node.
         */
        ModeTree.prototype.makeNodes = function (selector, option, errorHandler) {
            return __awaiter(this, void 0, void 0, function () {
                var submode, mode, submodes, _a, rawOptions, result, cleanedOptions;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            submode = option.submode;
                            return [4 /*yield*/, this.loader.initMode(option.path, option.options)];
                        case 1:
                            mode = _b.sent();
                            if (!(submode !== undefined)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.makeNodes(domutil_1.toGUISelector(submode.selector, mode.getAbsoluteNamespaceMappings()), submode.mode, errorHandler)];
                        case 2:
                            _a = [_b.sent()];
                            return [3 /*break*/, 4];
                        case 3:
                            _a = [];
                            _b.label = 4;
                        case 4:
                            submodes = _a;
                            rawOptions = mode.getWedOptions();
                            result = wed_options_validation_1.processWedOptions(rawOptions);
                            if (Array.isArray(result)) {
                                errorHandler(option.path, result);
                                // This is a lie.
                                cleanedOptions = rawOptions;
                            }
                            else {
                                cleanedOptions = result;
                            }
                            return [2 /*return*/, new ModeNode(mode, this.editor, selector, submodes, cleanedOptions)];
                    }
                });
            });
        };
        /**
         * Get the mode that governs a node.
         *
         * @param The node we want to check. This must be a done in the data tree or
         * the GUI tree.
         *
         * @returns The mode that governs the node.
         */
        ModeTree.prototype.getMode = function (node) {
            return this.getModeNode(node).mode;
        };
        /**
         * Get the decorator that governs a node.
         */
        ModeTree.prototype.getDecorator = function (node) {
            return this.getModeNode(node).decorator;
        };
        /**
         * Get the processed wed options that are in effect for a given node.
         *
         * @param The node we want to check. This must be a done in the data tree or
         * the GUI tree.
         *
         * @returns The wed options that governs the node.
         */
        ModeTree.prototype.getWedOptions = function (node) {
            var modeNode = this.getModeNode(node);
            return modeNode.wedOptions;
        };
        /**
         * Get the attribute handling that applies to a specific node.
         */
        ModeTree.prototype.getAttributeHandling = function (node) {
            return this.getWedOptions(node).attributes.handling;
        };
        /**
         * Get the attribute hiding specs that apply to a specific node.
         *
         * @returns The specifications that apply to the node. These specifications
         * have been preprocessed to convert the selectors from being appropriate for
         * the data tree to selectors appropriate for the GUI tree. ``null`` is
         * returned if there are no specs.
         */
        ModeTree.prototype.getAttributeHidingSpecs = function (node) {
            return this.getModeNode(node).attributeHidingSpecs;
        };
        /**
         * Get the mode node that governs a node.
         *
         * @param The node we want to check. This must be a done in the data tree or
         * the GUI tree.
         *
         * @returns The mode that governs the node.
         */
        ModeTree.prototype.getModeNode = function (node) {
            // Handle the trivial case where there is no submode first.
            if (this.root.submodes.length === 0) {
                return this.root;
            }
            if (domutil_1.contains(this.editor.dataRoot, node)) {
                var data = this.editor.fromDataNode(node);
                if (data !== null) {
                    node = data;
                }
            }
            if (!this.editor.guiRoot.contains(node)) {
                throw new Error("did not pass a node in the GUI or data tree");
            }
            var result = this._getModeNode(this.root, this.editor.guiRoot, node);
            if (result === undefined) {
                throw new Error("cannot find a mode for the node; something is wrong");
            }
            return result;
        };
        ModeTree.prototype._getModeNode = function (parent, parentScope, node) {
            var scope = parent.containingElement(parentScope, node);
            if (scope !== null) {
                var narrower = void 0;
                for (var _i = 0, _a = parent.submodes; _i < _a.length; _i++) {
                    var submode = _a[_i];
                    narrower = this._getModeNode(submode, scope, node);
                    if (narrower !== undefined) {
                        return narrower;
                    }
                }
                return parent;
            }
            return undefined;
        };
        /**
         * Get the stylesheets that the modes define. It is up to the mode to use
         * stylesheets that are written so as to avoid interfering with one another.
         *
         * @returns The list of sheets used by the modes. Straight duplicates are
         * eliminated from the list. The paths must not require any further
         * interpretation from wed.
         */
        ModeTree.prototype.getStylesheets = function () {
            return Object.keys(this.root.reduceTopFirst(function (accumulator, node) {
                for (var _i = 0, _a = node.mode.getStylesheets(); _i < _a.length; _i++) {
                    var sheet = _a[_i];
                    accumulator[sheet] = true;
                }
                return accumulator;
            }, Object.create(null)));
        };
        /**
         * Get the maximum label visibility level configured by the modes. This
         * function looks at all modes in use and returns the highest number it finds.
         *
         * @returns The maximum label visibility level.
         */
        ModeTree.prototype.getMaxLabelLevel = function () {
            return this.maxLabelLevelNode.wedOptions.label_levels.max;
        };
        /**
         * Get the initial label visibility level configured by the modes. This
         * function looks at all modes in use and returns the number that is set by
         * the same mode used to provide the value of [[getMaxLabelLevel]].
         *
         * @returns The initial label visibility level.
         */
        ModeTree.prototype.getInitialLabelLevel = function () {
            return this.maxLabelLevelNode.wedOptions.label_levels.initial;
        };
        Object.defineProperty(ModeTree.prototype, "maxLabelLevelNode", {
            /**
             * The node with the maximum label visibility level. If multiple nodes have
             * the same value, the earlier node "wins", and is the one provided by this
             * property. For instance, if the root node and its submode have the same
             * number, then this property has the root node for value.
             *
             * This is a cached value, computed on first access.
             */
            get: function () {
                if (this.cachedMaxLabelNode === undefined) {
                    this.cachedMaxLabelNode = this.root.reduceTopFirst(function (accumulator, node) {
                        var accMax = accumulator.wedOptions.label_levels.max;
                        var nodeMax = node.wedOptions.label_levels.max;
                        return (nodeMax > accMax) ? node : accumulator;
                    }, this.root);
                }
                return this.cachedMaxLabelNode;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @returns The list of all mode validators defined by the modes.
         */
        ModeTree.prototype.getValidators = function () {
            return this.root.reduceTopFirst(function (accumulator, node) {
                var validator = node.mode.getValidator();
                return validator !== undefined ?
                    accumulator.concat(validator) : accumulator;
            }, []);
        };
        /**
         * Call on each decorator to add its event handlers.
         */
        ModeTree.prototype.addDecoratorHandlers = function () {
            this.root.eachTopFirst(function (node) {
                node.decorator.addHandlers();
            });
        };
        /**
         * Call on each decorator to start listening.
         */
        ModeTree.prototype.startListening = function () {
            this.root.eachTopFirst(function (node) {
                node.decorator.startListening();
            });
        };
        return ModeTree;
    }());
    exports.ModeTree = ModeTree;
});
//  LocalWords:  MPL submodes submode combinedErrors nd preprocessed
//  LocalWords:  stylesheets

//# sourceMappingURL=mode-tree.js.map
