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

import { DLoc, makeDLoc } from "./dloc";
import { isAttr, isElement, isText } from "./domtypeguards";
import { closestByClass, indexOf, isWellFormedRange } from "./domutil";
import { AttributeNotFound } from "./guiroot";

export interface BoundaryCoordinates {
  left: number;
  top: number;
  bottom: number;
}

// Utility function for boundaryXY.
function parentBoundary(node: Node, root: Node): BoundaryCoordinates {
  const parent = node.parentNode!;

  // Cannot find a sensible boundary
  if (!root.contains(parent)) {
    return { left: 0, top: 0, bottom: 0 };
  }

  return boundaryXY(makeDLoc(root, parent, indexOf(parent.childNodes, node)));
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

// tslint:disable-next-line:no-any
export type Editor = any;

export function cut(editor: Editor): void {
  let range = editor._getDOMSelectionRange();
  if (!isWellFormedRange(range)) {
    throw new Error("malformed range");
  }

  const startCaret = editor.toDataLocation(range.startContainer,
                                           range.startOffset);
  const endCaret = editor.toDataLocation(range.endContainer, range.endOffset);
  while (editor._cut_buffer.firstChild !== null) {
    editor._cut_buffer.removeChild(editor._cut_buffer.firstChild);
  }
  if (isAttr(startCaret.node)) {
    const attr = startCaret.node;
    if (attr !== endCaret.node) {
      throw new Error("attribute selection that does not start " +
                      "and end in the same attribute");
    }
    const removedText = attr.value.slice(startCaret.offset, endCaret.offset);
    editor._spliceAttribute(
      closestByClass(editor.fromDataLocation(startCaret).node,
                     "_attribute_value", range.startContainer),
      startCaret.offset,
      endCaret.offset - startCaret.offset, "");
    editor._cut_buffer.textContent = removedText;
  }
  else {
    const cutRet = editor.data_updater.cut(startCaret, endCaret);
    const nodes = cutRet[1];
    const parser = new editor.my_window.DOMParser();
    const doc = parser.parseFromString("<div></div>", "text/xml");
    for (const node of nodes) {
      doc.firstChild.appendChild(doc.adoptNode(node));
    }
    editor._cut_buffer.textContent = doc.firstChild.innerHTML;
    editor.setDataCaret(cutRet[0]);
  }

  range = editor.doc.createRange();
  const container = editor._cut_buffer;
  range.setStart(container, 0);
  range.setEnd(container, container.childNodes.length);
  const sel = editor.my_window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  // We've set the range to the cut buffer, which is what we want for the cut
  // operation to work. However, the focus is also set to the cut buffer but
  // once the cut is done we want the focus to be back to our caret, so...
  setTimeout(() => {
    editor._focusInputField();
  }, 0);
}

// tslint:disable-next-line:no-any
export function paste(editor: Editor, data: any): void {
  const toPaste = data.to_paste;
  const dataClone = toPaste.cloneNode(true);
  let caret = editor.getDataCaret();
  let newCaret;
  let ret;

  // Handle the case where we are pasting only text.
  if (toPaste.childNodes.length === 1 && isText(toPaste.firstChild)) {
    if (isAttr(caret.node)) {
      const guiCaret = editor.getGUICaret();
      editor._spliceAttribute(closestByClass(guiCaret.node, "_attribute_value",
                                             guiCaret.node),
                              guiCaret.offset, 0, toPaste.firstChild.data);
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
    const frag = document.createDocumentFragment();
    while (toPaste.firstChild !== null) {
      frag.appendChild(toPaste.firstChild);
    }
    switch (caret.node.nodeType) {
    case Node.TEXT_NODE:
      ret = editor.data_updater.insertIntoText(caret, frag);
      newCaret = ret[1];
      break;
    case Node.ELEMENT_NODE:
      const child = caret.node.childNodes[caret.offset];
      const after = child != null ? child.nextSibling : null;
      editor.data_updater.insertBefore(caret.node, frag, child);
      newCaret = caret.make(caret.node,
                            after !== null ?
                            indexOf(caret.node.childNodes, after) :
                            caret.node.childNodes.length);
      break;
    default:
      throw new Error(`unexpected node type: ${caret.node.nodeType}`);
    }
  }
  if (newCaret != null) {
    editor.setDataCaret(newCaret);
    caret = newCaret;
  }
  editor.$gui_root.trigger("wed-post-paste", [data.e, caret, dataClone]);
}

export function getGUINodeIfExists(editor: Editor,
                                   node: Node | null | undefined):
Node | undefined {
  if (node == null) {
    return undefined;
  }

  try {
    const caret = editor.fromDataLocation(node, 0);
    return caret != null ? caret.node : undefined;
  }
  catch (ex) {
    if (ex instanceof AttributeNotFound) {
      return undefined;
    }

    throw ex;
  }
}
