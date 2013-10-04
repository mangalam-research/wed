/**
 * @module undo
 * @desc Basic undo/redo framework.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:undo */ function (require, exports, module) {
'use strict';

var oop = require("./oop");

/**
 * <p>An UndoList records operations that may be undone or redone. It
 * maintains a single list of {@link module:undo~Undo Undo} objects
 * the order by which they are passed to the {@link
 * module:undo~UndoList#record record()} method.</p>
 *
 * <p>This object maintains a single history. So if operations A, B,
 * C, D are recorded, C and D are undone and then E is recorded, the
 * list of recorded operations will then be A, B, E.</p>
 *
 * @class
 */
function UndoList() {
    this._stack = [];
    this._list = [];
    this._index = -1;
    this._undoing_or_redoing = false;
}

/**
 * This method makes the UndoList object record the object passed to
 * it. Any operations that had previously been undone are forgotten.
 *
 * @param {module:undo~Undo} obj An undo object to record.
 */
UndoList.prototype.record = function(obj) {
    if (this._stack.length > 0)
        this._stack[0].record(obj);
    else {
        this._list = this._list.splice(0, this._index + 1);
        this._list.push(obj);
        this._index++;
    }
};

/**
 * Undoes the latest {@link module:undo~Undo Undo} that was
 * recorded. If any {@link module:undo~UndoGroup UndoGroup} objects
 * were in effect when called, they are terminated. It is an error to
 * call this method or {@link module:undo~UndoList.redo redo()} from within
 * this method. Does nothing if there is nothing to undo.
 */
UndoList.prototype.undo = function() {
    // If undo is invoked in the middle of a group,
    // we must end it first.
    if (this._undoing_or_redoing)
        throw new Error("calling undo while undoing or redoing");
    this._undoing_or_redoing = true;
    while (this._stack.length > 0)
        this.endGroup();
    if (this._index >= 0)
        this._list[this._index--].undo();
    this._undoing_or_redoing = false;
};

/**
 * Redoes the latest {@link module:undo~Undo Undo} object that was
 * undone.  It is an error to call this method or {@link
 * module:undo~UndoList.undo undo()} from within this method. Does nothing
 * if there is nothing to redo.
 */
UndoList.prototype.redo = function() {
    if (this._undoing_or_redoing)
        throw new Error("calling redo while undoing or redoing");
    this._undoing_or_redoing = true;
    if (this._index < this._list.length - 1)
        this._list[++this._index].redo();
    this._undoing_or_redoing = false;
};

/**
 * @returns {Boolean} True if the object is in the midst of undoing or
 * redoing, false otherwise.
 */
UndoList.prototype.undoingOrRedoing = function () {
    return this._undoing_or_redoing;
};

/**
 * @returns {Boolean} True if there is something to undo, false otherwise.
 */
UndoList.prototype.canUndo = function () {
    return this._index > -1;
};

/**
 * @returns {Boolean} True if there is something to redo, false otherwise.
 */
UndoList.prototype.canRedo = function () {
    return this._index < this._list.length - 1;
};

/**
 * Starts recording a group of undo operations.
 *
 * @param {module:undo~UndoGroup} group The undo group to start.
 */
UndoList.prototype.startGroup = function (group) {
    this._stack.unshift(group);
};

/**
 * Ends recording a group of undo operations. The group currently in
 * effect is terminated, and made the last recorded operation (as if
 * it had been passed to {@link module:undo~UndoList#record record()}).
 */
UndoList.prototype.endGroup = function () {
    if (this._stack.length === 0)
        throw new Error("ending a non-existent group.");
    var group = this._stack.shift();
    group.end();
    this.record(group);
};

/**
 * Ends all groups currently in effect. This is the same as calling
 * {@link module:undo~UndoList#endGroup endGroup()}) repeatedly until
 * there are no more groups to end.
 */
UndoList.prototype.endAllGroups = function () {
    while(this._stack.length > 0)
        this.endGroup();
};


/**
 * @returns {module:undo~UndoGroup} The group currently being
 * recorded.
 */
UndoList.prototype.getGroup = function () {
    return this._stack[0];
};

UndoList.prototype.toString = function () {
    var ret = [];
    ret.push("Start of list\n");
    for (var i = 0, it; (it = this._list[i]) !== undefined; ++i)
        ret.push(it.toString());
    ret.push("End of list\n");
    ret.push("Unfinished groups:\n");
    for (i = this._stack.length - 1; (it = this._stack[i]) !== undefined; --i)
        ret.push(it.toString());
    ret.push("End of unfinished groups\n");
    return ret.join("");
};

exports.UndoList = UndoList;

/**
 * @class
 * @param {String} desc The description of this undo operation.
 */
function Undo(desc) {
    this._desc = desc;
}

/**
 * Called when the operation must be undone. Derived classes must
 * override this method.
 */
Undo.prototype.undo = function () {
    throw new Error("must override the undo method.");
};

/**
 * Called when the operation must be redone. Derived classes must
 * override this method.
 */
Undo.prototype.redo = function () {
    throw new Error("must override the redo method.");
};

/**
 * @returns {String} The description of this object.
 */
Undo.prototype.toString = function () {
    return this._desc + "\n";
};

exports.Undo = Undo;

/**
 * A group of undo operations. The constructor for this class takes
 * the same parameters as the constructor for {@link module:undo~Undo Undo}.
 *
 * @class
 * @extends module:undo~Undo
 */
function UndoGroup() {
    Undo.apply(this, arguments);
    this._list = [];
}

oop.inherit(UndoGroup, Undo);

/**
 * Undoes this group, which means undoing all the operations that this
 * group has recorded.
 */
UndoGroup.prototype.undo = function () {
    for(var i = this._list.length - 1; i >= 0; --i)
        this._list[i].undo();
};

/**
 * Redoes this group, which means redoing all the operations that this
 * group has recorded.
 */
UndoGroup.prototype.redo = function () {
    for(var i = 0; i < this._list.length; ++i)
        this._list[i].redo();
};

/**
 * Records an operation as part of this group.
 * @param {module:undo~Undo} obj The operation to record.
 */
UndoGroup.prototype.record = function (obj) {
    this._list.push(obj);
};

/**
 * This method is called by
 * {@link module:undo~UndoList#endGroup UndoList.endGroup()} when it ends a
 * group. The default implementation does nothing.
 */
UndoGroup.prototype.end = function () {
    // by default we do nothing
};

UndoGroup.prototype.toString = function () {
    var ret = [];
    ret.push("Start of ", this._desc, "\n");
    for (var i = 0, it; (it = this._list[i]) !== undefined; ++i)
        ret.push(it.toString().replace(/(^|\n)/g, '$1 ').slice(0, -1));
    ret.push("End of ", this._desc, "\n");
    return ret.join("");
};

exports.UndoGroup = UndoGroup;

});
