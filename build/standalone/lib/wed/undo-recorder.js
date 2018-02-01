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
define(["require", "exports", "./domutil", "./undo"], function (require, exports, domutil_1, undo) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getOuterHTML(node) {
        return (node == null) ? "undefined" : node.outerHTML;
    }
    /**
     * Undo operation for [["wed/tree-updater".InsertNodeAtEvent]].
     *
     * The parameters after ``tree_updater`` are the same as the properties on the
     * event corresponding to this class.
     *
     * @private
     */
    var InsertNodeAtUndo = /** @class */ (function (_super) {
        __extends(InsertNodeAtUndo, _super);
        /**
         * @param treeUpdater The tree updater to use to perform undo or redo
         * operations.
         *
         * @param parent
         * @param index
         */
        function InsertNodeAtUndo(treeUpdater, parent, index) {
            var _this = _super.call(this, "InsertNodeAtUndo") || this;
            _this.treeUpdater = treeUpdater;
            _this.index = index;
            _this.parentPath = treeUpdater.nodeToPath(parent);
            return _this;
            // We do not take a node parameter and save it here because further
            // manipulations could take the node out of the tree. So we cannot rely in a
            // reference to a node. What we do instead is keep a path to the parent and
            // the index. The ``node`` property will be filled as needed when
            // undoing/redoing.
        }
        InsertNodeAtUndo.prototype.performUndo = function () {
            if (this.node !== undefined) {
                throw new Error("undo called twice in a row");
            }
            var parent = this.treeUpdater.pathToNode(this.parentPath);
            this.node = parent.childNodes[this.index].cloneNode(true);
            this.treeUpdater.deleteNode(parent.childNodes[this.index]);
        };
        InsertNodeAtUndo.prototype.performRedo = function () {
            if (this.node === undefined) {
                throw new Error("redo called twice in a row");
            }
            var parent = this.treeUpdater.pathToNode(this.parentPath);
            this.treeUpdater.insertNodeAt(parent, this.index, this.node);
            this.node = undefined;
        };
        InsertNodeAtUndo.prototype.toString = function () {
            return [this.desc, "\n",
                " Parent path: ", this.parentPath, "\n",
                " Index: ", this.index, "\n",
                " Node: ", getOuterHTML(this.node), "\n"].join("");
        };
        return InsertNodeAtUndo;
    }(undo.Undo));
    /**
     * Undo operation for [["wed/tree-updater".SetTextNodeValueEvent]].
     *
     * @private
     */
    var SetTextNodeValueUndo = /** @class */ (function (_super) {
        __extends(SetTextNodeValueUndo, _super);
        /**
         * @param treeUpdater The tree updater to use to perform undo or redo
         * operations.
         */
        function SetTextNodeValueUndo(treeUpdater, node, value, oldValue) {
            var _this = _super.call(this, "SetTextNodeValueUndo") || this;
            _this.treeUpdater = treeUpdater;
            _this.value = value;
            _this.oldValue = oldValue;
            _this.nodePath = treeUpdater.nodeToPath(node);
            return _this;
        }
        SetTextNodeValueUndo.prototype.performUndo = function () {
            // The node is necessarily a text node.
            var node = this.treeUpdater.pathToNode(this.nodePath);
            this.treeUpdater.setTextNodeValue(node, this.oldValue);
        };
        SetTextNodeValueUndo.prototype.performRedo = function () {
            // The node is necessarily a text node.
            var node = this.treeUpdater.pathToNode(this.nodePath);
            this.treeUpdater.setTextNodeValue(node, this.value);
        };
        SetTextNodeValueUndo.prototype.toString = function () {
            return [this.desc, "\n",
                " Node path: ", this.nodePath, "\n",
                " Value: ", this.value, "\n",
                " Old value: ", this.oldValue, "\n"].join("");
        };
        return SetTextNodeValueUndo;
    }(undo.Undo));
    /**
     * Undo operation for [["wed/tree-updater".BeforeDeleteNodeEvent]].
     *
     * @private
     */
    var DeleteNodeUndo = /** @class */ (function (_super) {
        __extends(DeleteNodeUndo, _super);
        /**
         * @param treeUpdater The tree updater to use to perform undo or redo
         * operations.
         */
        function DeleteNodeUndo(treeUpdater, node) {
            var _this = _super.call(this, "DeleteNodeUndo") || this;
            _this.treeUpdater = treeUpdater;
            var parent = node.parentNode;
            _this.parentPath = treeUpdater.nodeToPath(parent);
            _this.index = domutil_1.indexOf(parent.childNodes, node);
            _this.node = node.cloneNode(true);
            return _this;
        }
        DeleteNodeUndo.prototype.performUndo = function () {
            if (this.node === undefined) {
                throw new Error("undo called twice in a row");
            }
            var parent = this.treeUpdater.pathToNode(this.parentPath);
            this.treeUpdater.insertNodeAt(parent, this.index, this.node);
            this.node = undefined;
        };
        DeleteNodeUndo.prototype.performRedo = function () {
            if (this.node !== undefined) {
                throw new Error("redo called twice in a row");
            }
            var parent = this.treeUpdater.pathToNode(this.parentPath);
            this.node = parent.childNodes[this.index].cloneNode(true);
            this.treeUpdater.deleteNode(parent.childNodes[this.index]);
        };
        DeleteNodeUndo.prototype.toString = function () {
            return [this.desc, "\n",
                " Parent path: ", this.parentPath, "\n",
                " Index: ", this.index, "\n",
                " Node: ", getOuterHTML(this.node), "\n"].join("");
        };
        return DeleteNodeUndo;
    }(undo.Undo));
    /**
     * Undo operation for [["wed/tree-updater".SetAttributeNSEvent]].
     *
     * @private
     */
    var SetAttributeNSUndo = /** @class */ (function (_super) {
        __extends(SetAttributeNSUndo, _super);
        /**
         * @param treeUpdater The tree updater to use to perform undo or redo
         * operations.
         */
        function SetAttributeNSUndo(treeUpdater, node, ns, attribute, oldValue, newValue) {
            var _this = _super.call(this, "SetAttributeNSUndo") || this;
            _this.treeUpdater = treeUpdater;
            _this.ns = ns;
            _this.attribute = attribute;
            _this.oldValue = oldValue;
            _this.newValue = newValue;
            _this.nodePath = treeUpdater.nodeToPath(node);
            return _this;
        }
        SetAttributeNSUndo.prototype.performUndo = function () {
            var node = this.treeUpdater.pathToNode(this.nodePath);
            this.treeUpdater.setAttributeNS(node, this.ns, this.attribute, this.oldValue);
        };
        SetAttributeNSUndo.prototype.performRedo = function () {
            var node = this.treeUpdater.pathToNode(this.nodePath);
            this.treeUpdater.setAttributeNS(node, this.ns, this.attribute, this.newValue);
        };
        SetAttributeNSUndo.prototype.toString = function () {
            return [this.desc, "\n",
                " Node path: ", this.nodePath, "\n",
                " Namespace: ", this.ns, "\n",
                " Attribute Name: ", this.attribute, "\n",
                " New value: ", this.newValue, "\n",
                " Old value: ", this.oldValue, "\n"].join("");
        };
        return SetAttributeNSUndo;
    }(undo.Undo));
    /**
     * Records undo operations.
     */
    var UndoRecorder = /** @class */ (function () {
        /**
         * @param editor The editor for which this recorder is created.
         *
         * @param treeUpdater The tree updater on which to listen for modifications.
         */
        function UndoRecorder(editor, treeUpdater) {
            var _this = this;
            this.editor = editor;
            this.treeUpdater = treeUpdater;
            this.suppress = false;
            treeUpdater.events.subscribe(function (ev) {
                switch (ev.name) {
                    case "InsertNodeAt":
                        _this.insertNodeAtHandler(ev);
                        break;
                    case "SetTextNodeValue":
                        _this.setTextNodeValueHandler(ev);
                        break;
                    case "BeforeDeleteNode":
                        _this.beforeDeleteNodeHandler(ev);
                        break;
                    case "SetAttributeNS":
                        _this.setAttributeNSHandler(ev);
                        break;
                    default:
                }
            });
        }
        /**
         * Sets the suppression state. When suppression is on, the recorder does not
         * record anything. When off, the recorder records. The recorder's suppression
         * state is initially off.
         *
         * @param suppress Whether to suppress or not.
         *
         * @throws {Error} If the call does not change the suppression state.
         */
        UndoRecorder.prototype.suppressRecording = function (suppress) {
            if (suppress === this.suppress) {
                throw new Error("spurious call to suppressRecording");
            }
            this.suppress = suppress;
        };
        UndoRecorder.prototype.insertNodeAtHandler = function (ev) {
            if (this.suppress) {
                return;
            }
            this.editor.recordUndo(new InsertNodeAtUndo(this.treeUpdater, ev.parent, ev.index));
        };
        UndoRecorder.prototype.setTextNodeValueHandler = function (ev) {
            if (this.suppress) {
                return;
            }
            this.editor.recordUndo(new SetTextNodeValueUndo(this.treeUpdater, ev.node, ev.value, ev.oldValue));
        };
        UndoRecorder.prototype.beforeDeleteNodeHandler = function (ev) {
            if (this.suppress) {
                return;
            }
            this.editor.recordUndo(new DeleteNodeUndo(this.treeUpdater, ev.node));
        };
        UndoRecorder.prototype.setAttributeNSHandler = function (ev) {
            if (this.suppress) {
                return;
            }
            this.editor.recordUndo(new SetAttributeNSUndo(this.treeUpdater, ev.node, ev.ns, ev.attribute, ev.oldValue, ev.newValue));
        };
        return UndoRecorder;
    }());
    exports.UndoRecorder = UndoRecorder;
});
//  LocalWords:  domutil insertNodeAt setTextNodeValue deleteNode ev param MPL
//  LocalWords:  InsertNodeAtUndo SetTextNodeValueUndo DeleteNodeUndo Dubeau
//  LocalWords:  pathToNode nodeToPath Mangalam SetAttributeNSUndo
//  LocalWords:  BeforeDeleteNode SetAttributeNS suppressRecording
//# sourceMappingURL=undo-recorder.js.map