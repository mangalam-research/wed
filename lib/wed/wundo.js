/**
 * @module wundo
 * @desc Wed-specific undo functionality.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:wundo */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
var oop = require("./oop");
var undo = require("./undo");
var domutil = require("./domutil");

/**
 * @classdesc This class extends the vanilla UndoGroup class by recording the
 * location of the caret when the group is created and when group
 * recording ends. This allows restoring the caret to sensible
 * positions before and after undoing or redoing.
 * @extends module:undo~UndoGroup
 *
 * @constructor
 * @param {string} desc The description of this group.
 * @param {module:wed~Editor} editor The editor for which this undo
 * group is created.
 */
function UndoGroup(desc, editor) {
    undo.UndoGroup.call(this, desc);
    this._editor = editor;
    this._caret_as_path_before = this.getDataCaretAsPath();
}

oop.inherit(UndoGroup, undo.UndoGroup);

UndoGroup.prototype.undo = function() {
    this.setDataCaretAsPath(this._caret_as_path_after);
    undo.UndoGroup.prototype.undo.apply(this, arguments);
    this.setDataCaretAsPath(this._caret_as_path_before);
};

UndoGroup.prototype.redo = function() {
    this.setDataCaretAsPath(this._caret_as_path_before);
    undo.UndoGroup.prototype.redo.apply(this, arguments);
    this.setDataCaretAsPath(this._caret_as_path_after);
};

/**
 * Get the current data caret position as a path.
 *
 * @returns {Array} A caret in the form of a <code>[path,
 * offset]</code> list.
 */
UndoGroup.prototype.getDataCaretAsPath = function () {
    var caret = this._editor.getDataCaret(true);
    if (!caret)
        // Returning undefined for "the caret was undefined" would not
        // trap stupid mistakes in managing the data.
        return [undefined, undefined];
    return [this._editor.data_updater.nodeToPath(caret.node), caret.offset];
};

/**
 * Set the data caret.
 *
 * @param {Array} caret A caret in the form of a <code>[path,
 * offset]</code> list.
 */
UndoGroup.prototype.setDataCaretAsPath = function (caret) {
    // [undefined, undefined] === the caret was undefined. We can't do
    // anything.
    if (!caret[0] && !caret[1])
        return;
    this._editor.setDataCaret(this._editor.data_updater.pathToNode(caret[0]),
                              caret[1]);
};

/**
 * This method can be used to record the caret position after the acts
 * recorded by this undo are performed. If the caret is recorded by
 * means of this method, then {@link module:wundo~UndoGroup#end end}
 * will not record the caret position again. This can be useful in
 * cases for which it is not clear when an UndoGroup might end. {@link
 * module:wundo~TextUndoGroup TextUndoGroup} is a case in point. This
 * method can be called any number of times to update the caret
 * position at the end of the group.
 */
UndoGroup.prototype.recordCaretAfter = function () {
    this._caret_as_path_after = this.getDataCaretAsPath();
};

UndoGroup.prototype.end = function () {
    if (!this._caret_as_path_after)
        this.recordCaretAfter();
};

exports.UndoGroup = UndoGroup;

/**
 * @classdesc Grouping of text operations should be limited in size. For
 * instance, if the user hits backspace to delete a whole sentence and
 * then wants to undo this operation. It is better to undo it in
 * chunks instead of reinserting the whole sentence. This class allows
 * for limiting the length of such chunks.
 * @extends module:wundo~UndoGroup
 *
 * @constructor
 * @param {string} desc The description of this group.
 * @param {module:wed~Editor} editor The editor for which this undo
 * group is created.
 * @param {module:undo~UndoList} undo_list The list which will hold
 * this group.
 * @param {integer} limit The maximum number of undo operations that
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
 * @classdesc Serves as a marker for debugging.
 *
 * @constructor
 * @param {string} msg A message to identify the marker.
 */
function MarkerUndo(msg) {
    undo.Undo.call(this, "*** MARKER *** " + msg);
}

oop.inherit(MarkerUndo, undo.Undo);

MarkerUndo.prototype.undo = function () {};
MarkerUndo.prototype.redo = function () {};

exports.MarkerUndo = MarkerUndo;

});

//  LocalWords:  TextUndoGroup UndoGroup param wundo oop Mangalam MPL
//  LocalWords:  Dubeau nodeToPath pathToNode domutil jquery jQuery
