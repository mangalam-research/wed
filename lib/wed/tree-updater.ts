/**
 * Facility for updating a DOM tree and issue synchronous events on changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { Observable, Subject } from "rxjs";

import { DLoc, DLocRoot, findRoot } from "./dloc";
import { isDocumentFragment, isElement, isNode, isText } from "./domtypeguards";
import * as domutil from "./domutil";

const indexOf = domutil.indexOf;

export interface TreeUpdaterEvent {
  name: string;
}

export interface ChangedEvent extends TreeUpdaterEvent {
  name: "Changed";
}

export interface BeforeInsertNodeAtEvent extends TreeUpdaterEvent {
  name: "BeforeInsertNodeAt";
  parent: Node;
  index: number;
  node: Node;
}

export interface InsertNodeAtEvent extends TreeUpdaterEvent {
  name: "InsertNodeAt";
  parent: Node;
  index: number;
  node: Node;
}

export interface SetTextNodeValueEvent extends TreeUpdaterEvent {
  name: "SetTextNodeValue";
  node: Text;
  value: string;
  oldValue: string;
}

export interface BeforeDeleteNodeEvent extends TreeUpdaterEvent {
  name: "BeforeDeleteNode";
  node: Node;
}

export interface DeleteNodeEvent extends TreeUpdaterEvent {
  name: "DeleteNode";
  node: Node;
  formerParent: Node;
}

export interface SetAttributeNSEvent extends TreeUpdaterEvent {
  name: "SetAttributeNS";
  node: Element;
  ns: string;
  attribute: string;
  oldValue: string | null;
  newValue: string | null;
}

export type TreeUpdaterEvents = ChangedEvent | BeforeInsertNodeAtEvent |
  InsertNodeAtEvent | SetTextNodeValueEvent | BeforeDeleteNodeEvent |
  DeleteNodeEvent | SetAttributeNSEvent;

export type InsertableAtom = string | Element | Text;
export type Insertable = InsertableAtom | InsertableAtom[] | NodeList;

export type SplitResult = [Node | null, Node | null];

/**
 * Records the results of inserting text into the tree.
 */
export interface TextInsertionResult {
  /** The node that contains the added text. */
  node: Text | undefined;

  /** Whether [[node]] is a new node. If ``false``, it was modified. */
  isNew: boolean;

  /** The caret position after the insertion. */
  caret: DLoc;
}
export type InsertionBoundaries = [DLoc, DLoc];

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
export class TreeUpdater {
  protected readonly dlocRoot: DLocRoot;
  protected readonly _events: Subject<TreeUpdaterEvents>;

  public readonly events: Observable<TreeUpdaterEvents>;
  /**
   * @param tree The node which contains the tree to update.
   */
  constructor(protected readonly tree: Element | Document) {
    const root = findRoot(tree);
    if (root === undefined) {
      throw new Error("the tree must have a DLocRoot");
    }

    this.dlocRoot = root;
    this._events = new Subject();

    this.events = this._events.asObservable();
  }

  protected _emit(event: TreeUpdaterEvents): void {
    this._events.next(event);
    this._events.next({name: "Changed"});
  }

  /**
   * A complex method. This is a convenience method that will call primitive
   * methods to insert the specified item at the specified location. Note that
   * this method returns nothing even if the primitives it uses return some
   * information.
   *
   * @param loc The location where to insert.
   *
   * @param node The node where to insert. If ``loc`` is not used.
   *
   * @param offset The offset where to insert. If ``loc`` is not used.
   *
   * @param what The data to insert.
   *
   * @throws {Error} If ``loc`` is not in an element or text node or if
   * ``what`` is not an element or text node.
   */
  insertAt(loc: DLoc, what: Insertable): void;
  insertAt(node: Node, offset: number, what: Insertable): void;
  insertAt(loc: DLoc | Node, offset: number | Insertable,
           what?: Insertable): void {
    let parent: Node;
    let index: number;
    if (loc instanceof DLoc) {
      parent = loc.node;
      index = loc.offset;
      if (typeof offset === "number") {
        throw new Error(
          "incorrect call on insertAt: offset cannot be a number");
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
      for (let i = 0; i < what.length; ++i, ++index) {
        const item = what[i];
        if (!(typeof item === "string" || isElement(item) || isText(item))) {
          throw new Error("Array or NodeList element of the wrong type");
        }
        this.insertAt(parent, index, item);
      }
    }
    else if (typeof what === "string") {
      this.insertText(parent, index, what);
    }
    else if (isText(what)) {
      switch (parent.nodeType) {
      case Node.TEXT_NODE:
        this.insertText(parent, index, what.data);
        break;
      case Node.ELEMENT_NODE:
        this.insertNodeAt(parent, index, what);
        break;
      default:
        throw new Error(`unexpected node type: ${parent.nodeType}`);
      }
    }
    else if (isElement(what)) {
      switch (parent.nodeType) {
      case Node.TEXT_NODE:
        this.insertIntoText(parent as Text, index, what);
        break;
      case Node.DOCUMENT_NODE:
      case Node.ELEMENT_NODE:
        this.insertNodeAt(parent, index, what);
        break;
      default:
        throw new Error(`unexpected node type: ${parent.nodeType}`);

      }
    }
    else {
      throw new Error(`unexpected value for what: ${what}`);
    }
  }

  /**
   * A complex method. Splits a DOM tree into two halves.
   *
   * @param top The node at which the splitting operation should end. This node
   * will be split but the function won't split anything above this node.
   *
   * @param loc The location where to start the split.
   *
   * @param node The node at which to start the split, if ``loc`` is not used.
   *
   * @param index The index at which to start in the node, if ``loc`` is not
   * used.
   *
   * @returns An array containing in order the first and second half of the
   * split.
   *
   * @throws {Error} If the split location is not inside the top node or if the
   * call would merely split a text node in two.
   */
  splitAt(top: Node, loc: DLoc): SplitResult;
  splitAt(top: Node, node: Node, index: number): SplitResult;
  splitAt(top: Node, loc: DLoc | Node, index?: number): SplitResult {
    let node;
    if (loc instanceof DLoc) {
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

    const clonedTop = top.cloneNode(true);
    const clonedNode = domutil.correspondingNode(top, clonedTop, node);

    const pair = this._splitAt(clonedTop, clonedNode, index);
    const [ first, second ] = pair;

    const parent = top.parentNode;
    if (parent === null) {
      throw new Error("called with detached top");
    }
    const at = indexOf(parent.childNodes, top);
    this.deleteNode(top);

    if (first !== null) {
      this.insertNodeAt(parent, at, first);
    }

    if (second !== null) {
      this.insertNodeAt(parent, at + 1, second);
    }
    return pair;
  }

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
  protected _splitAt(top: Node, node: Node, index: number): SplitResult {
    // We need to check this now because some operations below may remove node
    // from the DOM tree.
    const stop = (node === top);

    const parent = node.parentNode;
    let ret: SplitResult;
    if (isText(node)) {
      if (index === 0) {
        ret = [null, node];
      }
      else if (index === node.length) {
        ret = [node, null];
      }
      else {
        const textAfter = node.data.slice(index);
        node.deleteData(index, node.length - index);
        if (parent !== null) {
          parent.insertBefore(parent.ownerDocument.createTextNode(textAfter),
                              node.nextSibling);
        }
        ret = [node, node.nextSibling];
      }
    }
    else if (isElement(node)) {
      if (index < 0) {
        index = 0;
      }
      else if (index > node.childNodes.length) {
        index = node.childNodes.length;
      }

      const clone = node.cloneNode(true);
      // Remove all nodes at index and after.
      while (node.childNodes[index] != null) {
        node.removeChild(node.childNodes[index]);
      }

      // Remove all nodes before index
      while (index-- !== 0) {
        clone.removeChild(clone.firstChild!);
      }

      if (parent !== null) {
        parent.insertBefore(clone, node.nextSibling);
      }

      ret = [node, clone];
    }
    else {
      throw new Error(`unexpected node type: ${node.nodeType}`);
    }

    if (stop) { // We've just split the top, so end here...
      return ret;
    }

    if (parent === null) {
      throw new Error("unable to reach the top");
    }

    return this._splitAt(top, parent, indexOf(parent.childNodes, node) + 1);
  }

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
  insertBefore(parent: Element, toInsert: Element | Text,
               beforeThis: Node | null): void {
    // Convert it to an insertAt operation.
    const index = beforeThis == null ? parent.childNodes.length :
      indexOf(parent.childNodes, beforeThis);
    if (index === -1) {
      throw new Error("insertBefore called with a beforeThis value " +
                      "which is not a child of parent");
    }
    this.insertAt(parent, index, toInsert);
  }

  /**
   * A complex method. Inserts text into a node. This function will use already
   * existing text nodes whenever possible rather than create a new text node.
   *
   * @param loc The location at which to insert the text.
   *
   * @param node The node at which to insert the text, if ``loc`` is not used.
   *
   * @param index The location in the node at which to insert the text, if
   * ``loc`` is not used.
   *
   * @param text The text to insert.
   *
   * @param caretAtEnd Whether the returned caret should be at the end of the
   * inserted text or the start. If not specified, the default is ``true``.
   *
   * @returns The result of inserting text.
   *
   * @throws {Error} If ``node`` is not an element or text Node type.
   */
  insertText(loc: DLoc, text: string,
             caretAtEnd?: boolean): TextInsertionResult;
  insertText(node: Node, index: number, text: string,
             caretAtEnd?: boolean): TextInsertionResult;
  insertText(loc: DLoc | Node, index: number | string,
             text: string | boolean = true,
             caretAtEnd: boolean = true): TextInsertionResult {
    let node;
    if (loc instanceof DLoc) {
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

    const result = domutil.genericInsertText.call(this, node, index, text,
                                                  caretAtEnd);

    return {
      ...result,
      caret: DLoc.makeDLoc(this.dlocRoot, result.caret[0],
                           result.caret[1]),
    };
  }

  /**
   * A complex method. Deletes text from a text node. If the text node becomes
   * empty, it is deleted.
   *
   * @param loc Where to delete.
   *
   * @param node The text node from which to delete text.
   *
   * @param index The index at which to delete text.
   *
   * @param length The length of text to delete.
   */
  deleteText(loc: DLoc, length: number): void;
  deleteText(node: Text, index: number, length: number): void;
  deleteText(loc: DLoc | Text, index: number, length?: number): void {
    let node;
    if (loc instanceof DLoc) {
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

    if (!isText(node)) {
      throw new Error("deleteText called on non-text");
    }

    this.setTextNode(node, node.data.slice(0, index) +
                     node.data.slice(index + length));
  }

  /**
   * A complex method. Inserts an element into text, effectively splitting the
   * text node in two. This function takes care to modify the DOM tree only
   * once.
   *
   * @param loc The location at which to cut.
   *
   * @param parent The text node that will be cut in two by the new element.
   *
   * @param index The offset into the text node where the new element is to be
   * inserted.
   *
   * @param node The node to insert.
   *
   * @returns The first element of the array is a ``DLoc`` at the boundary
   * between what comes before the material inserted and the material
   * inserted. The second element of the array is a ``DLoc`` at the boundary
   * between the material inserted and what comes after. If I insert "foo" at
   * position 2 in "abcd", then the final result would be "abfoocd" and the
   * first location would be the boundary between "ab" and "foo" and the second
   * location the boundary between "foo" and "cd".
   *
   * @throws {Error} If the node to insert is undefined or null.
   */
  insertIntoText(loc: DLoc, node: Node): InsertionBoundaries;
  insertIntoText(parent: Text, index: number, node: Node): InsertionBoundaries;
  insertIntoText(loc: DLoc | Text, index: number | Node,
                 node?: Node): InsertionBoundaries {
    let parent;
    if (loc instanceof DLoc) {
      if (!isNode(index)) {
        throw new Error("must pass a node as the 2nd argument");
      }
      node = index;
      index = loc.offset;
      parent = loc.node;
    }
    else {
      parent = loc;
    }
    const ret = domutil.genericInsertIntoText.call(this, parent, index, node);
    return [DLoc.mustMakeDLoc(this.tree, ret[0]),
            DLoc.mustMakeDLoc(this.tree, ret[1])];
  }

  /**
   * A primitive method. Inserts a node at the specified position.
   *
   * @param loc The location at which to insert.
   * @param node The node to insert.
   * @param parent The node which will become the parent of the
   * inserted node.
   * @param index The position at which to insert the node
   * into the parent.
   *
   * @emits InsertNodeAtEvent
   * @emits ChangedEvent
   * @throws {Error} If ``node`` is a document fragment Node type.
   */
  insertNodeAt(loc: DLoc, node: Node): void;
  insertNodeAt(parent: Node, index: number, node: Node): void;
  insertNodeAt(loc: DLoc | Node, index: number | Node, node?: Node): void {
    let parent;
    if (loc instanceof DLoc) {
      if (!isNode(index)) {
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

    if (isDocumentFragment(node)) {
      throw new Error("document fragments cannot be passed to insertNodeAt");
    }

    this._emit({ name: "BeforeInsertNodeAt", parent, index, node });
    const child = parent.childNodes[index];
    parent.insertBefore(node,  child != null ? child : null);
    this._emit({ name: "InsertNodeAt", parent, index, node });
  }

  /**
   * A complex method. Sets a text node to a specified value.
   *
   * @param node The node to modify.
   *
   * @param value The new value of the node.
   *
   * @throws {Error} If called on a non-text Node type.
   */
  setTextNode(node: Text, value: string): void {
    if (!isText(node)) {
      throw new Error("setTextNode called on non-text");
    }

    if (value !== "") {
      this.setTextNodeValue(node, value);
    }
    else {
      this.deleteNode(node);
    }
  }

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
  setTextNodeValue(node: Text, value: string): void {
    if (!isText(node)) {
      throw new Error("setTextNodeValue called on non-text");
    }

    const oldValue = node.data;
    node.data = value;
    this._emit({ name: "SetTextNodeValue", node, value, oldValue });
  }

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
  removeNode(node: Node | undefined | null): DLoc {
    if (node == null) {
      throw new Error("called without a node value");
    }
    const prev = node.previousSibling;
    const parent = node.parentNode;

    if (parent === null) {
      throw new Error("called with detached node");
    }

    const ix = indexOf(parent.childNodes, node);
    this.deleteNode(node);
    if (prev === null) {
      return DLoc.mustMakeDLoc(this.tree, parent, ix);
    }
    return this.mergeTextNodes(prev);
  }

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
  removeNodeNF(node: Node | undefined | null): DLoc | undefined {
    if (node == null) {
      return undefined;
    }

    return this.removeNode(node);
  }

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
  removeNodes(nodes: Node[]): DLoc | undefined {
    if (nodes.length === 0) {
      return undefined;
    }
    const prev = nodes[0].previousSibling;
    const parent = nodes[0].parentNode;

    if (parent === null) {
      throw new Error("called with detached node");
    }

    const ix = indexOf(parent.childNodes, nodes[0]);
    for (let i = 0; i < nodes.length; ++i) {
      if (i < nodes.length - 1 && nodes[i].nextSibling !== nodes[i + 1]) {
        throw new Error("nodes are not immediately contiguous in " +
                        "document order");
      }
      this.deleteNode(nodes[i]);
    }

    if (prev === null) {
      return DLoc.makeDLoc(this.tree, parent, ix);
    }
    return this.mergeTextNodes(prev);
  }

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
  cut(start: DLoc, end: DLoc): [DLoc, Node[]] {
    const ret = domutil.genericCutFunction.call(this,
                                                start.toArray(), end.toArray());
    ret[0] = start.make(ret[0]);
    return ret;
  }

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
  mergeTextNodes(node: Node): DLoc {
    const next = node.nextSibling;
    if (isText(node) && next !== null && isText(next)) {
      const offset = node.length;
      this.setTextNodeValue(node, node.data + next.data);
      this.deleteNode(next);
      return DLoc.mustMakeDLoc(this.tree, node, offset);
    }

    const parent = node.parentNode;
    if (parent === null) {
      throw new Error("called with detached node");
    }

    return DLoc.mustMakeDLoc(this.tree, parent,
                             indexOf(parent.childNodes, node) + 1);
  }

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
  mergeTextNodesNF(node: Node | null | undefined): DLoc | undefined {
    if (node == null) {
      return undefined;
    }
    return this.mergeTextNodes(node);
  }

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
  deleteNode(node: Node): void {
    this._emit({ name: "BeforeDeleteNode", node: node });
    // The following is functionally equivalent to $(node).detach(), which is
    // what we want.
    const parent = node.parentNode;
    if (parent === null) {
      throw new Error("called with detached node");
    }

    parent.removeChild(node);
    this._emit({ name: "DeleteNode", node, formerParent: parent });
  }

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
  setAttribute(node: Element, attribute: string,
               value: string | null | undefined): void {
    this.setAttributeNS(node, "", attribute, value);
  }

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
  setAttributeNS(node: Element, ns: string, attribute: string,
                 value: string | null | undefined): void {
    // Normalize to null.
    if (value === undefined) {
      value = null;
    }

    if (!isElement(node)) {
      throw new Error("setAttribute called on non-element");
    }

    let oldValue: string | null = node.getAttributeNS(ns, attribute);
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

    this._emit({ name: "SetAttributeNS", node, ns, attribute, oldValue,
                 newValue: value });
  }

  /**
   * Converts a node to a path.
   *
   * @param node The node for which to return a path.
   *
   * @returns The path of the node relative to the root of the tree we are
   * updating.
   */
  nodeToPath(node: Node): string {
    return this.dlocRoot.nodeToPath(node);
  }

  /**
   * Converts a path to a node.
   *
   * @param path The path to convert.
   *
   * @returns The node corresponding to the path passed.
   */
  pathToNode(path: string): Node | null {
    return this.dlocRoot.pathToNode(path);
  }
}

//  LocalWords:  domutil splitAt insertAt insertText insertBefore deleteText cd
//  LocalWords:  removeNode setTextNodeValue param TreeUpdater insertNodeAt MPL
//  LocalWords:  abcd abfoocd setTextNode deleteNode pathToNode nodeToPath prev
//  LocalWords:  insertIntoText mergeTextNodes nextSibling previousSibling DOM
//  LocalWords:  Dubeau Mangalam BeforeInsertNodeAt BeforeDeleteNode DLocRoot
//  LocalWords:  SetAttributeNS NodeList nodeType beforeThis nd setAttribute
//  LocalWords:  caretAtEnd
