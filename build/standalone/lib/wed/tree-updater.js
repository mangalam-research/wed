/**
 * Facility for updating a DOM tree and issue synchronous events on changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "rxjs", "./dloc", "./domtypeguards", "./domutil"], function (require, exports, rxjs_1, dloc_1, domtypeguards_1, domutil) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    domutil = __importStar(domutil);
    var indexOf = domutil.indexOf;
    /**
     * A TreeUpdater is meant to serve as the sole point of modification for a DOM
     * tree. As methods are invoked on the TreeUpdater to modify the tree, events
     * are issued synchronously, which allows a listener to know what is happening
     * on the tree.
     *
     * Methods are divided into primitive and complex methods. Primitive methods
     * perform one and only one modification and issue an event of the same name as
     * their own name. Complex methods use primitive methods to perform a series of
     * modifications on the tree. Or they delegate the actual modification work to
     * the primitive methods. They may emit one or more events of a name different
     * from their own name. Events are emitted **after** their corresponding
     * operation is performed on the tree.
     *
     * For primitive methods, the list of events which they are documented to be
     * firing is exhaustive. For complex methods, the list is not exhaustive.
     *
     * Many events have a name identical to a corresponding method. Such events are
     * accompanied by event objects which have the same properties as the parameters
     * of the corresponding method, with the same meaning. Therefore, their
     * properties are not further documented.
     *
     * There is a generic [[ChangedEvent]] that is emitted with every other
     * event. This event does not carry information about what changed exactly.
     *
     * The [[TreeUpdater.deleteNode]] operation is the one major exception to the
     * basic rules given above:
     *
     * - [[BeforeDeleteNodeEvent]] is emitted **before** the deletion is
     * performed. This allows performing operations based on the node's location
     * before it is removed. For instance, calling the DOM method ``matches`` on a
     * node that has been removed from its DOM tree is generally going to fail to
     * perform the intended check.
     *
     * - [[DeleteNodeEvent]] has the additional ``formerParent`` property.
     *
     */
    var TreeUpdater = /** @class */ (function () {
        /**
         * @param tree The node which contains the tree to update.
         */
        function TreeUpdater(tree) {
            this.tree = tree;
            var root = dloc_1.findRoot(tree);
            if (root === undefined) {
                throw new Error("the tree must have a DLocRoot");
            }
            this.dlocRoot = root;
            this._events = new rxjs_1.Subject();
            this.events = this._events.asObservable();
        }
        TreeUpdater.prototype._emit = function (event) {
            this._events.next(event);
            this._events.next({ name: "Changed" });
        };
        TreeUpdater.prototype.insertAt = function (loc, offset, what) {
            var parent;
            var index;
            if (loc instanceof dloc_1.DLoc) {
                parent = loc.node;
                index = loc.offset;
                if (typeof offset === "number") {
                    throw new Error("incorrect call on insertAt: offset cannot be a number");
                }
                what = offset;
            }
            else {
                parent = loc;
                if (typeof offset !== "number") {
                    throw new Error("incorrect call on insertAt: offset must be a number");
                }
                index = offset;
            }
            if (what instanceof Array || what instanceof NodeList) {
                for (var i = 0; i < what.length; ++i, ++index) {
                    var item = what[i];
                    if (!(typeof item === "string" || domtypeguards_1.isElement(item) || domtypeguards_1.isText(item))) {
                        throw new Error("Array or NodeList element of the wrong type");
                    }
                    this.insertAt(parent, index, item);
                }
            }
            else if (typeof what === "string") {
                this.insertText(parent, index, what);
            }
            else if (domtypeguards_1.isText(what)) {
                switch (parent.nodeType) {
                    case Node.TEXT_NODE:
                        this.insertText(parent, index, what.data);
                        break;
                    case Node.ELEMENT_NODE:
                        this.insertNodeAt(parent, index, what);
                        break;
                    default:
                        throw new Error("unexpected node type: " + parent.nodeType);
                }
            }
            else if (domtypeguards_1.isElement(what)) {
                switch (parent.nodeType) {
                    case Node.TEXT_NODE:
                        this.insertIntoText(parent, index, what);
                        break;
                    case Node.DOCUMENT_NODE:
                    case Node.ELEMENT_NODE:
                        this.insertNodeAt(parent, index, what);
                        break;
                    default:
                        throw new Error("unexpected node type: " + parent.nodeType);
                }
            }
            else {
                throw new Error("unexpected value for what: " + what);
            }
        };
        TreeUpdater.prototype.splitAt = function (top, loc, index) {
            var node;
            if (loc instanceof dloc_1.DLoc) {
                node = loc.node;
                index = loc.offset;
            }
            else {
                node = loc;
            }
            if (index === undefined) {
                throw new Error("splitAt was called with undefined index");
            }
            if (node === top && node.nodeType === Node.TEXT_NODE) {
                throw new Error("splitAt called in a way that would result in " +
                    "two adjacent text nodes");
            }
            if (!top.contains(node)) {
                throw new Error("split location is not inside top");
            }
            var clonedTop = top.cloneNode(true);
            var clonedNode = domutil.correspondingNode(top, clonedTop, node);
            var pair = this._splitAt(clonedTop, clonedNode, index);
            var first = pair[0], second = pair[1];
            var parent = top.parentNode;
            if (parent === null) {
                throw new Error("called with detached top");
            }
            var at = indexOf(parent.childNodes, top);
            this.deleteNode(top);
            if (first !== null) {
                this.insertNodeAt(parent, at, first);
            }
            if (second !== null) {
                this.insertNodeAt(parent, at + 1, second);
            }
            return pair;
        };
        /**
         * Splits a DOM tree into two halves.
         *
         * @param top The node at which the splitting operation should end. This node
         * will be split but the function won't split anything above this node.
         *
         * @param node The node at which to start.
         *
         * @param index The index at which to start in the node.
         *
         * @returns An array containing in order the first and second half of the
         * split.
         */
        TreeUpdater.prototype._splitAt = function (top, node, index) {
            // We need to check this now because some operations below may remove node
            // from the DOM tree.
            var stop = (node === top);
            var parent = node.parentNode;
            var ret;
            if (domtypeguards_1.isText(node)) {
                if (index === 0) {
                    ret = [null, node];
                }
                else if (index === node.length) {
                    ret = [node, null];
                }
                else {
                    var textAfter = node.data.slice(index);
                    node.deleteData(index, node.length - index);
                    if (parent !== null) {
                        parent.insertBefore(parent.ownerDocument.createTextNode(textAfter), node.nextSibling);
                    }
                    ret = [node, node.nextSibling];
                }
            }
            else if (domtypeguards_1.isElement(node)) {
                if (index < 0) {
                    index = 0;
                }
                else if (index > node.childNodes.length) {
                    index = node.childNodes.length;
                }
                var clone = node.cloneNode(true);
                // Remove all nodes at index and after.
                while (node.childNodes[index] != null) {
                    node.removeChild(node.childNodes[index]);
                }
                // Remove all nodes before index
                while (index-- !== 0) {
                    clone.removeChild(clone.firstChild);
                }
                if (parent !== null) {
                    parent.insertBefore(clone, node.nextSibling);
                }
                ret = [node, clone];
            }
            else {
                throw new Error("unexpected node type: " + node.nodeType);
            }
            if (stop) { // We've just split the top, so end here...
                return ret;
            }
            if (parent === null) {
                throw new Error("unable to reach the top");
            }
            return this._splitAt(top, parent, indexOf(parent.childNodes, node) + 1);
        };
        /**
         * A complex method. Inserts the specified item before another one. Note that
         * the order of operands is the same as for the ``insertBefore`` DOM method.
         *
         * @param parent The node that contains the two other parameters.
         *
         * @param toInsert The node to insert.
         *
         * @param beforeThis The node in front of which to insert. A value of
         * ``null`` results in appending to the parent node.
         *
         * @throws {Error} If ``beforeThis`` is not a child of ``parent``.
         */
        TreeUpdater.prototype.insertBefore = function (parent, toInsert, beforeThis) {
            // Convert it to an insertAt operation.
            var index = beforeThis == null ? parent.childNodes.length :
                indexOf(parent.childNodes, beforeThis);
            if (index === -1) {
                throw new Error("insertBefore called with a beforeThis value " +
                    "which is not a child of parent");
            }
            this.insertAt(parent, index, toInsert);
        };
        TreeUpdater.prototype.insertText = function (loc, index, text, caretAtEnd) {
            if (text === void 0) { text = true; }
            if (caretAtEnd === void 0) { caretAtEnd = true; }
            var node;
            if (loc instanceof dloc_1.DLoc) {
                if (typeof index !== "string") {
                    throw new Error("text must be a string");
                }
                if (typeof text !== "boolean") {
                    throw new Error("caretAtEnd must be a boolean");
                }
                caretAtEnd = text;
                text = index;
                node = loc.node;
                index = loc.offset;
            }
            else {
                node = loc;
            }
            var result = domutil.genericInsertText.call(this, node, index, text, caretAtEnd);
            return __assign({}, result, { caret: dloc_1.DLoc.makeDLoc(this.dlocRoot, result.caret[0], result.caret[1]) });
        };
        TreeUpdater.prototype.deleteText = function (loc, index, length) {
            var node;
            if (loc instanceof dloc_1.DLoc) {
                length = index;
                node = loc.node;
                index = loc.offset;
            }
            else {
                node = loc;
                if (length === undefined) {
                    throw new Error("length cannot be undefined");
                }
            }
            if (!domtypeguards_1.isText(node)) {
                throw new Error("deleteText called on non-text");
            }
            this.setTextNode(node, node.data.slice(0, index) +
                node.data.slice(index + length));
        };
        TreeUpdater.prototype.insertIntoText = function (loc, index, node) {
            var parent;
            if (loc instanceof dloc_1.DLoc) {
                if (!domtypeguards_1.isNode(index)) {
                    throw new Error("must pass a node as the 2nd argument");
                }
                node = index;
                index = loc.offset;
                parent = loc.node;
            }
            else {
                parent = loc;
            }
            var ret = domutil.genericInsertIntoText.call(this, parent, index, node);
            return [dloc_1.DLoc.mustMakeDLoc(this.tree, ret[0]),
                dloc_1.DLoc.mustMakeDLoc(this.tree, ret[1])];
        };
        TreeUpdater.prototype.insertNodeAt = function (loc, index, node) {
            var parent;
            if (loc instanceof dloc_1.DLoc) {
                if (!domtypeguards_1.isNode(index)) {
                    throw new Error("the 2nd argument must be a Node");
                }
                node = index;
                index = loc.offset;
                parent = loc.node;
            }
            else {
                parent = loc;
                if (typeof index !== "number") {
                    throw new Error("index must be a number");
                }
            }
            if (node == null) {
                throw new Error("called insertNodeAt with absent node");
            }
            if (domtypeguards_1.isDocumentFragment(node)) {
                throw new Error("document fragments cannot be passed to insertNodeAt");
            }
            this._emit({ name: "BeforeInsertNodeAt", parent: parent, index: index, node: node });
            var child = parent.childNodes[index];
            parent.insertBefore(node, child != null ? child : null);
            this._emit({ name: "InsertNodeAt", parent: parent, index: index, node: node });
        };
        /**
         * A complex method. Sets a text node to a specified value.
         *
         * @param node The node to modify.
         *
         * @param value The new value of the node.
         *
         * @throws {Error} If called on a non-text Node type.
         */
        TreeUpdater.prototype.setTextNode = function (node, value) {
            if (!domtypeguards_1.isText(node)) {
                throw new Error("setTextNode called on non-text");
            }
            if (value !== "") {
                this.setTextNodeValue(node, value);
            }
            else {
                this.deleteNode(node);
            }
        };
        /**
         * A primitive method. Sets a text node to a specified value. This method must
         * not be called directly by code that performs changes of the DOM tree at a
         * high level, because it does not prevent a text node from becoming
         * empty. Call [[TreeUpdater.setTextNode]] instead. This method is meant to be
         * used by other complex methods of TreeUpdater and by some low-level
         * facilities of wed.
         *
         * @param node The node to modify. Must be a text node.
         *
         * @param value The new value of the node.
         *
         * @emits SetTextNodeValueEvent
         * @emits ChangedEvent
         * @throws {Error} If called on a non-text Node type.
         */
        TreeUpdater.prototype.setTextNodeValue = function (node, value) {
            if (!domtypeguards_1.isText(node)) {
                throw new Error("setTextNodeValue called on non-text");
            }
            var oldValue = node.data;
            node.data = value;
            this._emit({ name: "SetTextNodeValue", node: node, value: value, oldValue: oldValue });
        };
        /**
         * A complex method. Removes a node from the DOM tree. If two text nodes
         * become adjacent, they are merged.
         *
         * @param node The node to remove. This method will fail with an exception if
         * this parameter is ``undefined`` or ``null``. Use [[removeNodeNF]] if you
         * want a method that will silently do nothing if ``undefined`` or ``null``
         * are expected values.
         *
         * @returns A location between the two parts that were merged, or between the
         * two nodes that were not merged (because they were not both text).
         */
        TreeUpdater.prototype.removeNode = function (node) {
            if (node == null) {
                throw new Error("called without a node value");
            }
            var prev = node.previousSibling;
            var parent = node.parentNode;
            if (parent === null) {
                throw new Error("called with detached node");
            }
            var ix = indexOf(parent.childNodes, node);
            this.deleteNode(node);
            if (prev === null) {
                return dloc_1.DLoc.mustMakeDLoc(this.tree, parent, ix);
            }
            return this.mergeTextNodes(prev);
        };
        /**
         * A complex method. Removes a node from the DOM tree. If two text nodes
         * become adjacent, they are merged.
         *
         * @param node The node to remove. This method will do nothing if the node to
         * remove is ``undefined`` or ``null``.
         *
         * @returns A location between the two parts that were merged, or between the
         * two nodes that were not merged (because they were not both text). This will
         * be ``undefined`` if there was no node to remove.
         */
        TreeUpdater.prototype.removeNodeNF = function (node) {
            if (node == null) {
                return undefined;
            }
            return this.removeNode(node);
        };
        /**
         * A complex method. Removes a list of nodes from the DOM tree. If two text
         * nodes become adjacent, they are merged.
         *
         * @param nodes These nodes must be immediately contiguous siblings in
         * document order.
         *
         * @returns The location between the two parts that were merged, or between
         * the two nodes that were not merged (because they were not both
         * text). Undefined if the list of nodes is empty.
         *
         * @throws {Error} If nodes are not contiguous siblings.
         */
        TreeUpdater.prototype.removeNodes = function (nodes) {
            if (nodes.length === 0) {
                return undefined;
            }
            var prev = nodes[0].previousSibling;
            var parent = nodes[0].parentNode;
            if (parent === null) {
                throw new Error("called with detached node");
            }
            var ix = indexOf(parent.childNodes, nodes[0]);
            for (var i = 0; i < nodes.length; ++i) {
                if (i < nodes.length - 1 && nodes[i].nextSibling !== nodes[i + 1]) {
                    throw new Error("nodes are not immediately contiguous in " +
                        "document order");
                }
                this.deleteNode(nodes[i]);
            }
            if (prev === null) {
                return dloc_1.DLoc.makeDLoc(this.tree, parent, ix);
            }
            return this.mergeTextNodes(prev);
        };
        /**
         * A complex method. Removes the contents between the start and end carets
         * from the DOM tree. If two text nodes become adjacent, they are merged.
         *
         * @param start The start position.
         *
         * @param end The end position.
         *
         * @returns A pair of items. The first item is a ``DLoc`` object indicating
         * the position where the cut happened. The second item is a list of nodes,
         * the cut contents.
         *
         * @throws {Error} If Nodes in the range are not in the same element.
         */
        TreeUpdater.prototype.cut = function (start, end) {
            var ret = domutil.genericCutFunction.call(this, start.toArray(), end.toArray());
            ret[0] = start.make(ret[0]);
            return ret;
        };
        /**
         * A complex method. If the node is a text node and followed by a text node,
         * this method will combine them.
         *
         * @param node The node to check. This method will fail with an exception if
         * this parameter is ``undefined`` or ``null``. Use [[mergeTextNodesNF]] if
         * you want a method that will silently do nothing if ``undefined`` or
         * ``null`` are expected values.
         *
         * @returns A position between the two parts that were merged, or between the
         * two nodes that were not merged (because they were not both text).
         */
        TreeUpdater.prototype.mergeTextNodes = function (node) {
            var next = node.nextSibling;
            if (domtypeguards_1.isText(node) && next !== null && domtypeguards_1.isText(next)) {
                var offset = node.length;
                this.setTextNodeValue(node, node.data + next.data);
                this.deleteNode(next);
                return dloc_1.DLoc.mustMakeDLoc(this.tree, node, offset);
            }
            var parent = node.parentNode;
            if (parent === null) {
                throw new Error("called with detached node");
            }
            return dloc_1.DLoc.mustMakeDLoc(this.tree, parent, indexOf(parent.childNodes, node) + 1);
        };
        /**
         * A complex method. If the node is a text node and followed by a text node,
         * this method will combine them.
         *
         * @param node The node to check. This method will do nothing if the node to
         * remove is ``undefined`` or ``null``.
         *
         * @returns A position between the two parts that were merged, or between the
         * two nodes that were not merged (because they were not both text). This will
         * be ``undefined`` if there was no node to remove.
         */
        TreeUpdater.prototype.mergeTextNodesNF = function (node) {
            if (node == null) {
                return undefined;
            }
            return this.mergeTextNodes(node);
        };
        /**
         * A primitive method. Removes a node from the DOM tree. This method must not
         * be called directly by code that performs changes of the DOM tree at a high
         * level, because it does not prevent two text nodes from being contiguous
         * after deletion of the node. Call [[removeNode]] instead. This method is
         * meant to be used by other complex methods of TreeUpdater and by some
         * low-level facilities of wed.
         *
         * @param node The node to remove
         *
         * @emits DeleteNodeEvent
         * @emits BeforeDeleteNodeEvent
         * @emits ChangedEvent
         */
        TreeUpdater.prototype.deleteNode = function (node) {
            this._emit({ name: "BeforeDeleteNode", node: node });
            // The following is functionally equivalent to $(node).detach(), which is
            // what we want.
            var parent = node.parentNode;
            if (parent === null) {
                throw new Error("called with detached node");
            }
            parent.removeChild(node);
            this._emit({ name: "DeleteNode", node: node, formerParent: parent });
        };
        /**
         * A complex method. Sets an attribute to a value. Setting to the value
         * ``null`` or ``undefined`` deletes the attribute. This method sets
         * attributes outside of any namespace.
         *
         * @param node The node to modify.
         *
         * @param attribute The name of the attribute to modify.
         *
         * @param value The value to give to the attribute.
         *
         * @emits SetAttributeNSEvent
         * @emits ChangedEvent
         */
        TreeUpdater.prototype.setAttribute = function (node, attribute, value) {
            this.setAttributeNS(node, "", attribute, value);
        };
        /**
         * A primitive method. Sets an attribute to a value. Setting to the value
         * ``null`` or ``undefined`` deletes the attribute.
         *
         * @param node The node to modify.
         *
         * @param ns The URI of the namespace of the attribute.
         *
         * @param attribute The name of the attribute to modify.
         *
         * @param value The value to give to the attribute.
         *
         * @emits SetAttributeNSEvent
         * @emits ChangedEvent
         */
        TreeUpdater.prototype.setAttributeNS = function (node, ns, attribute, value) {
            // Normalize to null.
            if (value === undefined) {
                value = null;
            }
            if (!domtypeguards_1.isElement(node)) {
                throw new Error("setAttribute called on non-element");
            }
            var oldValue = node.getAttributeNS(ns, attribute);
            // Chrome 32 returns an empty string if the attribute is not present, so
            // normalize.
            if (oldValue === "" && !node.hasAttributeNS(ns, attribute)) {
                oldValue = null;
            }
            if (value != null) {
                node.setAttributeNS(ns, attribute, value);
            }
            else {
                node.removeAttributeNS(ns, attribute);
            }
            this._emit({ name: "SetAttributeNS", node: node, ns: ns, attribute: attribute, oldValue: oldValue,
                newValue: value });
        };
        /**
         * Converts a node to a path.
         *
         * @param node The node for which to return a path.
         *
         * @returns The path of the node relative to the root of the tree we are
         * updating.
         */
        TreeUpdater.prototype.nodeToPath = function (node) {
            return this.dlocRoot.nodeToPath(node);
        };
        /**
         * Converts a path to a node.
         *
         * @param path The path to convert.
         *
         * @returns The node corresponding to the path passed.
         */
        TreeUpdater.prototype.pathToNode = function (path) {
            return this.dlocRoot.pathToNode(path);
        };
        return TreeUpdater;
    }());
    exports.TreeUpdater = TreeUpdater;
});
//  LocalWords:  domutil splitAt insertAt insertText insertBefore deleteText cd
//  LocalWords:  removeNode setTextNodeValue param TreeUpdater insertNodeAt MPL
//  LocalWords:  abcd abfoocd setTextNode deleteNode pathToNode nodeToPath prev
//  LocalWords:  insertIntoText mergeTextNodes nextSibling previousSibling DOM
//  LocalWords:  Dubeau Mangalam BeforeInsertNodeAt BeforeDeleteNode DLocRoot
//  LocalWords:  SetAttributeNS NodeList nodeType beforeThis nd setAttribute
//  LocalWords:  caretAtEnd
//# sourceMappingURL=tree-updater.js.map