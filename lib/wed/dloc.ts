/**
 * Model for DOM locations.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as $ from "jquery";
import * as rangy from "rangy";
import { isAttr, isDocument, isElement } from "./domtypeguards";
import { Caret, rangeFromPoints, RangeInfo } from "./domutil";

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

    let checkNode = node;
    if (isAttr(node)) {
      checkNode = node.ownerElement;
    }

    if (!root.contains(checkNode)) {
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
 * A DLoc object can point to an offset inside an [[Element]], inside a [[Text]]
 * node or inside an [[Attr]].
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
   * @param offset The offset of the location.
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
  static makeDLoc(root: ValidRoots | DLocRoot,
                  node: Node | Attr | undefined | null,
                  offset: number, normalize?: boolean): DLoc | undefined;
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

    if (root instanceof DLocRoot) {
      root = root.node;
    }
    else if ($.data(root, "wed-dloc-root") == null) {
      throw new Error("root has not been marked as a root");
    }

    if (isAttr(node)) {
      if (!root.contains(node.ownerElement)) {
        throw new Error("node not in root");
      }
    }
    else if (!root.contains(node)) {
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
                      offset: number, normalize?: boolean): DLoc;
  static mustMakeDLoc(root: ValidRoots | DLocRoot, location: Caret,
                      normalize?: boolean): DLoc;
  static mustMakeDLoc(root: ValidRoots | DLocRoot,
                      node: Node | Attr | Caret | undefined | null,
                      offset?: number | boolean,
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
   * @param node The node of the new location, if ``caret`` is not used.
   *
   * @param offset The offset of the new location, if ``caret`` is not used.
   *
   * @returns The new location.
   */
  make(caret: Caret): DLoc;
  make(node: Node | Attr, offset: number): DLoc;
  make(node: Node | Attr | Caret, offset?: number): DLoc {
    if (node instanceof Array) {
      return DLoc.mustMakeDLoc(this.root, node);
    }

    if (typeof offset !== "number") {
      throw new Error(
        "if the 1st argument is a node, the 2nd must be a number");
    }

    return DLoc.mustMakeDLoc(this.root, node, offset);
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
   */
  makeRange(): rangy.RangyRange | undefined;
  makeRange(other: DLoc): RangeInfo | undefined;
  makeRange(other?: DLoc): rangy.RangyRange | RangeInfo | undefined {
    if (isAttr(this.node)) {
      throw new Error("cannot make range from attribute node");
    }

    if (!this.isValid()) {
      return undefined;
    }

    if (other === undefined) {
      const range = rangy.createRange(this.node.ownerDocument);
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
    return this.root.contains(isAttr(node) ? node.ownerElement : node) &&
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

export const makeDLoc =  DLoc.makeDLoc.bind(DLoc);

//  LocalWords:  dloc MPL jquery domutil oop DLoc makeDLoc jshint
//  LocalWords:  newcap validthis
