/**
 * @module gui_updater
 * @desc Listens to changes on a tree and updates the GUI tree in
 * response to changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:gui_updater */ function (require, exports, module) {
'use strict';

var domutil = require("./domutil");
var $ = require("jquery");
var oop = require("./oop");
var TreeUpdater = require("./tree_updater").TreeUpdater;

/**
 * TBA
 * @classdesc TBA
 * @extends module:tree_updater~TreeUpdater
 *
 * @constructor
 * @param gui_tree TBA
 * @param {module:tree_updater~TreeUpdater} tree_updater TBA
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
}

oop.inherit(GUIUpdater, TreeUpdater);

/**
 * TBA
 * @private
 * @param {TBA} ev TBA
*/
GUIUpdater.prototype._insertNodeAtHandler = function (ev) {
    var gui_caret = this.fromDataCaret(ev.parent, ev.index);
    var clone = $(ev.node).clone().get(0);
    domutil.linkTrees(ev.node, clone);
    this.insertNodeAt(gui_caret[0], gui_caret[1], clone);
};

/**
 * TBA
 * @private
 * @param {TBA} ev TBA
*/
GUIUpdater.prototype._setTextNodeValueHandler = function (ev) {
    var gui_caret = this.fromDataCaret(ev.node, 0);
    this.setTextNodeValue(gui_caret[0], ev.value);
};

/**
 * TBA
 * @private
 * @param {TBA} ev TBA
*/
GUIUpdater.prototype._deleteNodeHandler = function (ev) {
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
    this.deleteNode(to_remove);
    domutil.unlinkTree(data_node);
    domutil.unlinkTree(to_remove);
};

/**
 * TBA
 *
 * @param {Node} node TBA
 * @param {TBA} offset TBA
 * @returns {Array} TBA
*/
GUIUpdater.prototype.fromDataCaret = function (node, offset) {
    // Accept a single array as argument
    if (arguments.length === 1 && node instanceof Array) {
        offset = node[1];
        node = node[0];
    }

    var gui_node = domutil.pathToNode(
        this._gui_tree, this._tree_updater.nodeToPath(node));

    if (node.nodeType === Node.TEXT_NODE)
        return [gui_node, offset];

    if (offset === 0)
        return [gui_node, 0];

    if (offset >= node.childNodes.length)
        return [gui_node, gui_node.childNodes.length];

    var gui_child = domutil.pathToNode(
        this._gui_tree, this._tree_updater.nodeToPath(node.childNodes[offset]));
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



//  LocalWords:  domutil jquery util whitespace pathToNode nodeToPath
//  LocalWords:  contenteditable abcd abfoocd cd insertIntoText lt
//  LocalWords:  Prepend deleteText jQuery getSelectionRange prev
//  LocalWords:  lastChild makeCutFunction deleteNode mergeTextNodes
//  LocalWords:  jshint validthis insertNodeAt insertFragAt versa

//  LocalWords:  domlistener jquery findandself lt ul li nextSibling
//  LocalWords:  MutationObserver previousSibling jQuery LocalWords
// LocalWords:  Dubeau MPL Mangalam jquery validator util domutil oop
// LocalWords:  domlistener wundo jqutil gui onerror mixins html DOM
// LocalWords:  jQuery href sb nav ul li navlist errorlist namespaces
// LocalWords:  contenteditable Ok Ctrl listDecorator tabindex nbsp
// LocalWords:  unclick enterStartTag unlinks startContainer dropdown
// LocalWords:  startOffset endContainer endOffset mousedown
// LocalWords:  setTextNodeValue TreeUpdater
