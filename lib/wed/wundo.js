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
var domutil = require("./domutil");

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

/**
 * Serves as a marker for debugging.
 */
function MarkerUndo(msg) {
    undo.Undo.call(this, "*** MARKER *** " + msg);
}

oop.inherit(MarkerUndo, undo.Undo);

MarkerUndo.prototype.undo = function () {};
MarkerUndo.prototype.redo = function () {};

exports.MarkerUndo = MarkerUndo;

});
