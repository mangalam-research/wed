import * as rangy from "rangy";
import { Caret, RangeInfo } from "./domutil";
export declare type ValidRoots = Document | Element;
/**
 * A class for objects that are used to mark DOM nodes as roots for the purpose
 * of using DLoc objects.
 */
export declare class DLocRoot {
    readonly node: ValidRoots;
    /**
     * @param el The element to which this object is associated.
     */
    constructor(node: ValidRoots);
    /**
     * Converts a node to a path. A path is a string representation of the
     * location of a node relative to the root.
     *
     * @param node The node for which to construct a path.
     *
     * @returns The path.
     */
    nodeToPath(node: Node | Attr): string;
    /**
     * This function recovers a DOM node on the basis of a path previously created
     * by [[nodeToPath]].
     *
     * @param path The path to interpret.
     *
     * @returns The node corresponding to the path, or ``null`` if no such node
     * exists.
     *
     * @throws {Error} If given a malformed ``path``.
     */
    pathToNode(path: string): Node | Attr | null;
}
/**
 * ``DLoc`` objects model locations in a DOM tree. Although the current
 * implementation does not enforce this, **these objects are to be treated as
 * immutable**. These objects have ``node`` and ``offset`` properties that are
 * to be interpreted in the same way DOM locations usually are: the ``node`` is
 * the location of a DOM ``Node`` in a DOM tree (or an attribute), and
 * ``offset`` is a location in that node. ``DLoc`` objects are said to have a
 * ``root`` relative to which they are positioned.
 *
 * A DLoc object can point to an offset inside an ``Element``, inside a ``Text``
 * node or inside an ``Attr``.
 *
 * Use [[makeDLoc]] to make ``DLoc`` objects. Calling this constructor directly
 * is not legal.
 *
 */
export declare class DLoc {
    readonly root: ValidRoots;
    readonly node: Node | Attr;
    readonly offset: number;
    /**
     * @param root The root of the DOM tree to which this DLoc applies.
     *
     * @param node The node of the location.
     *
     * @param offset The offset of the location.
     */
    private constructor();
    /**
     * Creates a copy of the location.
     */
    clone(): DLoc;
    /**
     * Makes a location.
     *
     * @param root The root of the DOM tree to which this location belongs.
     *
     * @param node The node of the location.
     *
     * @param offset The offset of the location. If the offset is omitted, then
     * the location will point to ``node`` rather than be a location that points
     * to the node inside of ``node`` at offset ``offset``.
     *
     * @param location The location as a node, offset pair.
     *
     * @param normalize Normalize the offset to a valid value.
     *
     * @returns The location. It returns ``undefined`` if the ``node`` is "absent"
     * because it is ``undefined`` or ``null``. This is true irrespctive of the
     * signature used. If you use a [[Caret]] and it has an absent node, then the
     * result is ``undefined``.
     *
     * @throws {Error} If ``node`` is not in ``root`` or if ``root`` has not been
     * marked as a root.
     *
     */
    static makeDLoc(root: ValidRoots | DLocRoot, node: Node | Attr | undefined | null, offset?: number, normalize?: boolean): DLoc | undefined;
    static makeDLoc(root: ValidRoots | DLocRoot, location: Caret, normalize?: boolean): DLoc | undefined;
    /**
     * Same as [[DLoc.makeDLoc]] but must does not accept an "absent" node, and
     * won't ever return ``undefined``.
     */
    static mustMakeDLoc(root: ValidRoots | DLocRoot, node: Node | Attr | undefined | null, offset?: number, normalize?: boolean): DLoc;
    static mustMakeDLoc(root: ValidRoots | DLocRoot, location: Caret, normalize?: boolean): DLoc;
    /**
     * Make a new location in the same DOM tree as the current one. This is a
     * convenience function that enables avoid having to pass ``root`` around.
     *
     * @param caret A node, offset pair.
     *
     * @param node The node of the new location, if ``caret`` is not used. When a
     * node is passed without offset, the location created will point to the node.
     *
     * @param offset The offset of the new location, if ``caret`` is not used.
     *
     * @returns The new location.
     */
    make(caret: Caret): DLoc;
    make(node: Node | Attr, offset?: number): DLoc;
    /**
     * Make a new location with the same node as the current location but with a
     * new offset.
     *
     * @param offset The offset of the new location.
     *
     * @returns The new location.
     */
    makeWithOffset(offset: number): DLoc;
    /**
     * Make a new location. Let's define "current node" as the node of the current
     * location. The new location points to the current node. (The offset of the
     * current location is effectively ignored.) That is, the new location has for
     * node the parent node of the current node, and for offset the offset of the
     * current node in its parent.
     *
     * @returns The location in the parent, as described above.
     *
     * @throws {Error} If the current node has no parent.
     */
    getLocationInParent(): DLoc;
    /**
     * Same as [[getLocationInParent]] except that the location points *after* the
     * current node.
     *
     * @returns The location in the parent, as described above.
     *
     * @throws {Error} If the current node has no parent.
     */
    getLocationAfterInParent(): DLoc;
    /**
     * Converts the location to an array. This array contains only the node and
     * offset of the location. The root is not included because this method is of
     * use to pass data to functions that work with raw DOM information. These
     * functions do not typically expect a root.
     *
     * @returns The node and offset pair.
     */
    toArray(): Caret;
    /**
     * Make a range from this location. If ``other`` is not specified, the range
     * starts and ends with this location, and the return value is a range. If
     * ``other`` is specified, the range goes from this location to the ``other``
     * location. If ``other`` comes before ``this``, then the range is
     * "reversed". When ``other`` is specified, the return value is an object (see
     * below). (An undefined value for ``other`` is interpreted as an unspecified
     * ``other``.)
     *
     * @param other The other location to use.
     *
     * @returns The return value is just a range when the method is called without
     * ``other``. Otherwise, it is a range info object. The return value is
     * ``undefined`` if either ``this`` or ``other`` is invalid.
     */
    makeRange(): rangy.RangyRange | undefined;
    makeRange(other: DLoc): RangeInfo | undefined;
    /**
     * Verifies whether the ``DLoc`` object points to a valid location. The
     * location is valid if its ``node`` is a child of its ``root`` and if its
     * ``offset`` points inside the range of children of its ``node``.
     *
     * @returns {boolean} Whether the object is valid.
     */
    isValid(): boolean;
    /**
     * Creates a new ``DLoc`` object with an offset that is valid. It does this by
     * "normalizing" the offset, i.e. by setting the offset to its maximum
     * possible value.
     *
     * @returns The normalized location. This will be ``this``, if it so happens
     * that ``this`` is already valid.
     */
    normalizeOffset(): DLoc;
    /**
     * @returns Whether ``this`` and ``other`` are equal. They are equal if they
     * are the same object or if they point to the same location.
     */
    equals(other: DLoc | undefined | null): boolean;
}
/**
 * Finds the root under which a node resides. Note that in cases where an
 * undefined result is useless, you should use [[getRoot]] instead.
 *
 * @param node The node whose root we want.
 *
 * @returns The root object, or ``undefined`` if the root can't be found.
 */
export declare function findRoot(node: Node | Attr | undefined | null): DLocRoot | undefined;
/**
 * Gets the root under which a node resides.
 *
 * @param node The node whose root we want.
 *
 * @returns The root node.
 *
 * @throws {Error} If the root cannot be found.
 */
export declare function getRoot(node: Node | Attr | undefined | null): DLocRoot;
