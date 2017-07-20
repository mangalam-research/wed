var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "module", "jquery", "salve", "wed/action", "wed/decorator", "wed/domutil", "wed/gui/context-menu", "wed/input-trigger-factory", "wed/key", "wed/key-constants", "wed/modes/generic/generic", "wed/modes/generic/generic-decorator", "wed/transformation", "wed/util"], function (require, exports, module, $, salve_1, action_1, decorator_1, domutil_1, context_menu, input_trigger_factory, key, key_constants, generic_1, generic_decorator_1, transformation, util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:completed-docs
    var Validator = (function () {
        function Validator(dataRoot) {
            this.dataRoot = dataRoot;
        }
        Validator.prototype.validateDocument = function () {
            return [{
                    error: new salve_1.ValidationError("Test"),
                    node: this.dataRoot,
                    index: 0,
                }];
        };
        return Validator;
    }());
    // tslint:disable-next-line:completed-docs
    var TestDecorator = (function (_super) {
        __extends(TestDecorator, _super);
        function TestDecorator() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.elementLevel = {
                term: 2,
                ref: 2,
                text: 1,
            };
            return _this;
        }
        TestDecorator.prototype.addHandlers = function () {
            _super.prototype.addHandlers.call(this);
            input_trigger_factory.makeSplitMergeInputTrigger(this.editor, "hi", key.makeKey(";"), key_constants.BACKSPACE, key_constants.DELETE);
        };
        // tslint:disable:no-jquery-raw-elements
        TestDecorator.prototype.elementDecorator = function (root, el) {
            var dataNode = this.editor.toDataNode(el);
            var rend = dataNode.getAttribute("rend");
            var origName = util.getOriginalName(el);
            var level = this.elementLevel[origName];
            if (level === undefined) {
                level = 1;
            }
            // We don't run the default when we wrap p.
            if (!(origName === "p" && rend === "wrap")) {
                // There's no super.super syntax we can use here.
                decorator_1.Decorator.prototype.elementDecorator.call(this, root, el, level, this.contextMenuHandler.bind(this, true), this.contextMenuHandler.bind(this, false));
            }
            if (origName === "ref") {
                $(el).children("._text._phantom").remove();
                this.guiUpdater.insertBefore(el, $("<div class='_text _phantom _end_wrapper'>)</div>")[0], el.lastChild);
                var $before = $("<div class='_text _phantom _start_wrapper'>(</div>");
                this.guiUpdater.insertBefore(el, $before[0], el.firstChild.nextSibling);
                $before.on("wed-context-menu", { node: el }, this._navigationContextMenuHandler.bind(this));
                $before[0].setAttribute("data-wed-custom-context-menu", "true");
            }
            if (origName === "p") {
                switch (rend) {
                    case "foo":
                        $(el).children("._gui_test").remove();
                        this.guiUpdater
                            .insertBefore(el, $("<div class='_gui _phantom _gui_test btn " +
                            "btn-default'>Foo</div>")[0], el.lastChild);
                        var found = void 0;
                        var child = dataNode.firstElementChild;
                        while (found === undefined && child !== null) {
                            if (child.tagName === "abbr") {
                                found = child;
                            }
                            child = child.nextElementSibling;
                        }
                        if (found !== undefined) {
                            this.guiUpdater
                                .insertBefore(el, $("<div class='_gui _phantom _gui_test btn " +
                                "btn-default'>Foo2</div>")[0], el.lastChild);
                            this.guiUpdater
                                .insertBefore(el, $("<div class='_gui _phantom _gui_test btn " +
                                "btn-default'>Foo3</div>")[0], el.lastChild);
                        }
                        break;
                    case "wrap":
                        if (domutil_1.closestByClass(el, "_gui_test") !== null) {
                            break;
                        }
                        var wrapper = $("<div class='_gui _phantom_wrap _gui_test btn " +
                            "btn-default'></div>")[0];
                        this.guiUpdater.insertBefore(el.parentNode, wrapper, el);
                        this.guiUpdater.insertBefore(wrapper, el, null);
                        break;
                    default:
                        break;
                }
            }
        };
        TestDecorator.prototype._navigationContextMenuHandler = function (wedEv, ev) {
            // node is the node in the GUI tree which corresponds to the navigation item
            // for which a context menu handler was required by the user.
            var node = wedEv.data.node;
            var origName = util.getOriginalName(node);
            // container, offset: location of the node in its parent.
            var container = node.parentNode;
            var offset = domutil_1.indexOf(container.childNodes, node);
            // Create "insert" transformations for siblings that could be inserted
            // before this node.
            var actions = this.mode.getContextualActions("insert", origName, container, offset);
            // data to pass to transformations
            var data = {
                name: origName,
                moveCaretTo: this.editor.caretManager.makeCaret(container, offset),
            };
            var items = [];
            for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
                var act = actions_1[_i];
                var text = act.getLabelFor(data) + " before this one";
                var $a = $("<a tabindex='0' href='#'>" + text + "</a>");
                $a.click(data, act.boundTerminalHandler);
                items.push($("<li></li>").append($a)[0]);
            }
            // tslint:disable-next-line:no-unused-expression
            new context_menu.ContextMenu(this.editor.doc, ev.clientX, ev.clientY, items);
            return false;
        };
        return TestDecorator;
    }(generic_decorator_1.GenericDecorator));
    exports.TestDecorator = TestDecorator;
    // tslint:disable-next-line:completed-docs
    var TypeaheadAction = (function (_super) {
        __extends(TypeaheadAction, _super);
        function TypeaheadAction() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TypeaheadAction.prototype.execute = function () {
            var editor = this.editor;
            var substringMatcher = function (strs) {
                return function (q, cb) {
                    var re = new RegExp(q, "i");
                    var matches = [];
                    for (var _i = 0, strs_1 = strs; _i < strs_1.length; _i++) {
                        var str = strs_1[_i];
                        if (re.test(str)) {
                            matches.push({ value: str });
                        }
                    }
                    cb(matches);
                };
            };
            var testData = [];
            for (var i = 0; i < 100; ++i) {
                testData.push("Test " + i);
            }
            var options = {
                options: {
                    autoselect: true,
                    hint: true,
                    highlight: true,
                    minLength: 1,
                },
                datasets: [{
                        source: substringMatcher(testData),
                    }],
            };
            var pos = editor.computeContextMenuPosition(undefined, true);
            var typeahead = editor.displayTypeaheadPopup(pos.left, pos.top, 300, "Test", options, function (obj) {
                if (obj != null) {
                    editor.type(obj.value);
                }
            });
            typeahead.hideSpinner();
            var range = editor.caretManager.range;
            // This is purposely not as intelligent as what real mode would
            // need.
            if (range != null && !range.collapsed) {
                typeahead.setValue(range.toString());
            }
        };
        return TypeaheadAction;
    }(action_1.Action));
    // tslint:disable-next-line:completed-docs
    var DraggableModalAction = (function (_super) {
        __extends(DraggableModalAction, _super);
        function DraggableModalAction() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DraggableModalAction.prototype.execute = function () {
            var editor = this.editor;
            var modal = editor.mode.draggable;
            modal.modal();
        };
        return DraggableModalAction;
    }(action_1.Action));
    // tslint:disable-next-line:completed-docs
    var ResizableModalAction = (function (_super) {
        __extends(ResizableModalAction, _super);
        function ResizableModalAction() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ResizableModalAction.prototype.execute = function () {
            var editor = this.editor;
            var modal = editor.mode.resizable;
            modal.modal();
        };
        return ResizableModalAction;
    }(action_1.Action));
    // tslint:disable-next-line:completed-docs
    var DraggableResizableModalAction = (function (_super) {
        __extends(DraggableResizableModalAction, _super);
        function DraggableResizableModalAction() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DraggableResizableModalAction.prototype.execute = function () {
            var editor = this.editor;
            var modal = editor.mode.draggableResizable;
            modal.modal();
        };
        return DraggableResizableModalAction;
    }(action_1.Action));
    /**
     * This mode is purely designed to help test wed, and nothing
     * else. Don't derive anything from it and don't use it for editing.
     */
    var TestMode = (function (_super) {
        __extends(TestMode, _super);
        function TestMode(editor, options) {
            var _this = _super.call(this, editor, options) || this;
            _this.optionTemplate = {
                metadata: true,
                autoinsert: false,
                ambiguous_fileDesc_insert: false,
                fileDesc_insert_needs_input: false,
                hide_attributes: false,
            };
            if (_this.constructor !== TestMode) {
                throw new Error("this is a test mode; don't derive from it!");
            }
            _this.wedOptions.metadata = {
                name: "Test",
                authors: ["Louis-Dominique Dubeau"],
                description: "TEST MODE. DO NOT USE IN PRODUCTION!",
                license: "MPL 2.0",
                copyright: "Mangalam Research Center for Buddhist Languages",
            };
            _this.wedOptions.label_levels = {
                max: 2,
                initial: 1,
            };
            if (options.hide_attributes) {
                _this.wedOptions.attributes = "hide";
            }
            else {
                _this.wedOptions.attributes = {
                    handling: "edit",
                    autohide: {
                        method: "selector",
                        elements: [{
                                selector: "div",
                                attributes: ["*", {
                                        except: ["sample", "type", "subtype"],
                                    }],
                            }],
                    },
                };
            }
            return _this;
        }
        TestMode.prototype.init = function () {
            var _this = this;
            return _super.prototype.init.call(this)
                .then(function () {
                var editor = _this.editor;
                _this.typeaheadAction = new TypeaheadAction(editor, "Test typeahead", undefined, "<i class='fa fa-plus fa-fw'></i>", true);
                _this.draggable = editor.makeModal({ draggable: true });
                _this.resizable = editor.makeModal({ resizable: true });
                _this.draggableResizable = editor.makeModal({
                    resizable: true,
                    draggable: true,
                });
                _this.draggableAction = new DraggableModalAction(editor, "Test draggable", undefined, undefined, true);
                _this.resizableAction = new ResizableModalAction(editor, "Test resizable", undefined, undefined, true);
                _this.draggableResizableAction = new DraggableResizableModalAction(editor, "Test draggable resizable", undefined, undefined, true);
            });
        };
        TestMode.prototype.getContextualActions = function (transformationType, tag, container, offset) {
            if (this.options.fileDesc_insert_needs_input &&
                tag === "fileDesc" && transformationType === "insert") {
                return [new transformation.Transformation(this.editor, "insert", "foo", undefined, undefined, true, 
                    // We don't need a real handler because it will not be called.
                    // tslint:disable-next-line:no-empty
                    function () { })];
            }
            var ret = _super.prototype.getContextualActions.call(this, transformationType, tag, container, offset);
            if (this.options.ambiguous_fileDesc_insert &&
                tag === "fileDesc" && transformationType === "insert") {
                // We just duplicate the transformation.
                ret = ret.concat(ret);
            }
            if (tag === "ref" &&
                (transformationType === "insert" || transformationType === "wrap")) {
                ret.push(this.typeaheadAction, this.draggableAction, this.resizableAction, this.draggableResizableAction);
            }
            return ret;
        };
        TestMode.prototype.makeDecorator = function () {
            var obj = Object.create(TestDecorator.prototype);
            var args = Array.prototype.slice.call(arguments);
            args = [this, this.metadata, this.options].concat(args);
            TestDecorator.apply(obj, args);
            return obj;
        };
        TestMode.prototype.getAttributeCompletions = function (attr) {
            if (attr.name === "n") {
                return ["completion1", "completion2"];
            }
            return [];
        };
        TestMode.prototype.getValidator = function () {
            return new Validator(this.editor.data_root);
        };
        return TestMode;
    }(generic_1.Mode));
    exports.Mode = TestMode;
});
//  LocalWords:  domutil metas tei oop util Mangalam MPL
//  LocalWords:  Dubeau

//# sourceMappingURL=test-mode.js.map
