/**
 * Utilities that manipulate or query the DOM tree.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import $ from "jquery";

import { isAttr, isDocument, isDocumentFragment, isElement,
         isText } from "./domtypeguards";
import * as util from "./util";

/**
 * Search an array.
 *
 * @param a The array to search.
 *
 * @param target The target to find.
 *
 * @return -1 if the target is not found, or its index.
 */
export function indexOf(a: NodeList, target: Node): number;
export function indexOf<T>(a: T[], target: T): number;
export function indexOf<T>(a: T[] | NodeList, target: T | Node): number {
  const length = a.length;
  for (let i = 0; i < length; ++i) {
    if (a[i] === target) {
      return i;
    }
  }
  return -1;
}

/**
 * Compare two locations that have already been determined to be in a
 * parent-child relation. **Important: the relationship must have been formally
 * tested *before* calling this function.**
 *
 * @returns -1 if ``parent`` is before ``child``, 1 otherwise.
 */
function parentChildCompare(parentNode: Node, parentOffset: number,
                            childNode: Node): 1 | -1 {
  // Find which child of parent is or contains the other node.
  let curChild = parentNode.firstChild;
  let ix = 0;
  while (curChild !== null) {
    if (curChild.contains(childNode)) {
          break;
    }
    ix++;
    curChild = curChild.nextSibling;
  }

  // This is ``<= 0`` and not just ``< 0`` because if our offset points exactly
  // to the child we found, then parent location is necessarily before the child
  // location.
  return (parentOffset - ix) <= 0 ? -1 : 1;
}

/**
 * Compare two positions in document order.
 *
 * This function relies on DOM's ``compareDocumentPosition`` function. Remember
 * that calling that function with attributes can be problematic. (For instance,
 * two attributes on the same element are not ordered.)
 *
 * @param firstNode Node of the first position.
 *
 * @param firstOffset Offset of the first position.
 *
 * @param secondNode Node of the second position.
 *
 * @param secondOffset Offset of the second position.
 *
 * @returns -1 if the first position comes before the second. 1 if the first
 * position comes after the other. 0 if the two positions are equal.
 */
export function comparePositions(firstNode: Node,
                                 firstOffset: number,
                                 secondNode: Node,
                                 secondOffset: number): 1 | 0 | -1 {
  if (firstNode === secondNode) {
    const d = firstOffset - secondOffset;
    if (d === 0) {
      return 0;
    }

    return d < 0 ? -1 : 1;
  }

  const comparison = firstNode.compareDocumentPosition(secondNode);
  // tslint:disable:no-bitwise
  if ((comparison & Node.DOCUMENT_POSITION_DISCONNECTED) !== 0) {
    throw new Error("cannot compare disconnected nodes");
  }

  if ((comparison & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0) {
    return parentChildCompare(firstNode, firstOffset, secondNode);
  }

  if ((comparison & Node.DOCUMENT_POSITION_CONTAINS) !== 0) {
    // This raises a type error:
    //
    // return -parentChildCompare(secondNode, secondOffset, firstNode);
    return parentChildCompare(secondNode, secondOffset, firstNode) < 0 ? 1 : -1;
  }

  if ((comparison & Node.DOCUMENT_POSITION_PRECEDING) !== 0) {
    return 1;
  }

  if ((comparison & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) {
    return -1;
  }
  // tslint:enable:no-bitwise

  throw new Error("neither preceding nor following: this should not happen");
}

/**
 * Gets the first range in the selection.
 *
 * @param win The window for which we want the selection.
 *
 * @returns The first range in the selection. Undefined if there is no selection
 * or no range.
 */
export function getSelectionRange(win: Window): Range | undefined {
  const sel = win.getSelection();

  if (sel === undefined || sel.rangeCount < 1) {
    return undefined;
  }

  return sel.getRangeAt(0);
}

/**
 * A range and a flag indicating whether it is a reversed range or not. Range
 * objects themselves do not record how they were created. If the range was
 * created from a starting point which is greater than the end point (in
 * document order), then the range is "reversed".
 */
export type RangeInfo = {range: Range; reversed: boolean};

/**
 * Creates a range from two points in a document.
 *
 * @returns The range information.
 */
export function rangeFromPoints(startContainer: Node,
                                startOffset: number,
                                endContainer: Node,
                                endOffset: number): RangeInfo {
  const range = startContainer.ownerDocument.createRange();
  let reversed = false;
  if (comparePositions(startContainer, startOffset, endContainer,
                       endOffset) <= 0) {
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

/**
 * Focuses the node itself or if the node is a text node, focuses the parent.
 *
 * @param node The node to focus.
 *
 * @throws {Error} If the node is neither a text node nor an element. Trying to
 * focus something other than these is almost certainly an algorithmic bug.
 */
export function focusNode(node: Node): void {
  const nodeType = node != null ? node.nodeType : undefined;
  switch (nodeType) {
  case Node.TEXT_NODE:
    if (node.parentNode == null) {
      throw new Error("detached node");
    }
    (node.parentNode as HTMLElement).focus();
    break;
  case Node.ELEMENT_NODE:
    (node as HTMLElement).focus();
    break;
  default:
    throw new Error("tried to focus something other than a text node or " +
                    "an element.");
  }
}

/**
 * A caret position in the form of a pair of values. The caret we are talking
 * about here roughly corresponds to the caret that a "contenteditable" element
 * would present to the user. It can index in text nodes and element nodes but
 * not in attributes.
 */
export type Caret = [Node, number];

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
export function nextCaretPosition(caret: Caret,
                                  container: Node,
                                  noText: boolean): Caret | null {
  let [node, offset] = caret;
  let found = false;

  if (!container.contains(node)) {
    return null;
  }

  const doc = isDocument(node) ? node : node.ownerDocument;

  const window = doc.defaultView;
  let parent;
  search_loop:
  while (!found) {
    parent = node.parentNode;
    switch (node.nodeType) {
    case Node.TEXT_NODE:
      if (offset >= (node as Text).length ||
          // If the parent node is set to normal whitespace handling, then
          // moving the caret forward by one position will skip this whitespace.
          (parent != null && parent.lastChild === node &&
           window.getComputedStyle(parent as Element, undefined).whiteSpace ===
           "normal" && /^\s+$/.test((node as Text).data.slice(offset)))) {
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
                  isText(node.childNodes[offset]));
      }
      break;
    default:
    }
  }

  if (!found) {
    return null;
  }

  if (noText && isText(node)) {
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
export function prevCaretPosition(caret: Caret,
                                  container: Node,
                                  noText: boolean): Caret | null {
  let [node, offset] = caret;
  let found = false;

  if (!container.contains(node)) {
    return null;
  }

  const doc = isDocument(node) ? node : node.ownerDocument;

  const window = doc.defaultView;
  let parent;
  search_loop:
  while (!found) {
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
           window.getComputedStyle(parent as Element, undefined).whiteSpace ===
           "normal" && /^\s+$/.test((node as Text).data.slice(0, offset)))) {
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
      // If node.childNodes.length === 0, the first branch would have been
      // taken. No need to test that offset indexes to something that exists.
      else {
        node = node.childNodes[offset];
        if (isElement(node)) {
          offset = node.childNodes.length;
          found = !(node.childNodes.length > 0 &&
                    isText(node.childNodes[offset - 1]));
        }
        else {
          offset = (node as Text).length + 1;
        }
      }
      break;
    default:
    }
  }

  if (!found) {
    return null;
  }

  if (noText && isText(node)) {
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
export function correspondingNode(treeA: Node, treeB: Node,
                                  nodeInA: Node): Node {
  const path = [];
  let current = nodeInA;
  while (current !== treeA) {
    const parent = current.parentNode;
    if (parent == null) {
      throw new Error("nodeInA is not treeA or a child of treeA");
    }
    path.unshift(indexOf(parent.childNodes, current));
    current = parent;
  }

  let ret = treeB;
  while (path.length !== 0) {
    ret = ret.childNodes[path.shift()!];
  }

  return ret;
}

/**
 * Makes a placeholder element
 *
 * @param text The text to put in the placeholder.
 *
 * @returns A node.
 */
export function makePlaceholder(text?: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "_placeholder";
  span.setAttribute("contenteditable", "true");
  span.textContent = text !== undefined ? text : " ";
  return span;
}

export type InsertionBoundaries = [Caret, Caret];

export interface GenericInsertIntoTextContext {
  insertNodeAt(into: Element, index: number, node: Node): void;
  deleteNode(node: Node): void;
  /**
   * This function performs roughly the same as insertNodeAt but may be
   * optimized to take care of fragment handling.
   */
  insertFragAt?(into: Element, index: number, node: DocumentFragment): void;
}

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
function _genericInsertIntoText(this: GenericInsertIntoTextContext,
                                textNode: Text,
                                index: number,
                                node?: Node,
                                clean: boolean = true): InsertionBoundaries {
  // This function is meant to be called with this set to a proper
  // value.
  /* jshint validthis:true */
  if (!isText(textNode)) {
    throw new Error("insertIntoText called on non-text");
  }

  let startCaret: Caret;
  let endCaret: Caret;

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

  let prev;
  let next;
  const isFragment = isDocumentFragment(node);

  // A parent is necessarily an element.
  const parent = textNode.parentNode as Element;
  if (parent == null) {
    throw new Error("detached node");
  }
  let textNodeAt = indexOf(parent.childNodes, textNode);
  if (clean && (node == null || (isFragment && node.childNodes.length === 0))) {
    startCaret = endCaret = [textNode, index];
  }
  else {
    const frag = document.createDocumentFragment();
    prev = document.createTextNode(textNode.data.slice(0, index));
    frag.appendChild(prev);
    if (node != null) {
      frag.appendChild(node);
    }
    next = document.createTextNode(textNode.data.slice(index));
    const nextLen = next.length;
    frag.appendChild(next);

    if (clean) {
      frag.normalize();
    }

    if (clean && index === 0) {
      startCaret = [parent, textNodeAt];
    }
    else {
      startCaret = [frag.firstChild!, index];
    }

    if (clean && index === textNode.length) {
      endCaret = [parent, textNodeAt + frag.childNodes.length];
    }
    else {
      endCaret = [frag.lastChild!, (frag.lastChild as Text).length - nextLen];
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
export function genericInsertIntoText(this: GenericInsertIntoTextContext,
                                      textNode: Text,
                                      index: number,
                                      node?: Node): InsertionBoundaries {
  // This function is meant to be called with this set to a proper
  // value.
  if (node == null) {
    throw new Error("must pass an actual node to insert");
  }
  // tslint:disable-next-line:no-invalid-this
  return _genericInsertIntoText.call(this, textNode, index, node);
}

/**
 * Records the results of inserting text into the tree.
 */
export interface TextInsertionResult {
  /** The node that contains the added text. */
  node: Text | undefined;

  /** Whether [[node]] is a new node. If ``false``, it was modified. */
  isNew: boolean;

  /** The caret position after the insertion. */
  caret: Caret;
}

export interface GenericInsertTextContext {
  insertNodeAt(into: Element, index: number, node: Node): void;
  setTextNodeValue(node: Text, value: string): void;
}

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
export function genericInsertText(this: GenericInsertTextContext,
                                  node: Node,
                                  index: number,
                                  text: string,
                                  caretAtEnd: boolean = true):
TextInsertionResult {
  // This function is meant to be called with this set to a proper
  // value.
  if (text === "") {
    return {
      node: undefined,
      isNew: false,
      caret: [node, index],
    };
  }

  let isNew: boolean = false;
  let textNode: Text;
  let caret: Caret;
  work:
  // tslint:disable-next-line:no-constant-condition strict-boolean-expressions
  while (true) {
    switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      const child = node.childNodes[index];
      if (isText(child)) {
        // Prepend to already existing text node.
        node = child;
        index = 0;
        continue work;
      }

      const prev = node.childNodes[index - 1];
      if (isText(prev)) {
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
      this.insertNodeAt(node as Element, index, textNode);
      caret = [textNode, caretAtEnd ? text.length : 0];
      break work;
    case Node.TEXT_NODE:
      textNode = node as Text;
      const pre = textNode.data.slice(0, index);
      const post = textNode.data.slice(index);
      // tslint:disable-next-line:no-invalid-this
      this.setTextNodeValue(textNode, pre + text + post);
      caret = [textNode, caretAtEnd ? index + text.length : index];
      break work;
    default:
      throw new Error(`unexpected node type: ${node.nodeType}`);
    }
  }

  return {
    node: textNode,
    isNew,
    caret: caret,
  };
}

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
export function deleteText(node: Text, index: number, length: number): void {
  if (!isText(node)) {
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

/**
 * This function recursively links two DOM trees through the jQuery ``.data()``
 * method. For an element in the first tree the data item named
 * "wed_mirror_node" points to the corresponding element in the second tree, and
 * vice-versa. It is presumed that the two DOM trees are perfect mirrors of each
 * other, although no test is performed to confirm this.
 */
export function linkTrees(rootA: Element, rootB: Element): void {
  $.data(rootA, "wed_mirror_node", rootB);
  $.data(rootB, "wed_mirror_node", rootA);
  for (let i = 0; i < rootA.children.length; ++i) {
    const childA = rootA.children[i];
    const childB = rootB.children[i];
    linkTrees(childA, childB);
  }
}

/**
 * This function recursively unlinks a DOM tree though the jQuery ``.data()``
 * method.
 *
 * @param root A DOM node.
 *
 */
export function unlinkTree(root: Element): void {
  $.removeData(root, "wed_mirror_node");
  for (let i = 0; i < root.children.length; ++i) {
    unlinkTree(root.children[i]);
  }
}

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
export function firstDescendantOrSelf(node: Node | null | undefined):
Node | null {
  if (node === undefined) {
    node = null;
  }

  while (node !== null && node.firstChild !== null) {
    node = node.firstChild;
  }
  return node;
}

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
export function lastDescendantOrSelf(node: Node | null | undefined):
Node | null {
  if (node === undefined) {
    node = null;
  }

  while (node !== null && node.lastChild !== null) {
    node = node.lastChild;
  }
  return node;
}

/**
 * Removes the node. Mainly for use with the generic functions defined here.
 *
 * @param node The node to remove.
 */
export function deleteNode(node: Node): void {
  if (node.parentNode == null) {
    // For historical reasons we raise an error rather than make it a noop.
    throw new Error("detached node");
  }
  node.parentNode.removeChild(node);
}

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
function insertNodeAt(parent: Element, index: number, node: Node): void {
  const child = parent.childNodes[index];
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
export function insertText(node: Node,
                           index: number,
                           text: string,
                           caretAtEnd?: boolean): TextInsertionResult {
  return genericInsertText.call({
    insertNodeAt: insertNodeAt,
    setTextNodeValue: (textNode: Text, value: string) => {
      textNode.data = value;
    },
    // tslint:disable-next-line:align
  }, node, index, text, caretAtEnd);
}

const plainDOMMockup: GenericInsertIntoTextContext = {
  insertNodeAt: insertNodeAt,
  insertFragAt: insertNodeAt,
  deleteNode: deleteNode,
};

/**
 * See [[_genericInsertIntoText]].
 *
 * @private
 */
function _insertIntoText(textNode: Text,
                         index: number,
                         node?: Node,
                         clean: boolean = true): InsertionBoundaries {
  return _genericInsertIntoText.call(plainDOMMockup, textNode, index, node,
                                     clean);
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
export function insertIntoText(textNode: Text,
                               index: number,
                               node: Node): InsertionBoundaries {
  return genericInsertIntoText.call(plainDOMMockup, textNode, index, node);
}

export type SplitResult = [Node, Node];

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
export function splitTextNode(textNode: Text, index: number): SplitResult {
  const carets = _insertIntoText(textNode, index, undefined, false);
  return [carets[0][0], carets[1][0]];
}

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
export function mergeTextNodes(node: Node): Caret {
  const next = node.nextSibling;
  if (isText(node) && isText(next)) {
    const offset = node.length;
    node.appendData(next.data);
    next.parentNode!.removeChild(next);
    return [node, offset];
  }

  const parent = node.parentNode;
  if (parent == null) {
    throw new Error("detached node");
  }
  return [parent, indexOf(parent.childNodes, node) + 1];
}

export interface RangeLike {
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
}

export type ElementPair = [Element, Element];

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
function nodePairFromRange(range: RangeLike): ElementPair {
  let startNode;
  switch (range.startContainer.nodeType) {
  case Node.TEXT_NODE:
    startNode = range.startContainer.parentNode as Element;
    if (startNode == null) {
      throw new Error("detached node");
    }
    break;
  case Node.ELEMENT_NODE:
    startNode = range.startContainer as Element;
    break;
  default:
    throw new Error(`unexpected node type: ${range.startContainer.nodeType}`);

  }

  let endNode;
  switch (range.endContainer.nodeType) {
  case Node.TEXT_NODE:
    endNode = range.endContainer.parentNode as Element;
    if (endNode == null) {
      throw new Error("detached node");
    }
    break;
  case Node.ELEMENT_NODE:
    endNode = range.endContainer as Element;
    break;
  default:
    throw new Error(`unexpected node type: ${range.endContainer.nodeType}`);
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
export function isWellFormedRange(range: RangeLike): boolean {
  const pair = nodePairFromRange(range);
  return pair[0] === pair[1];
}

export interface GenericCutContext {
  deleteText(node: Text, index: number, length: number): void;
  deleteNode(node: Node): void;
  mergeTextNodes(node: Node): Caret;
}

export type CutResult = [Caret, Node[]];

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
export function genericCutFunction(this: GenericCutContext,
                                   startCaret: Caret,
                                   endCaret: Caret): CutResult {
  if (!isWellFormedRange({ startContainer: startCaret[0],
                           startOffset: startCaret[1],
                           endContainer: endCaret[0],
                           endOffset: endCaret[1] })) {
    throw new Error("range is not well-formed");
  }

  let [startContainer, startOffset] = startCaret;
  let [endContainer, endOffset] = endCaret;

  let parent = startContainer.parentNode;
  if (parent == null) {
    throw new Error("detached node");
  }
  let finalCaret: [Node, number];
  let startText;

  if (isText(startContainer) && startOffset === 0) {
    // We are at the start of a text node, move up to the parent.
    startOffset = indexOf(parent.childNodes, startContainer);
    startContainer = parent;
    parent = startContainer.parentNode;
    if (parent == null) {
      throw new Error("detached node");
    }
  }

  if (isText(startContainer)) {
    const sameContainer = startContainer === endContainer;

    const startContainerOffset = indexOf(parent.childNodes, startContainer);

    const endTextOffset = sameContainer ? endOffset : startContainer.length;

    startText = parent.ownerDocument.createTextNode(
      startContainer.data.slice(startOffset, endTextOffset));
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

  let endText;
  if (isText(endContainer)) {
    parent = endContainer.parentNode;
    if (parent == null) {
      throw new Error("detached node");
    }

    const endContainerOffset = indexOf(parent.childNodes, endContainer);

    endText = parent.ownerDocument.createTextNode(
      endContainer.data.slice(0, endOffset));
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
  if (!isElement(startContainer)) {
    throw new Error("internal error in cut: not an element");
  }

  const returnNodes = [];
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

/**
 * Dumps a range to the console.
 *
 * @param msg A message to output in front of the range information.
 *
 * @param range The range.
 */
export function dumpRange(msg: string, range?: RangeLike): void {
  if (range == null) {
    // tslint:disable-next-line:no-console
    console.log(msg, "no range");
  }
  else {
    // tslint:disable-next-line:no-console
    console.log(msg,
                range.startContainer,
                range.startOffset,
                range.endContainer,
                range.endOffset);
  }
}

/**
 * Dumps the current selection to the console.
 *
 * @param msg A message to output in front of the range information.
 *
 * @param win The window for which to dump selection information.
 */
export function dumpCurrentSelection(msg: string, win: Window): void {
  dumpRange(msg, getSelectionRange(win));
}

/**
 * Dumps a range to a string.
 *
 * @param msg A message to output in front of the range information.
 *
 * @param range The range.
 */
export function dumpRangeToString(msg: string, range?: RangeLike): string {
  let ret;
  if (range == null) {
    ret = [msg, "no range"];
  }
  else {
    ret = [msg,
           (range.startContainer as Element).outerHTML,
           range.startOffset,
           (range.endContainer as Element).outerHTML,
           range.endOffset];
  }

  return ret.join(", ");
}

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
export function pointInContents(element: Element,
                                x: number, y: number): boolean {
  // Convert the coordinates relative to the document to coordinates relative to
  // the element.
  const body = element.ownerDocument.body;
  // Using clientLeft and clientTop is not equivalent to using the rect.
  const rect = element.getBoundingClientRect();
  x -= rect.left + body.scrollLeft;
  y -= rect.top + body.scrollTop;

  return ((x >= 0) && (y >= 0) &&
          (x < element.clientWidth) && (y < element.clientHeight));
}

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
export function closest(node: Node | undefined | null,
                        selector: string,
                        limit?: Element| Document): Element | null {
  if (node == null) {
    return null;
  }

  // Immediately move out of text nodes.
  if (isText(node)) {
    node = node.parentNode;
  }

  while (node != null) {
    if (!isElement(node)) {
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

  return node as Element;
}

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
export function closestByClass(node: Node | undefined | null, cl: string,
                               limit?: Element | Document): Element | null {
  if (node == null) {
    return null;
  }

  // Immediately move out of text nodes.
  if (isText(node)) {
    node = node.parentNode;
  }

  while (node != null) {
    if (!isElement(node)) {
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

  return node as Element;
}

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
export function siblingByClass(node: Node | null, cl: string): Element | null {
  if (!isElement(node)) {
    return null;
  }

  const parent = node.parentNode as Element;
  if (parent == null) {
    return null;
  }

  let child = parent.firstElementChild;
  while (child != null && !child.classList.contains(cl)) {
    child = child.nextElementSibling;
  }
  return child;
}

/**
 * Find children matching the class.
 *
 * @param node The element whose children we are looking for.
 *
 * @param cl The class to use for matches.
 *
 * @returns The children (in document order) that match the class.
 */
export function childrenByClass(node: Node | null, cl: string): Element[] {
  if (!isElement(node)) {
    return [];
  }

  const ret = [];
  let child = node.firstElementChild;
  while (child != null) {
    if (child.classList.contains(cl)) {
      ret.push(child);
    }
    child = child.nextElementSibling;
  }

  return ret;
}

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
export function childByClass(node: Node | null, cl: string): Element | null {
  if (!isElement(node)) {
    return null;
  }

  let child = node.firstElementChild;
  while (child != null && !child.classList.contains(cl)) {
    child = child.nextElementSibling;
  }
  return child;
}

let textToHTMLSpan: HTMLSpanElement;

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
export function textToHTML(text: string): string {
  if (textToHTMLSpan == null) {
    textToHTMLSpan = document.createElement("span");
  }
  textToHTMLSpan.textContent = text;
  return textToHTMLSpan.innerHTML;
}

const separators = ",>+~ ";
const separatorRe = new RegExp(`([${separators}]+)`);

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
export function toGUISelector(selector: string,
                              namespaces: Record<string, string>): string {
  if (/[\]['"()]/.test(selector)) {
    throw new Error("selector is too complex");
  }

  if (/\\:/.test(selector)) {
    throw new Error("we do not accept escaped colons for now");
  }

  const parts = selector.split(separatorRe);
  let ret: string[] = [];
  for (let part of parts) {
    if (part.length !== 0) {
      if (separators.indexOf(part) > -1) {
        ret.push(part);
      }
      else if (/[a-zA-Z]/.test(part[0])) {
        part = part.trim();
        const nameSplit = part.split(/(.#)/);
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
export function dataFind(node: Element, selector: string,
                         namespaces: Record<string, string>): Element | null {
  const guiSelector = toGUISelector(selector, namespaces);
  const guiNode = $.data(node, "wed_mirror_node") as Element;
  const foundNodes = guiNode.querySelector(guiSelector);
  if (foundNodes == null) {
    return null;
  }
  const data = $.data(foundNodes, "wed_mirror_node");
  return (data != null) ? data : null;
}

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
export function dataFindAll(node: Element, selector: string,
                            namespaces: Record<string, string>): Element[] {
  const guiSelector = toGUISelector(selector, namespaces);
  const guiNode = $.data(node, "wed_mirror_node") as Element;
  const foundNodes = guiNode.querySelectorAll(guiSelector);
  const ret: Element[] = [];
  for (let i = 0; i < foundNodes.length; ++i) {
    ret.push($.data(foundNodes[i], "wed_mirror_node"));
  }
  return ret;
}

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
export function htmlToElements(html: string, document?: Document): Node[] {
  const doc = document != null ? document : window.document;
  const frag = doc.createDocumentFragment();
  const div = doc.createElement("div");
  frag.appendChild(div);
  //
  // Entire point of this function is to convert arbitrary HTML to DOM
  // elements. It is the responsibility of the caller to make sure the HTML
  // passed is clean.
  //
  // tslint:disable-next-line:no-inner-html
  div.innerHTML = html;
  const ret = Array.prototype.slice.call(div.childNodes);
  // Clear the div so that the children cannot access the DOM objects we created
  // only to convert the HTML to DOM elements.
  while (div.firstChild !== null) {
    div.removeChild(div.firstChild);
  }
  return ret;
}

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
export function getCharacterImmediatelyBefore(caret: Caret):
string | undefined {
  const [node, offset] = caret;
  switch (node.nodeType) {
  case Node.TEXT_NODE:
    const value = (node as Text).data;
    return value[offset - 1];
  case Node.ELEMENT_NODE:
    const prev = node.childNodes[offset - 1];
    if (isText(prev)) {
      return prev.data[prev.data.length - 1];
    }
    break;
  default:
    throw new Error(`unexpected node type: ${node.nodeType}`);
  }
  return undefined;
}

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
export function getCharacterImmediatelyAt(caret: Caret): string | undefined {
  const [node, offset] = caret;
  switch (node.nodeType) {
  case Node.TEXT_NODE:
    const value = (node as Text).data;
    return value[offset];
  case Node.ELEMENT_NODE:
    const next = node.childNodes[offset];
    if (isText(next)) {
      return next.data[0];
    }
    break;
  default:
    throw new Error(`unexpected node type: ${node.nodeType}`);
  }
  return undefined;
}

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
export function isNotDisplayed(el: HTMLElement,
                               root: HTMLElement | HTMLDocument): boolean {
  const win = el.ownerDocument.defaultView;

  // We don't put a menu for attributes that are somehow not
  // displayed.
  while (el != null && el !== root) {
    if (el.style.display === "none") {
      return true;
    }

    const display = win.getComputedStyle(el).getPropertyValue("display");

    if (display === "none") {
      return true;
    }

    el = el.parentNode as HTMLElement;
  }

  return false;
}

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
 * (e.g. the [["wed/dloc"]] module) should use this function as a general rule
 * so that it can work with either tree.
 *
 * @param container The thing which should contain in the test.
 *
 * @param contained The thing which should be contained in the test.
 *
 * @returns Whether ``container`` contains ``contained``.
 */
export function contains(container: Node, contained: Node): boolean {
  if (isAttr(contained)) {
    contained = contained.ownerElement!;
  }

  return container.contains(contained);
}

// Re-export, for historical reasons.
export { isAttr };

//  LocalWords:  wed's URIs rect clientTop jquery util whitespace clientLeft cd
//  LocalWords:  contenteditable abcd abfoocd insertIntoText Prepend scrollbars
//  LocalWords:  deleteText jQuery getSelectionRange prev lastChild nodeType zA
//  LocalWords:  dom deleteNode mergeTextNodes jshint insertNodeAt noop treeA
//  LocalWords:  validthis insertFragAt versa nextSibling Dubeau MPL nodeInA
//  LocalWords:  Mangalam gui DOM unlinks startContainer startOffset childNodes
//  LocalWords:  endContainer endOffset genericInsertIntoText secondNode
//  LocalWords:  parentChildCompare secondOffset firstNode
