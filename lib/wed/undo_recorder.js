/**
 * @module undo_recorder
 * @desc Listens to changes on a tree and records undo operations
 * corresponding to these changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:undo_recorder */ function (require, exports, module) {
'use strict';

var domutil = require("./domutil");
var $ = require("jquery");
var oop = require("./oop");
var undo = require("./undo");

/**
 * @classdesc Records undo operations.
 *
 * @constructor
 * @param {module:wed~Editor} editor The editor for which this
 * recorder is created.
 * @param {module:tree_updater~TreeUpdater} tree_updater The tree
 * updater on which to listen for modifications.
 */
function UndoRecorder (editor, tree_updater) {
    this._editor = editor;
    this._tree_updater = tree_updater;
    this._tree_updater.addEventListener(
        "insertNodeAt", this._insertNodeAtHandler.bind(this));
    this._tree_updater.addEventListener(
        "setTextNodeValue", this._setTextNodeValueHandler.bind(this));
    this._tree_updater.addEventListener(
        "deleteNode", this._deleteNodeHandler.bind(this));
    this._suppress = false;
}

/**
 * Sets the suppression state. When suppression is on, the recorder
 * does not record anything. When off, the recorder records. The
 * recorder's suppression state is initially off.
 *
 * @param {Boolean} suppress Whether to suppress or not.
 *
 * @throws {Error} If the call does not change the suppression state.
 */
UndoRecorder.prototype.suppressRecording = function (suppress) {
    if (suppress === this._suppress)
        throw new Error("spurious call to suppressRecording");
    this._suppress = suppress;
};

/**
 * Handles {@link module:tree_updater~TreeUpdater#event:insertNodeAt
 * insertNodeAt} events.
 * @private
 * @param {module:tree_updater~TreeUpdater#event:insertNodeAt} ev The
 * event.
 */
UndoRecorder.prototype._insertNodeAtHandler = function (ev) {
    if (this._suppress)
        return;
    this._editor.recordUndo(new InsertNodeAtUndo(
        this._tree_updater,
        ev.parent,
        ev.index,
        ev.node));
};

/**
 * Handles {@link module:tree_updater~TreeUpdater#event:setTextNodeValue
 * setTextNodeValue} events.
 * @private
 * @param {module:tree_updater~TreeUpdater#event:setTextNodeValue} ev The
 * event.
 */
UndoRecorder.prototype._setTextNodeValueHandler = function (ev) {
    if (this._suppress)
        return;
    this._editor.recordUndo(new SetTextNodeValueUndo(
        this._tree_updater, ev.node, ev.value, ev.old_value));
};

/**
 * Handles {@link module:tree_updater~TreeUpdater#event:deleteNode
 * deleteNode} events.
 * @private
 * @param {module:tree_updater~TreeUpdater#event:deleteNode} ev The
 * event.
 */
UndoRecorder.prototype._deleteNodeHandler = function (ev) {
    if (this._suppress)
        return;
    this._editor.recordUndo(new DeleteNodeUndo(this._tree_updater, ev.node));
};

/**
 * @classdesc Undo operation for {@link
 * module:tree_updater~TreeUpdater#event:insertNodeAt insertNodeAt}
 * events.
 * @extends module:undo~Undo
 *
 * The parameters after <code>tree_updater</code> are the same as the
 * properties on the event corresponding to this class.
 *
 * @private
 * @constructor
 * @param {module:tree_updater~TreeUpdater} tree_updater The tree
 * updater to use to perform undo or redo operations.
 * @param parent
 * @param index
 * @param node
 */
function InsertNodeAtUndo(tree_updater, parent, index, node) {
    undo.Undo.call(this, "InsertNodeAtUndo");
    this._tree_updater = tree_updater;
    this._parent_path = tree_updater.nodeToPath(parent);
    this._index = index;
    this._node = undefined;
}

oop.inherit(InsertNodeAtUndo, undo.Undo);

InsertNodeAtUndo.prototype.undo = function () {
    if (this._node)
        throw new Error("undo called twice in a row");
    var parent = this._tree_updater.pathToNode(this._parent_path);
    this._node = $(parent.childNodes[this._index]).clone().get(0);
    this._tree_updater.deleteNode(parent.childNodes[this._index]);
};

InsertNodeAtUndo.prototype.redo = function () {
    if (!this._node)
        throw new Error("redo called twice in a row");
    var parent = this._tree_updater.pathToNode(this._parent_path);
    this._tree_updater.insertNodeAt(parent, this._index, this._node);
    this._node = undefined;
};

InsertNodeAtUndo.prototype.toString = function () {
    function dump (it) {
        return it ? ($(it).clone().wrap('<div>').parent().html() ||
                     $(it).text()) : "undefined";
    }
    return [this._desc, "\n",
            " Parent path: ",  this._parent_path, "\n",
            " Index: ", this._index, "\n",
            " Node: ", dump(this._node), "\n"].join("");
};

/**
 * @classdesc Undo operation for {@link
 * module:tree_updater~TreeUpdater#event:setTextNodeValue setTextNodeValue}
 * events.
 * @extends module:undo~Undo
 *
 * The parameters after <code>tree_updater</code> are the same as the
 * properties on the event corresponding to this class.
 *
 * @private
 * @constructor
 * @param {module:tree_updater~TreeUpdater} tree_updater The tree
 * updater to use to perform undo or redo operations.
 * @param node
 * @param value
 * @param old_value
 */
function SetTextNodeValueUndo(tree_updater, node, value, old_value) {
    undo.Undo.call(this, "SetTextNodeValueUndo");
    this._tree_updater = tree_updater;
    this._node_path = tree_updater.nodeToPath(node);
    this._new_value = value;
    this._old_value = old_value;
}

oop.inherit(SetTextNodeValueUndo, undo.Undo);

SetTextNodeValueUndo.prototype.undo = function () {
    var node = this._tree_updater.pathToNode(this._node_path);
    this._tree_updater.setTextNodeValue(node, this._old_value);
};

SetTextNodeValueUndo.prototype.redo = function () {
    var node = this._tree_updater.pathToNode(this._node_path);
    this._tree_updater.setTextNodeValue(node, this._new_value);
};

SetTextNodeValueUndo.prototype.toString = function () {
    return [this._desc, "\n",
            " Node path: ",  this._node_path, "\n",
            " New value: ", this._new_value, "\n",
            " Old value: ", this._old_value, "\n"].join("");
};

/**
 * @classdesc Undo operation for {@link
 * module:tree_updater~TreeUpdater#event:deleteNode deleteNode}
 * events.
 * @extends module:undo~Undo
 *
 * The parameters after <code>tree_updater</code> are the same as the
 * properties on the event corresponding to this class.
 *
 * @private
 * @constructor
 * @param {module:tree_updater~TreeUpdater} tree_updater The tree
 * updater to use to perform undo or redo operations.
 * @param node
 */
function DeleteNodeUndo(tree_updater, node) {
    undo.Undo.call(this, "DeleteNodeUndo");
    this._tree_updater = tree_updater;
    var parent = node.parentNode;
    this._parent_path = tree_updater.nodeToPath(parent);
    this._index = Array.prototype.indexOf.call(parent.childNodes,
                                               node);
    this._node = $(node).clone().get(0);
}

oop.inherit(DeleteNodeUndo, undo.Undo);

DeleteNodeUndo.prototype.undo = function () {
    if (!this._node)
        throw new Error("undo called twice in a row");
    var parent = this._tree_updater.pathToNode(this._parent_path);
    this._tree_updater.insertNodeAt(parent, this._index, this._node);
    this._node = undefined;
};

DeleteNodeUndo.prototype.redo = function () {
    if (this._node)
        throw new Error("redo called twice in a row");
    var parent = this._tree_updater.pathToNode(this._parent_path);
    this._node = $(parent.childNodes[this._index]).clone().get(0);
    this._tree_updater.deleteNode(parent.childNodes[this._index]);
};

DeleteNodeUndo.prototype.toString = function () {
    function dump (it) {
        return it ? ($(it).clone().wrap('<div>').parent().html() ||
                     $(it).text()) : "undefined";
    }
    return [this._desc, "\n",
            " Parent path: ",  this._parent_path, "\n",
            " Index: ", this._index, "\n",
            " Node: ", dump(this._node), "\n"].join("");
};



exports.UndoRecorder = UndoRecorder;

});

//  LocalWords:  domutil jquery oop insertNodeAt setTextNodeValue ev
//  LocalWords:  deleteNode InsertNodeAtUndo SetTextNodeValueUndo
//  LocalWords:  DeleteNodeUndo param

//  LocalWords:  InputTrigger jQuery util jqutil jquery hashstructs
//  LocalWords:  keydown tabindex keypress submap focusable boolean

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
// LocalWords:  startOffset endContainer endOffset mousedown keyup
// LocalWords:  setTextNodeValue popup appender unhandled rethrown
// LocalWords:  Django overriden subarrays stylesheets RequireJS
// LocalWords:  characterData childList refman prepend concat
