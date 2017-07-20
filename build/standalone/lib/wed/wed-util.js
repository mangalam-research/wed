/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "./dloc", "./domtypeguards", "./domutil", "./guiroot"], function (require, exports, module, dloc_1, domtypeguards_1, domutil_1, guiroot_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Utility function for boundaryXY.
    function parentBoundary(node, root) {
        var parent = node.parentNode;
        // Cannot find a sensible boundary
        if (!root.contains(parent)) {
            return { left: 0, top: 0, bottom: 0 };
        }
        return boundaryXY(dloc_1.DLoc.mustMakeDLoc(root, node));
    }
    // tslint:disable-next-line:max-func-body-length
    function boundaryXY(boundary) {
        var node = boundary.node;
        var offset = boundary.offset;
        var nodeIsElement = domtypeguards_1.isElement(node);
        var nodeIsText = domtypeguards_1.isText(node);
        var nodeLen;
        if (nodeIsElement) {
            nodeLen = node.childNodes.length;
        }
        else if (nodeIsText) {
            nodeLen = node.length;
        }
        else {
            throw new Error("unexpected node type: " + node.nodeType);
        }
        // The node is empty ...
        if (nodeLen === 0) {
            return parentBoundary(node, boundary.root);
        }
        var range = node.ownerDocument.createRange();
        var rect;
        var child;
        while (offset < nodeLen) {
            // The array is empty if the node is a text node, and child will be
            // undefined.
            child = node.childNodes[offset];
            // We use getClientRects()[0] so that when we are working with an inline
            // node, we get only the first rect of the node. If the node is a block,
            // then there should be only one rect anyway.
            if (domtypeguards_1.isElement(child)) {
                rect = child.getClientRects()[0];
            }
            else {
                range.setStart(node, offset);
                range.setEnd(node, offset + 1);
                rect = range.getClientRects()[0];
            }
            // If the element that covers the range is invisible, then getClientRects
            // can return undefined. A 0, 0, 0, 0 rect is also theoretically possible.
            if (rect != null &&
                (rect.left !== 0 || rect.right !== 0 || rect.top !== 0 ||
                    rect.bottom !== 0)) {
                return { left: rect.left, top: rect.top, bottom: rect.bottom };
            }
            offset++;
        }
        // We failed to find something after our offset from which to get
        // coordinates. Try again.
        offset = boundary.offset;
        var win = node.ownerDocument.defaultView;
        while (offset !== 0) {
            offset--;
            child = undefined;
            // We check whether the thing we are going to cover with the range is
            // inline.
            var inline = void 0;
            if (nodeIsText) {
                inline = true;
            }
            else if (nodeIsElement) {
                child = node.childNodes[offset];
                if (domtypeguards_1.isText(child)) {
                    inline = true;
                }
                else if (domtypeguards_1.isElement(child)) {
                    var display = win.getComputedStyle(child).getPropertyValue("display");
                    inline = (display === "inline" || display === "inline-block");
                }
                else {
                    throw new Error("unexpected node type: " + child.nodeType);
                }
            }
            else {
                throw new Error("unexpected node type: " + node.nodeType);
            }
            // If it is not empty, and offset is at the end of the contents, then there
            // must be something *before* the point indicated by offset. Get a rectangle
            // around that and return the right side as the left value.
            var rects = void 0;
            if (domtypeguards_1.isElement(child)) {
                rects = child.getClientRects();
            }
            else {
                range.setStart(node, offset);
                range.setEnd(node, offset + 1);
                rects = range.getClientRects();
            }
            rect = rects[rects.length - 1];
            if (rect != null) {
                return (inline ?
                    // Yep, we use the right side when it is inline.
                    { left: rect.right, top: rect.top, bottom: rect.bottom } :
                    { left: rect.left, top: rect.top, bottom: rect.bottom });
            }
        }
        // We can get here with an offset of 0. In this case, we have to move to the
        // parent.
        return parentBoundary(node, boundary.root);
    }
    exports.boundaryXY = boundaryXY;
    function getAttrValueNode(attrVal) {
        if (!attrVal.classList.contains("_attribute_value")) {
            throw new Error("getAttrValueNode operates only on attribute values");
        }
        var ret = attrVal;
        var child = attrVal.firstChild;
        if (child !== null) {
            while (child !== null && !domtypeguards_1.isText(child)) {
                child = child.nextSibling;
            }
            if (child !== null) {
                ret = child;
            }
        }
        return ret;
    }
    exports.getAttrValueNode = getAttrValueNode;
    function cut(editor) {
        var caretManager = editor.caretManager;
        var sel = caretManager.sel;
        if (!sel.wellFormed) {
            throw new Error("malformed range");
        }
        var _a = sel.asDataCarets(), startCaret = _a[0], endCaret = _a[1];
        while (editor._cut_buffer.firstChild !== null) {
            editor._cut_buffer.removeChild(editor._cut_buffer.firstChild);
        }
        if (domtypeguards_1.isAttr(startCaret.node)) {
            var attr = startCaret.node;
            if (attr !== endCaret.node) {
                throw new Error("attribute selection that does not start " +
                    "and end in the same attribute");
            }
            var removedText = attr.value.slice(startCaret.offset, endCaret.offset);
            editor._spliceAttribute(domutil_1.closestByClass(caretManager.fromDataLocation(startCaret).node, "_attribute_value"), startCaret.offset, endCaret.offset - startCaret.offset, "");
            editor._cut_buffer.textContent = removedText;
        }
        else {
            var cutRet = editor.data_updater.cut(startCaret, endCaret);
            var nodes = cutRet[1];
            var parser = new editor.my_window.DOMParser();
            var doc = parser.parseFromString("<div></div>", "text/xml");
            for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                var node = nodes_1[_i];
                doc.firstChild.appendChild(doc.adoptNode(node));
            }
            editor._cut_buffer.textContent = doc.firstChild.innerHTML;
            editor.caretManager.setCaret(cutRet[0]);
        }
        var range = editor.doc.createRange();
        var container = editor._cut_buffer;
        range.setStart(container, 0);
        range.setEnd(container, container.childNodes.length);
        var domSel = editor.my_window.getSelection();
        domSel.removeAllRanges();
        domSel.addRange(range);
        // We've set the range to the cut buffer, which is what we want for the cut
        // operation to work. However, the focus is also set to the cut buffer but
        // once the cut is done we want the focus to be back to our caret, so...
        setTimeout(function () {
            caretManager.focusInputField();
        }, 0);
    }
    exports.cut = cut;
    // tslint:disable-next-line:no-any
    function paste(editor, data) {
        var toPaste = data.to_paste;
        var dataClone = toPaste.cloneNode(true);
        var caret = editor.caretManager.getDataCaret();
        var newCaret;
        var ret;
        // Handle the case where we are pasting only text.
        if (toPaste.childNodes.length === 1 && domtypeguards_1.isText(toPaste.firstChild)) {
            if (domtypeguards_1.isAttr(caret.node)) {
                var guiCaret = editor.caretManager.getNormalizedCaret();
                editor._spliceAttribute(domutil_1.closestByClass(guiCaret.node, "_attribute_value", guiCaret.node), guiCaret.offset, 0, toPaste.firstChild.data);
            }
            else {
                ret = editor.data_updater.insertText(caret, toPaste.firstChild.data);
                // In the first case, the node that contained the caret was modified to
                // contain the text. In the 2nd case, a new node was created **or** the
                // text that contains the text is a child of the original node.
                newCaret = ((ret[0] === ret[1]) && (ret[1] === caret.node)) ?
                    // tslint:disable-next-line:restrict-plus-operands
                    caret.make(caret.node, caret.offset + toPaste.firstChild.length) :
                    caret.make(ret[1], ret[1].length);
            }
        }
        else {
            var frag = document.createDocumentFragment();
            while (toPaste.firstChild !== null) {
                frag.appendChild(toPaste.firstChild);
            }
            switch (caret.node.nodeType) {
                case Node.TEXT_NODE:
                    ret = editor.data_updater.insertIntoText(caret, frag);
                    newCaret = ret[1];
                    break;
                case Node.ELEMENT_NODE:
                    var child = caret.node.childNodes[caret.offset];
                    var after_1 = child != null ? child.nextSibling : null;
                    editor.data_updater.insertBefore(caret.node, frag, child);
                    newCaret = caret.makeWithOffset(after_1 !== null ?
                        domutil_1.indexOf(caret.node.childNodes, after_1) :
                        caret.node.childNodes.length);
                    break;
                default:
                    throw new Error("unexpected node type: " + caret.node.nodeType);
            }
        }
        if (newCaret != null) {
            editor.caretManager.setCaret(newCaret);
            caret = newCaret;
        }
        editor.$gui_root.trigger("wed-post-paste", [data.e, caret, dataClone]);
    }
    exports.paste = paste;
    function getGUINodeIfExists(editor, node) {
        if (node == null) {
            return undefined;
        }
        try {
            var caret = editor.caretManager.fromDataLocation(node, 0);
            return caret != null ? caret.node : undefined;
        }
        catch (ex) {
            if (ex instanceof guiroot_1.AttributeNotFound) {
                return undefined;
            }
            throw ex;
        }
    }
    exports.getGUINodeIfExists = getGUINodeIfExists;
});

//# sourceMappingURL=wed-util.js.map
