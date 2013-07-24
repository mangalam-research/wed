/**
 * @module domutil
 * @desc Utilities that manipulate or query the DOM tree.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:domutil */ function (require, exports, module) {
"use strict";

var $ = require("jquery");
var rangy = require("rangy");
var util = require("./util");

function getSelectionRange(win) {
    var sel = rangy.getSelection(win);

    if (sel === undefined || sel.rangeCount < 1)
        return undefined;

    return sel.getRangeAt(0);
}

/**
 *
 * <p>This function determines the caret position if the caret were
 * moved forward.</p>
 *
 * <p>This function does not fully emulate how a broswer moves the
 * caret. The sole emulation it performs is to check whether
 * whitespace matters or not. It skips whitespace that does not
 * matter.</p>
 *
 * @param {Array} caret A caret position where the search starts. This
 * should be an array of length two that has in first position the
 * node where the caret is and in second position the offset in that
 * node. This pair is to be interpreted in the same way node, offset
 * pairs are interpreted in selection or range objects.
 *
 * @param {Node} container A DOM node which indicates the container
 * within which caret movements must be contained.
 *
 * @param {Boolean} no_text If true, and a text node would be
 * returned, the function will instead return the parent of the text
 * node.
 *
 * @returns {Array} Returns the next caret position, or null if such
 * position does not exist. The <code>container</code> parameter
 * constrains movements to positions inside it.
 */
function nextCaretPosition(caret, container, no_text) {
    var node = caret[0];
    var offset = caret[1];
    if (no_text === undefined)
        no_text = true;

    var found = false;
    search_loop:
    while(!found) {
        var parent = node.parentNode;
        switch(node.nodeType) {
        case Node.TEXT_NODE:
            if (offset >= node.nodeValue.length ||
                // If the parent node is set to normal white-space
                // handling, then moving the caret forward by one
                // position will skip this white-space.
                (parent.childNodes[parent.childNodes.length - 1] === node &&
                 $(parent).css("white-space") === "normal" &&
                 /^\s+$/.test(node.nodeValue.slice(offset)))) {

                // We would move outside the container
                if (container !== undefined && node === container)
                    break search_loop;

                offset = Array.prototype.indexOf.call(parent.childNodes,
                                                      node) + 1;
                node = parent;
            }
            else {
                offset++;
                found = true;
            }
            break;
        case Node.ELEMENT_NODE:
            if (offset >= node.childNodes.length) {
                // If we've hit the end of what we can search, stop.
                if (parent === null ||
                    parent === node.ownerDocument ||
                    // We would move outside the container
                    (container !== undefined && node === container))
                    break search_loop;

                offset = Array.prototype.indexOf.call(parent.childNodes,
                                                      node) + 1;
                node = parent;
                found = true;
            }
            else {
                node = node.childNodes[offset];
                offset = 0;
                if (!(node.childNodes.length > 0 &&
                      node.childNodes[offset].nodeType ===
                      Node.TEXT_NODE))
                    found = true;
            }
            break;
        }
    }

    if (!found)
        return null;

    return (no_text && node.nodeType === Node.TEXT_NODE) ?
        [node.parentNode,
         Array.prototype.indexOf.call(
             node.parentNode.childNodes, node)] : [node, offset];
}

/**
 *
 * <p>This function determines the caret position if the caret were
 * moved backwards.</p>
 *
 * <p>This function does not fully emulate how a broswer moves the
 * caret. The sole emulation it performs is to check whether
 * whitespace matters or not. It skips whitespace that does not
 * matter.</p>
 *
 * @param {Array} caret A caret position where the search starts. This
 * should be an array of length two that has in first position the
 * node where the caret is and in second position the offset in that
 * node. This pair is to be interpreted in the same way node, offset
 * pairs are interpreted in selection or range objects.
 *
 * @param {Node} container A DOM node which indicates the container
 * within which caret movements must be contained.
 *
 * @param {Boolean} no_text If true, and a text node would be
 * returned, the function will instead return the parent of the text
 * node.
 *
 * @returns {Array} Returns the previous caret position, or null if
 * such position does not exist.
 */
function prevCaretPosition(caret, container, no_text) {
    var node = caret[0];
    var offset = caret[1];
    if (no_text === undefined)
        no_text = true;

    var found = false;
    search_loop:
    while(!found) {
        offset--;
        var parent = node.parentNode;
        switch(node.nodeType) {
        case Node.TEXT_NODE:
            if (offset < 0 ||
                // If the parent node is set to normal white-space
                // handling, then moving the caret back by one
                // position will skip this white-space.
                ($(node.parentNode).css("white-space") === "normal" &&
                 parent.childNodes[0] === node &&
                 /^\s+$/.test(node.nodeValue.slice(0, offset)))) {

                // We would move outside the container
                if (container !== undefined && node === container)
                    break search_loop;

                offset = Array.prototype.indexOf.call(parent.childNodes, node);
                node = parent;
            }
            else
                found = true;
            break;
        case Node.ELEMENT_NODE:
            if (offset < 0 || node.childNodes.length === 0) {
                // If we've hit the end of what we can search, stop.
                if (parent === null ||
                    parent === node.ownerDocument ||
                    // We would move outside the container
                    (container !== undefined && node === container))
                    break search_loop;

                offset = Array.prototype.indexOf.call(parent.childNodes, node);
                node = parent;
                found = true;
            }
            // If node.childNodes.length === 0, the first branch would
            // have been taken. No need to test that offset indexes to
            // something that exists.
            else {
                node = node.childNodes[offset];
                if (node.nodeType === Node.ELEMENT_NODE) {
                    offset = node.childNodes.length;
                    if (!(node.childNodes.length > 0 &&
                          node.childNodes[offset - 1].nodeType ===
                          Node.TEXT_NODE))
                        found = true;
                }
                else
                    offset = node.nodeValue.length + 1;
            }
            break;
        }
    }

    if (!found)
        return null;

    return (no_text && node.nodeType === Node.TEXT_NODE) ?
        [node.parentNode,
         Array.prototype.indexOf.call(
             node.parentNode.childNodes, node)] : [node, offset];
}

/**
 * This function provides a representation of a node's location
 * relative to its parent. The return value can be passed to
 * <code>pathToNode</code>.
 *
 * @param {Node} root The node from which to calculate paths.
 *
 * @param {Node} node The node whose path must be calculated. Must be
 * a descendant of <code>root</code>.
 *
 * @returns This function retuns a representation of
 * <code>node</code>'s location relative to
 * <code>root</code>. Provided that no significant change has occurred
 * between a call to <code>nodeToPath</code> and
 * <code>pathToNode</code>, and given <code>var path =
 * nodeToPath(root, node)</code>, then the following is true
 * <code>pathToNode(root, path) === node</code>. The representation is
 * purposely not documented. In particular, the representation is not
 * guaranteed to refer to the same node across multiple sessions of
 * wed, even if the document has not changed at all.
 */

function nodeToPath(root, node) {
    if (root === null || root === undefined)
        throw new Error("invalid root parameter");

    if (node === null || node === undefined)
        throw new Error("invalid node parameter");

    var $node = $(node);
    if ($node.closest("._gui, ._placeholder, ._phantom").length > 0)
        throw new Error("cannot provide path to node because it is a "+
                        "gui, placeholder or phantom node");

    if (root === node)
        return "";

    if ($node.closest(root).length === 0 ||
        // This is also not a descendant...
        node === root)
        throw new Error("node is not a descendant of root");

    return _nodeToPath(root, node);
}

function _nodeToPath(root, node)
{
    var $node = $(node);
    var parent = node.parentNode;

    var location;
    var offset = 0;
    var ret;
    var i;
    switch(node.nodeType) {
    case Node.TEXT_NODE:
        location = Array.prototype.indexOf.call(parent.childNodes, node);
        for (i = 0; i < location; ++i) {
            if (parent.childNodes[i].nodeType === Node.TEXT_NODE)
                offset++;
        }
        ret = ["##text[", offset, "]"].join("");
        break;
    case Node.ELEMENT_NODE:
        if (!$node.is("._real, ._phantom_wrap"))
            throw new Error("only nodes of class ._real and ._phantom_wrap " +
                            "are supported by nodeToPath");
        var klass;
        if ($node.is("._real")) {
            var name = util.getOriginalName(node);
            klass = util.classFromOriginalName(name);
        }
        else
            klass = "._phantom_wrap";

        location = Array.prototype.indexOf.call(parent.childNodes, node);
        for (i = 0; i < location; ++i) {
            if (parent.childNodes[i].nodeType === Node.ELEMENT_NODE &&
                $(parent.childNodes[i]).is(klass))
                offset++;
        }
        ret = [klass, "[", offset, "]"].join("");
        break;
    default:
        throw new Error("unexpected node type: " + caret[0].nodeType);
    }

    if (parent === root)
        return ret;
    else
        return _nodeToPath(root, parent) + "/" + ret;
}

/**
 * This function recovers a DOM node on the basis of a path previously
 * created by <code>nodeToPath</code> and a root node from which to
 * interpret the path.
 *
 * @param {Node} root The node from which to interpret the path
 *
 * @param path The path to interpret.
 *
 * @returns {Node} The node corresponding to the path, or
 * <code>null</code> if no such node exists.
 */
function pathToNode(root, path) {
    if (!root)
        return null;

    if (path === "")
        return root;

    var parts = path.split(/\//, 1);
    var first;
    var last;

    if (parts.length === 0)
        first = path;
    else {
        first = parts[0];
        last = path.slice(first.length + 1);
    }

    var index;
    var node;
    var i;
    var found = null;
    var match = /^##text\[(.*)\]$/.exec(first);
    if (match) {
        index = match[1] >> 0;
        for(i = 0; !found && (i < root.childNodes.length); i++) {
            node = root.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE &&  --index < 0)
                found = node;
        }
    }
    else {
        match = /^(.*?)\[(.*)\]$/.exec(first);
        if (match) {
            var klass = match[1];
            index = match[2] >> 0;
            for(i = 0; !found && (i < root.childNodes.length); ++i) {
                node = root.childNodes[i];
                if (node.nodeType === Node.ELEMENT_NODE &&
                    $(node).is(klass) && --index < 0)
                    found = node;
            }
        }
    }

    // We did the whole path.
    if (!last)
        return found;

    return pathToNode(found, last);
}


function makePlaceholder(text) {
    return $("<span class='_placeholder' contenteditable='false'>" +
             (text ? text: " ") + "</span>");
}

/**
 * Splits a text node into two nodes. This function takes care to
 * modify the DOM tree only once.
 *
 * @param {Node} text_node The text node to split into two text nodes.
 * @param {Integer} index The offset into the text node where to split.
 * @returns {Array.<Node>} The first element of the array is the text
 * node which contains the text before index and the second element
 * of the array is the text node which contains the text after the
 * index.
 */
function splitTextNode(text_node, index) {
    return insertIntoText(text_node, index, undefined, false);
}

/**
 * Inserts an elment into text, effectively splitting the text node in
 * two. This function takes care to modify the DOM tree only once.
 *
 * @param {Node} text_node The text node that will be cut in two by the new
 * element.
 * @param {Integer} index The offset into the text node where to
 * insert the new element.
 * @param {Element} new_element The new element to insert. If this
 * parameter evaluates to <code>false</code>, then this function
 * effectively splits the text node into two parts.
 * @param {Boolean} [no_empty_nodes=true] The operation cannot create
 * empty nodes.
 * @returns {Array.<Node>} The first element of the array is the text
 * node which contains the text before index and the second element
 * of the array is the text node which contains the text after the
 * index.
 */
function insertIntoText(text_node, index, new_element, no_empty_nodes) {
    if (no_empty_nodes === undefined)
        no_empty_nodes = true;

    if (text_node.nodeType !== Node.TEXT_NODE)
        throw new Error("insertIntoText called on non-text");

    // Normalize
    if (index < 0)
        index = 0;
    else if (index > text_node.nodeValue.length)
        index = text_node.nodeValue.length;

    var prev;
    var next;
    if (no_empty_nodes && index === 0) {
        if (new_element)
            text_node.parentNode.insertBefore(new_element, text_node);
        next = text_node;
    }
    else if (no_empty_nodes && index === text_node.nodeValue.length) {
        if (new_element)
            text_node.parentNode.insertBefore(new_element,
                                              text_node.nextSibling);
        prev = text_node;
    }
    else {
        var frag = document.createDocumentFragment();
        prev = document.createTextNode(text_node.nodeValue.slice(0, index));
        frag.appendChild(prev);
        if (new_element)
            frag.appendChild(new_element);
        next = document.createTextNode(text_node.nodeValue.slice(index));
        frag.appendChild(next);
        text_node.parentNode.replaceChild(frag, text_node);
    }

    return [prev, next];
}

/**
 * Inserts text into a node. This function will use already existing
 * text nodes whenever possible rather than create a new text node.
 *
 * @param {Node} node The node where to insert the text.
 * @param {Integer} index The location in the node where to insert the text.
 * @param {String} text The text to insert.
 * @returns {Array.<Node>} The first element of the array is the node
 * that was modified to insert the text. The second element is the
 * text node which contains the new text. The two elements are equal
 * if a text node is modified to contain the newly inserted text. They
 * are unequal if a new text node had to be created to contain the new
 * text.
 */
function insertText(node, index, text) {
    var text_node;
    work:
    while (true) {
        switch(node.nodeType) {
        case Node.ELEMENT_NODE:
            var child = node.childNodes[index];
            if (child && child.nodeType === Node.TEXT_NODE) {
                // Prepend to already existing text node.
                node = child;
                index = 0;
                continue work;
            }

            var prev = node.childNodes[index - 1];
            if (prev && prev.nodeType === Node.TEXT_NODE) {
                // Append to already existing text node.
                node = prev;
                index = node.nodeValue.length;
                continue work;
            }

            // We have to create a text node
            text_node = document.createTextNode("");
            text_node.nodeValue = text;
            node.insertBefore(text_node, child);
            break work;
        case Node.TEXT_NODE:
            var pre = node.nodeValue.slice(0, index);
            var post = node.nodeValue.slice(index);
            node.nodeValue = pre + text + post;
            text_node = node;
            break work;
        default:
            throw new Error("unexpected node type: " + node.nodeType);
        }
    }
    return [node, text_node];
}

/**
 * Deletes text from a text node. If the text node becomes empty, it
 * is deleted.
 *
 * @param {Node} node The text node from which to delete text.
 * @param {Integer} index The index at which to delete text.
 * @param {Integer} length The length of text to delete.
 */

function deleteText(node, index, length) {
    if (node.nodeType === Node.TEXT_NODE) {
        node.nodeValue = node.nodeValue.slice(0, index) +
            node.nodeValue.slice(index + length);
        if (node.nodeValue.length === 0)
            node.parentNode.removeChild(node);
    }
    else
        throw new Error("deleteText called on non-text");
}

/**
 * Splits a DOM tree.
 *
 * @param {Node} top The node at which the splitting operation should
 * end. This node will be split but the function won't split anything
 * above this node.
 * @param {Node} node The node where to start.
 * @param {Number} index The index where to start in the node.
 */
function splitAt(top, node, index) {
    if ($(node).closest(top).length === 0)
        throw new Error("split location is not inside top");

    return _splitAt(top, node, index);
}

function _splitAt(top, node, index) {
    // We need to check this now because some operations below may
    // remove node from the DOM tree.
    var stop = (node === top);

    var ret;
    switch(node.nodeType) {
    case Node.TEXT_NODE:
        var pair = splitTextNode(node, index);
        node = pair[0];
        ret = [node, pair[1]];
        break;
    case Node.ELEMENT_NODE:
        if (index < 0)
            index = 0;
        else if (index > node.childNodes.length)
            index = node.childNodes.length;

        var $node = $(node);
        var $clone = $node.clone();
        var clone = $clone.get(0);
        // Remove all nodes at index and after.
        while (node.childNodes[index])
            node.removeChild(node.childNodes[index]);

        // Remove all nodes before index
        if (index < clone.childNodes.length)
            while (index--)
                clone.removeChild(clone.childNodes[0]);

        $node.after(clone);
        ret = [node, clone];
        break;
    default:
        throw new Error("unexpected node type: " + node.nodeType);
    }

    if (stop) // We've just split the top, so end here...
        return ret;

    var parent = node.parentNode;
    return _splitAt(top, parent,
                    Array.prototype.indexOf.call(parent.childNodes, node) + 1);
}


/**
 * This function recursively links two DOM trees though the JQuery
 * <code>.data()</code> method. For element in the first tree the data
 * item named "wed_mirror_node" in points to the corresponding element
 * in the second tree, and vice-versa. It is presumed that the two
 * DOM trees are perfect mirrors of each other, athough no test is
 * performed to confirm it.
 *
 * @param {Node} root_a A DOM node.
 * @param {Node} root_b A second DOM node.
 *
 */
function linkTrees(root_a, root_b) {
    $(root_a).data("wed_mirror_node", root_b);
    $(root_b).data("wed_mirror_node", root_a);
    if (root_a.nodeType === Node.ELEMENT_NODE) {
        for(var i = 0; i < root_a.childNodes.length; ++i) {
            var child_a = root_a.childNodes[i];
            var child_b = root_b.childNodes[i];
            linkTrees(child_a, child_b);
        }
    }
}

/**
 * This function recursively unlinks a DOM tree though the JQuery
 * <code>.data()</code> method.
 *
 * @param {Node} root_a A DOM node.
 *
 */
function unlinkTree(root) {
    $(root).removeData("wed_mirror_node");
    if (root.nodeType === Node.ELEMENT_NODE)
        for(var i = 0; i < root.childNodes.length; ++i)
            unlinkTree(root.childNodes[i]);
}


/**
 * <p>Returns the first descendant or the node passed to the function
 * if the node happens to not have descendant. The descendant returned
 * is the deepest one which is first in its parent.</p>
 *
 * <p>When passed
 * <code>&lt;p>&lt;b>A&lt;/b>&lt;b>&lt;q>B&lt;/q>&lt;/b>&lt;/p></code>
 * this code would return the text node "A" because it has no children
 * and is first.</p>
 *
 * @param {Node} node The node to search.
 * @returns {Node} The first node which is both first in its parent
 * and has no children.
 */
function firstDescendantOrSelf(node) {
    while (node && node.childNodes && node.childNodes.length)
        node = node.childNodes[0];
    return node;
}


exports.getSelectionRange = getSelectionRange;
exports.nextCaretPosition = nextCaretPosition;
exports.prevCaretPosition = prevCaretPosition;
exports.makePlaceholder = makePlaceholder;
exports.nodeToPath = nodeToPath;
exports.pathToNode = pathToNode;
exports.splitTextNode = splitTextNode;
exports.insertIntoText = insertIntoText;
exports.insertText = insertText;
exports.deleteText = deleteText;
exports.linkTrees = linkTrees;
exports.unlinkTree = unlinkTree;
exports.splitAt = splitAt;
exports.firstDescendantOrSelf = firstDescendantOrSelf;

});
