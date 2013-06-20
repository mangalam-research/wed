define(function (require, exports, module) {
'use strict';

var $ = require("jquery");
var oop = require("./oop");
var undo = require("./undo");

function DOMUndo (editor, $parent, $added, $removed, $prev, $next) {
    undo.Undo.call(this, "DOM undo");
    this._editor = editor;
    this._$parent = $parent;
    this._$added = $added;
    this._$removed = $removed;
    this._$prev = $prev;
    this._$next = $next;
}

DOMUndo.prototype.undo = function () {
    this._$added.remove();
    if (this._$removed.length > 0) {
        if (this._$prev.length > 0)
            this._$prev.after(this._$removed);
        else
            this._$parent.prepend(this._$removed);
    }
};

DOMUndo.prototype.redo = function () {
    this._$removed.remove();
    if (this._$added.length > 0) {
        if (this._$prev.length > 0)
            this._$prev.after(this._$added);
        else
            this._$parent.prepend(this._$added);
    }
};

exports.DOMUndo = DOMUndo;

function TextNodeUndo (editor, $node, old_value) {
    undo.Undo.call(this, "TextNodeUndo undo");
    this._editor = editor;
    this._node = $node.get(0);
    this._old_value = old_value;
    this._new_value = this._node.nodeValue;
}

TextNodeUndo.prototype.undo = function () {
    this._node.nodeValue = this._old_value;
    this._node.parentNode.normalize();
};

TextNodeUndo.prototype.redo = function () {
    this._node.nodeValue = this._new_value;
    this._node.parentNode.normalize();
};

exports.TextNodeUndo = TextNodeUndo;

function UndoGroup(desc, editor) {
    undo.UndoGroup.call(this, desc);
    this._editor = editor;
    this._caret_as_path_before = editor.getCaretAsPath();
}

oop.inherit(UndoGroup, undo.UndoGroup);

UndoGroup.prototype.undo = function() {
    this._editor.setCaretAsPath(this._caret_as_path_after);
    undo.UndoGroup.prototype.undo.apply(this, arguments);
    this._editor.setCaretAsPath(this._caret_as_path_before);
};

UndoGroup.prototype.redo = function() {
    this._editor.setCaretAsPath(this._caret_as_path_before);
    undo.UndoGroup.prototype.redo.apply(this, arguments);
    this._editor.setCaretAsPath(this._caret_as_path_after);
};

UndoGroup.prototype.end = function () {
    this._caret_as_path_after = this._editor.getCaretAsPath();
};

exports.UndoGroup = UndoGroup;

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
