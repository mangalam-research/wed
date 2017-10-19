/**
 * Transformation framework.
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
define(["require", "exports", "module", "lodash", "./action", "./domtypeguards", "./domutil", "./gui/icon"], function (require, exports, module, _, action_1, domtypeguards_1, domutil_1, icon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TYPE_TO_KIND = _.extend(Object.create(null), {
        // These are not actually type names. It is possible to use a kind name as a
        // type name if the transformation is not more specific. In this case the kind
        // === type.
        add: "add",
        delete: "delete",
        transform: "transform",
        insert: "add",
        "delete-element": "delete",
        "delete-parent": "delete",
        wrap: "wrap",
        "wrap-content": "wrap",
        "merge-with-next": "transform",
        "merge-with-previous": "transform",
        "swap-with-next": "transform",
        "swap-with-previous": "transform",
        split: "transform",
        append: "add",
        prepend: "add",
        unwrap: "unwrap",
        "add-attribute": "add",
        "delete-attribute": "delete",
    });
    var TYPE_TO_NODE_TYPE = _.extend(Object.create(null), {
        // These are not actually type names. These are here to handle the
        // case where the type is actually a kind name. Since they are not
        // more specific, the node type is set to "other". Note that
        // "wrap" and "unwrap" are always about elements so there is no
        // way to have a "wrap/unwrap" which has "other" for the node
        // type.
        add: "other",
        delete: "other",
        transform: "other",
        insert: "element",
        "delete-element": "element",
        "delete-parent": "element",
        wrap: "element",
        "wrap-content": "element",
        "merge-with-next": "element",
        "merge-with-previous": "element",
        "swap-with-next": "element",
        "swap-with-previous": "element",
        split: "element",
        append: "element",
        prepend: "element",
        unwrap: "element",
        "add-attribute": "attribute",
        "delete-attribute": "attribute",
    });
    function computeIconHtml(iconHtml, transformationType) {
        if (iconHtml !== undefined) {
            return iconHtml;
        }
        var kind = TYPE_TO_KIND[transformationType];
        if (kind !== undefined) {
            return icon.makeHTML(kind);
        }
        return undefined;
    }
    /**
     * An operation that transforms the data tree.
     */
    var Transformation = /** @class */ (function (_super) {
        __extends(Transformation, _super);
        function Transformation(editor, transformationType, desc, abbreviatedDesc, iconHtml, needsInput, handler) {
            var _this = this;
            if (typeof abbreviatedDesc === "function") {
                handler = abbreviatedDesc;
                _this = _super.call(this, editor, desc, undefined, computeIconHtml(undefined, transformationType), false) || this;
            }
            else if (typeof iconHtml === "function") {
                handler = iconHtml;
                _this = _super.call(this, editor, desc, abbreviatedDesc, computeIconHtml(undefined, transformationType), false) || this;
            }
            else if (typeof needsInput === "function") {
                handler = needsInput;
                _this = _super.call(this, editor, desc, abbreviatedDesc, computeIconHtml(iconHtml, transformationType), false) || this;
            }
            else {
                _this = _super.call(this, editor, desc, abbreviatedDesc, computeIconHtml(iconHtml, transformationType), needsInput) || this;
            }
            if (handler === undefined) {
                throw new Error("did not specify a handler");
            }
            _this.handler = handler;
            _this.transformationType = transformationType;
            _this.kind = TYPE_TO_KIND[transformationType];
            _this.nodeType = TYPE_TO_NODE_TYPE[transformationType];
            return _this;
        }
        Transformation.prototype.getDescriptionFor = function (data) {
            if (data.name === undefined) {
                return this.desc;
            }
            return this.desc.replace(/<name>/, data.name);
        };
        /**
         * Calls the ``fireTransformation`` method on this transformation's editor.
         *
         * @param data The data object to pass.
         */
        Transformation.prototype.execute = function (data) {
            // Removed this during conversion to TypeScript. Did it ever make sense??
            // data = data || {};
            this.editor.fireTransformation(this, data);
        };
        return Transformation;
    }(action_1.Action));
    exports.Transformation = Transformation;
    /**
     * Makes an element appropriate for a wed data tree.
     *
     * @param doc The document for which to make the element.
     *
     * @param ns The URI of the namespace to use for the new element.
     *
     * @param name The name of the new element.
     *
     * @param attrs An object whose fields will become attributes for the new
     * element.
     *
     * @returns The new element.
     */
    function makeElement(doc, ns, name, attrs) {
        var e = doc.createElementNS(ns, name);
        if (attrs !== undefined) {
            // Create attributes
            var keys = Object.keys(attrs).sort();
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                e.setAttribute(key, attrs[key]);
            }
        }
        return e;
    }
    exports.makeElement = makeElement;
    /**
     * Insert an element in a wed data tree.
     *
     * @param dataUpdater A tree updater through which to update the DOM tree.
     *
     * @param parent The parent of the new node.
     *
     * @param index Offset in the parent where to insert the new node.
     *
     * @param ns The URI of the namespace to use for the new element.
     *
     * @param name The name of the new element.
     *
     * @param attrs An object whose fields will become attributes for the new
     * element.
     *
     * @returns The new element.
     */
    function insertElement(dataUpdater, parent, index, ns, name, attrs) {
        var ownerDocument = domtypeguards_1.isDocument(parent) ? parent : parent.ownerDocument;
        var el = makeElement(ownerDocument, ns, name, attrs);
        dataUpdater.insertAt(parent, index, el);
        return el;
    }
    exports.insertElement = insertElement;
    /**
     * Wraps a span of text in a new element.
     *
     * @param dataUpdater A tree updater through which to update the DOM tree.
     *
     * @param node The DOM node where to wrap. Must be a text node.
     *
     * @param offset The offset in the node. This parameter specifies where to start
     * wrapping.
     *
     * @param endOffset Offset in the node. This parameter specifies where to end
     * wrapping.
     *
     * @param ns The URI of the namespace to use for the new element.
     *
     * @param name The name of the wrapping element.
     *
     * @param attrs An object whose fields will become attributes for the new
     * element.
     *
     * @returns The new element.
     */
    function wrapTextInElement(dataUpdater, node, offset, endOffset, ns, name, attrs) {
        var textToWrap = node.data.slice(offset, endOffset);
        var parent = node.parentNode;
        if (parent === null) {
            throw new Error("detached node");
        }
        var nodeOffset = domutil_1.indexOf(parent.childNodes, node);
        dataUpdater.deleteText(node, offset, textToWrap.length);
        var newElement = makeElement(node.ownerDocument, ns, name, attrs);
        if (textToWrap !== "") {
            // It is okay to manipulate the DOM directly as long as the DOM tree being
            // manipulated is not *yet* inserted into the data tree. That is the case
            // here.
            newElement.appendChild(node.ownerDocument.createTextNode(textToWrap));
        }
        if (node.parentNode === null) {
            // The entire node was removed.
            dataUpdater.insertAt(parent, nodeOffset, newElement);
        }
        else {
            dataUpdater.insertAt(node, offset, newElement);
        }
        return newElement;
    }
    exports.wrapTextInElement = wrapTextInElement;
    /**
     * Utility function for [[wrapInElement]].
     *
     * @param dataUpdater A tree updater through which to update the DOM tree.
     *
     * @param container The text node to split.
     *
     * @param offset Where to split the node
     *
     * @returns A caret location marking where the split occurred.
     */
    function _wie_splitTextNode(dataUpdater, container, offset) {
        var parent = container.parentNode;
        if (parent === null) {
            throw new Error("detached node");
        }
        var containerOffset = domutil_1.indexOf(parent.childNodes, container);
        // The first two cases here just return a caret outside of the text node
        // rather than make a split that will create a useless empty text node.
        if (offset === 0) {
            offset = containerOffset;
        }
        else if (offset >= container.length) {
            offset = containerOffset + 1;
        }
        else {
            var text = container.data.slice(offset);
            dataUpdater.setTextNode(container, container.data.slice(0, offset));
            dataUpdater.insertNodeAt(parent, containerOffset + 1, container.ownerDocument.createTextNode(text));
            offset = containerOffset + 1;
        }
        return [parent, offset];
    }
    /**
     * Wraps a well-formed span in a new element. This span can contain text and
     * element nodes.
     *
     * @param dataUpdater A tree updater through which to update the DOM tree.
     *
     * @param startContainer The node where to start wrapping.
     *
     * @param startOffset The offset where to start wrapping.
     *
     * @param endContainer The node where to end wrapping.
     *
     * @param endOffset The offset where to end wrapping.
     *
     * @param ns The URI of the namespace to use for the new element.
     *
     * @param name The name of the new element.
     *
     * @param [attrs] An object whose fields will become attributes for the new
     * element.
     *
     * @returns The new element.
     *
     * @throws {Error} If the range is malformed or if there is an internal error.
     */
    function wrapInElement(dataUpdater, startContainer, startOffset, endContainer, endOffset, ns, name, attrs) {
        if (!domutil_1.isWellFormedRange({ startContainer: startContainer, startOffset: startOffset, endContainer: endContainer,
            endOffset: endOffset })) {
            throw new Error("malformed range");
        }
        if (domtypeguards_1.isText(startContainer)) {
            // We already have an algorithm for this case.
            if (startContainer === endContainer) {
                return wrapTextInElement(dataUpdater, startContainer, startOffset, endOffset, ns, name, attrs);
            }
            _a = _wie_splitTextNode(dataUpdater, startContainer, startOffset), startContainer = _a[0], startOffset = _a[1];
        }
        if (domtypeguards_1.isText(endContainer)) {
            _b = _wie_splitTextNode(dataUpdater, endContainer, endOffset), endContainer = _b[0], endOffset = _b[1];
        }
        if (startContainer !== endContainer) {
            throw new Error("startContainer and endContainer are not the same;" +
                "probably due to an algorithmic mistake");
        }
        var newElement = makeElement(startContainer.ownerDocument, ns, name, attrs);
        while (--endOffset >= startOffset) {
            var endNode = endContainer.childNodes[endOffset];
            dataUpdater.deleteNode(endNode);
            // Okay to change a tree which is not yet connected to the data tree.
            newElement.insertBefore(endNode, newElement.firstChild);
        }
        dataUpdater.insertAt(startContainer, startOffset, newElement);
        return newElement;
        var _a, _b;
    }
    exports.wrapInElement = wrapInElement;
    /**
     * Replaces an element with its contents.
     *
     * @param dataUpdater A tree updater through which to update the DOM tree.
     *
     * @param node The element to unwrap.
     *
     * @returns The contents of the element.
     */
    function unwrap(dataUpdater, node) {
        var parent = node.parentNode;
        if (parent === null) {
            throw new Error("detached node");
        }
        var children = Array.prototype.slice.call(node.childNodes);
        var prev = node.previousSibling;
        var next = node.nextSibling;
        // This does not merge text nodes, which is what we want. We also want to
        // remove it first so that we don't generate so many update events.
        dataUpdater.deleteNode(node);
        // We want to calculate this index *after* removal.
        var nextIx = (next !== null) ? domutil_1.indexOf(parent.childNodes, next) :
            parent.childNodes.length;
        var lastChild = node.lastChild;
        // This also does not merge text nodes.
        while (node.firstChild != null) {
            dataUpdater.insertNodeAt(parent, nextIx++, node.firstChild);
        }
        // The order of the next two calls is important. We start at the end because
        // going the other way around could cause lastChild to leave the DOM tree.
        // Merge possible adjacent text nodes: the last child of the node that was
        // removed in the unwrapping and the node that was after the node that was
        // removed in the unwrapping.
        if (lastChild !== null) {
            dataUpdater.mergeTextNodes(lastChild);
        }
        // Merge the possible adjacent text nodes: the one before the start of the
        // children we unwrapped and the first child that was unwrapped. There may not
        // be a prev so we use the NF form of the call.
        dataUpdater.mergeTextNodesNF(prev);
        return children;
    }
    exports.unwrap = unwrap;
    /**
     * This function splits a node at the position of the caret. If the caret is not
     * inside the node or its descendants, an exception is raised.
     *
     * @param editor The editor on which we are to perform the transformation.
     *
     * @param node The node to split.
     *
     * @throws {Error} If the caret is not inside the node or its descendants.
     */
    function splitNode(editor, node) {
        var caret = editor.caretManager.getDataCaret();
        if (caret === undefined) {
            throw new Error("no caret");
        }
        if (!node.contains(caret.node)) {
            throw new Error("caret outside node");
        }
        var pair = editor.dataUpdater.splitAt(node, caret);
        // Find the deepest location at the start of the 2nd element.
        editor.caretManager.setCaret(domutil_1.firstDescendantOrSelf(pair[1]), 0);
    }
    exports.splitNode = splitNode;
    /**
     * This function merges an element with a previous element of the same name. For
     * the operation to go forward, the element must have a previous sibling and
     * this sibling must have the same name as the element being merged.
     *
     * @param editor The editor on which we are to perform the transformation.
     *
     * @param node The element to merge with previous.
     */
    function mergeWithPreviousHomogeneousSibling(editor, node) {
        var prev = node.previousElementSibling;
        if (prev === null) {
            return;
        }
        if (prev.localName !== node.localName ||
            prev.namespaceURI !== node.namespaceURI) {
            return;
        }
        // We need to record these to set the caret to a good position.
        var caretPos = prev.childNodes.length;
        var lastChild = prev.lastChild;
        var wasText = domtypeguards_1.isText(lastChild);
        // We need to record this *now* for future use, because it is possible that
        // the next loop could modify lastChild in place.
        var textLen = wasText ? lastChild.length : 0;
        var insertionPoint = prev.childNodes.length;
        // Reverse order
        for (var i = node.childNodes.length - 1; i >= 0; --i) {
            editor.dataUpdater.insertAt(prev, insertionPoint, node.childNodes[i].cloneNode(true));
        }
        if (wasText) {
            // If wasText is true, lastChild cannot be null.
            editor.dataUpdater.mergeTextNodes(lastChild);
            editor.caretManager.setCaret(prev.childNodes[caretPos - 1], textLen);
        }
        else {
            editor.caretManager.setCaret(prev, caretPos);
        }
        editor.dataUpdater.removeNode(node);
    }
    exports.mergeWithPreviousHomogeneousSibling = mergeWithPreviousHomogeneousSibling;
    /**
     * This function merges an element with a next element of the same name. For the
     * operation to go forward, the element must have a next sibling and this
     * sibling must have the same name as the element being merged.
     *
     * @param editor The editor on which we are to perform the transformation.
     *
     * @param node The element to merge with next.
     */
    function mergeWithNextHomogeneousSibling(editor, node) {
        var next = node.nextElementSibling;
        if (next === null) {
            return;
        }
        mergeWithPreviousHomogeneousSibling(editor, next);
    }
    exports.mergeWithNextHomogeneousSibling = mergeWithNextHomogeneousSibling;
    /**
     * This function swaps an element with a previous element of the same name. For
     * the operation to go forward, the element must have a previous sibling and
     * this sibling must have the same name as the element being merged.
     *
     * @param editor The editor on which we are to perform the transformation.
     *
     * @param node The element to swap with previous.
     */
    function swapWithPreviousHomogeneousSibling(editor, node) {
        var prev = node.previousElementSibling;
        if (prev === null) {
            return;
        }
        if (prev.localName !== node.localName ||
            prev.namespaceURI !== node.namespaceURI) {
            return;
        }
        var parent = prev.parentNode;
        if (parent === null) {
            throw new Error("detached node");
        }
        editor.dataUpdater.removeNode(node);
        editor.dataUpdater.insertBefore(parent, node, prev);
        editor.caretManager.setCaret(node);
    }
    exports.swapWithPreviousHomogeneousSibling = swapWithPreviousHomogeneousSibling;
    /**
     * This function swaps an element with a next element of the same name. For the
     * operation to go forward, the element must have a next sibling and this
     * sibling must have the same name as the element being merged.
     *
     * @param editor The editor on which we are to perform the transformation.
     *
     * @param node The element to swap with next.
     */
    function swapWithNextHomogeneousSibling(editor, node) {
        var next = node.nextElementSibling;
        if (next === null) {
            return;
        }
        swapWithPreviousHomogeneousSibling(editor, next);
    }
    exports.swapWithNextHomogeneousSibling = swapWithNextHomogeneousSibling;
});
//  LocalWords:  wasText endOffset prepend endContainer startOffset html DOM
//  LocalWords:  startContainer Mangalam Dubeau previousSibling nextSibling MPL
//  LocalWords:  insertNodeAt deleteNode mergeTextNodes lastChild prev Prepend
//  LocalWords:  deleteText domutil

//# sourceMappingURL=transformation.js.map
