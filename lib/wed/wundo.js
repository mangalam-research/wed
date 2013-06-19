define(function (require, exports, module) {
'use strict';

var $ = require("jquery");
var oop = require("./oop");
var undo = require("./undo");

function Undo(desc, editor, node, do_action, undo_action) {
    undo.Undo.call(this, desc);
    this._editor = editor;
    this._node = node;
    this._undo_action = undo_action;
    this._do_action = do_action;
    this._node_path = editor.nodeToPath(node);
}

oop.inherit(Undo, undo.Undo);

Undo.prototype.undo = function () {
    var node = this._editor.pathToNode(this._node_path);
    // The original operation's *post*condition is the undo's
    // *pre*condition.
    if (this._postcondition.length != length(node))
        throw new Error("undo precondition check failed");
    this._undo_action(this._editor, node);
    // ... and vice-versa.
    var node_after = this._editor.pathToNode(this._node_path);
    if (this._precondition.length != length(node_after))
        throw new Error("undo postcondition failed");
    this._editor.setCaretAsPath(this._precondition.caret_as_path);
};

Undo.prototype.redo = function () {
    var node = this._editor.pathToNode(this._node_path);
    this._editor.setCaretAsPath(this._precondition.caret_as_path);
    this._do_action(this._editor, node);
    if (this._postcondition.length != length(node))
        throw new Error("redo postcondition failed");
    this._editor.setCaretAsPath(this._postcondition.caret_as_path);
};

Undo.prototype.act = function () {
    this._precondition = new Condition(this._editor, this._node);
    this._do_action(this._editor, this._node);
    var node_after = this._editor.pathToNode(this._node_path);
    this._postcondition = new Condition(this._editor, node_after);
    // Flush it, because we'll use paths to refer to it.
    this._node = undefined;
};

function Condition(editor, node) {
    this.caret_as_path = editor.getCaretAsPath();
    this.node = node;
    this.length = length(node);
}

function length(node) {
    if (!node)
        return undefined;
    var ret = 0;
    switch(node.nodeType) {
    case Node.ELEMENT_NODE:
        // We consider only ._real ._phantom_wrap and text nodes
        for(var i = 0, el; (el = node.childNodes[i]) !== undefined;
            ++i) {
            var $el = $(el);
            if (el.nodeType === Node.TEXT_NODE ||
                $el.is("._real, ._phantom_wrap"))
                ret++;
        }
        break;
    case Node.TEXT_NODE:
        ret = node.nodeValue.length;
        break;
    default:
        throw new Error("unexpected node type: " + node.nodeType);
    }
    return ret;
}

exports.Undo = Undo;

function TextUndoGroup(undo_list, limit, desc) {
    undo.UndoGroup.call(this, desc);
    this._undo_list = undo_list;
    this._limit = limit;
}

oop.inherit(TextUndoGroup, undo.UndoGroup);

TextUndoGroup.prototype.record = function() {
    if (this._list.length >= this._limit)
        throw new Error("TextUndoGroup.record called beyond the limit");
    undo.UndoGroup.prototype.record.apply(this, arguments);
    if (this._list.length === this._limit)
        this._undo_list.endGroup();
};

exports.TextUndoGroup = TextUndoGroup;

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

});
