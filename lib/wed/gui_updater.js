/**
 * @module gui_updater
 * @desc Listens to changes on a tree and updates the GUI tree in
 * response to changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:gui_updater */ function (require, exports, module) {
'use strict';

var domutil = require("./domutil");
var $ = require("jquery");
var oop = require("./oop");
var TreeUpdater = require("./tree_updater").TreeUpdater;
var dloc = require("./dloc");
var convert = require("./convert");
var util = require("./util");
var makeDLoc = dloc.makeDLoc;
var DLoc = dloc.DLoc;

/**
 * @classdesc Updates a GUI tree so that its data nodes (those nodes
 * that are not decorations) mirror a data tree.
 * @extends module:tree_updater~TreeUpdater
 *
 * @constructor
 * @param {Node} gui_tree The DOM tree to update.
 * @param {module:tree_updater~TreeUpdater} tree_updater A tree
 * updater that updates the data tree. It serves as a source of
 * modification events which the <code>GUIUpdater</code> object being
 * created will listen on.
 */
function GUIUpdater (gui_tree, tree_updater) {
    TreeUpdater.call(this, gui_tree);
    this._gui_tree = gui_tree;
    this._tree_updater = tree_updater;
    this._tree_updater.addEventListener(
        "insertNodeAt", this._insertNodeAtHandler.bind(this));
    this._tree_updater.addEventListener(
        "setTextNodeValue", this._setTextNodeValueHandler.bind(this));
    this._tree_updater.addEventListener(
        "deleteNode", this._deleteNodeHandler.bind(this));
    this._tree_updater.addEventListener(
        "setAttributeNS", this._setAttributeNSHandler.bind(this));
}

oop.inherit(GUIUpdater, TreeUpdater);

/**
 * Handles {@link module:tree_updater~TreeUpdater#event:insertNodeAt
 * insertNodeAt} events.
 * @private
 * @param {module:tree_updater~TreeUpdater#event:insertNodeAt} ev The
 * event.
 */
GUIUpdater.prototype._insertNodeAtHandler = function (ev) {
    var gui_caret = this.fromDataLocation(ev.parent, ev.index);
    var clone = convert.toHTMLTree(ev.node.ownerDocument, ev.node);
    domutil.linkTrees(ev.node, clone);
    this.insertNodeAt(gui_caret, clone);
};

/**
 * Handles {@link module:tree_updater~TreeUpdater#event:setTextNodeValue
 * setTextNodeValue} events.
 * @private
 * @param {module:tree_updater~TreeUpdater#event:setTextNodeValue} ev The
 * event.
 */
GUIUpdater.prototype._setTextNodeValueHandler = function (ev) {
    var gui_caret = this.fromDataLocation(ev.node, 0);
    this.setTextNodeValue(gui_caret.node, ev.value);
};

/**
 * Handles {@link module:tree_updater~TreeUpdater#event:deleteNode
 * deleteNode} events.
 * @private
 * @param {module:tree_updater~TreeUpdater#event:deleteNode} ev The
 * event.
 */
GUIUpdater.prototype._deleteNodeHandler = function (ev) {
    var data_node = ev.node;
    var to_remove;
    switch(data_node.nodeType) {
    case Node.TEXT_NODE:
        var gui_caret = this.fromDataLocation(data_node, 0);
        to_remove = gui_caret.node;
        break;
    case Node.ELEMENT_NODE:
        to_remove = $.data(data_node, "wed_mirror_node");
        break;
    }
    this.deleteNode(to_remove);
    domutil.unlinkTree(data_node);
    domutil.unlinkTree(to_remove);
};

/**
 * Handles {@link module:tree_updater~TreeUpdater#event:setAttributeNS
 * setAttributeNS} events.
 * @private
 * @param {module:tree_updater~TreeUpdater#event:setAttributeNS} ev The
 * event.
 */
GUIUpdater.prototype._setAttributeNSHandler = function (ev) {
    var gui_caret = this.fromDataLocation(ev.node, 0);
    this.setAttributeNS(gui_caret.node, "",
                        util.encodeAttrName(ev.attribute), ev.new_value);
};

/**
 * Converts a data location to a GUI location.
 *
 * @param {module:dloc~DLoc} loc The location.
 * @returns {module:dloc~DLoc} The GUI location.
 */
GUIUpdater.prototype.fromDataLocation = function (loc, offset) {
    var node;
    if (loc instanceof DLoc) {
        node = loc.node;
        offset = loc.offset;
    }
    else
        node = loc;

    var gui_node = this.pathToNode(this._tree_updater.nodeToPath(node));

    if (node.nodeType === Node.TEXT_NODE)
        return makeDLoc(this._gui_tree, gui_node, offset);

    if (node.nodeType === Node.ATTRIBUTE_NODE) {
        if (gui_node.firstChild &&
            // The check for the node type is to avoid getting a location
            // inside a placeholder.
            gui_node.firstChild.nodeType === Node.TEXT_NODE)
            gui_node = gui_node.firstChild;
        return makeDLoc(this._gui_tree, gui_node, offset);
    }

    if (offset === 0)
        return makeDLoc(this._gui_tree, gui_node, 0);

    if (offset >= node.childNodes.length)
        return makeDLoc(this._gui_tree, gui_node, gui_node.childNodes.length);

    var gui_child = this.pathToNode(
        this._tree_updater.nodeToPath(node.childNodes[offset]));
    if (gui_child === null)
        // This happens if for instance node has X children but the
        // corresponding node in _gui_tree has X-1 children.
        return makeDLoc(this._gui_tree, gui_node, gui_node.childNodes.length);

    return makeDLoc(this._gui_tree, gui_child.parentNode,
                    Array.prototype.indexOf.call(
                        gui_child.parentNode.childNodes,
                        gui_child));
};

exports.GUIUpdater = GUIUpdater;

});

//  LocalWords:  TreeUpdater setTextNodeValue gui oop Mangalam MPL
//  LocalWords:  Dubeau insertNodeAt deleteNode jQuery nodeToPath
//  LocalWords:  pathToNode jquery domutil
