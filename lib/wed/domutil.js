/**
 * @module domutil
 * @desc Utilities that manipulate or query the DOM tree.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:domutil */ function (require, exports, module) {
"use strict";

var $ = require("jquery");
var rangy = require("rangy");
var util = require("./util");

var _indexOf = Array.prototype.indexOf;

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
 * <p>This function does not fully emulate how a browser moves the
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

                offset = _indexOf.call(parent.childNodes, node) + 1;
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

                offset = _indexOf.call(parent.childNodes, node) + 1;
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
         _indexOf.call(node.parentNode.childNodes, node)] : [node, offset];
}

/**
 *
 * <p>This function determines the caret position if the caret were
 * moved backwards.</p>
 *
 * <p>This function does not fully emulate how a browser moves the
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

                offset = _indexOf.call(parent.childNodes, node);
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

                offset = _indexOf.call(parent.childNodes, node);
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
         _indexOf.call(node.parentNode.childNodes, node)] : [node, offset];
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
 * @returns This function returns a representation of
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

    if (!$node.is("._real, ._phantom_wrap") && node.nodeType !== Node.TEXT_NODE)
        throw new Error("only nodes of class ._real and ._phantom_wrap " +
                        "are supported by nodeToPath");


    location = _indexOf.call(parent.childNodes, node);
    for (i = 0; i < location; ++i) {
        if ((parent.childNodes[i].nodeType === Node.TEXT_NODE) ||
            (parent.childNodes[i].nodeType === Node.ELEMENT_NODE &&
             $(parent.childNodes[i]).is("._real, ._phantom_wrap")))
            offset++;
    }

    ret = "" + offset;

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
    var match = /^(\d+)$/.exec(first);
    if (match) {
        index = match[1] >> 0;
        for(i = 0; !found && (i < root.childNodes.length); i++) {
            node = root.childNodes[i];
            if ((node.nodeType === Node.TEXT_NODE ||
                 (node.nodeType === Node.ELEMENT_NODE &&
                  $(node).is("._real, ._phantom_wrap"))) && --index < 0)
                found = node;
        }
    }
    else
        throw new Error("malformed path expression");

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
    var carets = _insertIntoText(text_node, index, undefined, false);
    return [carets[0][0], carets[1][0]];
}


/**
 * <p>Inserts an element into text, effectively splitting the text node in
 * two. This function takes care to modify the DOM tree only once.</p>
 *
 * <p>This function must have <code>this</code> set to an object that
 * has the <code>insertNodeAt</code> and <code>deleteNode</code> set
 * to functions with the signatures of , {@link
 * module:domutil~insertNodeAt insertNodeAt} and @{link
 * module:domutil~mergeTextNodes mergeTextNodes}. It optionally can
 * have a <code>insertFragAt</code> function with the same signature
 * as <code>insertNodeAt</code>.</p>
 *
 * @param {Node} text_node The text node that will be cut in two by the new
 * element.
 * @param {Integer} index The offset into the text node where to
 * insert the new element.
 * @param {Node} node The node to insert.
 * @returns {Array} The first element of the array is a caret position
 * (i.e. a pair of container and offset) marking the boundary between
 * what comes before the material inserted and the material
 * inserted. The second element of the array is a caret position
 * marking the boundary between the material inserted and what comes
 * after. If I insert "foo" at position 2 in "abcd", then the final
 * result would be "abfoocd" and the first caret would mark the
 * boundary between "ab" and "foo" and the second caret the boundary
 * between "foo" and "cd".
 */
function genericInsertIntoText(text_node, index, node) {
    // This function is meant to be called with this set to a proper
    // value.
    /* jshint validthis:true */
    if (!node)
        throw new Error("must pass an actual node to insert");
    return _genericInsertIntoText.apply(this, arguments);
}

/**
 * Inserts an element into text, effectively splitting the text node in
 * two. This function takes care to modify the DOM tree only once.
 *
 * <p>This function must have <code>this</code> set to an object that
 * has the <code>insertNodeAt</code> and <code>deleteNode</code> set
 * to functions with the signatures of , {@link
 * module:domutil~insertNodeAt insertNodeAt} and @{link
 * module:domutil~mergeTextNodes mergeTextNodes}. It optionally can
 * have a <code>insertFragAt</code> function with the same signature
 * as <code>insertNodeAt</code>.</p>
 *
 * @private
 * @param {Node} text_node The text node that will be cut in two by the new
 * element.
 * @param {Integer} index The offset into the text node where to
 * insert the new element.
 * @param {Node} node The node to insert. If this parameter evaluates
 * to <code>false</code>, then this function effectively splits the
 * text node into two parts.
 * @param {Boolean} [clean=true] The operation must clean contiguous
 * text nodes so as to merge them and must not create empty
 * nodes. <strong>This code assumes that the text node into which data
 * is added is not preceded or followed by another text node and that
 * it is not empty.</strong> In other words, if the DOM tree on which
 * this code is used does not have consecutive text nodes and no empty
 * nodes, then after the call, it still won't.
 * @returns {Array} The first element of the array is a caret position
 * (i.e. a pair of container and offset) marking the boundary between
 * what comes before the material inserted and the material
 * inserted. The second element of the array is a caret position
 * marking the boundary between the material inserted and what comes
 * after. If I insert "foo" at position 2 in "abcd", then the final
 * result would be "abfoocd" and the first caret would mark the
 * boundary between "ab" and "foo" and the second caret the boundary
 * between "foo" and "cd".
 */
function _genericInsertIntoText(text_node, index, node, clean) {
    // This function is meant to be called with this set to a proper
    // value.
    /* jshint validthis:true */
    if (text_node.nodeType !== Node.TEXT_NODE)
        throw new Error("insertIntoText called on non-text");

    var start_caret;
    var end_caret;

    if (clean === undefined)
        clean = true;

    // Normalize
    if (index < 0)
        index = 0;
    else if (index > text_node.nodeValue.length)
        index = text_node.nodeValue.length;

    var search_node, prev, next;
    var is_fragment = node && (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE);

    var parent = text_node.parentNode;
    var text_node_at = _indexOf.call(parent.childNodes, text_node);
    if (clean && (!node || (is_fragment && node.childNodes.length === 0)))
    {
        start_caret = end_caret = [text_node, index];
    }
    else {
        var frag = document.createDocumentFragment();
        prev = document.createTextNode(text_node.nodeValue.slice(0, index));
        frag.appendChild(prev);
        if (node)
            frag.appendChild(node);
        next = document.createTextNode(text_node.nodeValue.slice(index));
        var next_len = next.nodeValue.length;
        frag.appendChild(next);

        if (clean)
            frag.normalize();

        if (clean && index === 0)
            start_caret = [parent, text_node_at];
        else
            start_caret = [frag.firstChild, index];

        if (clean && index === text_node.nodeValue.length)
            end_caret = [parent, text_node_at + frag.childNodes.length];
        else
            end_caret = [frag.lastChild, frag.lastChild.nodeValue.length -
                         next_len];

        this.deleteNode(text_node);
        if (this.insertFragAt)
            this.insertFragAt(parent, text_node_at, frag);
        else
            while (frag.firstChild)
                this.insertNodeAt(parent, text_node_at++, frag.firstChild);
    }
    return [start_caret, end_caret];
}

var plain_dom_mockup =     {
    insertNodeAt: insertNodeAt,
    insertFragAt: insertNodeAt,
    deleteNode: deleteNode
};

var _insertIntoText = _genericInsertIntoText.bind(plain_dom_mockup);

/**
 * Inserts an element into text, effectively splitting the text node in
 * two. This function takes care to modify the DOM tree only once.
 *
 * @param {Node} text_node The text node that will be cut in two by the new
 * element.
 * @param {Integer} index The offset into the text node where to
 * insert the new element.
 * @param {Node} node The node to insert.
 * @returns {Array} The first element of the array is a caret position
 * (i.e. a pair of container and offset) marking the boundary between
 * what comes before the material inserted and the material
 * inserted. The second element of the array is a caret position
 * marking the boundary between the material inserted and what comes
 * after. If I insert "foo" at position 2 in "abcd", then the final
 * result would be "abfoocd" and the first caret would mark the
 * boundary between "ab" and "foo" and the second caret the boundary
 * between "foo" and "cd".
 */
var insertIntoText = genericInsertIntoText.bind(plain_dom_mockup);

/**
 * Inserts text into a node. This function will use already existing
 * text nodes whenever possible rather than create a new text node.
 *
 * @param {Node} node The node where to insert the text.
 * @param {Integer} index The location in the node where to insert the text.
 * @param {String} text The text to insert.
 * @returns {Array.<Node>} The first element of the array is the node
 * that was modified to insert the text. It will be
 * <code>undefined</code> if no node was modified. The second element
 * is the text node which contains the new text. The two elements are
 * defined and equal if a text node was modified to contain the newly
 * inserted text. They are unequal if a new text node had to be
 * created to contain the new text. A return value of
 * <code>[undefined, undefined]</code> means that no modification
 * occurred (because the text passed was "").
 */
function genericInsertText(node, index, text) {
    // This function is meant to be called with this set to a proper
    // value.
    /* jshint validthis:true */
    if (text === "")
        return [undefined, undefined];

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
            this.insertNodeAt(node, index, text_node);
            node = undefined;
            break work;
        case Node.TEXT_NODE:
            var pre = node.nodeValue.slice(0, index);
            var post = node.nodeValue.slice(index);
            this.setTextNodeValue(node, pre + text + post);
            text_node = node;
            break work;
        default:
            throw new Error("unexpected node type: " + node.nodeType);
        }
    }
    return [node, text_node];
}

var insertText = genericInsertText.bind(
    {
        insertNodeAt: insertNodeAt,
        setTextNodeValue: function (node, value) {
            node.nodeValue = value;
        }
    });

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
 * This function recursively links two DOM trees though the jQuery
 * <code>.data()</code> method. For element in the first tree the data
 * item named "wed_mirror_node" in points to the corresponding element
 * in the second tree, and vice-versa. It is presumed that the two
 * DOM trees are perfect mirrors of each other, although no test is
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
 * This function recursively unlinks a DOM tree though the jQuery
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

/**
 * Removes the node. Mainly for use with the generic functions defined here.
 *
 * @param {Node} node The node to remove.
 */
function deleteNode(node) {
    node.parentNode.removeChild(node);
}

/**
 * Inserts at node at the position specified. Mainly for use with the
 * generic functions defined here.
 *
 * @param {Node} parent The node which will become the parent of the
 * inserted node.
 * @param {Integer} index The position at which to insert the node
 * into the parent.
 * @param {Node} node The node to insert.
 */
function insertNodeAt(parent, index, node) {
    parent.insertBefore(node, parent.childNodes[index]);
}

/**
 * Merges a text node with the next text node, if present. When called
 * on something which is not a text node or if the next node is not
 * text, does nothing. Mainly for use with the generic functions defined here.
 *
 * @param {Node} node The node to merge with the next node.
 * @returns {Array} A two-element array. It is a caret position
 * between the two parts that were merged, or between the two nodes
 * that were not merged (because they were not both text).
 */
function mergeTextNodes(node) {
    var next = node.nextSibling;
    if (node.nodeType === Node.TEXT_NODE &&
        next && next.nodeType === Node.TEXT_NODE) {
        var offset = node.nodeValue.length;
        node.nodeValue += next.nodeValue;
        next.parent.removeChild(next);
        return [node, offset];
    }

    var parent = node.parentNode;
    return [parent, _indexOf.call(parent.childNodes, node) + 1];
}

/**
 * <p>Removes the contents between the start and end carets from the DOM
 * tree. If two text nodes become adjacent, they are merged.</p>
 *
 * <p>This function must have <code>this</code> set to an object that
 * has the <code>deleteText</code>, <code>deleteNode</code> and
 * <code>mergeTextNodes</code> symbols set to functions with the
 * signatures of {@link module:domutil~deleteText deleteText}, {@link
 * module:domutil~deleteNode deleteNode} and @{link
 * module:domutil~mergeTextNodes mergeTextNodes}.
 *
 * @param {Array} start_caret Start caret position.
 * @param {Array} end_caret Ending caret position.
 * @returns {Array} A pair of items. The first item is the caret
 * position indicating where the cut happened. The second item is a
 * list of nodes. The cut contents.
 */
function genericCutFunction (start_caret, end_caret) {
    if (!isWellFormedRange({startContainer: start_caret[0],
                            startOffset: start_caret[1],
                            endContainer: end_caret[0],
                            endOffset: end_caret[1]}))
        throw new Error("range is not well-formed");

    // This function is meant to be called with this set to a proper
    // value.
    /* jshint validthis:true */
    var start_container = start_caret[0];
    var start_offset = start_caret[1];
    var end_container = end_caret[0];
    var end_offset = end_caret[1];

    var parent;
    var same_container = start_container === end_container;

    // The corresponding elements on the gui side have already been
    // removed from the gui tree, so we exceptionally modify the data tree
    // directly.

    var final_caret;
    var start_text;
    if (start_container.nodeType === Node.TEXT_NODE) {
        parent = start_container.parentNode;
        var start_container_offset = _indexOf.call(
            parent.childNodes, start_container);

        var end_text_offset = same_container ? end_offset :
                start_container.nodeValue.length;

        start_text = parent.ownerDocument.createTextNode(
            start_container.nodeValue.slice(start_offset, end_text_offset));
        this.deleteText(start_container, start_offset,
                        start_text.nodeValue.length);

        final_caret = (start_container.parentNode) ?
            [start_container, start_offset] :
            // Selection was such that the text node was emptied.
            [parent, start_container_offset];

        if (same_container)
            // Both the start and end were in the same node, so the
            // deleteText operation above did everything needed.
            return [final_caret, [start_text]];

        // Alter our start to take care of the rest
        start_offset = (start_container.parentNode) ?
            // Look after the text node we just modified.
            start_container_offset + 1 :
            // Selection was such that the text node was emptied, and
            // thus removed. So stay at the same place.
            start_container_offset;
        start_container = parent;
    }

    var end_text;
    if (end_container.nodeType === Node.TEXT_NODE) {
        parent = end_container.parentNode;
        var end_container_offset = _indexOf.call(
            parent.childNodes, end_container);

        end_text = parent.ownerDocument.createTextNode(
            end_container.nodeValue.slice(0, end_offset));
        this.deleteText(end_container, 0, end_offset);

        // Alter our end to take care of the rest
        end_offset = end_container_offset;
        end_container = parent;
    }

    // At this point, the following checks must hold
    if (start_container !== end_container)
            throw new Error("internal error in cut: containers unequal");
    if (start_container.nodeType !== Node.ELEMENT_NODE)
        throw new Error("internal error in cut: not an element");

    var return_nodes = [];
    end_offset--;
    // Doing it in reverse allows us to not worry about offsets
    // getting out of whack.
    while (end_offset >= start_offset) {
        return_nodes.unshift(end_container.childNodes[end_offset]);
        this.deleteNode(end_container.childNodes[end_offset]);
        end_offset--;
    }
    if (start_text)
        return_nodes.unshift(start_text);
    if (end_text)
        return_nodes.push(end_text);

    // At this point, end_offset points to the node that is before the
    // list of nodes removed. The browser cut on the gui tree did not
    // merge text nodes so use the tree_updater to perform this merge.
    this.mergeTextNodes(end_container.childNodes[end_offset]);
    return [final_caret, return_nodes];
}

/**
 * Returns the <strong>element</strong> nodes that contain the start
 * and the end of the range. If an end of the range happens to be in a
 * text node, the element node will be that node's parent.
 *
 * @private
 * @param {Range} range A DOM range.
 * @returns {Array} A pair of nodes.
 */
function nodePairFromRange(range) {
    var start_node;
    switch(range.startContainer.nodeType) {
    case Node.TEXT_NODE:
        start_node = range.startContainer.parentNode;
        break;
    case Node.ELEMENT_NODE:
        start_node = range.startContainer;
        break;
    default:
        throw new Error("unexpected node type: " + range.startContainer.nodeType);

    }

    var end_node;
    switch(range.endContainer.nodeType) {
    case Node.TEXT_NODE:
        end_node = range.endContainer.parentNode;
        break;
    case Node.ELEMENT_NODE:
        end_node = range.endContainer;
        break;
    default:
        throw new Error("unexpected node type: " + range.endContainer.nodeType);
    }
    return [start_node, end_node];
}

/**
 * Determines whether a range is well-formed. A well-formed range is
 * one who is entirely contained by the same element.
 *
 * @param {Range} range A DOM range.
 * @returns {Boolean} True if the range is well-formed. False if not.
 */
function isWellFormedRange(range) {
    var pair = nodePairFromRange(range);
    return pair[0] === pair[1];
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
exports.firstDescendantOrSelf = firstDescendantOrSelf;
exports.isWellFormedRange = isWellFormedRange;
exports.genericCutFunction = genericCutFunction;
exports.genericInsertIntoText = genericInsertIntoText;
exports.genericInsertText = genericInsertText;
exports.deleteNode = deleteNode;
exports.mergeTextNodes = mergeTextNodes;

});

//  LocalWords:  domutil jquery util whitespace pathToNode nodeToPath
//  LocalWords:  contenteditable abcd abfoocd cd insertIntoText lt
//  LocalWords:  Prepend deleteText jQuery getSelectionRange prev
//  LocalWords:  lastChild makeCutFunction deleteNode mergeTextNodes
//  LocalWords:  jshint validthis
