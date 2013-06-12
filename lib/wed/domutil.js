/**
 * @module domutil
 * @desc Utilities that manipulate or query the DOM tree.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends <global> */ function (require, exports, module) {
"use strict";

var $ = require("jquery");
var rangy = require("rangy");

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

function makePlaceholder() {
    return $("<span class='_placeholder' contenteditable='false'> </span>");
}

exports.getSelectionRange = getSelectionRange;
exports.nextCaretPosition = nextCaretPosition;
exports.prevCaretPosition = prevCaretPosition;
exports.makePlaceholder = makePlaceholder;

});
