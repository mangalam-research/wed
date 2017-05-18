/**
 * Transformation framework.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as _ from "lodash";

import { Action } from "./action";
import { DLoc } from "./dloc";
import { isDocument, isText } from "./domtypeguards";
import { Caret, firstDescendantOrSelf, indexOf,
         isWellFormedRange } from "./domutil";
import * as icon from "./gui/icon";

// tslint:disable:no-any
export type Editor = any;
export type TreeUpdater = any;
// tslint:enable:no-any

const TYPE_TO_KIND = _.extend(Object.create(null), {
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

const TYPE_TO_NODE_TYPE = _.extend(Object.create(null), {
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

/**
 * Data passed to the transformation handler. The transformation types expect
 * the following values for the parameters passed to a handler.
 *
 * Transformation Type | `node` is | `name` is the name of the:
 * --------------------|-----------|---------------------------
 * insert | undefined (we insert at caret position) | element to insert
 * delete-element | element to delete | element to delete
 * delete-parent | element to delete | element to delete
 * wrap | undefined (we wrap the current selection) | wrapping element
 * merge-with-next | element to merge | element to merge
 * merge-with-previous | element to merge | element to merge
 * swap-with-next | element to swap | element to swap
 * swap-with-previous | element to swap | element to swap
 * append | element after which to append | element after which to append
 * prepend | element before which to prepend | element before which to append
 * unwrap | node to unwrap | node to unwrap
 * add-attribute | node to which an attribute is added | attribute to add
 * delete-attribute | attribute to delete | attribute to delete
 * insert-text | node to which text is added | text to add
 */
export interface TransformationData {
  /**
   * The JavaScript event that triggered the transformation, if any.
   */
  readonly e?: Event;

  /**
   * The node to operate on. Should be set by the code that invokes the
   * transformation. This may be undefined if the transformation should rely on
   * the caret position.
   */
  node?: Node;

  /**
   * The name of the node to add, remove, etc. Should be set by the code that
   * invokes the transformation.
   */
  name: string;

  /**
   * A position to which the caret is moved before the transformation is fired.
   * **Wed performs the move.** Should be set by the code that invokes the
   * transformation.
   */
  moveCaretTo?: DLoc;
}

/**
 * @param editor The editor.
 *
 * @param data Data for the transformation.
 */
export type TransformationHandler =
  (editor: Editor, data: TransformationData) => void;

function computeIconHtml(iconHtml: string | undefined,
                         transformationType: string): string | undefined {
  if (iconHtml !== undefined) {
    return iconHtml;
  }

  const kind = TYPE_TO_KIND[transformationType];
  if (kind !== undefined) {
    return icon.makeHTML(kind);
  }

  return undefined;
}

/**
 * An operation that transforms the data tree.
 */
export class Transformation<Data extends TransformationData>
  extends Action<Data> {
  public readonly handler: TransformationHandler;
  public readonly transformationType: string;
  public readonly kind: string;
  public readonly nodeType: string;

  /**
   * @param editor The editor for which this transformation is created.
   *
   * @param transformationType The type of transformation.
   *
   * @param desc The description of this transformation. A transformation's
   * [[getDescriptionFor]] method will replace ``<name>`` with the name of the
   * node actually being processed. So a string like ``Remove <name>`` would
   * become ``Remove foo`` when the transformation is called for the element
   * ``foo``.
   *
   * @param abbreviatedDesc An abbreviated description of this transformation.
   *
   * @param iconHtml An HTML representation of the icon associated with this
   * transformation.
   *
   * @param needsInput Defaults to ``false`` for signatures that do not contain
   * this parameter. Indicates whether this action needs input from the
   * user. For instance, an action which brings up a modal dialog to ask
   * something of the user must have this parameter set to ``true``. It is
   * important to record whether an action needs input because, to take one
   * example, the ``autoinsert`` logic will try to insert automatically any
   * element it can. However, doing this for elements that need user input will
   * just confuse the user (or could cause a crash). Therefore, it is important
   * that the insertion operations for such elements be marked with
   * ``needsInput`` set to ``true`` so that the ``autoinsert`` logic backs off
   * from trying to insert these elements.
   *
   * @param handler The handler to call when this transformation is executed.
   */
  constructor(editor: Editor, transformationType: string, desc: string,
              handler: TransformationHandler);
  constructor(editor: Editor, transformationType: string, desc: string,
              abbreviatedDesc: string | undefined,
              handler: TransformationHandler);
  constructor(editor: Editor, transformationType: string, desc: string,
              abbreviatedDesc: string, iconHtml: string,
              handler: TransformationHandler);
  constructor(editor: Editor, transformationType: string, desc: string,
              abbreviatedDesc: string, iconHtml: string,
              needsInput: boolean, handler: TransformationHandler);
  constructor(editor: Editor, transformationType: string, desc: string,
              abbreviatedDesc: string | TransformationHandler | undefined,
              iconHtml?: string | TransformationHandler,
              needsInput?: boolean | TransformationHandler,
              handler?: TransformationHandler) {
    if (typeof abbreviatedDesc === "function") {
      handler = abbreviatedDesc;
      super(editor, desc, undefined,
            computeIconHtml(undefined, transformationType), false);
    }
    else if (typeof iconHtml === "function") {
      handler = iconHtml;
      super(editor, desc, abbreviatedDesc,
            computeIconHtml(undefined, transformationType), false);
    }
    else if (typeof needsInput === "function") {
      handler = needsInput;
      super(editor, desc, abbreviatedDesc,
            computeIconHtml(iconHtml, transformationType), false);
    }
    else {
      super(editor, desc, abbreviatedDesc,
            computeIconHtml(iconHtml, transformationType), needsInput);
    }

    if (handler === undefined) {
      throw new Error("did not specify a handler");
    }

    this.handler = handler;
    this.transformationType = transformationType;
    this.kind = TYPE_TO_KIND[transformationType];
    this.nodeType = TYPE_TO_NODE_TYPE[transformationType];
  }

  getDescriptionFor(data: Data): string {
    return this.desc.replace(/<name>/, data.name);
  }

  /**
   * Calls the ``fireTransformation`` method on this transformation's editor.
   *
   * @param data The data object to pass.
   */
  execute(data: Data): void {
    // Removed this during conversion to TypeScript. Did it ever make sense??
    // data = data || {};
    this.editor.fireTransformation(this, data);
  }
}

export type AttributeTable = Record<string, string>;

/**
 * Makes an element appropriate for a wed data tree.
 *
 * @param doc The document for which to make the element.
 *
 * @param ns The URI of the namespace to use for the new element.
 *
 * @param name Name of the new element.
 *
 * @param attrs An object whose fields will become attributes for the new
 * element.
 *
 * @returns The new element.
 */
export function makeElement(doc: Document, ns: string, name: string,
                            attrs?: AttributeTable): Element {
  const e = doc.createElementNS(ns, name);
  if (attrs !== undefined) {
    // Create attributes
    const keys = Object.keys(attrs).sort();
    for (const key of keys) {
      e.setAttribute(key, attrs[key]);
    }
  }
  return e;
}

/**
 * Insert an element in a wed data tree.
 *
 * @param dataUpdater A tree updater through which to update the DOM tree.
 *
 * @param parent Parent of the new node.
 *
 * @param index Offset in the parent where to insert the new node.
 *
 * @param ns The URI of the namespace to use for the new element.
 *
 * @param name Name of the new element.
 *
 * @param attrs An object whose fields will become attributes for the new
 * element.
 *
 * @returns The new element.
 */
export function insertElement(dataUpdater: TreeUpdater,
                              parent: Node, index: number, ns: string,
                              name: string,
                              attrs?: AttributeTable): Element {
  const ownerDocument = isDocument(parent) ? parent : parent.ownerDocument;
  const el = makeElement(ownerDocument, ns, name, attrs);
  dataUpdater.insertAt(parent, index, el);
  return el;
}

/**
 * Wraps a span of text in a new element.
 *
 * @param dataUpdater A tree updater through which to update the DOM tree.
 *
 * @param node The DOM node where to wrap. Must be a text node.
 *
 * @param offset Offset in the node. This parameter specifies where to start
 * wrapping.
 *
 * @param endOffset Offset in the node. This parameter specifies where to end
 * wrapping.
 *
 * @param ns The URI of the namespace to use for the new element.
 *
 * @param name Name of the wrapping element.
 *
 * @param attrs An object whose fields will become attributes for the new
 * element.
 *
 * @returns The new element.
 */
export function wrapTextInElement(dataUpdater: TreeUpdater, node: Text,
                                  offset: number, endOffset: number,
                                  ns: string, name: string,
                                  attrs?: AttributeTable): Element {
  const textToWrap = node.data.slice(offset, endOffset);

  const parent = node.parentNode;
  if (parent === null) {
    throw new Error("detached node");
  }
  const nodeOffset = indexOf(parent.childNodes, node);

  dataUpdater.deleteText(node, offset, textToWrap.length);
  const newElement = makeElement(node.ownerDocument, ns, name, attrs);

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

/**
 * Utility function for [[wrapInElement]].
 *
 * @param dataUpdater A tree updater through which to update the DOM tree.
 *
 * @param container The text node to split.
 *
 * @param offset Where to split the node
 *
 * @returns Returns a caret location marking where the split occurred.
 */
function _wie_splitTextNode(dataUpdater: TreeUpdater, container: Text,
                            offset: number): Caret {
  const parent = container.parentNode;
  if (parent === null) {
    throw new Error("detached node");
  }
  const containerOffset = indexOf(parent.childNodes, container);
  // The first two cases here just return a caret outside of the text node
  // rather than make a split that will create a useless empty text node.
  if (offset === 0) {
    offset = containerOffset;
  }
  else if (offset >= container.length) {
    offset = containerOffset + 1;
  }
  else {
    const text = container.data.slice(offset);
    dataUpdater.setTextNode(container, container.data.slice(0, offset));
    dataUpdater.insertNodeAt(parent, containerOffset + 1,
                             container.ownerDocument.createTextNode(text));

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
export function wrapInElement(dataUpdater: TreeUpdater, startContainer: Node,
                              startOffset: number, endContainer: Node,
                              endOffset: number, ns: string, name: string,
                              attrs?: AttributeTable): Element {
  if (!isWellFormedRange({ startContainer, startOffset, endContainer,
                           endOffset })) {
    throw new Error("malformed range");
  }

  if (isText(startContainer)) {
    // We already have an algorithm for this case.
    if (startContainer === endContainer) {
      return wrapTextInElement(dataUpdater, startContainer, startOffset,
                               endOffset, ns, name, attrs);
    }

    [startContainer, startOffset] =
      _wie_splitTextNode(dataUpdater, startContainer, startOffset);
  }

  if (isText(endContainer)) {
    [endContainer, endOffset] =
      _wie_splitTextNode(dataUpdater, endContainer, endOffset);
  }

  if (startContainer !== endContainer) {
    throw new Error("startContainer and endContainer are not the same;" +
                    "probably due to an algorithmic mistake");
  }

  const newElement = makeElement(startContainer.ownerDocument, ns, name, attrs);
  while (--endOffset >= startOffset) {
    const endNode = endContainer.childNodes[endOffset];
    dataUpdater.deleteNode(endNode);
    // Okay to change a tree which is not yet connected to the data tree.
    newElement.insertBefore(endNode, newElement.firstChild);
  }

  dataUpdater.insertAt(startContainer, startOffset, newElement);

  return newElement;
}

/**
 * Replaces an element with its contents.
 *
 * @param dataUpdater A tree updater through which to update the DOM tree.
 *
 * @param node The element to unwrap.
 *
 * @returns The contents of the element.
 */
export function unwrap(dataUpdater: TreeUpdater, node: Element): Node[] {
  const parent = node.parentNode;
  if (parent === null) {
    throw new Error("detached node");
  }

  const children = Array.prototype.slice.call(node.childNodes);
  const prev = node.previousSibling;
  const next = node.nextSibling;
  // This does not merge text nodes, which is what we want. We also want to
  // remove it first so that we don't generate so many update events.
  dataUpdater.deleteNode(node);

  // We want to calculate this index *after* removal.
  let nextIx = (next !== null) ? indexOf(parent.childNodes, next) :
    parent.childNodes.length;

  const lastChild = node.lastChild;

  // This also does not merge text nodes.
  while (node.firstChild != null) {
    dataUpdater.insertNodeAt(parent, nextIx++, node.firstChild);
  }

  // The order of the next two calls is important. We start at the end because
  // going the other way around could cause lastChild to leave the DOM tree.

  // Merge possible adjacent text nodes: the last child of the node that was
  // removed in the unwrapping and the node that was after the node that was
  // removed in the unwrapping.
  dataUpdater.mergeTextNodes(lastChild);

  // Merge the possible adjacent text nodes: the one before the start of the
  // children we unwrapped and the first child that was unwrapped. There may not
  // be a prev so we use the NF form of the call.
  dataUpdater.mergeTextNodesNF(prev);

  return children;
}

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
export function splitNode(editor: Editor, node: Node): void {
  const caret = editor.getDataCaret();

  if (!node.contains(caret.node)) {
    throw new Error("caret outside node");
  }

  const pair = editor.data_updater.splitAt(node, caret);
  // Find the deepest location at the start of the 2nd element.
  editor.setDataCaret(firstDescendantOrSelf(pair[1]), 0);
}

/**
 * This function merges an element with a previous element of the same name. For
 * the operation to go forward, the element must have a previous sibling and
 * this sibling must have the same name as the element being merged.
 *
 * @param editor The editor on which we are to perform the transformation.
 *
 * @param node The element to merge with previous.
 */
export function mergeWithPreviousHomogeneousSibling(editor: Editor,
                                                    node: Element): void {
  const prev = node.previousElementSibling;
  if (prev === null) {
    return;
  }

  if (prev.localName !== node.localName ||
      prev.namespaceURI !== node.namespaceURI) {
    return;
  }

  // We need to record these to set the caret to a good position.
  const caretPos = prev.childNodes.length;
  const lastChild = prev.lastChild;
  const wasText = isText(lastChild);
  // We need to record this *now* for future use, because it is possible that
  // the next loop could modify lastChild in place.
  const textLen = wasText ? (lastChild as Text).length : 0;

  const insertionPoint = prev.childNodes.length;
  // Reverse order
  for (let i = node.childNodes.length - 1; i >= 0; --i) {
    editor.data_updater.insertAt(prev, insertionPoint,
                                 node.childNodes[i].cloneNode(true));
  }

  if (wasText) {
    editor.data_updater.mergeTextNodes(lastChild);
    editor.setDataCaret(prev.childNodes[caretPos - 1], textLen);
  }
  else {
    editor.setDataCaret(prev, caretPos);
  }
  editor.data_updater.removeNode(node);
}

/**
 * This function merges an element with a next element of the same name. For the
 * operation to go forward, the element must have a next sibling and this
 * sibling must have the same name as the element being merged.
 *
 * @param editor The editor on which we are to perform the transformation.
 *
 * @param node The element to merge with next.
 */
export function mergeWithNextHomogeneousSibling(editor: Editor,
                                                node: Element): void {
  const next = node.nextElementSibling;
  if (next === null) {
    return;
  }

  mergeWithPreviousHomogeneousSibling(editor, next);
}

/**
 * This function swaps an element with a previous element of the same name. For
 * the operation to go forward, the element must have a previous sibling and
 * this sibling must have the same name as the element being merged.
 *
 * @param editor The editor on which we are to perform the transformation.
 *
 * @param node The element to swap with previous.
 */
export function swapWithPreviousHomogeneousSibling(editor: Editor,
                                                   node: Element): void {
  const prev = node.previousElementSibling;
  if (prev === null) {
    return;
  }

  if (prev.localName !== node.localName ||
      prev.namespaceURI !== node.namespaceURI) {
    return;
  }

  const parent = prev.parentNode;
  if (parent === null) {
    throw new Error("detached node");
  }

  editor.data_updater.removeNode(node);
  editor.data_updater.insertBefore(parent, node, prev);
  editor.setDataCaret(parent, indexOf(parent.childNodes, node));
}

/**
 * This function swaps an element with a next element of the same name. For the
 * operation to go forward, the element must have a next sibling and this
 * sibling must have the same name as the element being merged.
 *
 * @param editor The editor on which we are to perform the transformation.
 *
 * @param node The element to swap with next.
 */
export function swapWithNextHomogeneousSibling(editor: Editor,
                                               node: Element): void {
  const next = node.nextElementSibling;
  if (next === null) {
    return;
  }

  swapWithPreviousHomogeneousSibling(editor, next);
}

//  LocalWords:  concat prepend refman endOffset endContainer DOM oop
//  LocalWords:  startOffset startContainer html Mangalam MPL Dubeau
//  LocalWords:  previousSibling nextSibling insertNodeAt deleteNode
//  LocalWords:  mergeTextNodes lastChild prev deleteText Prepend lt
//  LocalWords:  domutil util
