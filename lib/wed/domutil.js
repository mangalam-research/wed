/**
 * @module domutil
 * @desc Utilities that manipulate or query the DOM tree.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends <global> */ function (require, exports, module) {
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
        switch(node.nodeType) {
        case Node.TEXT_NODE:
            if (offset >= node.nodeValue.length ||
                // If the parent node is set to normal white-space
                // handling, then moving the caret forward by one
                // position will skip this white-space.
                ($(node.parentNode).css("white-space") === "normal" &&
                 /^\s+$/.test(node.nodeValue.slice(offset)))) {

                // We would move outside the container
                if (container !== undefined && node === container)
                    break search_loop;

                offset = Array.prototype.indexOf.call(
                    node.parentNode.childNodes, node) + 1;
                node = node.parentNode;
            }
            else {
                offset++;
                found = true;
            }
            break;
        case Node.ELEMENT_NODE:
            if (offset >= node.childNodes.length) {
                // If we've hit the end of what we can search, stop.
                if (node.parentNode === null ||
                    node.parentNode === node.ownerDocument ||
                    // We would move outside the container
                    (container !== undefined && node === container))
                    break search_loop;

                offset = Array.prototype.indexOf.call(
                    node.parentNode.childNodes, node) + 1;
                node = node.parentNode;
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
        switch(node.nodeType) {
        case Node.TEXT_NODE:
            if (offset < 0 ||
                // If the parent node is set to normal white-space
                // handling, then moving the caret back by one
                // position will skip this white-space.
                ($(node.parentNode).css("white-space") === "normal" &&
                 /^\s+$/.test(node.nodeValue.slice(0, offset)))) {

                // We would move outside the container
                if (container !== undefined && node === container)
                    break search_loop;

                offset =
                    Array.prototype.indexOf.call(node.parentNode.childNodes,
                                                 node);
                node = node.parentNode;
            }
            else
                found = true;
            break;
        case Node.ELEMENT_NODE:
            if (offset < 0 || node.childNodes.length === 0) {
                // If we've hit the end of what we can search, stop.
                if (node.parentNode === null ||
                    node.parentNode === node.ownerDocument ||
                    // We would move outside the container
                    (container !== undefined && node === container))
                    break search_loop;

                offset = Array.prototype.indexOf.call(
                    node.parentNode.childNodes, node);
                node = node.parentNode;
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
        // To ensure consistency
        parent.normalize();

        location = Array.prototype.indexOf.call(parent.childNodes, node);
        for (i = 0; i < location; ++i) {
            if (parent.childNodes[i].nodeType === Node.TEXT_NODE)
                offset++;
        }
        ret = ["##text[", offset, "]"].join("");
        break;
    case Node.ELEMENT_NODE:
        if (!$node.is("._real"))
            throw new Error("only nodes of class ._real are supported by " +
                            "nodeToPath");
        var name = util.getOriginalName(node);
        var klass = util.classFromOriginalName(name);
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
        root.normalize();
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


function splitTextNode(text_node, index) {
    if (text_node.nodeType !== Node.TEXT_NODE)
        throw new Error("splitTextNode called on non-text");

    // Normalize
    if (index < 0)
        index = 0;
    else if (index > text_node.nodeValue.length)
        index = text_node.nodeValue.length;

    var frag = document.createDocumentFragment();
    var prev = document.createTextNode(text_node.nodeValue.slice(0, index));
    frag.appendChild(prev);
    var next = document.createTextNode(text_node.nodeValue.slice(index));
    frag.appendChild(next);
    text_node.parentNode.replaceChild(frag, text_node);
    return [prev, next];
}

function makePlaceholder() {
    return $("<span class='_placeholder' contenteditable='false'> </span>");
}

exports.getSelectionRange = getSelectionRange;
exports.nextCaretPosition = nextCaretPosition;
exports.prevCaretPosition = prevCaretPosition;
exports.makePlaceholder = makePlaceholder;
exports.nodeToPath = nodeToPath;
exports.pathToNode = pathToNode;
exports.splitTextNode = splitTextNode;

});
