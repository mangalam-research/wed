/**
 * Model for a GUI root.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { DLocRoot } from "./dloc";
import { isElement, isText } from "./domtypeguards";
import { closestByClass, indexOf, siblingByClass } from "./domutil";
import { fixPrototype } from "./util";

/**
 * Raised if an attribute could not be found when converting a path to a node.
 */
export class AttributeNotFound extends Error {
  constructor(message: string) {
    super(message);
    fixPrototype(this, AttributeNotFound);
  }
}

/**
 * Count the number of relevant nodes in the ``_phantom_wrap``.
 *
 * @param top The top _phantom_wrap to consider.
 */
function countInPhantomWrap(top: Element): number {
  if (!isElement(top) || !top.classList.contains("_phantom_wrap")) {
    throw new Error("the node should be a _phantom_wrap element");
  }

  let count = 0;
  let child = top.firstChild;
  while (child !== null) {
    if (isElement(child)) {
      if (child.classList.contains("_phantom_wrap")) {
        count += countInPhantomWrap(child);
      }
      else if (child.classList.contains("_real")) {
        count += 1;
      }
      else if (child.classList.contains("_phantom")) {
        // Phantoms don't count.
      }
      else {
        throw new Error("unexpected element in _phantom_wrap");
      }
    }
    else if (child.nodeType === Node.TEXT_NODE) {
      // Text nodes also do not count.
    }
    else {
      throw new Error("unexpected node in _phantom_wrap");
    }
    child = child.nextSibling;
  }

  return count;
}

type FindResult = { found: Node | null; count: number };

function findInPhantomWrap(top: Element, index: number): FindResult {
  if (!isElement(top) || !top.classList.contains("_phantom_wrap")) {
    throw new Error("the node should be a _phantom_wrap element");
  }

  const originalIndex = index;
  let found: Node | null = null;
  let child = top.firstChild;
  while (found === null && child !== null) {
    if (isElement(child)) {
      if (child.classList.contains("_phantom_wrap")) {
        const result = findInPhantomWrap(child, index);
        if (result.found !== null) {
          found = result.found;
        }
        index -= result.count;
      }
      else if (child.classList.contains("_real")) {
        index -= 1;
        if (index < 0) {
          found = child;
        }
      }
      else if (child.classList.contains("_phantom")) {
        // Phantoms don't count.
      }
      else {
        throw new Error("unexpected element in _phantom_wrap");
      }
    }
    else if (child.nodeType === Node.TEXT_NODE) {
      // Text nodes do not count.
    }
    else {
      throw new Error("unexpected node in _phantom_wrap");
    }
    child = child.nextSibling;
  }

  return {
    found: found,
    count: originalIndex - index,
  };
}

/**
 * This is a [[DLocRoot]] class customized for use to mark the root of the GUI
 * tree.
 */
export class GUIRoot extends DLocRoot {

  /**
   * Converts a node to a path suitable to be used by the
   * [["wed/dloc".DLocRoot.pathToNode]] method so long as the root used is the
   * one for the data tree corresponding to the GUI tree to which this object
   * belongs.
   *
   * @param node The node for which to construct a path.
   *
   * @returns The path.
   */
  nodeToPath(node: Node): string {
    const root = this.node;

    if (closestByClass(node, "_placeholder", root) !== null) {
      throw new Error(
        "cannot provide path to node because it is a placeholder node");
    }

    if (root === node) {
      return "";
    }

    if (!root.contains(node)) {
      throw new Error("node is not a descendant of root");
    }

    const ret = [];
    while (node !== root) {
      let parent;

      if (isElement(node) &&
          !node.matches("._real, ._phantom_wrap, ._attribute_value")) {
        throw new Error("only nodes of class ._real, ._phantom_wrap, and " +
                        "._attribute_value are supported");
      }

      const attrVal = closestByClass(node, "_attribute_value", root);
      if (attrVal !== null) {
        const child = siblingByClass(attrVal, "_attribute_name");
        if (child === null) {
          throw new Error("no attribute name found");
        }
        ret.unshift(`@${child.textContent}`);
        parent = closestByClass(attrVal, "_real", root);
        if (parent === null) {
          throw new Error("attribute is detached from real element");
        }
      }
      else {
        parent = node.parentNode;
        if (parent === null) {
          throw new Error("detached node");
        }
        let offset = 0;
        const location = indexOf(parent.childNodes, node);
        for (let i = 0; i < location; ++i) {
          const child = parent.childNodes[i];
          if (isText(child) ||
              (isElement(child) && child.classList.contains("_real"))) {
            offset++;
          }
          else if (isElement(child) &&
                   child.classList.contains("_phantom_wrap")) {
            offset += countInPhantomWrap(child);
          }
        }

        // Parent could be a document if it is not an element.
        if (!isElement(parent) || !parent.classList.contains("_phantom_wrap")) {
          ret.unshift(String(offset));
        }
      }
      node = parent;
    }

    return ret.join("/");
  }

  /**
   * This function recovers a DOM node on the basis of a path previously created
   * by [["wed/dloc".DLocRoot.nodeToPath]] provided that the root from which the
   * path was obtained is on the data tree which corresponds to the GUI tree
   * that this root was created for.
   *
   * @param path The path to interpret.
   *
   * @returns The node corresponding to the path, or ``null`` if no such node
   * exists.
   *
   * @throws {Error} If given a malformed ``path``.
   */
  pathToNode(path: string): Node | null {
    const root = this.node;

    if (path === "") {
      return root;
    }

    const parts = path.split(/\//);
    let parent: Node | null = root;

    let attribute;
    // Set aside the last part if it is an attribute.
    if (parts[parts.length - 1][0] === "@") {
      attribute = parts.pop();
    }

    let found: Node | null = null;
    for (const part of parts) {
      const match = /^(\d+)$/.exec(part);
      if (match !== null) {
        found = null;
        let index = parseInt(match[1]);
        for (let i = 0; found === null && (i < parent.childNodes.length); i++) {
          const node: Node = parent.childNodes[i];
          if ((isText(node) ||
               (isElement(node) && node.classList.contains("_real"))) &&
              --index < 0) {
            found = node;
          }
          else if (isElement(node) &&
                   node.classList.contains("_phantom_wrap")) {
            const result = findInPhantomWrap(node, index);
            if (result.found !== null) {
              found = result.found;
            }
            index -= result.count;
          }
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

    if (attribute !== undefined) {
      const name = attribute.slice(1);
      if (!isElement(parent)) {
        throw new Error(
          "looking for attribute on something which is not an element");
      }
      const attrs = parent.getElementsByClassName("_attribute_name");
      found = null;
      for (let aix = 0; aix < attrs.length; ++aix) {
        const attr = attrs[aix];
        if (attr.textContent === name) {
          found = attr;
          break;
        }
      }
      if (found === null) {
        throw new AttributeNotFound(
          `could not find attribute with name: ${name}`);
      }
      parent = siblingByClass(found, "_attribute_value");
    }

    return parent;
  }
}

//  LocalWords:  MPL
