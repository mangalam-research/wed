/**
 * @module domutil
 * @desc Utilities that manipulate or query the DOM tree.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends <global> */ function (require, exports, module) {
"use strict";

var $ = require("jquery");
var rangy = require("rangy");

function getSelectionRange() {
    var sel = rangy.getSelection();

    if (sel === undefined || sel.rangeCount < 1)
        return undefined;

    return sel.getRangeAt(0);
}

/**
 *
 * This function determines the caret position if the caret were moved
 * forward.
 *
 * @param {Array} caret A caret position where the search starts. This
 * should be an array of length two that has in first position the
 * node where the caret is and in second position the offset in that
 * node. This pair is to be interpreted in the same way node, offset
 * pairs are interpreted in selection or range objects.
 *
 * @param {Boolean} no_text If true, and a text node would be
 * returned, the function will instead return the parent of the text
 * node. True by default.
 *
 * @returns {Node} Returns the node which would contain the caret, or
 * null if such node cannot be found.
 */
function nextCaretPosition(caret, no_text) {
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
                    node.parentNode === node.ownerDocument)
                    break search_loop;

                offset = Array.prototype.indexOf.call(
                    node.parentNode.childNodes, node) + 1;
                node = node.parentNode;
                found = true;
            }
            else {
                node = node.childNodes[offset];
                offset = 0;

                // If our child is a text node, then we must move into
                // it.
                if (node.childNodes.length > 0 &&
                    node.childNodes[offset].nodeType ===
                    Node.TEXT_NODE) {
                    node = node.childNodes[offset];
                    offset = -1;
                }
                else
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
 * This function determines which node would contain the caret if the
 * caret were moved backwards.
 *
 * @param {Array} caret A caret position where the search starts. This
 * should be an array of length two that has in first position the
 * node where the caret is and in second position the offset in that
 * node. This pair is to be interpreted in the same way node, offset
 * pairs are interpreted in selection or range objects.
 *
 * @param {Boolean} no_text If true, and a text node would be
 * returned, the function will instead return the parent of the text
 * node. True by default.
 *
 * @returns {Node} Returns the node which would contain the caret, or
 * null if such node cannot be found.
 */
function nodeAtPrevCaretPosition(caret, no_text) {
    var node = caret[0];
    var offset = caret[1];
    if (no_text === undefined)
        no_text = true;

    offset--;

    var found = false;
    search_loop:
    while(!found) {
        switch(node.nodeType) {
        case Node.TEXT_NODE:
            if (offset < 0 ||
                // If the parent node is set to normal white-space
                // handling, then moving the caret back by one
                // position will skip this white-space.
                ($(node.parentNode).css("white-space") === "normal" &&
                 /^\s+$/.test(node.nodeValue.slice(0, offset)))) {
                offset = Array.prototype.indexOf.call(node.parentNode.childNodes, node) - 1;
                node = node.parentNode;
            }
            else
                found = true;
            break;
        case Node.ELEMENT_NODE:
            if (offset < 0 || node.childNodes.length === 0) {
                // If we've hit the end of what we can search, stop.
                if (node.parentNode === null || node.parentNode === node.ownerDocument)
                    break search_loop;

                offset = Array.prototype.indexOf.call(node.parentNode.childNodes, node) - 1;
                node = node.parentNode;
            }
            // If node.childNodes.length === 0, the first branch would
            // have been taken. No need to test that offset indexes to
            // something that exists.
            else if (node.childNodes[offset].nodeType === Node.TEXT_NODE)
                found = true;
            else {
                node = node.childNodes[offset];
                offset = node.childNodes.length - 1;
            }
            break;
        }
    }

    if (!found)
        return null;

    if (node.nodeType === Node.ELEMENT_NODE)
        node = node.childNodes[offset];

    return (no_text && node.nodeType === Node.TEXT_NODE)?node.parentNode:node;
}

function makePlaceholder() {
    return $("<span class='_placeholder' contenteditable='false'> </span>");
}

exports.getSelectionRange = getSelectionRange;
exports.nextCaretPosition = nextCaretPosition;
exports.nodeAtPrevCaretPosition = nodeAtPrevCaretPosition;
exports.makePlaceholder = makePlaceholder;

});
