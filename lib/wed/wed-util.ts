/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

//
// We already have domutil and util so why this module? It combines those
// functions that are really part of wed but are not meant to be used outside
// the Editor class itself. domutil is meant to encompass those functions that
// could be used in other contexts and are about the DOM. util is meant to
// encompass those functions that do not depend on having a browser available.
//

import { DLoc } from "./dloc";
import { isElement, isText } from "./domtypeguards";
import { Editor } from "./editor";
import { AttributeNotFound } from "./guiroot";

export interface BoundaryCoordinates {
  left: number;
  top: number;
  bottom: number;
}

// Utility function for boundaryXY.
function parentBoundary(node: Node,
                        root: Document | Element): BoundaryCoordinates {
  const parent = node.parentNode!;

  // Cannot find a sensible boundary
  if (!root.contains(parent)) {
    return { left: 0, top: 0, bottom: 0 };
  }

  return boundaryXY(DLoc.mustMakeDLoc(root, node));
}

// tslint:disable-next-line:max-func-body-length
export function boundaryXY(boundary: DLoc): BoundaryCoordinates {
  const node = boundary.node;
  let offset = boundary.offset;

  const nodeIsElement = isElement(node);
  const nodeIsText = isText(node);
  let nodeLen;
  if (nodeIsElement) {
    nodeLen = node.childNodes.length;
  }
  else if (nodeIsText) {
    nodeLen = (node as Text).length;
  }
  else {
    throw new Error(`unexpected node type: ${node.nodeType}`);
  }

  // The node is empty ...
  if (nodeLen === 0) {
    return parentBoundary(node, boundary.root);
  }

  const range = node.ownerDocument.createRange();
  let rect;

  let child;
  while (offset < nodeLen) {
    // The array is empty if the node is a text node, and child will be
    // undefined.
    child = node.childNodes[offset];

    // We use getClientRects()[0] so that when we are working with an inline
    // node, we get only the first rect of the node. If the node is a block,
    // then there should be only one rect anyway.
    if (isElement(child)) {
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

  const win = node.ownerDocument.defaultView;
  while (offset !== 0) {
    offset--;
    child = undefined;

    // We check whether the thing we are going to cover with the range is
    // inline.
    let inline;
    if (nodeIsText) {
      inline = true;
    }
    else if (nodeIsElement) {
      child = node.childNodes[offset];
      if (isText(child)) {
        inline = true;
      }
      else if (isElement(child)) {
        const display = win.getComputedStyle(child).getPropertyValue("display");
        inline = (display === "inline" || display === "inline-block");
      }
      else {
        throw new Error(`unexpected node type: ${child.nodeType}`);
      }
    }
    else {
      throw new Error(`unexpected node type: ${node.nodeType}`);
    }

    // If it is not empty, and offset is at the end of the contents, then there
    // must be something *before* the point indicated by offset. Get a rectangle
    // around that and return the right side as the left value.
    let rects;
    if (isElement(child)) {
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

export function getAttrValueNode(attrVal: Element): Node {
  if (!attrVal.classList.contains("_attribute_value")) {
    throw new Error("getAttrValueNode operates only on attribute values");
  }

  let ret: Node = attrVal;

  let child = attrVal.firstChild;
  if (child !== null) {
    while (child !== null && !isText(child)) {
      child = child.nextSibling;
    }

    if (child !== null) {
      ret = child;
    }
  }

  return ret;
}

export function getGUINodeIfExists(editor: Editor,
                                   node: Node | null | undefined):
Node | undefined {
  if (node == null) {
    return undefined;
  }

  try {
    const caret = editor.caretManager.fromDataLocation(node, 0);
    return caret != null ? caret.node : undefined;
  }
  catch (ex) {
    if (ex instanceof AttributeNotFound) {
      return undefined;
    }

    throw ex;
  }
}

//  LocalWords:  MPL domutil util boundaryXY nodeType getClientRects rect
//  LocalWords:  getAttrValueNode
