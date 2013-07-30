/**
 * @module gui_updater
 * @desc Listens to changes on a tree and update the GUI tree in
 * response to changes.
 * @author Louis-Dominique Dubeau
 */

define(/** @lends module:gui_updater */ function (require, exports, module) {
'use strict';

var domutil = require("./domutil");
var $ = require("jquery");
var oop = require("./oop");
var TreeUpdater = require("./tree_updater").TreeUpdater;

function GUIUpdater (gui_tree, data_tree, tree_updater) {
    TreeUpdater.call(this, gui_tree);
    this._gui_tree = gui_tree;
    this._data_tree = data_tree;
    this._tree_updater = tree_updater;
    this._tree_updater.addEventListener(
        "insertText", this._insertTextHandler.bind(this));
    this._tree_updater.addEventListener(
        "insertNodeAt", this._insertNodeAtHandler.bind(this));
    this._tree_updater.addEventListener(
        "setTextNodeValue", this._setTextNodeValueHandler.bind(this));
    this._tree_updater.addEventListener(
        "removeNode", this._removeNodeHandler.bind(this));
    this._tree_updater.addEventListener(
        "deleteText", this._deleteTextHandler.bind(this));
    this._tree_updater.addEventListener(
        "refresh", this._refreshHandler.bind(this));
}

oop.inherit(GUIUpdater, TreeUpdater);

GUIUpdater.prototype._insertTextHandler = function (ev) {
    var gui_caret = this.fromDataCaret(ev.parent, ev.index);
    this.insertText(gui_caret[0], gui_caret[1], ev.text);
};

TreeUpdater.prototype._deleteTextHandler = function(ev) {
    var gui_caret = this.fromDataCaret(ev.parent, ev.index);
    this.deleteText(gui_caret[0], gui_caret[1], ev.length);
};


GUIUpdater.prototype._insertIntoTextHandler = function (ev) {
    var gui_caret = this.fromDataCaret(ev.parent, ev.index);
    var clone = $(ev.element).clone();
    this.insertIntoText(gui_caret[0], gui_caret[1], clone);
    domutil.linkTrees(ev.element, clone);
};

GUIUpdater.prototype._insertNodeAtHandler = function (ev) {
    var gui_caret = this.fromDataCaret(ev.parent, ev.index);
    var clone = $(ev.element).clone().get(0);
    this.insertNodeAt(gui_caret[0], gui_caret[1], clone);
    domutil.linkTrees(ev.element, clone);
};

GUIUpdater.prototype._setTextNodeValueHandler = function (ev) {
    var gui_caret = this.fromDataCaret(ev.node, 0);
    this.setTextNodeValue(gui_caret[0], ev.value);
};

GUIUpdater.prototype._removeNodeHandler = function (ev) {
    var data_node = ev.node;
    var to_remove;
    switch(data_node.nodeType) {
    case Node.TEXT_NODE:
        var gui_caret = this.fromDataCaret(data_node, 0);
        to_remove = gui_caret[0];
        break;
    case Node.ELEMENT_NODE:
        to_remove = $(data_node).data("wed_mirror_node");
        break;
    }
    this.removeNode(to_remove);
    domutil.unlinkTree(data_node);
    domutil.unlinkTree(to_remove);
};

GUIUpdater.prototype._refreshHandler = function (ev) {
    var data_node = ev.node;
    var gui_node = $(ev.node).data("wed_mirror_node");
    domutil.unlinkTree(gui_node);
    while(gui_node.firstChild)
        gui_node.removeChild(gui_node.firstChild);
    var $clone = $(data_node).clone();
    $(gui_node).append($clone.contents().toArray());
    domutil.linkTrees(gui_node, data_node);
};


GUIUpdater.prototype.fromDataCaret = function (node, offset) {
    // Accept a single array as argument
    if (arguments.length === 1 && node instanceof Array) {
        offset = node[1];
        node = node[0];
    }

    var gui_node = domutil.pathToNode(
        this._gui_tree, domutil.nodeToPath(this._data_tree, node));

    if (node.nodeType === Node.TEXT_NODE)
        return [gui_node, offset];

    if (offset === 0)
        return [gui_node, 0];

    if (offset >= node.childNodes.length)
        return [gui_node, gui_node.childNodes.length];

    var gui_child = domutil.pathToNode(
        this._gui_tree, domutil.nodeToPath(this._data_tree,
                                           node.childNodes[offset]));
    if (gui_child === null)
        // This happens if for instance node has X children but the
        // corresponding node in _gui_tree has X-1 children.
        return [gui_node, gui_node.childNodes.length];

    return [gui_child.parentNode,
            Array.prototype.indexOf.call(gui_child.parentNode.childNodes,
                                         gui_child)];
};

exports.GUIUpdater = GUIUpdater;

});
