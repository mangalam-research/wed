/**
 * @module undo
 * @desc Basic undo/redo framework.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:undo */ function f(require, exports) {
  "use strict";

  var oop = require("./oop");

  /**
   * @classdesc <p>An UndoList records operations that may be undone or redone. It
   * maintains a single list of {@link module:undo~Undo Undo} objects in
   * the order by which they are passed to the {@link
   * module:undo~UndoList#record record()} method.</p>
   *
   * <p>This object maintains a single history. So if operations A, B,
   * C, D are recorded, C and D are undone and then E is recorded, the
   * list of recorded operations will then be A, B, E.</p>
   *
   * @constructor
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
  UndoList.prototype.record = function record(obj) {
    if (this._stack.length > 0) {
      this._stack[0].record(obj);
    }
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
   *
   * @throws {Error} If an undo is attempted when an undo or redo is already
   * in progress.
   */
  UndoList.prototype.undo = function undo() {
    // If undo is invoked in the middle of a group,
    // we must end it first.
    if (this._undoing_or_redoing) {
      throw new Error("calling undo while undoing or redoing");
    }
    this._undoing_or_redoing = true;
    while (this._stack.length > 0) {
      this.endGroup();
    }
    if (this._index >= 0) {
      this._list[this._index--].undo();
    }
    this._undoing_or_redoing = false;
  };

  /**
   * Redoes the latest {@link module:undo~Undo Undo} object that was
   * undone.  It is an error to call this method or {@link
   * module:undo~UndoList.undo undo()} from within this method. Does nothing
   * if there is nothing to redo.
   *
   * @throws {Error} If an undo is attempted when an undo or redo is already
   * in progress.
   */
  UndoList.prototype.redo = function redo() {
    if (this._undoing_or_redoing) {
      throw new Error("calling redo while undoing or redoing");
    }
    this._undoing_or_redoing = true;
    if (this._index < this._list.length - 1) {
      this._list[++this._index].redo();
    }
    this._undoing_or_redoing = false;
  };

  /**
   * @returns {boolean} True if the object is in the midst of undoing or
   * redoing, false otherwise.
   */
  UndoList.prototype.undoingOrRedoing = function undoingOrRedoing() {
    return this._undoing_or_redoing;
  };

  /**
   * @returns {boolean} True if there is something to undo, false otherwise.
   */
  UndoList.prototype.canUndo = function canUndo() {
    return this._index > -1;
  };

  /**
   * @returns {boolean} True if there is something to redo, false otherwise.
   */
  UndoList.prototype.canRedo = function canRedo() {
    return this._index < this._list.length - 1;
  };

  /**
   * Starts recording a group of undo operations.
   *
   * @param {module:undo~UndoGroup} group The undo group to start.
   */
  UndoList.prototype.startGroup = function startGroup(group) {
    this._stack.unshift(group);
  };

  /**
   * Ends recording a group of undo operations. The group currently in
   * effect is terminated, and made the last recorded operation (as if
   * it had been passed to {@link module:undo~UndoList#record record()}).
   *
   * @throws {Error} If there is no current undo group.
   */
  UndoList.prototype.endGroup = function endGroup() {
    if (this._stack.length === 0) {
      throw new Error("ending a non-existent group.");
    }
    var group = this._stack.shift();
    group.end();
    this.record(group);
  };

  /**
   * Ends all groups currently in effect. This is the same as calling
   * {@link module:undo~UndoList#endGroup endGroup()} repeatedly until
   * there are no more groups to end.
   */
  UndoList.prototype.endAllGroups = function endAllGroups() {
    while (this._stack.length > 0) {
      this.endGroup();
    }
  };


  /**
   * @returns {module:undo~UndoGroup} The group currently being
   * recorded.
   */
  UndoList.prototype.getGroup = function getGroup() {
    return this._stack[0];
  };

  /**
   * @returns {string} A string showing all the undo steps and undo
   * groups stored in this undo list.
   */
  UndoList.prototype.toString = function toString() {
    var ret = [];
    ret.push("Start of list\n");
    var i;
    var it;
    for (i = 0; i < this._list.length; ++i) {
      it = this._list[i];
      ret.push(it.toString());
    }
    ret.push("End of list\n");
    ret.push("Unfinished groups:\n");
    for (i = this._stack.length - 1; i >= 0; --i) {
      it = this._stack[i];
      ret.push(it.toString());
    }
    ret.push("End of unfinished groups\n");
    return ret.join("");
  };

  exports.UndoList = UndoList;

  /**
   * @classdesc An undo operation.
   * @constructor
   * @param {string} desc The description of this undo operation.
   */
  function Undo(desc) {
    this._desc = desc;
  }

  /**
   * Called when the operation must be undone. Derived classes must
   * override this method.
   * @throws {Error} If an undo is attempted when an undo or redo is already
   * in progress.
   */
  Undo.prototype.undo = function undo() {
    throw new Error("must override the undo method.");
  };

  /**
   * Called when the operation must be redone. Derived classes must
   * override this method.
   * @throws {Error} If an undo is attempted when an undo or redo is already
   * in progress.
   */
  Undo.prototype.redo = function redo() {
    throw new Error("must override the redo method.");
  };

  /**
   * @returns {string} The description of this object.
   */
  Undo.prototype.toString = function toString() {
    return this._desc + "\n";
  };

  exports.Undo = Undo;

  /**
   * @classdesc A group of undo operations.
   *
   * Takes the same parameters as the constructor for {@link
   * module:undo~Undo Undo}.
   * @extends module:undo~Undo
   *
   * @constructor
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
  UndoGroup.prototype.undo = function undo() {
    for (var i = this._list.length - 1; i >= 0; --i) {
      this._list[i].undo();
    }
  };

  /**
   * Redoes this group, which means redoing all the operations that this
   * group has recorded.
   */
  UndoGroup.prototype.redo = function redo() {
    for (var i = 0; i < this._list.length; ++i) {
      this._list[i].redo();
    }
  };

  /**
   * Records an operation as part of this group.
   * @param {module:undo~Undo} obj The operation to record.
   */
  UndoGroup.prototype.record = function record(obj) {
    this._list.push(obj);
  };

  /**
   * This method is called by
   * {@link module:undo~UndoList#endGroup UndoList.endGroup()} when it ends a
   * group. The default implementation does nothing.
   */
  UndoGroup.prototype.end = function end() {
    // by default we do nothing
  };

  UndoGroup.prototype.toString = function toString() {
    var ret = [];
    ret.push("Start of ", this._desc, "\n");
    for (var i = 0; i < this._list.length; ++i) {
      var it = this._list[i];
      ret.push(it.toString().replace(/(^|\n)/g, "$1 ").slice(0, -1));
    }
    ret.push("End of ", this._desc, "\n");
    return ret.join("");
  };

  exports.UndoGroup = UndoGroup;
});

//  LocalWords:  UndoList oop Mangalam MPL Dubeau boolean
