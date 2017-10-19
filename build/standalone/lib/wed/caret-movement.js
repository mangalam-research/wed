/**
 * Library of caret movement computations.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "./domtypeguards", "./domutil", "./wed-util"], function (require, exports, module, domtypeguards_1, domutil_1, wed_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function moveInAttributes(node, modeTree) {
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
    function moveOutOfPlaceholder(pos, root, after) {
        // If we are in a placeholder node, immediately move out of it.
        var closestPh = domutil_1.closestByClass(pos.node, "_placeholder", root);
        if (closestPh !== null) {
            var parent_1 = closestPh.parentNode;
            var index = domutil_1.indexOf(parent_1.childNodes, closestPh);
            if (after) {
                index++;
            }
            pos = pos.make(parent_1, index);
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
    function determineContainer(docRoot) {
        var container = docRoot.firstChild;
        if (!domtypeguards_1.isElement(container)) {
            throw new Error("docRoot does not contain an element");
        }
        // This takes care of the special case where we have an empty document that
        // contains only a placeholder. In such case, setting the container to
        // docRoot.firstChild will have a perverse effect of setting the container to
        // be **inside** the current pos.
        if (container.classList.contains("_placeholder")) {
            container = docRoot;
        }
        return container;
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
    function insideEditableContent(element, offset, modeTree) {
        var mode = modeTree.getMode(element);
        var _a = mode.nodesAroundEditableContents(element), before = _a[0], after = _a[1];
        // If the element has nodes before editable contents and the caret would
        // be before or among such nodes, then ...
        if (before !== null && domutil_1.indexOf(element.childNodes, before) >= offset) {
            return false;
        }
        // If the element has nodes after editable contents and the caret would be
        // after or among such nodes, then ...
        if (after !== null && domutil_1.indexOf(element.childNodes, after) < offset) {
            return false;
        }
        return true;
    }
    /**
     * @returns ``true`` if ``prev`` and ``next`` are both decorated; ``false``
     * otherwise.
     */
    function bothDecorated(prev, next) {
        if (next === undefined || prev === undefined) {
            return false;
        }
        var nextFirst = next.firstChild;
        var prevLast = prev.lastChild;
        return domtypeguards_1.isElement(nextFirst) &&
            nextFirst.classList.contains("_gui") &&
            !nextFirst.classList.contains("_invisible") &&
            domtypeguards_1.isElement(prevLast) &&
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
    function findNext(haystack, ref) {
        var arr = Array.prototype.slice.call(haystack);
        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
            var x = arr_1[_i];
            // tslint:disable-next-line:no-bitwise
            if ((x.compareDocumentPosition(ref) &
                Node.DOCUMENT_POSITION_PRECEDING) !== 0) {
                return x;
            }
        }
        return undefined;
    }
    var directionToFunction = {
        right: positionRight,
        left: positionLeft,
        up: positionUp,
        down: positionDown,
    };
    function newPosition(pos, direction, docRoot, modeTree) {
        var fn = directionToFunction[direction];
        if (fn === undefined) {
            throw new Error("cannot resolve direction: " + direction);
        }
        return fn(pos, docRoot, modeTree);
    }
    exports.newPosition = newPosition;
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
    function positionRight(pos, docRoot, modeTree) {
        if (pos == null) {
            return undefined;
        }
        var root = pos.root;
        // If we are in a placeholder node, immediately move out of it.
        pos = moveOutOfPlaceholder(pos, root, true);
        var container = determineContainer(docRoot);
        // tslint:disable-next-line:strict-boolean-expressions no-constant-condition
        while (true) {
            var guiBefore = domutil_1.closestByClass(pos.node, "_gui", root);
            var nextCaret = domutil_1.nextCaretPosition(pos.toArray(), container, false);
            if (nextCaret === null) {
                pos = null;
                break;
            }
            pos = pos.make(nextCaret);
            var node = pos.node, offset = pos.offset;
            var closestGUI = domutil_1.closest(node, "._gui:not(._invisible)", root);
            if (closestGUI !== null) {
                var startLabel = closestGUI.classList.contains("__start_label");
                if (startLabel &&
                    moveInAttributes(domutil_1.closestByClass(closestGUI, "_real", root), modeTree)) {
                    if (domutil_1.closestByClass(node, "_attribute_value", root) !== null) {
                        // We're in an attribute value, stop here.
                        break;
                    }
                    // Already in the element name, or in a previous attribute, move from
                    // attribute to attribute.
                    if (domutil_1.closest(node, "._element_name, ._attribute", root) !== null) {
                        // Search for the next attribute.
                        var nextAttr = findNext(closestGUI.getElementsByClassName("_attribute"), node);
                        if (nextAttr !== undefined) {
                            // There is a next attribute: move to it.
                            var val = wed_util_1.getAttrValueNode(domutil_1.childByClass(nextAttr, "_attribute_value"));
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
                (startLabel || domutil_1.closestByClass(node, "_label", closestGUI) !== null) ?
                    node.getElementsByClassName("_element_name")[0] :
                    closestGUI, 0);
                // ... stop here.
                break;
            }
            // Can't stop inside a phantom node.
            var closestPhantom = domutil_1.closestByClass(node, "_phantom", root);
            if (closestPhantom !== null) {
                // This ensures the next loop will move after the phantom.
                pos = pos.make(closestPhantom, closestPhantom.childNodes.length);
                continue;
            }
            // Or beyond the first position in a placeholder node.
            var closestPh = domutil_1.closestByClass(node, "_placeholder", root);
            if (closestPh !== null && offset > 0) {
                // This ensures the next loop will move after the placeholder.
                pos = pos.make(closestPh, closestPh.childNodes.length);
                continue;
            }
            // Make sure the position makes sense from an editing standpoint.
            if (domtypeguards_1.isElement(node)) {
                var nextNode = node.childNodes[offset];
                // Always move into text
                if (domtypeguards_1.isText(nextNode)) {
                    continue;
                }
                var prevNode = node.childNodes[offset - 1];
                // Stop between two decorated elements.
                if (bothDecorated(prevNode, nextNode)) {
                    break;
                }
                if (domtypeguards_1.isElement(prevNode) &&
                    // We do not stop in front of element nodes.
                    ((domtypeguards_1.isElement(nextNode) &&
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
    exports.positionRight = positionRight;
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
    function positionLeft(pos, docRoot, modeTree) {
        if (pos == null) {
            return undefined;
        }
        var root = pos.root;
        // If we are in a placeholder node, immediately move out of it.
        pos = moveOutOfPlaceholder(pos, root, false);
        var container = determineContainer(docRoot);
        // tslint:disable-next-line:strict-boolean-expressions no-constant-condition
        while (true) {
            var elName = domutil_1.closestByClass(pos.node, "_element_name", root);
            var wasInName = (pos.node === elName) && (pos.offset === 0);
            var prevCaret = domutil_1.prevCaretPosition(pos.toArray(), container, false);
            if (prevCaret === null) {
                pos = null;
                break;
            }
            pos = pos.make(prevCaret);
            var node = pos.node;
            var offset = pos.offset;
            var closestGUI = domutil_1.closest(node, "._gui:not(._invisible)", root);
            if (closestGUI !== null) {
                var startLabel = closestGUI.classList.contains("__start_label");
                if (startLabel && !wasInName &&
                    moveInAttributes(domutil_1.closestByClass(closestGUI, "_real", root), modeTree)) {
                    if (domutil_1.closestByClass(node, "_attribute_value", closestGUI) !== null) {
                        // We're in an attribute value, stop here.
                        break;
                    }
                    var attr = domutil_1.closestByClass(node, "_attribute", closestGUI);
                    if (attr === null &&
                        domtypeguards_1.isElement(node) &&
                        node.nextElementSibling !== null &&
                        node.nextElementSibling.classList.contains("_attribute")) {
                        attr = node.nextElementSibling;
                    }
                    if (attr === null) {
                        elName = domutil_1.closestByClass(node, "_element_name", closestGUI);
                        attr = elName !== null ? elName.nextElementSibling : null;
                    }
                    var prevAttr = attr !== null ? attr.previousElementSibling : null;
                    // If we have not yet found anything, then the
                    // previous attribute is the last one.
                    if (prevAttr === null) {
                        var all = closestGUI.getElementsByClassName("_attribute");
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
                        var val = domutil_1.childByClass(prevAttr, "_attribute_value");
                        offset = 0;
                        if (val.lastChild !== null) {
                            val = val.lastChild;
                            if (domtypeguards_1.isElement(val) && val.classList.contains("_placeholder")) {
                                offset = 0;
                            }
                            else if (domtypeguards_1.isText(val)) {
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
                        domutil_1.closestByClass(node, "_label", closestGUI) !== null) ?
                        closestGUI.getElementsByClassName("_element_name")[0]
                        : closestGUI, 0);
                    break;
                }
                // ... move to start of gui element ...
                pos = pos.make(closestGUI, 0);
                // ... and then out of it.
                continue;
            }
            var closestPh = domutil_1.closestByClass(node, "_placeholder", root);
            if (closestPh !== null) {
                // Stopping in a placeholder is fine, but normalize the position to the
                // start of the text.
                pos = pos.make(closestPh.firstChild, 0);
                break;
            }
            // Can't stop inside a phantom node.
            var closestPhantom = domutil_1.closestByClass(node, "_phantom", root);
            if (closestPhantom !== null) {
                // Setting the position to this will ensure that on the next loop we move
                // to the left of the phantom node.
                pos = pos.make(closestPhantom, 0);
                continue;
            }
            // Make sure the position makes sense from an editing standpoint.
            if (domtypeguards_1.isElement(node)) {
                var prevNode = node.childNodes[offset - 1];
                // Always move into text
                if (domtypeguards_1.isText(prevNode)) {
                    continue;
                }
                var nextNode = node.childNodes[offset];
                // Stop between two decorated elements.
                if (bothDecorated(prevNode, nextNode)) {
                    break;
                }
                if (domtypeguards_1.isElement(nextNode) &&
                    // We do not stop just before a start tag button.
                    ((domtypeguards_1.isElement(prevNode) &&
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
    exports.positionLeft = positionLeft;
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
    function positionDown(pos, docRoot, modeTree) {
        if (pos == null) {
            return undefined;
        }
        // Search for the next line.
        var initialCaret = wed_util_1.boundaryXY(pos);
        var next = initialCaret;
        while (initialCaret.bottom > next.top) {
            pos = positionRight(pos, docRoot, modeTree);
            if (pos === undefined) {
                return undefined;
            }
            next = wed_util_1.boundaryXY(pos);
        }
        // pos is now at the start of the next line. We need to find the position that
        // is closest horizontally.
        var nextBottom = next.bottom;
        var minDist = Infinity;
        var minPosition;
        while (pos !== undefined) {
            var dist = Math.abs(next.left - initialCaret.left);
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
                next = wed_util_1.boundaryXY(pos);
            }
        }
        return minPosition;
    }
    exports.positionDown = positionDown;
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
    function positionUp(pos, docRoot, modeTree) {
        if (pos == null) {
            return undefined;
        }
        // Search for the previous line.
        var initialBoundary = wed_util_1.boundaryXY(pos);
        var prev = initialBoundary;
        while (initialBoundary.top < prev.bottom) {
            pos = positionLeft(pos, docRoot, modeTree);
            if (pos === undefined) {
                return undefined;
            }
            prev = wed_util_1.boundaryXY(pos);
        }
        // pos is now at the end of the previous line. We need to find the position
        // that is closest horizontally.
        var prevTop = prev.top;
        var minDist = Infinity;
        var minPosition;
        while (pos !== undefined) {
            var dist = Math.abs(prev.left - initialBoundary.left);
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
                prev = wed_util_1.boundaryXY(pos);
            }
        }
        return minPosition;
    }
    exports.positionUp = positionUp;
});
//  LocalWords:  docRoot firstChild pos

//# sourceMappingURL=caret-movement.js.map
