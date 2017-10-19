/**
 * Utilities that manipulate or query the DOM tree.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "jquery", "rangy", "./domtypeguards", "./util"], function (require, exports, module, $, rangy, domtypeguards_1, util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAttr = domtypeguards_1.isAttr;
    function indexOf(a, target) {
        var length = a.length;
        for (var i = 0; i < length; ++i) {
            if (a[i] === target) {
                return i;
            }
        }
        return -1;
    }
    exports.indexOf = indexOf;
    /**
     * Gets the first range in the selection.
     *
     * @param win The window for which we want the selection.
     *
     * @returns The first range in the selection. Undefined if there is no selection
     * or no range.
     */
    function getSelectionRange(win) {
        var sel = rangy.getSelection(win);
        if (sel === undefined || sel.rangeCount < 1) {
            return undefined;
        }
        return sel.getRangeAt(0);
    }
    exports.getSelectionRange = getSelectionRange;
    /**
     * Creates a range from two points in a document.
     *
     * @returns The range information.
     */
    function rangeFromPoints(startContainer, startOffset, endContainer, endOffset) {
        var range = rangy.createRange(startContainer.ownerDocument);
        var reversed = false;
        if (rangy.dom.comparePoints(startContainer, startOffset, endContainer, endOffset) <= 0) {
            range.setStart(startContainer, startOffset);
            range.setEnd(endContainer, endOffset);
        }
        else {
            range.setStart(endContainer, endOffset);
            range.setEnd(startContainer, startOffset);
            reversed = true;
        }
        return { range: range, reversed: reversed };
    }
    exports.rangeFromPoints = rangeFromPoints;
    /**
     * Focuses the node itself or if the node is a text node, focuses the parent.
     *
     * @param node The node to focus.
     *
     * @throws {Error} If the node is neither a text node nor an element. Trying to
     * focus something other than these is almost certainly an algorithmic bug.
     */
    function focusNode(node) {
        var nodeType = node != null ? node.nodeType : undefined;
        switch (nodeType) {
            case Node.TEXT_NODE:
                if (node.parentNode == null) {
                    throw new Error("detached node");
                }
                node.parentNode.focus();
                break;
            case Node.ELEMENT_NODE:
                node.focus();
                break;
            default:
                throw new Error("tried to focus something other than a text node or " +
                    "an element.");
        }
    }
    exports.focusNode = focusNode;
    /**
     * This function determines the caret position if the caret was moved forward.
     *
     * This function does not fully emulate how a browser moves the caret. The sole
     * emulation it performs is to check whether whitespace matters or not. It skips
     * whitespace that does not matter.
     *
     * @param caret A caret position where the search starts. This should be an
     * array of length two that has in first position the node where the caret is
     * and in second position the offset in that node. This pair is to be
     * interpreted in the same way node, offset pairs are interpreted in selection
     * or range objects.
     *
     * @param container A DOM node which indicates the container within which caret
     * movements must be contained.
     *
     * @param noText If true, and a text node would be returned, the function will
     * instead return the parent of the text node.
     *
     * @returns The next caret position, or ``null`` if such position does not
     * exist. The ``container`` parameter constrains movements to positions inside
     * it.
     */
    // tslint:disable-next-line:cyclomatic-complexity
    function nextCaretPosition(caret, container, noText) {
        var node = caret[0], offset = caret[1];
        var found = false;
        if (!container.contains(node)) {
            return null;
        }
        var doc = domtypeguards_1.isDocument(node) ? node : node.ownerDocument;
        var window = doc.defaultView;
        var parent;
        search_loop: while (!found) {
            parent = node.parentNode;
            switch (node.nodeType) {
                case Node.TEXT_NODE:
                    if (offset >= node.length ||
                        // If the parent node is set to normal whitespace handling, then
                        // moving the caret forward by one position will skip this whitespace.
                        (parent != null && parent.lastChild === node &&
                            window.getComputedStyle(parent, undefined).whiteSpace ===
                                "normal" && /^\s+$/.test(node.data.slice(offset)))) {
                        // We would move outside the container
                        if (parent == null || node === container) {
                            break search_loop;
                        }
                        offset = indexOf(parent.childNodes, node) + 1;
                        node = parent;
                    }
                    else {
                        offset++;
                        found = true;
                    }
                    break;
                case Node.ELEMENT_NODE:
                    if (offset >= node.childNodes.length) {
                        // If we've hit the end of what we can search, stop.
                        if (parent == null || node === container) {
                            break search_loop;
                        }
                        offset = indexOf(parent.childNodes, node) + 1;
                        node = parent;
                        found = true;
                    }
                    else {
                        node = node.childNodes[offset];
                        offset = 0;
                        found = !(node.childNodes.length > 0 &&
                            domtypeguards_1.isText(node.childNodes[offset]));
                    }
                    break;
                default:
                    break;
            }
        }
        if (!found) {
            return null;
        }
        if (noText && domtypeguards_1.isText(node)) {
            parent = node.parentNode;
            if (parent == null) {
                throw new Error("detached node");
            }
            offset = indexOf(parent.childNodes, node);
            node = parent;
        }
        // We've moved to a position outside the container.
        if (!container.contains(node) ||
            (node === container && offset >= node.childNodes.length)) {
            return null;
        }
        return [node, offset];
    }
    exports.nextCaretPosition = nextCaretPosition;
    /**
     * This function determines the caret position if the caret was moved backwards.
     *
     * This function does not fully emulate how a browser moves the caret. The sole
     * emulation it performs is to check whether whitespace matters or not. It skips
     * whitespace that does not matter.
     *
     * @param caret A caret position where the search starts. This should be an
     * array of length two that has in first position the node where the caret is
     * and in second position the offset in that node. This pair is to be
     * interpreted in the same way node, offset pairs are interpreted in selection
     * or range objects.
     *
     * @param container A DOM node which indicates the container within which caret
     * movements must be contained.
     *
     * @param noText If true, and a text node would be returned, the function will
     * instead return the parent of the text node.
     *
     * @returns The previous caret position, or ``null`` if such position does not
     * exist. The ``container`` parameter constrains movements to positions inside
     * it.
     */
    // tslint:disable-next-line:cyclomatic-complexity
    function prevCaretPosition(caret, container, noText) {
        var node = caret[0], offset = caret[1];
        var found = false;
        if (!container.contains(node)) {
            return null;
        }
        var doc = domtypeguards_1.isDocument(node) ? node : node.ownerDocument;
        var window = doc.defaultView;
        var parent;
        search_loop: while (!found) {
            offset--;
            // We've moved to a position outside the container.
            if (node === container && offset < 0) {
                return null;
            }
            parent = node.parentNode;
            switch (node.nodeType) {
                case Node.TEXT_NODE:
                    if (offset < 0 ||
                        // If the parent node is set to normal whitespace handling, then
                        // moving the caret back by one position will skip this whitespace.
                        (parent != null && parent.firstChild === node &&
                            window.getComputedStyle(parent, undefined).whiteSpace ===
                                "normal" && /^\s+$/.test(node.data.slice(0, offset)))) {
                        // We would move outside the container
                        if (parent === null || node === container) {
                            break search_loop;
                        }
                        offset = indexOf(parent.childNodes, node);
                        node = parent;
                    }
                    else {
                        found = true;
                    }
                    break;
                case Node.ELEMENT_NODE:
                    if (offset < 0 || node.childNodes.length === 0) {
                        // If we've hit the end of what we can search, stop.
                        if (parent == null || node === container) {
                            break search_loop;
                        }
                        offset = indexOf(parent.childNodes, node);
                        node = parent;
                        found = true;
                    }
                    else {
                        node = node.childNodes[offset];
                        if (domtypeguards_1.isElement(node)) {
                            offset = node.childNodes.length;
                            found = !(node.childNodes.length > 0 &&
                                domtypeguards_1.isText(node.childNodes[offset - 1]));
                        }
                        else {
                            offset = node.length + 1;
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        if (!found) {
            return null;
        }
        if (noText && domtypeguards_1.isText(node)) {
            parent = node.parentNode;
            if (parent == null) {
                throw new Error("detached node");
            }
            offset = indexOf(parent.childNodes, node);
            node = parent;
        }
        // We've moved to a position outside the container.
        if (!container.contains(node) || (node === container && offset < 0)) {
            return null;
        }
        return [node, offset];
    }
    exports.prevCaretPosition = prevCaretPosition;
    /**
     * Given two trees A and B of DOM nodes, this function finds the node in tree B
     * which corresponds to a node in tree A. The two trees must be structurally
     * identical. If tree B is cloned from tree A, it will satisfy this
     * requirement. This function does not work with attribute nodes.
     *
     * @param treeA The root of the first tree.
     *
     * @param treeB The root of the second tree.
     *
     * @param nodeInA A node in the first tree.
     *
     * @returns The node which corresponds to ``nodeInA`` in ``treeB``.
     *
     * @throws {Error} If ``nodeInA`` is not ``treeA`` or a child of ``treeA``.
     */
    function correspondingNode(treeA, treeB, nodeInA) {
        var path = [];
        var current = nodeInA;
        while (current !== treeA) {
            var parent_1 = current.parentNode;
            if (parent_1 == null) {
                throw new Error("nodeInA is not treeA or a child of treeA");
            }
            path.unshift(indexOf(parent_1.childNodes, current));
            current = parent_1;
        }
        var ret = treeB;
        while (path.length !== 0) {
            ret = ret.childNodes[path.shift()];
        }
        return ret;
    }
    exports.correspondingNode = correspondingNode;
    /**
     * Makes a placeholder element
     *
     * @param text The text to put in the placeholder.
     *
     * @returns A node.
     */
    function makePlaceholder(text) {
        var span = document.createElement("span");
        span.className = "_placeholder";
        span.setAttribute("contenteditable", "true");
        span.textContent = text !== undefined ? text : " ";
        return span;
    }
    exports.makePlaceholder = makePlaceholder;
    /**
     * Inserts an element into text, effectively splitting the text node in
     * two. This function takes care to modify the DOM tree only once.
     *
     * @private
     *
     * @param textNode The text node that will be cut in two by the new element.
     *
     * @param index The offset into the text node where the new element is to be
     * inserted.
     *
     * @param node The node to insert. If undefined, then this function effectively
     * splits the text node into two parts.
     *
     * @param The operation must clean contiguous text nodes so as to merge them and
     * must not create empty nodes. **This code assumes that the text node into
     * which data is added is not preceded or followed by another text node and that
     * it is not empty.** In other words, if the DOM tree on which this code is used
     * does not have consecutive text nodes and no empty nodes, then after the call,
     * it still won't.
     *
     * @returns A pair containing a caret position marking the boundary between what
     * comes before the material inserted and the material inserted, and a caret
     * position marking the boundary between the material inserted and what comes
     * after. If I insert "foo" at position 2 in "abcd", then the final result would
     * be "abfoocd" and the first caret would mark the boundary between "ab" and
     * "foo" and the second caret the boundary between "foo" and "cd".
     *
     * @throws {Error} If ``textNode`` is not a text node.
     */
    function _genericInsertIntoText(textNode, index, node, clean) {
        if (clean === void 0) { clean = true; }
        // This function is meant to be called with this set to a proper
        // value.
        /* jshint validthis:true */
        if (!domtypeguards_1.isText(textNode)) {
            throw new Error("insertIntoText called on non-text");
        }
        var startCaret;
        var endCaret;
        if (clean === undefined) {
            clean = true;
        }
        // Normalize
        if (index < 0) {
            index = 0;
        }
        else if (index > textNode.length) {
            index = textNode.length;
        }
        var prev;
        var next;
        var isFragment = domtypeguards_1.isDocumentFragment(node);
        // A parent is necessarily an element.
        var parent = textNode.parentNode;
        if (parent == null) {
            throw new Error("detached node");
        }
        var textNodeAt = indexOf(parent.childNodes, textNode);
        if (clean && (node == null || (isFragment && node.childNodes.length === 0))) {
            startCaret = endCaret = [textNode, index];
        }
        else {
            var frag = document.createDocumentFragment();
            prev = document.createTextNode(textNode.data.slice(0, index));
            frag.appendChild(prev);
            if (node != null) {
                frag.appendChild(node);
            }
            next = document.createTextNode(textNode.data.slice(index));
            var nextLen = next.length;
            frag.appendChild(next);
            if (clean) {
                frag.normalize();
            }
            if (clean && index === 0) {
                startCaret = [parent, textNodeAt];
            }
            else {
                startCaret = [frag.firstChild, index];
            }
            if (clean && index === textNode.length) {
                endCaret = [parent, textNodeAt + frag.childNodes.length];
            }
            else {
                endCaret = [frag.lastChild, frag.lastChild.length - nextLen];
            }
            // tslint:disable:no-invalid-this
            this.deleteNode(textNode);
            if (this.insertFragAt !== undefined) {
                this.insertFragAt(parent, textNodeAt, frag);
            }
            else {
                while (frag.firstChild != null) {
                    this.insertNodeAt(parent, textNodeAt++, frag.firstChild);
                }
            }
            // tslint:enable:no-invalid-this
        }
        return [startCaret, endCaret];
    }
    /**
     * Inserts an element into text, effectively splitting the text node in
     * two. This function takes care to modify the DOM tree only once.
     *
     * @param textNode The text node that will be cut in two by the new element.
     *
     * @param index The offset into the text node where the new element is to be
     * inserted.
     *
     * @param node The node to insert.
     *
     * @returns A pair containing a caret position marking the boundary between what
     * comes before the material inserted and the material inserted, and a caret
     * position marking the boundary between the material inserted and what comes
     * after. If I insert "foo" at position 2 in "abcd", then the final result would
     * be "abfoocd" and the first caret would mark the boundary between "ab" and
     * "foo" and the second caret the boundary between "foo" and "cd".
     *
     * @throws {Error} If the node to insert is undefined or null.
     */
    function genericInsertIntoText(textNode, index, node) {
        // This function is meant to be called with this set to a proper
        // value.
        if (node == null) {
            throw new Error("must pass an actual node to insert");
        }
        // tslint:disable-next-line:no-invalid-this
        return _genericInsertIntoText.call(this, textNode, index, node);
    }
    exports.genericInsertIntoText = genericInsertIntoText;
    /**
     * Inserts text into a node. This function will use already existing
     * text nodes whenever possible rather than create a new text node.
     *
     * @param node The node where the text is to be inserted.
     *
     * @param index The location in the node where the text is
     * to be inserted.
     *
     * @param text The text to insert.
     *
     * @param caretAtEnd Whether the caret position returned should be placed at the
     * end of the inserted text.
     *
     * @returns The result of inserting the text.
     *
     * @throws {Error} If ``node`` is not an element or text Node type.
     */
    function genericInsertText(node, index, text, caretAtEnd) {
        if (caretAtEnd === void 0) { caretAtEnd = true; }
        // This function is meant to be called with this set to a proper
        // value.
        if (text === "") {
            return {
                node: undefined,
                isNew: false,
                caret: [node, index],
            };
        }
        var isNew = false;
        var textNode;
        var caret;
        work: 
        // tslint:disable-next-line:no-constant-condition strict-boolean-expressions
        while (true) {
            switch (node.nodeType) {
                case Node.ELEMENT_NODE:
                    var child = node.childNodes[index];
                    if (domtypeguards_1.isText(child)) {
                        // Prepend to already existing text node.
                        node = child;
                        index = 0;
                        continue work;
                    }
                    var prev = node.childNodes[index - 1];
                    if (domtypeguards_1.isText(prev)) {
                        // Append to already existing text node.
                        node = prev;
                        index = prev.length;
                        continue work;
                    }
                    // We have to create a text node
                    textNode = document.createTextNode(text);
                    isNew = true;
                    // Node is necessarily an element when we get here.
                    // tslint:disable-next-line:no-invalid-this
                    this.insertNodeAt(node, index, textNode);
                    caret = [textNode, caretAtEnd ? text.length : 0];
                    break work;
                case Node.TEXT_NODE:
                    textNode = node;
                    var pre = textNode.data.slice(0, index);
                    var post = textNode.data.slice(index);
                    // tslint:disable-next-line:no-invalid-this
                    this.setTextNodeValue(textNode, pre + text + post);
                    caret = [textNode, caretAtEnd ? index + text.length : index];
                    break work;
                default:
                    throw new Error("unexpected node type: " + node.nodeType);
            }
        }
        return {
            node: textNode,
            isNew: isNew,
            caret: caret,
        };
    }
    exports.genericInsertText = genericInsertText;
    /**
     * Deletes text from a text node. If the text node becomes empty, it is deleted.
     *
     * @param node The text node from which to delete text.
     *
     * @param index The index at which to delete text.
     *
     * @param length The length of text to delete.
     *
     * @throws {Error} If ``node`` is not a text Node type.
     */
    function deleteText(node, index, length) {
        if (!domtypeguards_1.isText(node)) {
            throw new Error("deleteText called on non-text");
        }
        node.deleteData(index, length);
        if (node.length === 0) {
            if (node.parentNode == null) {
                throw new Error("detached node");
            }
            node.parentNode.removeChild(node);
        }
    }
    exports.deleteText = deleteText;
    /**
     * This function recursively links two DOM trees through the jQuery ``.data()``
     * method. For an element in the first tree the data item named
     * "wed_mirror_node" points to the corresponding element in the second tree, and
     * vice-versa. It is presumed that the two DOM trees are perfect mirrors of each
     * other, although no test is performed to confirm this.
     */
    function linkTrees(rootA, rootB) {
        $.data(rootA, "wed_mirror_node", rootB);
        $.data(rootB, "wed_mirror_node", rootA);
        for (var i = 0; i < rootA.children.length; ++i) {
            var childA = rootA.children[i];
            var childB = rootB.children[i];
            linkTrees(childA, childB);
        }
    }
    exports.linkTrees = linkTrees;
    /**
     * This function recursively unlinks a DOM tree though the jQuery ``.data()``
     * method.
     *
     * @param root A DOM node.
     *
     */
    function unlinkTree(root) {
        $.removeData(root, "wed_mirror_node");
        for (var i = 0; i < root.children.length; ++i) {
            unlinkTree(root.children[i]);
        }
    }
    exports.unlinkTree = unlinkTree;
    /**
     * Returns the first descendant or the node passed to the function if the node
     * happens to not have a descendant. The function searches in document order.
     *
     * When passed ``<p><b>A</b><b><q>B</q></b></p>`` this code would return the
     * text node "A" because it has no children and is first.
     *
     * @param node The node to search.
     *
     * @returns The first node which is both first in its parent and has no
     * children.
     */
    function firstDescendantOrSelf(node) {
        if (node === undefined) {
            node = null;
        }
        while (node !== null && node.firstChild !== null) {
            node = node.firstChild;
        }
        return node;
    }
    exports.firstDescendantOrSelf = firstDescendantOrSelf;
    /**
     * Returns the last descendant or the node passed to the function if the node
     * happens to not have a descendant. The function searches in reverse document
     * order.
     *
     * When passed ``<p><b>A</b><b><q>B</q></b></p>`` this code would return the
     * text node "B" because it has no children and is last.
     *
     * @param node The node to search.
     *
     * @returns The last node which is both last in its parent and has no
     * children.
     */
    function lastDescendantOrSelf(node) {
        if (node === undefined) {
            node = null;
        }
        while (node !== null && node.lastChild !== null) {
            node = node.lastChild;
        }
        return node;
    }
    exports.lastDescendantOrSelf = lastDescendantOrSelf;
    /**
     * Removes the node. Mainly for use with the generic functions defined here.
     *
     * @param node The node to remove.
     */
    function deleteNode(node) {
        if (node.parentNode == null) {
            // For historical reasons we raise an error rather than make it a noop.
            throw new Error("detached node");
        }
        node.parentNode.removeChild(node);
    }
    exports.deleteNode = deleteNode;
    /**
     * Inserts a node at the position specified. Mainly for use with the generic
     * functions defined here.
     *
     * @param parent The node which will become the parent of the inserted node.
     *
     * @param index The position at which to insert the node into the parent.
     *
     * @param node The node to insert.
     */
    function insertNodeAt(parent, index, node) {
        var child = parent.childNodes[index];
        parent.insertBefore(node, child != null ? child : null);
    }
    /**
     * Inserts text into a node. This function will use already existing text nodes
     * whenever possible rather than create a new text node.
     *
     * @function
     *
     * @param node The node where the text is to be inserted.
     *
     * @param index The location in the node where the text is to be inserted.
     *
     * @param text The text to insert.
     *
     * @param caretAtEnd Whether to return the caret position at the end of the
     * inserted text or at the beginning. Default to ``true``.
     *
     * @returns The result of inserting the text.
     *
     * @throws {Error} If ``node`` is not an element or text Node type.
     */
    function insertText(node, index, text, caretAtEnd) {
        return genericInsertText.call({
            insertNodeAt: insertNodeAt,
            setTextNodeValue: function (textNode, value) {
                textNode.data = value;
            },
        }, node, index, text, caretAtEnd);
    }
    exports.insertText = insertText;
    var plainDOMMockup = {
        insertNodeAt: insertNodeAt,
        insertFragAt: insertNodeAt,
        deleteNode: deleteNode,
    };
    /**
     * See [[_genericInsertIntoText]].
     *
     * @private
     */
    function _insertIntoText(textNode, index, node, clean) {
        if (clean === void 0) { clean = true; }
        return _genericInsertIntoText.call(plainDOMMockup, textNode, index, node, clean);
    }
    /**
     * Inserts an element into text, effectively splitting the text node in
     * two. This function takes care to modify the DOM tree only once.
     *
     * @param textNode The text node that will be cut in two by the new element.
     *
     * @param index The offset into the text node where the new element is to be
     * inserted.
     *
     * @param node The node to insert.
     *
     * @returns A pair containing a caret position marking the boundary between what
     * comes before the material inserted and the material inserted, and a caret
     * position marking the boundary between the material inserted and what comes
     * after. If I insert "foo" at position 2 in "abcd", then the final result would
     * be "abfoocd" and the first caret would mark the boundary between "ab" and
     * "foo" and the second caret the boundary between "foo" and "cd".
     */
    function insertIntoText(textNode, index, node) {
        return genericInsertIntoText.call(plainDOMMockup, textNode, index, node);
    }
    exports.insertIntoText = insertIntoText;
    /**
     * Splits a text node into two nodes. This function takes care to modify the DOM
     * tree only once.
     *
     * @param textNode The text node to split into two text nodes.
     *
     * @param index The offset into the text node where to split.
     *
     * @returns The first element is the node before index after split and the
     * second element is the node after the index after split.
     */
    function splitTextNode(textNode, index) {
        var carets = _insertIntoText(textNode, index, undefined, false);
        return [carets[0][0], carets[1][0]];
    }
    exports.splitTextNode = splitTextNode;
    /**
     * Merges a text node with the next text node, if present. When called on
     * something which is not a text node or if the next node is not text, does
     * nothing. Mainly for use with the generic functions defined here.
     *
     * @param node The node to merge with the next node.
     *
     * @returns A caret position between the two parts that were merged, or between
     * the two nodes that were not merged (because they were not both text).
     */
    function mergeTextNodes(node) {
        var next = node.nextSibling;
        if (domtypeguards_1.isText(node) && domtypeguards_1.isText(next)) {
            var offset = node.length;
            node.appendData(next.data);
            next.parentNode.removeChild(next);
            return [node, offset];
        }
        var parent = node.parentNode;
        if (parent == null) {
            throw new Error("detached node");
        }
        return [parent, indexOf(parent.childNodes, node) + 1];
    }
    exports.mergeTextNodes = mergeTextNodes;
    /**
     * Returns the **element** nodes that contain the start and the end of the
     * range. If an end of the range happens to be in a text node, the element node
     * will be that node's parent.
     *
     * @private
     *
     * @param range An object which has the ``startContainer``, ``startOffset``,
     * ``endContainer``, ``endOffset`` attributes set. The interpretation of these
     * values is the same as for DOM ``Range`` objects. Therefore, the object passed
     * can be a DOM range.
     *
     * @returns A pair of nodes.
     *
     * @throws {Error} If a node in ``range`` is not of element or text Node types.
     */
    function nodePairFromRange(range) {
        var startNode;
        switch (range.startContainer.nodeType) {
            case Node.TEXT_NODE:
                startNode = range.startContainer.parentNode;
                if (startNode == null) {
                    throw new Error("detached node");
                }
                break;
            case Node.ELEMENT_NODE:
                startNode = range.startContainer;
                break;
            default:
                throw new Error("unexpected node type: " + range.startContainer.nodeType);
        }
        var endNode;
        switch (range.endContainer.nodeType) {
            case Node.TEXT_NODE:
                endNode = range.endContainer.parentNode;
                if (endNode == null) {
                    throw new Error("detached node");
                }
                break;
            case Node.ELEMENT_NODE:
                endNode = range.endContainer;
                break;
            default:
                throw new Error("unexpected node type: " + range.endContainer.nodeType);
        }
        return [startNode, endNode];
    }
    /**
     * Determines whether a range is well-formed. A well-formed range is one which
     * starts and ends in the same element.
     *
     * @param range An object which has the ``startContainer``,
     * ``startOffset``, ``endContainer``, ``endOffset`` attributes set. The
     * interpretation of these values is the same as for DOM ``Range``
     * objects. Therefore, the object passed can be a DOM range.
     *
     * @returns ``true`` if the range is well-formed.  ``false`` if not.
     */
    function isWellFormedRange(range) {
        var pair = nodePairFromRange(range);
        return pair[0] === pair[1];
    }
    exports.isWellFormedRange = isWellFormedRange;
    /**
     * Removes the contents between the start and end carets from the DOM tree. If
     * two text nodes become adjacent, they are merged.
     *
     * @param startCaret Start caret position.
     *
     * @param endCaret Ending caret position.
     *
     * @returns The first item is the caret position indicating where the cut
     * happened. The second item is a list of nodes, the cut contents.
     *
     * @throws {Error} If Nodes in the range are not in the same element.
     */
    // tslint:disable-next-line:max-func-body-length
    function genericCutFunction(startCaret, endCaret) {
        if (!isWellFormedRange({ startContainer: startCaret[0],
            startOffset: startCaret[1],
            endContainer: endCaret[0],
            endOffset: endCaret[1] })) {
            throw new Error("range is not well-formed");
        }
        var startContainer = startCaret[0], startOffset = startCaret[1];
        var endContainer = endCaret[0], endOffset = endCaret[1];
        var parent = startContainer.parentNode;
        if (parent == null) {
            throw new Error("detached node");
        }
        var finalCaret;
        var startText;
        if (domtypeguards_1.isText(startContainer) && startOffset === 0) {
            // We are at the start of a text node, move up to the parent.
            startOffset = indexOf(parent.childNodes, startContainer);
            startContainer = parent;
            parent = startContainer.parentNode;
            if (parent == null) {
                throw new Error("detached node");
            }
        }
        if (domtypeguards_1.isText(startContainer)) {
            var sameContainer = startContainer === endContainer;
            var startContainerOffset = indexOf(parent.childNodes, startContainer);
            var endTextOffset = sameContainer ? endOffset : startContainer.length;
            startText = parent.ownerDocument.createTextNode(startContainer.data.slice(startOffset, endTextOffset));
            // tslint:disable-next-line:no-invalid-this
            this.deleteText(startContainer, startOffset, startText.length);
            finalCaret = (startContainer.parentNode != null) ?
                [startContainer, startOffset] :
                // Selection was such that the text node was emptied.
                [parent, startContainerOffset];
            if (sameContainer) {
                // Both the start and end were in the same node, so the deleteText
                // operation above did everything needed.
                return [finalCaret, [startText]];
            }
            // Alter our start to take care of the rest
            startOffset = (startContainer.parentNode != null) ?
                // Look after the text node we just modified.
                startContainerOffset + 1 :
                // Selection was such that the text node was emptied, and thus removed. So
                // stay at the same place.
                startContainerOffset;
            startContainer = parent;
        }
        else {
            finalCaret = [startContainer, startOffset];
        }
        var endText;
        if (domtypeguards_1.isText(endContainer)) {
            parent = endContainer.parentNode;
            if (parent == null) {
                throw new Error("detached node");
            }
            var endContainerOffset = indexOf(parent.childNodes, endContainer);
            endText = parent.ownerDocument.createTextNode(endContainer.data.slice(0, endOffset));
            // tslint:disable-next-line:no-invalid-this
            this.deleteText(endContainer, 0, endOffset);
            // Alter our end to take care of the rest
            endOffset = endContainerOffset;
            endContainer = parent;
        }
        // At this point, the following checks must hold
        if (startContainer !== endContainer) {
            throw new Error("internal error in cut: containers unequal");
        }
        if (!domtypeguards_1.isElement(startContainer)) {
            throw new Error("internal error in cut: not an element");
        }
        var returnNodes = [];
        endOffset--;
        // Doing it in reverse allows us to not worry about offsets getting out of
        // whack.
        while (endOffset >= startOffset) {
            returnNodes.unshift(endContainer.childNodes[endOffset]);
            // tslint:disable-next-line:no-invalid-this
            this.deleteNode(endContainer.childNodes[endOffset]);
            endOffset--;
        }
        if (startText != null) {
            returnNodes.unshift(startText);
        }
        if (endText != null) {
            returnNodes.push(endText);
        }
        // At this point, endOffset points to the node that is before the list of
        // nodes removed.
        if (endContainer.childNodes[endOffset] != null) {
            // tslint:disable-next-line:no-invalid-this
            this.mergeTextNodes(endContainer.childNodes[endOffset]);
        }
        return [finalCaret, returnNodes];
    }
    exports.genericCutFunction = genericCutFunction;
    /**
     * Dumps a range to the console.
     *
     * @param msg A message to output in front of the range information.
     *
     * @param range The range.
     */
    function dumpRange(msg, range) {
        if (range == null) {
            // tslint:disable-next-line:no-console
            console.log(msg, "no range");
        }
        else {
            // tslint:disable-next-line:no-console
            console.log(msg, range.startContainer, range.startOffset, range.endContainer, range.endOffset);
        }
    }
    exports.dumpRange = dumpRange;
    /**
     * Dumps the current selection to the console.
     *
     * @param msg A message to output in front of the range information.
     *
     * @param win The window for which to dump selection information.
     */
    function dumpCurrentSelection(msg, win) {
        dumpRange(msg, getSelectionRange(win));
    }
    exports.dumpCurrentSelection = dumpCurrentSelection;
    /**
     * Dumps a range to a string.
     *
     * @param msg A message to output in front of the range information.
     *
     * @param range The range.
     */
    function dumpRangeToString(msg, range) {
        var ret;
        if (range == null) {
            ret = [msg, "no range"];
        }
        else {
            ret = [msg,
                range.startContainer.outerHTML,
                range.startOffset,
                range.endContainer.outerHTML,
                range.endOffset];
        }
        return ret.join(", ");
    }
    exports.dumpRangeToString = dumpRangeToString;
    /**
     * Checks whether a point is in the element's contents. This means inside the
     * element and **not** inside one of the scrollbars that the element may
     * have. The coordinates passed must be **relative to the document.** If the
     * coordinates are taken from an event, this means passing ``pageX`` and
     * ``pageY``.
     *
     * @param element The element to check.
     *
     * @param x The x coordinate **relative to the document.**
     *
     * @param y The y coordinate **relative to the document.**
     *
     * @returns ``true`` if inside, ``false`` if not.
     */
    function pointInContents(element, x, y) {
        // Convert the coordinates relative to the document to coordinates relative to
        // the element.
        var body = element.ownerDocument.body;
        // Using clientLeft and clientTop is not equivalent to using the rect.
        var rect = element.getBoundingClientRect();
        x -= rect.left + body.scrollLeft;
        y -= rect.top + body.scrollTop;
        return ((x >= 0) && (y >= 0) &&
            (x < element.clientWidth) && (y < element.clientHeight));
    }
    exports.pointInContents = pointInContents;
    /**
     * Starting with the node passed, and walking up the node's
     * parents, returns the first node that matches the selector.
     *
     * @param node The node to start with.
     *
     * @param selector The selector to use for matches.
     *
     * @param limit The algorithm will search up to this limit, inclusively.
     *
     * @returns The first element that matches the selector, or ``null`` if nothing
     * matches.
     */
    function closest(node, selector, limit) {
        if (node == null) {
            return null;
        }
        // Immediately move out of text nodes.
        if (domtypeguards_1.isText(node)) {
            node = node.parentNode;
        }
        while (node != null) {
            if (!domtypeguards_1.isElement(node)) {
                return null;
            }
            if (node.matches(selector)) {
                break;
            }
            if (node === limit) {
                node = null;
                break;
            }
            node = node.parentNode;
        }
        return node;
    }
    exports.closest = closest;
    /**
     * Starting with the node passed, and walking up the node's parents, returns the
     * first element that matches the class.
     *
     * @param node The node to start with.
     *
     * @param cl The class to use for matches.
     *
     * @param limit The algorithm will search up to this limit, inclusively.
     *
     * @returns The first element that matches the class, or ``null`` if nothing
     * matches.
     */
    function closestByClass(node, cl, limit) {
        if (node == null) {
            return null;
        }
        // Immediately move out of text nodes.
        if (domtypeguards_1.isText(node)) {
            node = node.parentNode;
        }
        while (node != null) {
            if (!domtypeguards_1.isElement(node)) {
                return null;
            }
            if (node.classList.contains(cl)) {
                break;
            }
            if (node === limit) {
                node = null;
                break;
            }
            node = node.parentNode;
        }
        return node;
    }
    exports.closestByClass = closestByClass;
    /**
     * Find a sibling matching the class.
     *
     * @param node The element whose sibling we are looking for.
     *
     * @param cl The class to use for matches.
     *
     * @returns The first sibling (in document order) that matches the class, or
     * ``null`` if nothing matches.
     */
    function siblingByClass(node, cl) {
        if (!domtypeguards_1.isElement(node)) {
            return null;
        }
        var parent = node.parentNode;
        if (parent == null) {
            return null;
        }
        var child = parent.firstElementChild;
        while (child != null && !child.classList.contains(cl)) {
            child = child.nextElementSibling;
        }
        return child;
    }
    exports.siblingByClass = siblingByClass;
    /**
     * Find children matching the class.
     *
     * @param node The element whose children we are looking for.
     *
     * @param cl The class to use for matches.
     *
     * @returns The children (in document order) that match the class.
     */
    function childrenByClass(node, cl) {
        if (!domtypeguards_1.isElement(node)) {
            return [];
        }
        var ret = [];
        var child = node.firstElementChild;
        while (child != null) {
            if (child.classList.contains(cl)) {
                ret.push(child);
            }
            child = child.nextElementSibling;
        }
        return ret;
    }
    exports.childrenByClass = childrenByClass;
    /**
     * Find child matching the class.
     *
     * @param node The element whose child we are looking for.
     *
     * @param cl The class to use for matches.
     *
     * @returns The first child (in document order) that matches the class, or
     * ``null`` if nothing matches.
     */
    function childByClass(node, cl) {
        if (!domtypeguards_1.isElement(node)) {
            return null;
        }
        var child = node.firstElementChild;
        while (child != null && !child.classList.contains(cl)) {
            child = child.nextElementSibling;
        }
        return child;
    }
    exports.childByClass = childByClass;
    var textToHTMLSpan;
    /**
     * Convert a string to HTML encoding. For instance if you want to have the
     * less-than symbol be part of the contents of a ``span`` element, it would have
     * to be escaped to ``<`` otherwise it would be interpreted as the beginning of
     * a tag. This function does this kind of escaping.
     *
     * @param text The text to convert.
     *
     * @returns The converted text.
     */
    function textToHTML(text) {
        if (textToHTMLSpan == null) {
            textToHTMLSpan = document.createElement("span");
        }
        textToHTMLSpan.textContent = text;
        return textToHTMLSpan.innerHTML;
    }
    exports.textToHTML = textToHTML;
    var separators = ",>+~ ";
    var separatorRe = new RegExp("([" + separators + "]+)");
    /**
     * Converts a CSS selector written as if it were run against the XML document
     * being edited by wed into a selector that will match the corresponding items
     * in the GUI tree. This implementation is extremely naive and likely to break
     * on complex selectors. Some specific things it cannot do:
     *
     * - Match attributes.
     *
     * - Match pseudo-elements.
     *
     * @param selector The selector to convert.
     *
     * @param namespaces The namespaces that are known. This is used to convert
     * element name prefixes to namespace URIs.
     *
     * @returns The converted selector.
     */
    function toGUISelector(selector, namespaces) {
        if (/[\]['"()]/.test(selector)) {
            throw new Error("selector is too complex");
        }
        if (/\\:/.test(selector)) {
            throw new Error("we do not accept escaped colons for now");
        }
        var parts = selector.split(separatorRe);
        var ret = [];
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var part = parts_1[_i];
            if (part.length !== 0) {
                if (separators.indexOf(part) > -1) {
                    ret.push(part);
                }
                else if (/[a-zA-Z]/.test(part[0])) {
                    part = part.trim();
                    var nameSplit = part.split(/(.#)/);
                    ret.push(util.classFromOriginalName(nameSplit[0], namespaces));
                    ret = ret.concat(nameSplit.slice(1));
                }
                else {
                    ret.push(part);
                }
            }
        }
        return ret.join("");
    }
    exports.toGUISelector = toGUISelector;
    /**
     * Allows applying simple CSS selectors on the data tree as if it were an HTML
     * tree. This is necessary because the current browsers are unable to handle tag
     * prefixes or namespaces in selectors passed to ``matches``, ``querySelector``
     * and related functions.
     *
     * The steps are:
     *
     * 1. Convert ``selector`` with [[toGUISelector]] into a selector that can be
     * applied to the GUI tree.
     *
     * 2. Convert ``node`` to a GUI node.
     *
     * 3. Apply the converted selector to the GUI node.
     *
     * 4. Convert the resulting node to a data node.
     *
     * @param node The element to use as the starting point of the query.
     *
     * @param selector The selector to use.
     *
     * @param namespaces The namespaces that are known. This is used to convert
     * element name prefixes to namespace URIs.
     *
     * @returns The resulting data node.
     */
    function dataFind(node, selector, namespaces) {
        var guiSelector = toGUISelector(selector, namespaces);
        var guiNode = $.data(node, "wed_mirror_node");
        var foundNodes = guiNode.querySelector(guiSelector);
        if (foundNodes == null) {
            return null;
        }
        var data = $.data(foundNodes, "wed_mirror_node");
        return (data != null) ? data : null;
    }
    exports.dataFind = dataFind;
    /**
     * Allows applying simple CSS selectors on the data tree as if it were an HTML
     * tree. Operates like [[dataFind]] but returns an array of nodes.
     *
     * @param node The data node to use as the starting point of the query.
     *
     * @param selector The selector to use.
     *
     * @param namespaces The namespaces that are known. This is used to convert
     * element name prefixes to namespace URIs.
     *
     * @returns The resulting data nodes.
     */
    function dataFindAll(node, selector, namespaces) {
        var guiSelector = toGUISelector(selector, namespaces);
        var guiNode = $.data(node, "wed_mirror_node");
        var foundNodes = guiNode.querySelectorAll(guiSelector);
        var ret = [];
        for (var i = 0; i < foundNodes.length; ++i) {
            ret.push($.data(foundNodes[i], "wed_mirror_node"));
        }
        return ret;
    }
    exports.dataFindAll = dataFindAll;
    /**
     * Converts an HTML string to an array of DOM nodes. **This function is not
     * responsible for checking the HTML for security holes it is the responsibility
     * of the calling code to ensure the HTML passed is clean.**
     *
     * @param html The HTML to convert.
     *
     * @param document The document for which to create the nodes. If not specified,
     * the document will be the global ``document``.
     *
     * @returns The resulting nodes.
     */
    function htmlToElements(html, document) {
        var doc = document != null ? document : window.document;
        var frag = doc.createDocumentFragment();
        var div = doc.createElement("div");
        frag.appendChild(div);
        //
        // Entire point of this function is to convert arbitrary HTML to DOM
        // elements. It is the responsibility of the caller to make sure the HTML
        // passed is clean.
        //
        // tslint:disable-next-line:no-inner-html
        div.innerHTML = html;
        var ret = Array.prototype.slice.call(div.childNodes);
        // Clear the div so that the children cannot access the DOM objects we created
        // only to convert the HTML to DOM elements.
        while (div.firstChild !== null) {
            div.removeChild(div.firstChild);
        }
        return ret;
    }
    exports.htmlToElements = htmlToElements;
    /**
     * Gets the character immediately before the caret. The word "immediately" here
     * means that this function does not walk the DOM. If the caret is pointing into
     * an element node, it will check whether the node before the offset is a text
     * node and use it. That's the extent to which it walks the DOM.
     *
     * @param caret The caret position.
     *
     * @return The character, if it exists.
     */
    function getCharacterImmediatelyBefore(caret) {
        var node = caret[0], offset = caret[1];
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                var value = node.data;
                return value[offset - 1];
            case Node.ELEMENT_NODE:
                var prev = node.childNodes[offset - 1];
                if (domtypeguards_1.isText(prev)) {
                    return prev.data[prev.data.length - 1];
                }
                break;
            default:
                throw new Error("unexpected node type: " + node.nodeType);
        }
        return undefined;
    }
    exports.getCharacterImmediatelyBefore = getCharacterImmediatelyBefore;
    /**
     * Gets the character immediately at the caret. The word "immediately" here
     * means that this function does not walk the DOM. If the caret is pointing into
     * an element node, it will check whether the node at the offset is a text
     * node and use it. That's the extent to which it walks the DOM.
     *
     * @param caret The caret position.
     *
     * @return The character, if it exists.
     */
    function getCharacterImmediatelyAt(caret) {
        var node = caret[0], offset = caret[1];
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                var value = node.data;
                return value[offset];
            case Node.ELEMENT_NODE:
                var next = node.childNodes[offset];
                if (domtypeguards_1.isText(next)) {
                    return next.data[0];
                }
                break;
            default:
                throw new Error("unexpected node type: " + node.nodeType);
        }
        return undefined;
    }
    exports.getCharacterImmediatelyAt = getCharacterImmediatelyAt;
    /**
     * Determine whether an element is displayed. This function is designed to
     * handle checks in wed's GUI tree, and not as a general purpose solution. It
     * only checks whether the element or its parents have ``display`` set to
     * ``"none"``.
     *
     * @param el The DOM element for which we want to check whether it is displayed
     * or not.
     *
     * @param root The parent of ``el`` beyond which we do not search.
     *
     * @returns ``true`` if the element or any of its parents is not
     * displayed. ``false`` otherwise. If the search up the DOM tree hits ``root``,
     * then the value returned is ``false``.
     */
    function isNotDisplayed(el, root) {
        var win = el.ownerDocument.defaultView;
        // We don't put a menu for attributes that are somehow not
        // displayed.
        while (el != null && el !== root) {
            if (el.style.display === "none") {
                return true;
            }
            var display = win.getComputedStyle(el).getPropertyValue("display");
            if (display === "none") {
                return true;
            }
            el = el.parentNode;
        }
        return false;
    }
    exports.isNotDisplayed = isNotDisplayed;
    /**
     * A ``contains`` function that handles attributes. Attributes are not part of
     * the node tree and performing a ``contains`` test on them is always ``false``.
     *
     * Yet it makes sense to say that an element A contains its own attributes and
     * thus by transitivity if element A is contained by element B, then all
     * attributes of A are contained by B. This function supports the contention
     * just described.
     *
     * Usage note: this function is typically not *needed* when doing tests in the
     * GUI tree because we do not address attributes in that tree. There is,
     * however, no harm in using it where it is not strictly needed. In the data
     * tree, however, we do address attributes. Code that works with either tree
     * (e.g. the [["dloc"]] module) should use this function as a general rule so
     * that it can work with either tree.
     *
     * @param container The thing which should contain in the test.
     *
     * @param contained The thing which should be contained in the test.
     *
     * @returns Whether ``container`` contains ``contained``.
     */
    function contains(container, contained) {
        if (domtypeguards_1.isAttr(contained)) {
            contained = contained.ownerElement;
        }
        return container.contains(contained);
    }
    exports.contains = contains;
});
//  LocalWords:  wed's URIs rect clientTop jquery util whitespace clientLeft cd
//  LocalWords:  contenteditable abcd abfoocd insertIntoText Prepend scrollbars
//  LocalWords:  deleteText jQuery getSelectionRange prev lastChild nodeType zA
//  LocalWords:  dom deleteNode mergeTextNodes jshint insertNodeAt noop treeA
//  LocalWords:  validthis insertFragAt versa nextSibling Dubeau MPL nodeInA
//  LocalWords:  Mangalam gui DOM unlinks startContainer startOffset childNodes
//  LocalWords:  endContainer endOffset genericInsertIntoText

//# sourceMappingURL=domutil.js.map
