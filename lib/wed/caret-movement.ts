/**
 * Library of caret movement computations.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { DLoc } from "./dloc";
import { isElement, isText } from "./domtypeguards";
import { Caret, childByClass, closest, closestByClass, indexOf,
         nextCaretPosition, prevCaretPosition } from "./domutil";
import { ModeTree } from "./mode-tree";
import { boundaryXY, getAttrValueNode } from "./wed-util";

function moveInAttributes(node: Node, modeTree: ModeTree): boolean {
  return modeTree.getAttributeHandling(node) === "edit";
}

/**
 * @param pos The position form which we start.
 *
 * @param root The root of the DOM tree within which we move.
 *
 * @param after Whether we are to move after the placeholder (``true``) or not
 * (``false``).
 *
 * @returns If called with a position inside a placeholder, return a position
 * outside of the placeholder. Otherwise, return the position unchanged.
 */
function moveOutOfPlaceholder(pos: DLoc, root: Element | Document,
                              after: boolean): DLoc {
  // If we are in a placeholder node, immediately move out of it.
  const closestPh = closestByClass(pos.node, "_placeholder", root);
  if (closestPh !== null) {
    const parent = closestPh.parentNode!;
    let index = indexOf(parent.childNodes, closestPh);
    if (after) {
      index++;
    }

    pos = pos.make(parent, index);
  }

  return pos;
}

/**
 * Determines what should be used as the "container" for caret movement
 * purposes. The "container" is the element within which caret movements are
 * constrained. (The caret cannot move out of it.)
 *
 * @param docRoot The root element of the document being edited by wed.
 *
 * @returns A container that can be used by the caret movement functions.
 */
function determineContainer(docRoot: Document | Element): Element {
  let container = docRoot.firstChild;

  if (!isElement(container)) {
    throw new Error("docRoot does not contain an element");
  }

  // This takes care of the special case where we have an empty document that
  // contains only a placeholder. In such case, setting the container to
  // docRoot.firstChild will have a perverse effect of setting the container to
  // be **inside** the current pos.
  if (container.classList.contains("_placeholder")) {
    container = docRoot;
  }

  return container as Element;
}

/**
 * Determine whether a position is within the editable content of an element or
 * outside of it. Modes often decorate elements by adding decorations before and
 * after the content of the element. These are not editable, and should be
 * skipped by caret movement.
 *
 * @param element The element in which the caret is appearing.
 *
 * @param offset The offset into the element at which the caret is positioned.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns ``true`` if we are inside editable content, ``false`` otherwise.
 */
function insideEditableContent(element: Element, offset: number,
                               modeTree: ModeTree): boolean {
  const mode = modeTree.getMode(element);
  const [before, after] = mode.nodesAroundEditableContents(element);

  // If the element has nodes before editable contents and the caret would
  // be before or among such nodes, then ...
  if (before !== null && indexOf(element.childNodes, before) >= offset) {
    return false;
  }

  // If the element has nodes after editable contents and the caret would be
  // after or among such nodes, then ...
  if (after !== null && indexOf(element.childNodes, after) < offset) {
    return false;
  }

  return true;
}

/**
 * @returns ``true`` if ``prev`` and ``next`` are both decorated; ``false``
 * otherwise.
 */
function bothDecorated(prev: Node | undefined,
                       next: Node | undefined): boolean {
  if (next === undefined || prev === undefined) {
    return false;
  }

  const nextFirst = next.firstChild;
  const prevLast = prev.lastChild;

  return isElement(nextFirst) &&
    nextFirst.classList.contains("_gui") &&
    !nextFirst.classList.contains("_invisible") &&
    isElement(prevLast) &&
    prevLast.classList.contains("_gui") &&
    !prevLast.classList.contains("_invisible");
}

/**
 * Find the first node in a set of nodes which is such that the reference node
 * **precedes** it.
 *
 * @param haystack The nodes to search.
 *
 * @param ref The reference node.
 *
 * @returns The first node in ``haystack`` which does not precede ``ref``.
 */
function findNext(haystack: NodeList, ref: Node): Node | undefined {
  const arr: Element[] = Array.prototype.slice.call(haystack);
  for (const x of arr) {
    // tslint:disable-next-line:no-bitwise
    if ((x.compareDocumentPosition(ref) &
         Node.DOCUMENT_POSITION_PRECEDING) !== 0) {
      return x;
    }
  }

  return undefined;
}

export type Direction = "right" | "left" | "up" | "down";

const directionToFunction = {
  right: positionRight,
  left: positionLeft,
  up: positionUp,
  down: positionDown,
};

export function newPosition(pos: DLoc | undefined | null,
                            direction: Direction,
                            docRoot: Document | Element,
                            modeTree: ModeTree): DLoc | undefined {
  const fn = directionToFunction[direction];
  if (fn === undefined) {
    throw new Error(`cannot resolve direction: ${direction}`);
  }

  return fn(pos, docRoot, modeTree);
}

/**
 * Compute the position to the right of a starting position. This function takes
 * into account wed-specific needs. For instance, it knows how start and end
 * labels are structured.
 *
 * @param pos The position at which we start.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
export function positionRight(pos: DLoc | undefined | null,
                              docRoot: Document | Element,
                              modeTree: ModeTree): DLoc | undefined {
  if (pos == null) {
    return undefined;
  }

  const root = pos.root;
  // If we are in a placeholder node, immediately move out of it.
  pos = moveOutOfPlaceholder(pos, root, true);

  const container = determineContainer(docRoot);

  // tslint:disable-next-line:strict-boolean-expressions no-constant-condition
  while (true) {
    const guiBefore: Element | null = closestByClass(pos.node, "_gui", root);

    const nextCaret: Caret | null =
      nextCaretPosition(pos.toArray(), container, false);
    if (nextCaret === null) {
      pos = null;
      break;
    }

    pos = pos.make(nextCaret);
    const { node, offset }: { node: Node; offset: number } = pos;
    const closestGUI = closest(node, "._gui:not(._invisible)", root);
    if (closestGUI !== null) {
      const startLabel = closestGUI.classList.contains("__start_label");
      if (startLabel &&
          moveInAttributes(closestByClass(closestGUI, "_real", root)!,
                           modeTree)) {
        if (closestByClass(node, "_attribute_value", root) !== null) {
          // We're in an attribute value, stop here.
          break;
        }

        // Already in the element name, or in a previous attribute, move from
        // attribute to attribute.
        if (closest(node, "._element_name, ._attribute", root) !== null) {
          // Search for the next attribute.
          const nextAttr = findNext(
            closestGUI.getElementsByClassName("_attribute"), node);

          if (nextAttr !== undefined) {
            // There is a next attribute: move to it.
            const val = getAttrValueNode(childByClass(nextAttr,
                                                      "_attribute_value")!);
            pos = pos.make(val, 0);
            break;
          }
        }
        // else fall through and move to end of gui element.
      }

      if (guiBefore === closestGUI) {
        // Move to the end of the gui element ...
        pos = pos.make(closestGUI, closestGUI.childNodes.length);
        // ... and then out of it.
        continue;
      }
      pos = pos.make(
        // If in a label, normalize to element name. If in another kind of gui
        // element, normalize to start of the element.
        (startLabel || closestByClass(node, "_label", closestGUI) !== null) ?
          (node as Element).getElementsByClassName("_element_name")[0] :
          closestGUI, 0);
      // ... stop here.
      break;
    }

    // Can't stop inside a phantom node.
    const closestPhantom = closestByClass(node, "_phantom", root);
    if (closestPhantom !== null) {
      // This ensures the next loop will move after the phantom.
      pos = pos.make(closestPhantom, closestPhantom.childNodes.length);
      continue;
    }

    // Or beyond the first position in a placeholder node.
    const closestPh = closestByClass(node, "_placeholder", root);
    if (closestPh !== null && offset > 0) {
      // This ensures the next loop will move after the placeholder.
      pos = pos.make(closestPh, closestPh.childNodes.length);
      continue;
    }

    // Make sure the position makes sense from an editing standpoint.
    if (isElement(node)) {
      const nextNode = node.childNodes[offset];

      // Always move into text
      if (isText(nextNode)) {
        continue;
      }

      const prevNode = node.childNodes[offset - 1];
      // Stop between two decorated elements.
      if (bothDecorated(prevNode, nextNode)) {
        break;
      }

      if (isElement(prevNode) &&
          // We do not stop in front of element nodes.
          ((isElement(nextNode) &&
            !nextNode.classList.contains("_end_wrapper") &&
            !prevNode.classList.contains("_start_wrapper")) ||
           prevNode.matches("._wed-validation-error, ._gui.__end_label"))) {
        // can't stop here
        continue;
      }

      // If the offset is not inside the editable content of the node, then...
      if (!insideEditableContent(node, offset, modeTree)) {
        // ... can't stop here.
        continue;
      }
    }

    // If we get here, the position is good!
    break;
  }

  return pos !== null ? pos : undefined;
}

/**
 * Compute the position to the left of a starting position. This function takes
 * into account wed-specific needs. For instance, it knows how start and end
 * labels are structured.
 *
 * @param pos The position at which we start.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
export function positionLeft(pos: DLoc | undefined | null,
                             docRoot: Document | Element,
                             modeTree: ModeTree): DLoc | undefined {
  if (pos == null) {
    return undefined;
  }

  const root = pos.root;
  // If we are in a placeholder node, immediately move out of it.
  pos = moveOutOfPlaceholder(pos, root, false);

  const container = determineContainer(docRoot);

  // tslint:disable-next-line:strict-boolean-expressions no-constant-condition
  while (true) {
    let elName = closestByClass(pos.node, "_element_name", root);
    const wasInName = (pos.node === elName) && (pos.offset === 0);
    const prevCaret: Caret | null = prevCaretPosition(pos.toArray(), container,
                                                      false);
    if (prevCaret === null) {
      pos = null;
      break;
    }

    pos = pos.make(prevCaret);
    const node: Node = pos.node;
    let offset = pos.offset;
    const closestGUI: Element | null = closest(node, "._gui:not(._invisible)",
                                               root);
    if (closestGUI !== null) {
      const startLabel = closestGUI.classList.contains("__start_label");
      if (startLabel && !wasInName &&
          moveInAttributes(closestByClass(closestGUI, "_real", root)!,
                           modeTree)) {
        if (closestByClass(node, "_attribute_value", closestGUI) !== null) {
          // We're in an attribute value, stop here.
          break;
        }

        let attr = closestByClass(node, "_attribute", closestGUI);
        if (attr === null &&
            isElement(node) &&
            node.nextElementSibling !== null &&
            node.nextElementSibling.classList.contains("_attribute")) {
          attr = node.nextElementSibling;
        }

        if (attr === null) {
          elName = closestByClass(node, "_element_name", closestGUI);
          attr = elName !== null ? elName.nextElementSibling : null;
        }

        let prevAttr = attr !== null ? attr.previousElementSibling : null;

        // If we have not yet found anything, then the
        // previous attribute is the last one.
        if (prevAttr === null) {
          const all = closestGUI.getElementsByClassName("_attribute");
          if (all.length > 0) {
            prevAttr = all[all.length - 1];
          }
        }

        // Eliminate those elements which are not attributes.
        if (prevAttr !== null && !prevAttr.classList.contains("_attribute")) {
          prevAttr = null;
        }

        if (prevAttr !== null) {
          // There is a previous attribute: move to it.
          let val: Node = childByClass(prevAttr, "_attribute_value")!;
          offset = 0;
          if (val.lastChild !== null) {
            val = val.lastChild;
            if (isElement(val) && val.classList.contains("_placeholder")) {
              offset = 0;
            }
            else if (isText(val)) {
              offset = val.length;
            }
            else {
              throw new Error("unexpected content in attribute value");
            }
          }
          pos = pos.make(val, offset);
          break;
        }
      }

      if (!wasInName) {
        pos = pos.make(
          // If we are in any label, normalize to the element name, otherwise
          // normalize to the first position in the gui element.
          (startLabel ||
           closestByClass(node, "_label", closestGUI) !== null) ?
              closestGUI.getElementsByClassName("_element_name")[0]
            : closestGUI,
          0);
        break;
      }

      // ... move to start of gui element ...
      pos = pos.make(closestGUI, 0);
      // ... and then out of it.
      continue;
    }

    const closestPh = closestByClass(node, "_placeholder", root);
    if (closestPh !== null) {
      // Stopping in a placeholder is fine, but normalize the position to the
      // start of the text.
      pos = pos.make(closestPh.firstChild!, 0);
      break;
    }

    // Can't stop inside a phantom node.
    const closestPhantom = closestByClass(node, "_phantom", root);
    if (closestPhantom !== null) {
      // Setting the position to this will ensure that on the next loop we move
      // to the left of the phantom node.
      pos = pos.make(closestPhantom, 0);
      continue;
    }

    // Make sure the position makes sense from an editing standpoint.
    if (isElement(node)) {
      const prevNode = node.childNodes[offset - 1];

      // Always move into text
      if (isText(prevNode)) {
        continue;
      }

      const nextNode = node.childNodes[offset];
      // Stop between two decorated elements.
      if (bothDecorated(prevNode, nextNode)) {
        break;
      }

      if (isElement(nextNode) &&
          // We do not stop just before a start tag button.
          ((isElement(prevNode) &&
            !prevNode.classList.contains("_start_wrapper") &&
            !nextNode.classList.contains("_end_wrapper")) ||
           // Can't stop right before a validation error.
           nextNode.matches("._gui.__start_label, .wed-validation-error"))) {
        continue;
      } // can't stop here

      // If the offset is not inside the editable content of the node, then...
      if (!insideEditableContent(node, offset, modeTree)) {
        // ... can't stop here.
        continue;
      }
    }

    // If we get here, the position is good!
    break;
  }

  return pos !== null ? pos : undefined;
}

/**
 * Compute the position under a starting position. This function takes into
 * account wed-specific needs. For instance, it knows how start and end labels
 * are structured.
 *
 * @param pos The position at which we start.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export function positionDown(pos: DLoc | undefined | null,
                             docRoot: Document | Element,
                             modeTree: ModeTree): DLoc | undefined {
  if (pos == null) {
    return undefined;
  }

  // Search for the next line.
  const initialCaret = boundaryXY(pos);
  let next = initialCaret;
  while (initialCaret.bottom > next.top) {
    pos = positionRight(pos, docRoot, modeTree);
    if (pos === undefined) {
      return undefined;
    }
    next = boundaryXY(pos);
  }

  // pos is now at the start of the next line. We need to find the position that
  // is closest horizontally.

  const nextBottom = next.bottom;
  let minDist = Infinity;
  let minPosition;
  while (pos !== undefined) {
    const dist = Math.abs(next.left - initialCaret.left);
    // We've started moving away from the minimum distance.
    if (dist > minDist) {
      break;
    }

    // We've moved to yet another line. The minimum we have so far is *it*.
    if (nextBottom <= next.top) {
      break;
    }

    minDist = dist;
    minPosition = pos;
    pos = positionRight(pos, docRoot, modeTree);
    if (pos !== undefined) {
      next = boundaryXY(pos);
    }
  }

  return minPosition;
}

/**
 * Compute the position above a starting position. This function takes into
 * account wed-specific needs. For instance, it knows how start and end labels
 * are structured.
 *
 * @param pos The position at which we start.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export function positionUp(pos: DLoc | undefined | null,
                           docRoot: Document | Element,
                           modeTree: ModeTree): DLoc | undefined {
  if (pos == null) {
    return undefined;
  }

  // Search for the previous line.
  const initialBoundary = boundaryXY(pos);
  let prev = initialBoundary;
  while (initialBoundary.top < prev.bottom) {
    pos = positionLeft(pos, docRoot, modeTree);
    if (pos === undefined) {
      return undefined;
    }
    prev = boundaryXY(pos);
  }

  // pos is now at the end of the previous line. We need to find the position
  // that is closest horizontally.

  const prevTop = prev.top;
  let minDist = Infinity;
  let minPosition;
  while (pos !== undefined) {
    const dist = Math.abs(prev.left - initialBoundary.left);
    // We've started moving away from the minimum distance.
    if (dist > minDist) {
      break;
    }

    // We've moved to yet another line. The minimum we have so far is *it*.
    if (prev.bottom <= prevTop) {
      break;
    }

    minDist = dist;
    minPosition = pos;
    pos = positionLeft(pos, docRoot, modeTree);
    if (pos !== undefined) {
      prev = boundaryXY(pos);
    }
  }

  return minPosition;
}

//  LocalWords:  docRoot firstChild pos
