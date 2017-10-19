/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "./dloc", "./domtypeguards", "./guiroot"], function (require, exports, module, dloc_1, domtypeguards_1, guiroot_1) {
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
//  LocalWords:  MPL domutil util boundaryXY nodeType getClientRects rect
//  LocalWords:  getAttrValueNode

//# sourceMappingURL=wed-util.js.map
