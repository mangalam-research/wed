/**
 * Transformation framework.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import _ from "lodash";
import { ObjectUnsubscribedError, Subject } from "rxjs";

import { Action } from "./action";
import { DLoc } from "./dloc";
import { isDocument, isText } from "./domtypeguards";
import { Caret, firstDescendantOrSelf, indexOf,
         isWellFormedRange } from "./domutil";
import { AbortTransformationException } from "./exceptions";
import * as icon from "./gui/icon";
import { EditorAPI } from "./mode-api";
import { TreeUpdater } from "./tree-updater";

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
  name?: string;

  /**
   * A position to which the caret is moved before the transformation is fired.
   * **Wed performs the move.** Should be set by the code that invokes the
   * transformation.
   */
  moveCaretTo?: DLoc;
}

export interface NamedTransformationData extends TransformationData {
  name: string;
}

/**
 * @param editor The editor.
 *
 * @param data The data for the transformation.
 */
export type TransformationHandler<Data extends TransformationData> =
  (editor: EditorAPI, data: Data) => void;

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

export interface TransformationOptions {
  /**  An abbreviated description of this transformation. */
  abbreviatedDesc?: string;

  /** An HTML representation of the icon associated with this transformation. */
  iconHtml?: string;

  /**
   * Indicates whether this action needs input from the user. For instance, an
   * action which brings up a modal dialog to ask something of the user must
   * have this parameter set to ``true``. It is important to record whether an
   * action needs input because, to take one example, the ``autoinsert`` logic
   * will try to insert automatically any element it can. However, doing this
   * for elements that need user input will just confuse the user (or could
   * cause a crash). Therefore, it is important that the insertion operations
   * for such elements be marked with ``needsInput`` set to ``true`` so that the
   * ``autoinsert`` logic backs off from trying to insert these elements.
   *
   * Defaults to ``false`` if not specified.
   */
  needsInput?: boolean;
}

/**
 * An operation that transforms the data tree.
 */
export class Transformation<Data extends TransformationData,
Handler extends TransformationHandler<Data> = TransformationHandler<Data>>
  extends Action<Data> {
  public readonly handler: Handler;
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
   * @param handler The handler to call when this transformation is executed.
   *
   * @param options Additional options.
   */
  constructor(editor: EditorAPI, transformationType: string, desc: string,
              handler: Handler, options?: TransformationOptions) {
    const actualOpts = options !== undefined ? options : {};
    super(editor, desc, actualOpts.abbreviatedDesc,
          computeIconHtml(actualOpts.iconHtml, transformationType),
          actualOpts.needsInput);

    if (handler === undefined) {
      throw new Error("did not specify a handler");
    }

    this.handler = handler;
    this.transformationType = transformationType;
    this.kind = TYPE_TO_KIND[transformationType];
    this.nodeType = TYPE_TO_NODE_TYPE[transformationType];
  }

  getDescriptionFor(data: Data): string {
    if (data.name === undefined) {
      return this.desc;
    }

    return this.desc.replace(/<name>/, data.name);
  }

  /**
   * Calls the ``fireTransformation`` method on this transformation's editor.
   *
   * @param data The data object to pass.
   */
  execute(data: Data): void {
    this.editor.fireTransformation(this, data);
  }
}

/**
 * Transformation events are generated by an editor before and after a
 * transformation is executed. The ``StartTransformation`` event is generated
 * before, and the ``EndTransformation`` is generated after. These events allow
 * modes to perform additional processing before or after a transformation, or
 * to abort a transformation while it is being processed.
 */
export class TransformationEvent {
  private _aborted: boolean = false;
  private _abortMessage?: string;
  /**
   * @param name The name of the event.
   * @param transformation The transformation to which the event pertains.
   */
  constructor(readonly name: "StartTransformation" | "EndTransformation",
              readonly transformation: Transformation<TransformationData>) {}

  /** Whether the transformation is aborted. */
  get aborted(): boolean {
    return this._aborted;
  }

  /**
   * Mark the transformation as aborted. Once aborted, a transformation cannot
   * be unaborted.
   */
  abort(message: string): void {
    this._aborted = true;
    this._abortMessage = message;
  }

  /**
   * Raise an [[AbortTransformationException]] if the event was marked as
   * aborted.
   */
  throwIfAborted(): void {
    if (this.aborted) {
      throw new AbortTransformationException(this._abortMessage!);
    }
  }
}

/**
 * A subject that emits [[TransformationEvent]] objects and immediately stops
 * calling subscribers when the [[TransformationEvent]] object it is processing
 * is aborted.
 */
export class TransformationEventSubject extends Subject<TransformationEvent> {

  next(value: TransformationEvent): void {
    if (this.closed) {
      throw new ObjectUnsubscribedError();
    }

    if (this.isStopped || value.aborted) {
      return;
    }

    for (const observer of this.observers.slice()) {
      observer.next(value);
      if (value.aborted) {
        break;
      }
    }
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
 * @param name The name of the new element.
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
 * @returns A caret location marking where the split occurred.
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
  if (lastChild !== null) {
    dataUpdater.mergeTextNodes(lastChild);
  }

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
export function splitNode(editor: EditorAPI, node: Node): void {
  const caret = editor.caretManager.getDataCaret();

  if (caret === undefined) {
    throw new Error("no caret");
  }

  if (!node.contains(caret.node)) {
    throw new Error("caret outside node");
  }

  const pair = editor.dataUpdater.splitAt(node, caret);
  // Find the deepest location at the start of the 2nd element.
  editor.caretManager.setCaret(firstDescendantOrSelf(pair[1]), 0);
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
export function mergeWithPreviousHomogeneousSibling(editor: EditorAPI,
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
    editor.dataUpdater.insertAt(
      prev, insertionPoint,
      node.childNodes[i].cloneNode(true) as (Element | Text));
  }

  if (wasText) {
    // If wasText is true, lastChild cannot be null.
    editor.dataUpdater.mergeTextNodes(lastChild!);
    editor.caretManager.setCaret(prev.childNodes[caretPos - 1], textLen);
  }
  else {
    editor.caretManager.setCaret(prev, caretPos);
  }
  editor.dataUpdater.removeNode(node);
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
export function mergeWithNextHomogeneousSibling(editor: EditorAPI,
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
export function swapWithPreviousHomogeneousSibling(editor: EditorAPI,
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

  editor.dataUpdater.removeNode(node);
  editor.dataUpdater.insertBefore(parent as Element, node, prev);
  editor.caretManager.setCaret(node);
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
export function swapWithNextHomogeneousSibling(editor: EditorAPI,
                                               node: Element): void {
  const next = node.nextElementSibling;
  if (next === null) {
    return;
  }

  swapWithPreviousHomogeneousSibling(editor, next);
}

/**
 * Remove markup from the current selection. This turns mixed content into pure
 * text. The selection must be well-formed, otherwise the transformation is
 * aborted.
 *
 * @param editor The editor for which we are doing the transformation.
 */
export function removeMarkup(editor: EditorAPI): void {
  const selection = editor.caretManager.sel;

  // Do nothing if we don't have a selection.
  if (selection === undefined || selection.collapsed) {
    return;
  }

  if (!selection.wellFormed) {
    editor.modals.getModal("straddling").modal();
    throw new AbortTransformationException("selection is not well-formed");
  }

  const [start, end] = selection.asDataCarets()!;
  const cutRet = editor.dataUpdater.cut(start, end);
  let newText = "";
  const cutNodes = cutRet[1];
  for (const el of cutNodes) {
    newText += el.textContent;
  }

  const insertRet = editor.dataUpdater.insertText(cutRet[0], newText);
  editor.caretManager.setRange(
    start.make(insertRet.node!, insertRet.isNew ? cutRet[0].offset : 0),
    insertRet.caret);
}

//  LocalWords:  wasText endOffset prepend endContainer startOffset html DOM
//  LocalWords:  startContainer Mangalam Dubeau previousSibling nextSibling MPL
//  LocalWords:  insertNodeAt deleteNode mergeTextNodes lastChild prev Prepend
//  LocalWords:  deleteText domutil
