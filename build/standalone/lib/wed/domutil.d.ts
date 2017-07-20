import * as rangy from "rangy";
import { isAttr } from "./domtypeguards";
/**
 * Search an array.
 *
 * @param a The array to search.
 *
 * @param target The target to find.
 *
 * @return -1 if the target is not found, or its index.
 */
export declare function indexOf(a: NodeList, target: Node): number;
export declare function indexOf<T>(a: T[], target: T): number;
/**
 * Gets the first range in the selection.
 *
 * @param win The window for which we want the selection.
 *
 * @returns The first range in the selection. Undefined if there is no selection
 * or no range.
 */
export declare function getSelectionRange(win: Window): rangy.RangyRange | undefined;
/**
 * A range and a flag indicating whether it is a reversed range or not. Range
 * objects themselves do not record how they were created. If the range was
 * created from a starting point which is greater than the end point (in
 * document order), then the range is "reversed".
 */
export declare type RangeInfo = {
    range: rangy.RangyRange;
    reversed: boolean;
};
/**
 * Creates a range from two points in a document.
 *
 * @returns The range information.
 */
export declare function rangeFromPoints(startContainer: Node, startOffset: number, endContainer: Node, endOffset: number): RangeInfo;
/**
 * Focuses the node itself or if the node is a text node, focuses the parent.
 *
 * @param node Node to focus.
 *
 * @throws {Error} If the node is neither a text node nor an element. Trying to
 * focus something other than these is almost certainly an algorithmic bug.
 */
export declare function focusNode(node: Node): void;
/**
 * A caret position in the form of a pair of values. The caret we are talking
 * about here roughly corresponds to the caret that a "contenteditable" element
 * would present to the user. It can index in text nodes and element nodes but
 * not in attributes.
 */
export declare type Caret = [Node, number];
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
 * @returns Returns the next caret position, or ``null`` if such position does
 * not exist. The ``container`` parameter constrains movements to positions
 * inside it.
 */
export declare function nextCaretPosition(caret: Caret, container: Node, noText: boolean): Caret | null;
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
 * @returns Returns the previous caret position, or ``null`` if such position
 * does not exist. The ``container`` parameter constrains movements to positions
 * inside it.
 */
export declare function prevCaretPosition(caret: Caret, container: Node, noText: boolean): Caret | null;
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
export declare function correspondingNode(treeA: Node, treeB: Node, nodeInA: Node): Node;
/**
 * Makes a placeholder element
 *
 * @param text The text to put in the placeholder.
 *
 * @returns A node.
 */
export declare function makePlaceholder(text?: string): HTMLElement;
export declare type InsertionBoundaries = [Caret, Caret];
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
export declare function genericInsertIntoText(this: GenericInsertIntoTextContext, textNode: Text, index: number, node?: Node): InsertionBoundaries;
export declare type TextInsertionResult = [Text | undefined, Text | undefined];
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
 * @returns The first element of the array is the node that was modified to
 * insert the text. It will be ``undefined`` if no node was modified. The second
 * element is the text node which contains the new text. The two elements are
 * defined and equal if a text node was modified to contain the newly inserted
 * text. They are unequal if a new text node had to be created to contain the
 * new text. A return value of ``[undefined, undefined]`` means that no
 * modification occurred (because the text passed was "").
 *
 * @throws {Error} If ``node`` is not an element or text Node type.
 */
export declare function genericInsertText(this: GenericInsertTextContext, node: Node, index: number, text: string): TextInsertionResult;
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
export declare function deleteText(node: Text, index: number, length: number): void;
/**
 * This function recursively links two DOM trees through the jQuery ``.data()``
 * method. For an element in the first tree the data item named
 * "wed_mirror_node" points to the corresponding element in the second tree, and
 * vice-versa. It is presumed that the two DOM trees are perfect mirrors of each
 * other, although no test is performed to confirm this.
 */
export declare function linkTrees(rootA: Element, rootB: Element): void;
/**
 * This function recursively unlinks a DOM tree though the jQuery ``.data()``
 * method.
 *
 * @param root A DOM node.
 *
 */
export declare function unlinkTree(root: Element): void;
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
export declare function firstDescendantOrSelf(node: Node | null | undefined): Node | null;
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
export declare function lastDescendantOrSelf(node: Node | null | undefined): Node | null;
/**
 * Removes the node. Mainly for use with the generic functions defined here.
 *
 * @param node The node to remove.
 */
export declare function deleteNode(node: Node): void;
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
 * @returns The first element of the array is the node that was modified to
 * insert the text. It will be ``undefined`` if no node was modified. The second
 * element is the text node which contains the new text. The two elements are
 * defined and equal if a text node was modified to contain the newly inserted
 * text. They are unequal if a new text node had to be created to contain the
 * new text. A return value of ``[undefined, undefined]`` means that no
 * modification occurred (because the text passed was "").
 *
 * @throws {Error} If ``node`` is not an element or text Node type.
 */
export declare function insertText(node: Node, index: number, text: string): TextInsertionResult;
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
export declare function insertIntoText(textNode: Text, index: number, node: Node): InsertionBoundaries;
export declare type SplitResult = [Node, Node];
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
export declare function splitTextNode(textNode: Text, index: number): SplitResult;
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
export declare function mergeTextNodes(node: Node): Caret;
export interface RangeLike {
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
}
export declare type ElementPair = [Element, Element];
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
export declare function isWellFormedRange(range: RangeLike): boolean;
export interface GenericCutContext {
    deleteText(node: Text, index: number, length: number): void;
    deleteNode(node: Node): void;
    mergeTextNodes(node: Node): Caret;
}
export declare type CutResult = [Caret, Node[]];
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
export declare function genericCutFunction(this: GenericCutContext, startCaret: Caret, endCaret: Caret): CutResult;
/**
 * Dumps a range to the console.
 *
 * @param msg A message to output in front of the range information.
 *
 * @param range The range.
 */
export declare function dumpRange(msg: string, range?: RangeLike): void;
/**
 * Dumps the current selection to the console.
 *
 * @param msg A message to output in front of the range information.
 *
 * @param win The window for which to dump selection information.
 */
export declare function dumpCurrentSelection(msg: string, win: Window): void;
/**
 * Dumps a range to a string.
 *
 * @param msg A message to output in front of the range information.
 *
 * @param range The range.
 */
export declare function dumpRangeToString(msg: string, range?: RangeLike): string;
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
export declare function pointInContents(element: Element, x: number, y: number): boolean;
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
export declare function closest(node: Node | undefined | null, selector: string, limit?: Element | Document): Element | null;
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
export declare function closestByClass(node: Node | undefined | null, cl: string, limit?: Element | Document): Element | null;
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
export declare function siblingByClass(node: Node, cl: string): Element | null;
/**
 * Find children matching the class.
 *
 * @param node The element whose children we are looking for.
 *
 * @param cl The class to use for matches.
 *
 * @returns The children (in document order) that match the class.
 */
export declare function childrenByClass(node: Node, cl: string): Element[];
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
export declare function childByClass(node: Node, cl: string): Element | null;
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
export declare function textToHTML(text: string): string;
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
 * @returns The converted selector.
 */
export declare function toGUISelector(selector: string): string;
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
 * @returns The resulting data node.
 */
export declare function dataFind(node: Element, selector: string): Element | null;
/**
 * Allows applying simple CSS selectors on the data tree as if it were an HTML
 * tree. Operates like [[dataFind]] but returns an array of nodes.
 *
 * @param node The data node to use as the starting point of the query.
 *
 * @param selector The selector to use.
 *
 * @returns The resulting data nodes.
 */
export declare function dataFindAll(node: Element, selector: string): Element[];
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
export declare function htmlToElements(html: string, document?: Document): Node[];
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
export declare function getCharacterImmediatelyBefore(caret: Caret): string | undefined;
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
export declare function getCharacterImmediatelyAt(caret: Caret): string | undefined;
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
export declare function isNotDisplayed(el: HTMLElement, root: Element): boolean;
export { isAttr };
