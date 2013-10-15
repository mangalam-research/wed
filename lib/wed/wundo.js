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
 * @param {String} desc The description of this group.
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

UndoGroup.prototype.getDataCaretAsPath = function () {
    var caret = this._editor.getDataCaret(true);
    return [this._editor.data_updater.nodeToPath(caret[0]), caret[1]];
};

UndoGroup.prototype.setDataCaretAsPath = function (caret) {
    var real_caret = [this._editor.data_updater.pathToNode(caret[0]),
                      caret[1]];
    this._editor.setDataCaret(real_caret);
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
// LocalWords:  UndoGroup TextUndoGroup
