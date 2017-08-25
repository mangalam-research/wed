/**
 * Basic undo/redo framework.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

/**
 * Records operations that may be undone or redone. It maintains a single list
 * of [[Undo]] objects in the order by which they are passed to the
 * [[UndoList.record]] method.
 *
 * This object maintains a single history. So if operations A, B, C, D are
 * recorded, C and D are undone and then E is recorded, the list of recorded
 * operations will then be A, B, E.
 */
export class UndoList {
  private readonly stack: UndoGroup[] = [];
  private list: Undo[] = [];
  private index: number = -1;
  private _undoingOrRedoing: boolean = false;

  /**
   * This method makes the UndoList object record the object passed to it. Any
   * operations that had previously been undone are forgotten.
   *
   * @param obj An undo object to record.
   */
  record(obj: Undo): void {
    if (this.stack.length > 0) {
      this.stack[0].record(obj);
    }
    else {
      this.list = this.list.splice(0, this.index + 1);
      this.list.push(obj);
      this.index++;
    }
  }

  /**
   * Undoes the latest [[Undo]] that was recorded. If any [[UndoGroup]] objects
   * were in effect when called, they are terminated. It is an error to call
   * this method or [[redo]] from within this method. Does nothing if there is
   * nothing to undo.
   *
   * @throws {Error} If an undo is attempted when an undo or redo is already in
   * progress.
   */
  undo(): void {
    // If undo is invoked in the middle of a group, we must end it first.
    if (this._undoingOrRedoing) {
      throw new Error("calling undo while undoing or redoing");
    }
    this._undoingOrRedoing = true;
    while (this.stack.length > 0) {
      this.endGroup();
    }
    if (this.index >= 0) {
      this.list[this.index--].undo();
    }
    this._undoingOrRedoing = false;
  }

  /**
   * Redoes the latest [[Undo]] object that was undone.  It is an error to call
   * this method or [[undo]] from within this method. Does nothing if there is
   * nothing to redo.
   *
   * @throws {Error} If an undo is attempted when an undo or redo is already in
   * progress.
   */
  redo(): void {
    if (this._undoingOrRedoing) {
      throw new Error("calling redo while undoing or redoing");
    }
    this._undoingOrRedoing = true;
    if (this.index < this.list.length - 1) {
      this.list[++this.index].redo();
    }
    this._undoingOrRedoing = false;
  }

  /**
   * @returns True if the object is in the midst of undoing or redoing, false
   * otherwise.
   */
  undoingOrRedoing(): boolean {
    return this._undoingOrRedoing;
  }

  /**
   * @returns True if there is something to undo, false otherwise.
   */
  canUndo(): boolean {
    return this.index > -1;
  }

  /**
   * @returns True if there is something to redo, false otherwise.
   */
  canRedo(): boolean {
    return this.index < this.list.length - 1;
  }

  /**
   * Starts recording a group of undo operations.
   *
   * @param group The undo group to start.
   */
  startGroup(group: UndoGroup): void {
    this.stack.unshift(group);
  }

  /**
   * Ends recording a group of undo operations. The group currently in effect is
   * terminated, and made the last recorded operation (as if it had been passed
   * to [[UndoList.record]]).
   *
   * @throws {Error} If there is no current undo group.
   */
  endGroup(): void {
    const group = this.stack.shift();
    if (group === undefined) {
      throw new Error("ending a non-existent group.");
    }
    group.end();
    this.record(group);
  }

  /**
   * Ends all groups currently in effect. This is the same as calling
   * [[endGroup]] repeatedly until there are no more groups to end.
   */
  endAllGroups(): void {
    while (this.stack.length > 0) {
      this.endGroup();
    }
  }

  /**
   * @returns The group currently being recorded.
   */
  getGroup(): UndoGroup {
    return this.stack[0];
  }

  /**
   * @returns A string showing all the undo steps and undo groups stored in this
   * undo list.
   */
  toString(): string {
    const ret = [];
    ret.push("Start of list\n");
    for (const it of this.list) {
      ret.push(it.toString());
    }
    ret.push("End of list\n");
    ret.push("Unfinished groups:\n");
    for (let i = this.stack.length - 1; i >= 0; --i) {
      const it = this.stack[i];
      ret.push(it.toString());
    }
    ret.push("End of unfinished groups\n");
    return ret.join("");
  }
}

/**
 * An undo operation.
 * @param {string} desc The description of this undo operation.
 */
export abstract class Undo {
  constructor(public readonly desc: string) {}

  /**
   * Called when the operation must be undone.
   *
   * @throws {Error} If an undo is attempted when an undo or redo is already in
   * progress.
   */
  abstract undo(): void;

  /**
   * Called when the operation must be redone.
   *
   * @throws {Error} If an undo is attempted when an undo or redo is already in
   * progress.
   */
  abstract redo(): void;

  /**
   * @returns The description of this object.
   */
  toString(): string {
    return `${this.desc}\n`;
  }
}

/**
 * A group of undo operations.
 */
export class UndoGroup extends Undo {
  protected readonly list: Undo[] = [];

  /**
   * Undoes this group, which means undoing all the operations that this group
   * has recorded.
   */
  undo(): void {
    for (let i = this.list.length - 1; i >= 0; --i) {
      this.list[i].undo();
    }
  }

  /**
   * Redoes this group, which means redoing all the operations that this group
   * has recorded.
   */
  redo(): void {
    for (const it of this.list) {
      it.redo();
    }
  }

  /**
   * Records an operation as part of this group.
   *
   * @param obj The operation to record.
   */
  record(obj: Undo): void {
    this.list.push(obj);
  }

  /**
   * This method is called by [[UndoList.endGroup]] when it ends a group. The
   * default implementation does nothing.
   */
  end(): void {
    // by default we do nothing
  }

  toString(): string {
    const ret = [];
    ret.push(`Start of ${this.desc}\n`);
    for (const it of this.list) {
      ret.push(it.toString().replace(/(^|\n)/g, "$1 ").slice(0, -1));
    }
    ret.push(`End of ${this.desc}\n`);
    return ret.join("");
  }
}

//  LocalWords:  boolean Dubeau MPL Mangalam UndoList desc
