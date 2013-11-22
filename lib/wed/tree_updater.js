/**
 * @module tree_updater
 * @desc Facility for updating a DOM tree and issue synchronous events
 * on changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:tree_updater */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
var domutil = require("./domutil");
var oop = require("./oop");
var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;

/**
 * @classdesc <p>A TreeUpdater is meant to serve as the sole point of
 * modification for a DOM tree. As methods are invoked on the
 * TreeUpdater to modify the tree, events are issued synchronously,
 * which allows a listener to know what is happening on the tree.</p>
 *
 * <p>Methods are divided into primitive and complex
 * methods. Primitive methods perform one and only one modification
 * and issue an event of the same name as their own name. Complex
 * methods use primitive methods to perform a series of modifications
 * on the tree. Or they delegate the actual modification work to the
 * primitive methods. They may emit one or more events of a name
 * different from their own name.</p>
 *
 * <p>For primitive methods, the list of events which they are
 * documented to be firing is exhaustive. For complex methods, the
 * list is not exhaustive.</p>
 *
 * <p>Many events have a name identical to a corresponding
 * method. Such events are accompanied by event objects which have the
 * same properties as the parameters of the corresponding method, with
 * the same meaning. Therefore, their parameters are not further
 * documented.</p>
 *
 * <p>Events signaling the removal of data from the DOM tree are
 * issued <strong>before</strong> their corresponding operation is
 * performed on the tree. Events signaling the addition of data to the
 * DOM tree are issued <strong>after</strong> their corresponding
 * operation is performed on the tree.</p>
 * @mixes module:simple_event_emitter~SimpleEventEmitter
 *
 * @constructor
 * @param {Node} tree The node which contains the tree to update.
 *
 */
function TreeUpdater (tree) {
    // Call the constructor for our mixin
    SimpleEventEmitter.call(this);
    this._tree = tree;
}

oop.implement(TreeUpdater, SimpleEventEmitter);

/**
 * A complex method. This is a convenience method that will call
 * primitive methods to insert the specified item at the specified
 * location. Note that this method returns nothing even if the
 * primitives it uses return some information.
 *
 * @param {Node} parent The node that will contain what is inserted.
 * @param {integer} index The place at which to insert into <code>parent<code>.
 * @param what The data to insert. This can be a string, a DOM Node of
 * TEXT_NODE or ELEMENT_NODE type, or an array of these.
 * @throws {Error} If <code>parent</code> or <code>what</code> Node is not
 * of text or element type.
 */
TreeUpdater.prototype.insertAt = function (parent, index, what) {
    if (what instanceof Array || what instanceof NodeList) {
        for (var i = 0; i < what.length; ++i, ++index)
            this.insertAt(parent, index, what[i]);
    }
    else if (typeof what === "string")
        this.insertText(parent, index, what);
    else if (what.nodeType === Node.TEXT_NODE) {
        switch(parent.nodeType) {
        case Node.TEXT_NODE:
            this.insertText(parent, index, what.nodeValue);
            break;
        case Node.ELEMENT_NODE:
            this.insertNodeAt(parent, index, what);
            break;
        default:
            throw new Error("unexpected node type: " + parent.nodeType);

        }
    }
    else if (what.nodeType === Node.ELEMENT_NODE) {
        switch(parent.nodeType) {
        case Node.TEXT_NODE:
            this.insertIntoText(parent, index, what);
            break;
        case Node.ELEMENT_NODE:
            this.insertNodeAt(parent, index, what);
            break;
        default:
            throw new Error("unexpected node type: " + parent.nodeType);

        }
    }
    else
        throw new Error("unexpected value for what: " + what);
};

/**
 * A complex method. Splits a DOM tree into two halves.
 *
 * @param {Node} top The node at which the splitting operation should
 * end. This node will be split but the function won't split anything
 * above this node.
 * @param {Node} node The node at which to start.
 * @param {number} index The index at which to start in the node.
 * @returns {Array.<Node>} An array containing in order the first and
 * second half of the split.
 * @throws {Error} If the split location is not inside the top node or
 * if the call would merely split a text node in two.
 */
TreeUpdater.prototype.splitAt = function (top, node, index) {
    if (node instanceof Array) {
        index = node[1];
        node = node[0];
    }

    if (node === top && node.nodeType === Node.TEXT_NODE)
        throw new Error("splitAt called in a way that would result in " +
                        "two adjacent text nodes");

    if ($(node).closest(top).length === 0)
        throw new Error("split location is not inside top");

    var cloned_top = $(top).clone().get(0);
    var cloned_node = domutil.pathToNode(cloned_top,
                                         domutil.nodeToPath(top, node));
    var pair = this._splitAt(cloned_top, cloned_node, index);

    var parent = top.parentNode;
    var at = Array.prototype.indexOf.call(parent.childNodes, top);
    this.deleteNode(top);
    this.insertNodeAt(parent, at, pair[0]);
    this.insertNodeAt(parent, at + 1, pair[1]);
    return pair;
};

/**
 * Splits a DOM tree into two halves.
 * @private
 *
 * @param {Node} top The node at which the splitting operation should
 * end. This node will be split but the function won't split anything
 * above this node.
 * @param {Node} node The node at which to start.
 * @param {number} index The index at which to start in the node.
 * @returns {Array.<Node>} An array containing in order the first and
 * second half of the split.
 */
TreeUpdater.prototype._splitAt = function (top, node, index) {
    // We need to check this now because some operations below may
    // remove node from the DOM tree.
    var stop = (node === top);

    var parent = node.parentNode;
    var ret;
    switch(node.nodeType) {
    case Node.TEXT_NODE:
        if (index === 0)
            ret = [null, node];
        else if (index === node.nodeValue.length)
            ret = [node, null];
        else {
            var text_after = node.nodeValue.slice(index);
            node.nodeValue = node.nodeValue.slice(0, index);
            if (parent)
                parent.insertBefore(parent.ownerDocument.createTextNode(
                    text_after),
                    node.nextSibling);
            ret = [node, node.nextSibling];
        }
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
        while (index--)
            clone.removeChild(clone.childNodes[0]);

        if (parent)
            parent.insertBefore(clone, node.nextSibling);

        ret = [node, clone];
        break;
    default:
        throw new Error("unexpected node type: " + node.nodeType);
    }

    if (stop) // We've just split the top, so end here...
        return ret;

    return this._splitAt(
        top, parent, Array.prototype.indexOf.call(parent.childNodes, node) + 1);
};

/**
 * A complex method. Inserts the specified item before another
 * one. Note that the order of operands is the same as for the
 * <code>insertBefore</code> DOM method.
 *
 * @param {Node} parent The node that contains the two other
 * parameters.
 * @param {Node} to_insert The node to insert.
 * @param {Node} before_this The node in front of which to insert. A
 * value of <code>null</code> results in appending to the parent node.
 *
 * @throws {Error} If <code>before_this</code> is not a child of <code>
 * parent</code>.
 */
TreeUpdater.prototype.insertBefore = function (parent, to_insert,
                                               before_this) {
    // Convert it to an insertAt operation.
    var index = !before_this ? parent.childNodes.length :
            Array.prototype.indexOf.call(parent.childNodes, before_this);
    if (index === -1)
        throw new Error("insertBefore called with a before_this value "+
                        "which is not a child of parent");
    this.insertAt(parent, index, to_insert);
};

/**
 * A complex method. Inserts text into a node. This function will use
 * already existing text nodes whenever possible rather than create a
 * new text node.
 *
 * @method
 * @param {Node} node The node at which to insert the text.
 * @param {integer} index The location in the node at which to insert the text.
 * @param {string} text The text to insert.
 * @returns {Array.<Node>} The first element of the array is the node
 * that was modified to insert the text. It will be
 * <code>undefined</code> if no node was modified. The second element
 * is the text node which contains the new text. The two elements are
 * defined and equal if a text node was modified to contain the newly
 * inserted text. They are unequal if a new text node had to be
 * created to contain the new text. A return value of
 * <code>[undefined, undefined]</code> means that no modification
 * occurred (because the text passed was "").
 * @throws {Error} If <code>node</code> is not an element or text Node type.
 */
TreeUpdater.prototype.insertText = domutil.genericInsertText;

/**
 * A complex method. Deletes text from a text node. If the text node
 * becomes empty, it is deleted.
 *
 * @param {Node} node The text node from which to delete text.
 * @param {integer} index The index at which to delete text.
 * @param {integer} length The length of text to delete.
 *
 * @emits module:tree_updater~TreeUpdater#deleteText
 * @throws {Error} If <code>node</code> is not a text Node type.
 */
TreeUpdater.prototype.deleteText = function(node, index, length) {
    if (node.nodeType !== Node.TEXT_NODE)
        throw new Error("deleteText called on non-text");

    this.setTextNode(node, node.nodeValue.slice(0, index) +
                     node.nodeValue.slice(index + length));
};

/**
 * A complex method. Inserts an element into text, effectively
 * splitting the text node in two. This function takes care to modify
 * the DOM tree only once.
 * @method
 *
 * @param {Node} parent The text node that will be cut in two by the new
 * element.
 * @param {integer} index The offset into the text node where
 * the new element is to be inserted.
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
 * @throws {Error} If the node to insert is undefined or null.
 */
TreeUpdater.prototype.insertIntoText = domutil.genericInsertIntoText;


/**
 * A primitive method. Inserts a node at the specified position.
 *
 * @param {Node} parent The node which will become the parent of the
 * inserted node.
 * @param {integer} index The position at which to insert the node
 * into the parent.
 * @param {Node} node The node to insert.
 *
 * @emits module:tree_updater~TreeUpdater#insertNodeAt
 * @throws {Error} If <code>node</code> is a document fragment Node type.
 */
TreeUpdater.prototype.insertNodeAt = function (parent, index, node) {
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE)
        throw new Error("document fragments cannot be passed to insertNodeAt");

    parent.insertBefore(node, parent.childNodes[index]);
    /**
     * @event module:tree_updater~TreeUpdater#insertNodeAt
     * @type {Object}
     * @property {Node} parent
     * @property {integer} index
     * @property {Node} node
     */
    this._emit("insertNodeAt", {parent: parent, index: index,
                                node: node});
};

/**
 * A complex method. Sets a text node to a specified value.
 *
 * @param {Node} node The node to modify. Must be a text node.
 * @param {string} value The new value of the node.
 *
 * @throws {Error} If called on a non-text Node type.
 */
TreeUpdater.prototype.setTextNode = function (node, value) {
    if (node.nodeType !== Node.TEXT_NODE)
        throw new Error("setTextNode called on non-text");

    if (value !== "")
        this.setTextNodeValue(node, value);
    else
        this.deleteNode(node);
};

/**
 * A primitive method. Sets a text node to a specified value. This
 * method must not be called directly by code that perform changes of
 * the DOM tree at a high level, because it does not prevent a text
 * node from becoming empty. Call {@link
 * module:tree_updater~TreeUpdater#removeNode setTextNode}
 * instead. This method is meant to be used by other complex methods
 * of TreeUpdater and by some low-level facilities of wed.
 *
 * @param {Node} node The node to modify. Must be a text node.
 * @param {string} value The new value of the node.
 *
 * @emits module:tree_updater~TreeUpdater#setTextNodeValue
 * @throws {Error} If called on a non-text Node type.
 */
TreeUpdater.prototype.setTextNodeValue = function (node, value) {
    if (node.nodeType !== Node.TEXT_NODE)
        throw new Error("setTextNodeValue called on non-text");

    var old_value = node.nodeValue;
    node.nodeValue = value;
    /**
     * @event module:tree_updater~TreeUpdater#setTextNodeValue
     * @type {Object}
     * @property {Node} node
     * @property {string} value
     * @property {string} old_value The value before the change.
     */
    this._emit("setTextNodeValue", {
        node: node, value: value, old_value: old_value});
};


/**
 * A complex method. Removes a node from the DOM tree. If two text
 * nodes become adjacent, they are merged.
 *
 * @param {Node} node The node to remove
 * @returns {Array} A two-element array. It is a caret position
 * between the two parts that were merged, or between the two nodes
 * that were not merged (because they were not both text).
 */
TreeUpdater.prototype.removeNode = function (node) {
    var prev = node.previousSibling;
    var next = node.nextSibling;
    var parent = node.parentNode;
    var ix = Array.prototype.indexOf.call(parent.childNodes, node);
    this.deleteNode(node);
    if (!prev)
        return [parent, ix];
    return this.mergeTextNodes(prev);
};

/**
 * A complex method. Removes a list of nodes from the DOM tree. If two
 * text nodes become adjacent, they are merged.
 *
 * @param {Array.<Node>} nodes An array of nodes. These nodes must be
 * immediately contiguous siblings in document order.
 *
 * @returns {Array} A two-element array. It is a caret position
 * between the two parts that were merged, or between the two nodes
 * that were not merged (because they were not both text). Undefined
 * if the list of nodes is empty.
 * @throws {Error} If nodes are not contiguous siblings.
 */
TreeUpdater.prototype.removeNodes = function (nodes) {
    if (!nodes.length)
        return undefined;
    var prev = nodes[0].previousSibling;
    var next = nodes[nodes.length - 1].nextSibling;
    var parent = nodes[0].parentNode;
    var ix = Array.prototype.indexOf.call(parent.childNodes, nodes[0]);
    for(var i = 0; i < nodes.length; ++i) {
        if (i < nodes.length - 1 && nodes[i].nextSibling !== nodes[i + 1])
            throw new Error("nodes are not immediately contiguous in " +
                            "document order");
        this.deleteNode(nodes[i]);
    }

    if (!prev)
        return [parent, ix];
    return this.mergeTextNodes(prev);
};

/**
 * A complex method. Removes the contents between the start and end
 * carets from the DOM tree. If two text nodes become adjacent, they
 * are merged.
 * @function
 *
 * @param {Array} start_caret Start caret position.
 * @param {Array} end_caret Ending caret position.
 * @returns {Array} A pair of items. The first item is the caret
 * position indicating where the cut happened. The second item is a
 * list of nodes, the cut contents.
 * @throws {Error} If Nodes in the range are not in the same element.
 */
TreeUpdater.prototype.cut = domutil.genericCutFunction;


/**
 * A complex method. If the node is a text node and followed by a text
 * node, this method will combine them.
 *
 * @param {Node} node The node to check.
 * @returns {Array} A two-element array. It is a caret position
 * between the two parts that were merged, or between the two nodes
 * that were not merged (because they were not both text).
 */
TreeUpdater.prototype.mergeTextNodes = function (node) {
    var next = node.nextSibling;
    if (node.nodeType === Node.TEXT_NODE &&
        next && next.nodeType === Node.TEXT_NODE) {
        var offset = node.nodeValue.length;
        this.setTextNodeValue(node, node.nodeValue + next.nodeValue);
        this.deleteNode(next);
        return [node, offset];
    }

    var parent = node.parentNode;
    return [parent,
            Array.prototype.indexOf.call(parent.childNodes, node) + 1];
};

/**
 * A primitive method. Removes a node from the DOM tree. This method
 * must not be called directly by code that perform changes of the DOM
 * tree at a high level, because it does not prevent two text nodes
 * from being contiguous after deletion of the node. Call {@link
 * module:tree_updater~TreeUpdater#removeNode removeNode}
 * instead. This method is meant to be used by other complex methods
 * of TreeUpdater and by some low-level facilities of wed.
 *
 * @param {Node} node The node to remove
 *
 * @emits module:tree_updater~TreeUpdater#deleteNode
 */
TreeUpdater.prototype.deleteNode = function (node) {
    /**
     * @event module:tree_updater~TreeUpdater#deleteNode
     * @type {Object}
     * @property {Node} node
     */
    this._emit("deleteNode", {node: node});
    $(node).detach();
};

/**
 * Converts a node to a path.
 *
 * @param {Node} node The node for which to return a path.
 * @returns {string} The path of the node relative to the root of the
 * tree we are updating.
 */
TreeUpdater.prototype.nodeToPath = function (node) {
    return domutil.nodeToPath(this._tree, node);
};

/**
 * Converts a path to a node.
 *
 * @param {string} path The path to convert.
 * @returns {Node} The node corresponding to the path passed.
 */
TreeUpdater.prototype.pathToNode = function (path) {
    return domutil.pathToNode(this._tree, path);
};



exports.TreeUpdater = TreeUpdater;

});

//  LocalWords:  DOM Mangalam MPL Dubeau previousSibling nextSibling
//  LocalWords:  mergeTextNodes prev insertIntoText nodeToPath jQuery
//  LocalWords:  pathToNode SimpleEventEmitter deleteNode setTextNode
//  LocalWords:  cd abfoocd abcd insertNodeAt TreeUpdater param mixin
//  LocalWords:  setTextNodeValue removeNode deleteText insertBefore
//  LocalWords:  insertText insertAt splitAt oop domutil jquery
