/**
 * Model for DOM locations.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import $ from "jquery";
import { isAttr, isDocument, isElement } from "./domtypeguards";
import { Caret, comparePositions, contains, indexOf, rangeFromPoints,
         RangeInfo } from "./domutil";

export type ValidRoots = Document | Element;

/**
 * A class for objects that are used to mark DOM nodes as roots for the purpose
 * of using DLoc objects.
 */
export class DLocRoot {
  /**
   * @param el The element to which this object is associated.
   */
  constructor(public readonly node: ValidRoots) {
    if ($.data(node, "wed-dloc-root") != null) {
      throw new Error("node already marked as root");
    }

    $.data(node, "wed-dloc-root", this);
  }

  /**
   * Converts a node to a path. A path is a string representation of the
   * location of a node relative to the root.
   *
   * @param node The node for which to construct a path.
   *
   * @returns The path.
   */
  nodeToPath(node: Node | Attr): string {
    if (node == null) {
      throw new Error("invalid node parameter");
    }

    const root = this.node;
    if (root === node) {
      return "";
    }

    if (!contains(root, node)) {
      throw new Error("node is not a descendant of root");
    }

    const ret = [];
    while (node !== root) {
      let parent;
      if (isAttr(node)) {
        parent = node.ownerElement;
        ret.unshift(`@${node.name}`);
      }
      else {
        let offset = 0;

        parent = node.parentNode;

        let offsetNode = node.previousSibling;
        while (offsetNode !== null) {
          const t = offsetNode.nodeType;
          if ((t === Node.TEXT_NODE) || (t === Node.ELEMENT_NODE)) {
            offset++;
          }
          offsetNode = offsetNode.previousSibling;
        }

        ret.unshift(String(offset));
      }

      // We checked whether the node is contained by root so we should never run
      // into a null parent.
      node = parent!;
    }

    return ret.join("/");
  }

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
  pathToNode(path: string): Node | Attr | null {
    const root = this.node;

    if (path === "") {
      return root;
    }

    const parts = path.split(/\//);
    let parent: Node = root;

    let attribute;
    // Set aside the last part if it is an attribute.
    if (parts[parts.length - 1][0] === "@") {
      attribute = parts.pop();
    }

    for (const part of parts) {
      if (/^(\d+)$/.test(part)) {
        let index = parseInt(part);
        let found = null;
        let node = parent.firstChild;
        while (node !== null && found === null) {
          const t = node.nodeType;

          if ((t === Node.TEXT_NODE || (t === Node.ELEMENT_NODE)) &&
              --index < 0) {
            found = node;
          }

          node = node.nextSibling;
        }

        if (found === null) {
          return null;
        }

        parent = found;
      }
      else {
        throw new Error("malformed path expression");
      }
    }

    if (attribute === undefined) {
      return parent;
    }

    if (!isElement(parent)) {
      throw new Error(`parent must be an element since we are looking for an \
attribute`);
    }

    return parent.getAttributeNode(attribute.slice(1));
  }
}

function getTestLength(node: Node | Attr): number {
  let testLength;
  if (isAttr(node)) {
    testLength = node.value.length;
  }
  else {
    switch (node.nodeType) {
    case Node.TEXT_NODE:
      testLength = (node as Text).data.length;
      break;
    case Node.DOCUMENT_NODE:
    case Node.ELEMENT_NODE:
      testLength = node.childNodes.length;
      break;
    default:
      throw new Error("unexpected node type");
    }
  }
  return testLength;
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
export class DLoc {
  /**
   * @param root The root of the DOM tree to which this DLoc applies.
   *
   * @param node The node of the location.
   *
   * @param offset The offset of the location.
   */
  private constructor(public readonly root: ValidRoots,
                      public readonly node: Node | Attr,
                      public readonly offset: number) {}

  /**
   * This is the node to which this location points. For locations pointing to
   * attributes and text nodes, that's the same as [[node]]. For locations
   * pointing to an element, that's the child to which the ``node, offset`` pair
   * points. Since this pair may point after the last child of an element, the
   * child obtained may be ``undefined``.
   */
  get pointedNode(): Node | Attr | undefined {
    if (isElement(this.node)) {
      return this.node.childNodes[this.offset];
    }

    return this.node;
  }

  /**
   * Creates a copy of the location.
   */
  clone(): DLoc {
    return new DLoc(this.root, this.node, this.offset);
  }

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
   * @param normalize Whether to normalize the offset to a valid value.
   *
   * @returns The location. It returns ``undefined`` if the ``node`` is "absent"
   * because it is ``undefined`` or ``null``. This is true irrespective of the
   * signature used. If you use a [[Caret]] and it has an absent node, then the
   * result is ``undefined``.
   *
   * @throws {Error} If ``node`` is not in ``root`` or if ``root`` has not been
   * marked as a root.
   *
   */
  static makeDLoc(root: ValidRoots | DLocRoot,
                  node: Node | Attr | undefined | null,
                  offset?: number, normalize?: boolean): DLoc | undefined;
  static makeDLoc(root: ValidRoots | DLocRoot, location: Caret,
                  normalize?: boolean): DLoc | undefined;
  static makeDLoc(root: ValidRoots | DLocRoot,
                  node: Node | Attr | Caret | undefined | null,
                  offset?: number | boolean,
                  normalize?: boolean): DLoc | undefined {
    if (node instanceof Array) {
      normalize = offset as boolean;
      [node, offset] = node as Caret;
    }

    if (normalize === undefined) {
      normalize = false;
    }

    if (node == null) {
      return undefined;
    }

    if (offset === undefined) {
      const parent = node.parentNode;
      if (parent === null) {
        throw new Error("trying to get parent of a detached node");
      }

      offset = indexOf(parent.childNodes, node);
      node = parent;
    }
    else {
      if (typeof offset !== "number") {
        throw new Error("offset is not a number, somehow");
      }

      if (offset < 0) {
        if (normalize) {
          offset = 0;
        }
        else {
          throw new Error("negative offsets are not allowed");
        }
      }
    }

    if (root instanceof DLocRoot) {
      root = root.node;
    }
    else if ($.data(root, "wed-dloc-root") == null) {
      throw new Error("root has not been marked as a root");
    }

    if (!contains(root, node)) {
      throw new Error("node not in root");
    }

    const testLength = getTestLength(node);
    if (offset > testLength) {
      if (normalize) {
        offset = testLength;
      }
      else {
        throw new Error("offset greater than allowable value");
      }
    }

    return new DLoc(root, node, offset);
  }

  /**
   * Same as [[DLoc.makeDLoc]] but must does not accept an "absent" node, and
   * won't ever return ``undefined``.
   */
  static mustMakeDLoc(root: ValidRoots | DLocRoot,
                      node: Node | Attr | undefined | null,
                      offset?: number, normalize?: boolean): DLoc;
  static mustMakeDLoc(root: ValidRoots | DLocRoot, location: Caret,
                      normalize?: boolean): DLoc;
  // @ts-ignore
  static mustMakeDLoc(root: ValidRoots | DLocRoot,
                      node: Node | Attr | Caret | undefined | null,
                      // @ts-ignore
                      offset?: number | boolean,
                      // @ts-ignore
                      normalize?: boolean): DLoc {
    let nodeToCheck = node;
    if (nodeToCheck instanceof Array) {
      nodeToCheck = nodeToCheck[0];
    }

    if (nodeToCheck == null) {
      throw new Error("called mustMakeDLoc with an absent node");
    }

    return this.makeDLoc.apply(this, arguments);
  }

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
  make(node: Node | Attr | Caret, offset?: number): DLoc {
    if (node instanceof Array) {
      return DLoc.mustMakeDLoc(this.root, node);
    }

    if (offset !== undefined && typeof offset !== "number") {
      throw new Error(
        "if the 1st argument is a node, the 2nd must be a number or undefined");
    }

    return DLoc.mustMakeDLoc(this.root, node, offset);
  }

  /**
   * Make a new location with the same node as the current location but with a
   * new offset.
   *
   * @param offset The offset of the new location.
   *
   * @returns The new location.
   */
  makeWithOffset(offset: number): DLoc {
    if (offset === this.offset) {
      return this;
    }

    return this.make(this.node, offset);
  }

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
  getLocationInParent(): DLoc {
    const node = this.node;
    const parent = node.parentNode;
    if (parent === null) {
      throw new Error("trying to get parent of a detached node");
    }

    return this.make(parent, indexOf(parent.childNodes, node));
  }

  /**
   * Same as [[getLocationInParent]] except that the location points *after* the
   * current node.
   *
   * @returns The location in the parent, as described above.
   *
   * @throws {Error} If the current node has no parent.
   */
  getLocationAfterInParent(): DLoc {
    const node = this.node;
    const parent = node.parentNode;
    if (parent === null) {
      throw new Error("trying to get parent of a detached node");
    }

    return this.make(parent, indexOf(parent.childNodes, node) + 1);
  }

  /**
   * Converts the location to an array. This array contains only the node and
   * offset of the location. The root is not included because this method is of
   * use to pass data to functions that work with raw DOM information. These
   * functions do not typically expect a root.
   *
   * @returns The node and offset pair.
   */
  toArray(): Caret {
    return [this.node, this.offset];
  }

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
   *
   * @throws {Error} If trying to make a range from an attribute node. DOM
   * ranges can only point into elements or text nodes.
   */
  makeRange(): Range | undefined;
  makeRange(other: DLoc): RangeInfo | undefined;
  makeRange(other?: DLoc): Range | RangeInfo | undefined {
    if (isAttr(this.node)) {
      throw new Error("cannot make range from attribute node");
    }

    if (!this.isValid()) {
      return undefined;
    }

    if (other === undefined) {
      const range = this.node.ownerDocument.createRange();
      range.setStart(this.node, this.offset);
      return range;
    }

    if (isAttr(other.node)) {
      throw new Error("cannot make range from attribute node");
    }

    if (!other.isValid()) {
      return undefined;
    }

    return rangeFromPoints(this.node, this.offset, other.node, other.offset);
  }

  /**
   * Make a range from this location. If ``other`` is not specified, the range
   * starts and ends with this location. If ``other`` is specified, the range
   * goes from this location to the ``other`` location.
   *
   * @param other The other location to use.
   *
   * @returns The range.
   */
  makeDLocRange(other?: DLoc): DLocRange | undefined {
    if (!this.isValid()) {
      return undefined;
    }

    if (other === undefined) {
      // tslint:disable-next-line:no-use-before-declare
      return new DLocRange(this, this);
    }

    if (!other.isValid()) {
      return undefined;
    }

    // tslint:disable-next-line:no-use-before-declare
    return new DLocRange(this, other);
  }

  /**
   * Like [[makeDLocRange]] but throws if it cannot make a range, rather than
   * return ``undefined``.
   */
  mustMakeDLocRange(other?: DLoc): DLocRange {
    const ret = other !== undefined ?
      this.makeDLocRange(other) : this.makeDLocRange();
    if (ret === undefined) {
      throw new Error("cannot make a range");
    }

    return ret;
  }

  /**
   * Verifies whether the ``DLoc`` object points to a valid location. The
   * location is valid if its ``node`` is a child of its ``root`` and if its
   * ``offset`` points inside the range of children of its ``node``.
   *
   * @returns {boolean} Whether the object is valid.
   */
  isValid(): boolean {
    const node = this.node;
    // We do not check that offset is greater than 0 as this would be
    // done while constructing the object.
    return this.root.contains(isAttr(node) ? node.ownerElement! : node) &&
      this.offset <= getTestLength(node);
  }

  /**
   * Creates a new ``DLoc`` object with an offset that is valid. It does this by
   * "normalizing" the offset, i.e. by setting the offset to its maximum
   * possible value.
   *
   * @returns The normalized location. This will be ``this``, if it so happens
   * that ``this`` is already valid.
   */
  normalizeOffset(): DLoc {
    const node = this.node;

    const testLength = getTestLength(node);
    if (this.offset > testLength) {
      return this.make(node, testLength);
    }

    return this;
  }

  /**
   * @returns Whether ``this`` and ``other`` are equal. They are equal if they
   * are the same object or if they point to the same location.
   */
  equals(other: DLoc | undefined | null): boolean {
    if (other == null) {
      return false;
    }

    return this === other ||
      (this.node === other.node) &&
      (this.offset === other.offset);
  }

  /**
   * Compare two locations. Note that for attribute ordering, this class
   * arbitrarily decides that the order of two attributes on the same element is
   * the same as the order of their ``name`` fields as if they were sorted in an
   * array with ``Array.prototype.sort()``. This differs from how
   * ``Node.compareDocumentPosition`` determines the order of attributes. We
   * want something stable, which is not implementation dependent. In all other
   * cases, the nodes are compared in the same way
   * ``Node.compareDocumentPosition`` does.
   *
   * @param other The other location to compare this one with.
   *
   * @returns ``0`` if the locations are the same. ``-1`` if this location comes
   * first. ``1`` if the other location comes first.
   *
   * @throws {Error} If the nodes are disconnected.
   */
  compare(other: DLoc): -1 | 0 | 1 {
    if (this.equals(other)) {
      return 0;
    }

    let { node: thisNode, offset: thisOffset } = this;
    let { node: otherNode, offset: otherOffset } = other;

    // We need to handle attributes specially, because
    // ``compareDocumentPosition`` does not work reliably with attribute nodes.
    if (isAttr(thisNode)) {
      if (isAttr(otherNode)) {
        // We do not want an implementation-specific order when we compare
        // attributes. So we perform our own test.
        if (thisNode.ownerElement === otherNode.ownerElement) {
          // It is not clear what the default comparison function is, so create
          // a temporary array and sort.
          const names = [thisNode.name, otherNode.name].sort();
          // 0 is not a possible value here because it is not possible for
          // thisNode.name to equal otherNode.name.
          return names[0] === thisNode.name ? -1 : 1;
        }
      }

      const owner = thisNode.ownerElement!;
      if (owner === other.pointedNode) {
        // This location points into an attribute that belongs to the node
        // that other points to. So this is later than other.
        return 1;
      }

      // If we get here we'll rely on ``compareDocumentPosition`` but using the
      // position of the element that has the attribute.
      thisNode = owner.parentNode!;
      thisOffset = indexOf(thisNode.childNodes, owner);
    }

    if (isAttr(otherNode)) {
      const owner = otherNode.ownerElement!;
      if (owner === this.pointedNode) {
        // The other location points into an attribute that belongs to the node
        // that this location points to. So this is earlier than other.
        return -1;
      }

      // If we get here we'll rely on ``compareDocumentPosition`` but using the
      // position of the element that has the attribute.
      otherNode = owner.parentNode!;
      otherOffset = indexOf(otherNode.childNodes, owner);
    }

    return comparePositions(thisNode, thisOffset, otherNode, otherOffset);
  }
}

/**
 * Finds the root under which a node resides. Note that in cases where an
 * undefined result is useless, you should use [[getRoot]] instead.
 *
 * @param node The node whose root we want.
 *
 * @returns The root object, or ``undefined`` if the root can't be found.
 */
export function findRoot(node: Node | Attr | undefined | null):
DLocRoot | undefined {
  while (node != null) {
    if (isElement(node) || isDocument(node)) {
      const root = $.data(node, "wed-dloc-root");
      if (root != null) {
        return root;
      }
    }
    node = node.parentNode;
  }
  return undefined;
}

/**
 * Gets the root under which a node resides.
 *
 * @param node The node whose root we want.
 *
 * @returns The root node.
 *
 * @throws {Error} If the root cannot be found.
 */
export function getRoot(node: Node | Attr | undefined | null): DLocRoot {
  const ret = findRoot(node);
  if (ret == null) {
    throw new Error("no root found");
  }
  return ret;
}

/**
 * Represents a range spanning locations indicated by two [[DLoc]] objects.
 * Though this is not enforced at the VM level, objects of this class are to be
 * considered immutable.
 */
export class DLocRange {
  /**
   * @param start The start of the range.
   * @param end The end of the range.
   */
  constructor(readonly start: DLoc, readonly end: DLoc) {
    if (start.root !== end.root) {
      throw new Error("the start and end must be in the same document");
    }
  }

  /** Whether this range is collapsed. */
  get collapsed(): boolean {
    return this.start.equals(this.end);
  }

  /**
   * Make a DOM range.
   *
   * @returns The range. Or ``undefined`` if either the start or end are not
   * pointing to valid positions.
   *
   * @throws {Error} If trying to make a range from an attribute node. DOM
   * ranges can only point into elements or text nodes.
   */
  makeDOMRange(): Range | undefined {
    if (isAttr(this.start.node)) {
      throw new Error("cannot make range from attribute node");
    }

    if (!this.start.isValid()) {
      return undefined;
    }

    if (isAttr(this.end.node)) {
      throw new Error("cannot make range from attribute node");
    }

    if (!this.end.isValid()) {
      return undefined;
    }

    return rangeFromPoints(this.start.node, this.start.offset, this.end.node,
                           this.end.offset).range;
  }

  /**
   * Same as [[makeDOMRange]] but throws instead of returning ``undefined``.
   */
  mustMakeDOMRange(): Range {
    const ret = this.makeDOMRange();
    if (ret === undefined) {
      throw new Error("cannot make a range");
    }

    return ret;
  }

  /**
   * @returns Whether ``this`` and ``other`` are equal. They are equal if they
   * are the same object or if they have equal start and ends.
   */
  equals(other: DLocRange | undefined | null): boolean {
    if (other == null) {
      return false;
    }

    return this === other ||
      (this.start.equals(other.start) && this.end.equals(other.end));
  }

  /**
   * @returns Whether the two endpoints of the range are valid.
   */
  isValid(): boolean {
    return this.start.isValid() && this.end.isValid();
  }

  /**
   * @param loc The location to test.
   *
   * @returns Whether a location is within the range.
   */
  contains(loc: DLoc): boolean {
    const startTest = this.start.compare(loc);
    const endTest = this.end.compare(loc);
    // Reversed ranges are valid. So one end must be lower or equal to loc, and
    // the other end must be greater or equal to loc. The following test ensures
    // this. (If both are -1, then the result is > 0, and if both are 1, then
    // then result > 0.)
    return startTest * endTest <= 0;
  }
}

//  LocalWords:  makeDLoc DLoc domutil jquery MPL dloc mustMakeDLoc nd thisNode
//  LocalWords:  otherNode compareDocumentPosition makeDOMRange
