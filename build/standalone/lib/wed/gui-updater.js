/**
 * Listens to changes on a tree and updates the GUI tree in response to changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
define(["require", "exports", "jquery", "./convert", "./dloc", "./domtypeguards", "./domutil", "./tree-updater", "./util"], function (require, exports, jquery_1, convert, dloc_1, domtypeguards_1, domutil_1, tree_updater_1, util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    jquery_1 = __importDefault(jquery_1);
    convert = __importStar(convert);
    util = __importStar(util);
    /**
     * Updates a GUI tree so that its data nodes (those nodes that are not
     * decorations) mirror a data tree.
     */
    var GUIUpdater = /** @class */ (function (_super) {
        __extends(GUIUpdater, _super);
        /**
         * @param guiTree The DOM tree to update.
         *
         * @param treeUpdater A tree updater that updates the data tree. It serves as
         * a source of modification events which the object being created will listen
         * on.
         */
        function GUIUpdater(guiTree, treeUpdater) {
            var _this = _super.call(this, guiTree) || this;
            _this.treeUpdater = treeUpdater;
            _this.treeUpdater.events.subscribe(function (ev) {
                switch (ev.name) {
                    case "InsertNodeAt":
                        _this._insertNodeAtHandler(ev);
                        break;
                    case "SetTextNodeValue":
                        _this._setTextNodeValueHandler(ev);
                        break;
                    case "BeforeDeleteNode":
                        _this._beforeDeleteNodeHandler(ev);
                        break;
                    case "SetAttributeNS":
                        _this._setAttributeNSHandler(ev);
                        break;
                    default:
                    // Do nothing...
                }
            });
            return _this;
        }
        /**
         * Handles "InsertNodeAt" events.
         *
         * @param ev The event.
         */
        GUIUpdater.prototype._insertNodeAtHandler = function (ev) {
            var guiCaret = this.fromDataLocation(ev.parent, ev.index);
            if (guiCaret === null) {
                throw new Error("cannot find gui tree position");
            }
            var clone = convert.toHTMLTree(this.tree.ownerDocument, ev.node);
            if (domtypeguards_1.isElement(ev.node)) {
                // If ev.node is an element, then the clone is an element too.
                domutil_1.linkTrees(ev.node, clone);
            }
            this.insertNodeAt(guiCaret, clone);
        };
        /**
         * Handles "SetTextNodeValue" events.
         *
         * @param ev The event.
         */
        GUIUpdater.prototype._setTextNodeValueHandler = function (ev) {
            var guiCaret = this.fromDataLocation(ev.node, 0);
            if (guiCaret === null) {
                throw new Error("cannot find gui tree position");
            }
            this.setTextNodeValue(guiCaret.node, ev.value);
        };
        /**
         * Handles "BeforeDeleteNode" events.
         *
         * @param ev The event.
         */
        GUIUpdater.prototype._beforeDeleteNodeHandler = function (ev) {
            var dataNode = ev.node;
            var toRemove;
            var element = false;
            switch (dataNode.nodeType) {
                case Node.TEXT_NODE:
                    var guiCaret = this.fromDataLocation(dataNode, 0);
                    if (guiCaret === null) {
                        throw new Error("cannot find gui tree position");
                    }
                    toRemove = guiCaret.node;
                    break;
                case Node.ELEMENT_NODE:
                    toRemove = jquery_1.default.data(dataNode, "wed_mirror_node");
                    element = true;
                    break;
                default:
            }
            this.deleteNode(toRemove);
            // We have to do this **after** we delete the node.
            if (element) {
                domutil_1.unlinkTree(dataNode);
                domutil_1.unlinkTree(toRemove);
            }
        };
        /**
         * Handles "SetAttributeNS" events.
         *
         * @param ev The event.
         */
        GUIUpdater.prototype._setAttributeNSHandler = function (ev) {
            var guiCaret = this.fromDataLocation(ev.node, 0);
            if (guiCaret === null) {
                throw new Error("cannot find gui tree position");
            }
            this.setAttributeNS(guiCaret.node, "", util.encodeAttrName(ev.attribute), ev.newValue);
        };
        GUIUpdater.prototype.fromDataLocation = function (loc, offset) {
            var node;
            if (loc instanceof dloc_1.DLoc) {
                node = loc.node;
                offset = loc.offset;
            }
            else {
                node = loc;
                if (offset === undefined) {
                    throw new Error("must specify an offset");
                }
            }
            var guiNode = this.pathToNode(this.treeUpdater.nodeToPath(node));
            if (guiNode === null) {
                return null;
            }
            if (domtypeguards_1.isText(node)) {
                return dloc_1.DLoc.mustMakeDLoc(this.tree, guiNode, offset);
            }
            if (domutil_1.isAttr(node)) {
                // The check for the node type is to avoid getting a location inside a
                // placeholder.
                if (domtypeguards_1.isText(guiNode.firstChild)) {
                    guiNode = guiNode.firstChild;
                }
                return dloc_1.DLoc.mustMakeDLoc(this.tree, guiNode, offset);
            }
            if (offset === 0) {
                return dloc_1.DLoc.mustMakeDLoc(this.tree, guiNode, 0);
            }
            if (offset >= node.childNodes.length) {
                return dloc_1.DLoc.mustMakeDLoc(this.tree, guiNode, guiNode.childNodes.length);
            }
            var guiChild = this.pathToNode(this.treeUpdater.nodeToPath(node.childNodes[offset]));
            if (guiChild === null) {
                // This happens if for instance node has X children but the
                // corresponding node in tree has X-1 children.
                return dloc_1.DLoc.mustMakeDLoc(this.tree, guiNode, guiNode.childNodes.length);
            }
            return dloc_1.DLoc.mustMakeDLoc(this.tree, guiChild);
        };
        return GUIUpdater;
    }(tree_updater_1.TreeUpdater));
    exports.GUIUpdater = GUIUpdater;
});
//  LocalWords:  domutil jquery pathToNode nodeToPath jQuery deleteNode Dubeau
//  LocalWords:  insertNodeAt MPL Mangalam gui setTextNodeValue TreeUpdater ev
//  LocalWords:  BeforeDeleteNode SetAttributeNS
//# sourceMappingURL=gui-updater.js.map