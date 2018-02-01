/**
 * Facility for updating a DOM tree and issue synchronous events on changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { DLoc, DLocRoot } from "./dloc";
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
export declare type TreeUpdaterEvents = ChangedEvent | BeforeInsertNodeAtEvent | InsertNodeAtEvent | SetTextNodeValueEvent | BeforeDeleteNodeEvent | DeleteNodeEvent | SetAttributeNSEvent;
export declare type InsertableAtom = string | Element | Text;
export declare type Insertable = InsertableAtom | InsertableAtom[] | NodeList;
export declare type SplitResult = [Node | null, Node | null];
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
export declare type InsertionBoundaries = [DLoc, DLoc];
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
export declare class TreeUpdater {
    protected readonly tree: Element | Document;
    protected readonly dlocRoot: DLocRoot;
    protected readonly _events: Subject<TreeUpdaterEvents>;
    readonly events: Observable<TreeUpdaterEvents>;
    /**
     * @param tree The node which contains the tree to update.
     */
    constructor(tree: Element | Document);
    protected _emit(event: TreeUpdaterEvents): void;
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
    protected _splitAt(top: Node, node: Node, index: number): SplitResult;
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
    insertBefore(parent: Element, toInsert: Element | Text, beforeThis: Node | null): void;
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
    insertText(loc: DLoc, text: string, caretAtEnd?: boolean): TextInsertionResult;
    insertText(node: Node, index: number, text: string, caretAtEnd?: boolean): TextInsertionResult;
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
    /**
     * A complex method. Sets a text node to a specified value.
     *
     * @param node The node to modify.
     *
     * @param value The new value of the node.
     *
     * @throws {Error} If called on a non-text Node type.
     */
    setTextNode(node: Text, value: string): void;
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
    setTextNodeValue(node: Text, value: string): void;
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
    removeNode(node: Node | undefined | null): DLoc;
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
    removeNodeNF(node: Node | undefined | null): DLoc | undefined;
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
    removeNodes(nodes: Node[]): DLoc | undefined;
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
    cut(start: DLoc, end: DLoc): [DLoc, Node[]];
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
    mergeTextNodes(node: Node): DLoc;
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
    mergeTextNodesNF(node: Node | null | undefined): DLoc | undefined;
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
    deleteNode(node: Node): void;
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
    setAttribute(node: Element, attribute: string, value: string | null | undefined): void;
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
    setAttributeNS(node: Element, ns: string, attribute: string, value: string | null | undefined): void;
    /**
     * Converts a node to a path.
     *
     * @param node The node for which to return a path.
     *
     * @returns The path of the node relative to the root of the tree we are
     * updating.
     */
    nodeToPath(node: Node): string;
    /**
     * Converts a path to a node.
     *
     * @param path The path to convert.
     *
     * @returns The node corresponding to the path passed.
     */
    pathToNode(path: string): Node | null;
}
