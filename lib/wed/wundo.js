/**
 * @module wundo
 * @desc Wed-specific undo functionality.
 * @author Louis-Dominique Dubeau
 */

define(/** @lends module:wundo */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
var oop = require("./oop");
var undo = require("./undo");

/**
 * This class models undo operations based on the addition or removal
 * of DOM nodes from a DOM tree.
 * @class
 * @extends module:undo~Undo
 * @param {module:wed~Editor} editor The editor for which this undo
 * object is created.
 * @param {jQuery} $parent The parent of other node parameters.
 * @param {jQuery} $added The nodes that were added by the operation
 * that would eventually be undone.
 * @param {jQuery} $removed The nodes that were removed by the
 * operation that would eventually be undone.
 * @param {jQuery} $prev The node that appears before all
 * <code>$added</code> and <code>$removed</code> nodes.
 * @param {jQuery} $next The node that appears after all
 * <code>$added</code> and <code>$removed</code> nodes.
 */
function DOMUndo (editor, $parent, $added, $removed, $prev, $next) {
    undo.Undo.call(this, "DOM undo");
    this._editor = editor;
    this._$parent = $parent;
    this._$added = $added;
    this._$removed = $removed;
    this._$prev = $prev;
    this._$next = $next;
}

oop.inherit(DOMUndo, undo.Undo);

DOMUndo.prototype.undo = function () {
    removeAll(this._editor.data_updater, this._$added.toArray());
    if (this._$removed.length > 0)
        addAll(this._editor.data_updater, this._$parent.get(0),
               this._$prev.get(0), this._$removed.toArray());
};

function removeAll(data_updater, all) {
    for(var i = 0; i < all.length; ++i)
        data_updater.removeNode(all[i]);
}

function addAll(data_updater, parent, prev, all) {
    var insert_at = !prev ? 0:
            Array.prototype.indexOf.call(parent.childNodes, prev) + 1;
    if (insert_at === -1)
        throw new Error("prev is absent from parent");
    for(var i = 0; i < all.length; ++i, ++insert_at)
        data_updater.insertNodeAt(parent, insert_at, all[i]);
}

DOMUndo.prototype.redo = function () {
    removeAll(this._editor.data_updater, this._$removed.toArray());
    if (this._$added.length > 0)
        addAll(this._editor.data_updater, this._$parent.get(0),
               this._$prev.get(0), this._$added.toArray());
};

exports.DOMUndo = DOMUndo;

/**
 * This class is meant to model changes to DOM text nodes.
 *
 * @class
 * @extends module:undo~Undo
 * @param {module:wed~Editor} editor The editor for which this undo
 * object is created.
 * @param {jQuery} $node The text node that was modified.
 * @param {String} old_value The old value of the text node.
 */
function TextNodeUndo (editor, $node, old_value) {
    undo.Undo.call(this, "TextNodeUndo undo");
    this._editor = editor;
    this._node = $node.get(0);
    this._old_value = old_value;
    this._new_value = this._node.nodeValue;
}

oop.inherit(TextNodeUndo, undo.Undo);

TextNodeUndo.prototype.undo = function () {
    this._editor.data_updater.setTextNodeValue(this._node, this._old_value);
};

TextNodeUndo.prototype.redo = function () {
    this._editor.data_updater.setTextNodeValue(this._node, this._new_value);
};

exports.TextNodeUndo = TextNodeUndo;

/**
 * This class extends the vanilla UndoGroup class by recording the
 * location of the caret when the group is created and when group
 * recording ends. This allows restoring the caret to sensible
 * positions before and after undoing or redoing.
 *
 * @class
 * @extends module:undo~UndoGroup
 * @param {String} desc The description of this group.
 * @param {module:wed~Editor} editor The editor for which this undo
 * group is created.
 */
function UndoGroup(desc, editor) {
    undo.UndoGroup.call(this, desc);
    this._editor = editor;
    this._caret_as_path_before = editor.getDataCaretAsPath();
}

oop.inherit(UndoGroup, undo.UndoGroup);

UndoGroup.prototype.undo = function() {
    this._editor.setDataCaretAsPath(this._caret_as_path_after);
    undo.UndoGroup.prototype.undo.apply(this, arguments);
    this._editor.setDataCaretAsPath(this._caret_as_path_before);
};

UndoGroup.prototype.redo = function() {
    this._editor.setDataCaretAsPath(this._caret_as_path_before);
    undo.UndoGroup.prototype.redo.apply(this, arguments);
    this._editor.setDataCaretAsPath(this._caret_as_path_after);
};

UndoGroup.prototype.end = function () {
    this._caret_as_path_after = this._editor.getDataCaretAsPath();
};

exports.UndoGroup = UndoGroup;

/**
 * Grouping of text operations should be limited in size. For
 * instance, if the user hits backspace to delete a whole sentence and
 * then wants to undo this operation. It is better to undo it in
 * chunks instead of reinserting the whole sentence. This class allows
 * for limiting the length of such chunks.
 *
 * @class
 * @extends module:wundo~UndoGroup
 * @param {String} desc The description of this group.
 * @param {module:wed~Editor} editor The editor for which this undo
 * group is created.
 * @param {module:undo~UndoList} undo_list The list which will hold
 * this group.
 * @param {Integer} limit The maximum number of undo operations that
 * this group should record.
 */
function TextUndoGroup(desc, editor, undo_list, limit) {
    UndoGroup.call(this, desc, editor);
    this._undo_list = undo_list;
    this._limit = limit;
}

oop.inherit(TextUndoGroup, UndoGroup);

TextUndoGroup.prototype.record = function() {
    if (this._list.length >= this._limit)
        throw new Error("TextUndoGroup.record called beyond the limit");
    undo.UndoGroup.prototype.record.apply(this, arguments);
    if (this._list.length === this._limit)
        this._undo_list.endGroup();
};

exports.TextUndoGroup = TextUndoGroup;

});
