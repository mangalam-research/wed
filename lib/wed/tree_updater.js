/**
 * @module tree_updater
 * @desc Facility to update a DOM tree and issue synchronous events on
 * changes.
 * @author Louis-Dominique Dubeau
 */

define(/** @lends module:tree_updater */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
var domutil = require("./domutil");
var oop = require("./oop");
var SimpleEventEmitter = require("./lib/simple_event_emitter").SimpleEventEmitter;

function TreeUpdater (tree) {
    // Call the constructor for our mixin
    SimpleEventEmitter.call(this);
    this._tree = tree;
}

oop.implement(TreeUpdater, SimpleEventEmitter);

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

TreeUpdater.prototype.splitAt = function (node, caret) {
    var pair = domutil.splitAt(node, caret[0], caret[1]);
    this._emit("refresh", {node: node.parentNode});
    return pair;
};

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

TreeUpdater.prototype.insertText = function (parent, index, text) {
    var ret = domutil.insertText(parent, index, text);
    this._emit("insertText", {parent: parent, index: index, text: text});
    return ret;
};

TreeUpdater.prototype.deleteText = function(parent, index, length) {
    this._emit("deleteText", {parent: parent, index: index, length: length});
    domutil.deleteText(parent, index, length);
};

TreeUpdater.prototype.insertIntoText = function (parent, index, element) {
    var grandparent = parent.parentNode;
    var ret = domutil.insertIntoText(parent, index, element);
    // TODO this should be optimized because refresh is expensive.
    this._emit("refresh", {node: grandparent});
    return ret;
};

TreeUpdater.prototype.insertNodeAt = function (parent, index, element) {
    if (index >= parent.childNodes.length)
        $(parent).append(element);
    else
        $(parent.childNodes[index]).before(element);
    this._emit("insertNodeAt", {parent: parent, index: index,
                                   element: element});
};

TreeUpdater.prototype.setTextNodeValue = function (node, value) {
    this._emit("setTextNodeValue", {node: node, value: value});
    if (value !== "")
        node.nodeValue = value;
    else
        this.removeNode(node);
};

TreeUpdater.prototype.removeNode = function (node) {
    this._emit("removeNode", {node: node});
    $(node).detach();
};

exports.TreeUpdater = TreeUpdater;

});
