/**
 * Basic undo/redo framework.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Observable, Subject, Subscription } from "rxjs";

export interface UndoEvent {
  name: "Undo";

  undo: Undo;
}

export interface RedoEvent {
  name: "Redo";

  undo: Undo;
}

export type UndoEvents = UndoEvent | RedoEvent;

interface ListItem {
  undo: Undo;

  subscription: Subscription;
}

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
  private list: ListItem[] = [];
  private index: number = -1;
  private _undoingOrRedoing: boolean = false;

  private readonly _events: Subject<UndoEvents> = new Subject();

  readonly events: Observable<UndoEvents> = this._events.asObservable();

  /**
   * Reset the list to its initial state **without** undoing operations. The
   * list effectively forgets old undo operations.
   */
  reset(): void {
    if (this._undoingOrRedoing) {
      throw new Error("may not reset while undoing or redoing");
    }

    this.stack.length = 0; // Yes, this works and clears the stack.
    this.index = -1;

    // We need to cleanup the old subscriptions.
    for (const { subscription } of this.list) {
      subscription.unsubscribe();
    }
    this.list = [];
  }

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
      // We do things in reverse here. We save the original list. Then the call
      // to splice mutates the original list to contain elements we do *not*
      // want. The return value are those elements we do want.
      const oldList = this.list;
      this.list = this.list.splice(0, this.index + 1);

      // We need to cleanup the old subscriptions.
      for (const { subscription } of oldList) {
        subscription.unsubscribe();
      }

      // This is the only place we need to subscribe. We do not need to
      // subscribe to individual object that are in undo groups because the
      // groups forward events that happen on their inner objects. Also, a group
      // need not be subscribed to until ``record`` is called for it.
      this.list.push({
        undo: obj,
        subscription: obj.events.subscribe(this._events),
      });
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
      this.list[this.index--].undo.undo();
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
      this.list[++this.index].undo.redo();
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
    // If there is a group on the stack, then we have to return true. That's
    // because when the group is ended when undo() is called, it will be added
    // at the end of this.list.
    return this.index > -1 || this.stack.length > 0;
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
  protected readonly _events: Subject<UndoEvents> = new Subject();

  readonly events: Observable<UndoEvents> = this._events.asObservable();

  constructor(public readonly desc: string) {}

  /**
   * Called when the operation must be undone.
   *
   * @throws {Error} If an undo is attempted when an undo or redo is already in
   * progress.
   */
  undo(): void {
    this.performUndo();
    this._events.next({
      name: "Undo",
      undo: this,
    });
  }

  /**
   * This is the function that performs the specific operations required by this
   * undo object, when undoing.
   */
  protected abstract performUndo(): void;

  /**
   * Called when the operation must be redone.
   *
   * @throws {Error} If an undo is attempted when an undo or redo is already in
   * progress.
   */
  redo(): void {
    this.performRedo();
    this._events.next({
      name: "Redo",
      undo: this,
    });
  }

  /**
   * This is the function that performs the specific operations required by this
   * undo object, when redoing.
   */
  protected abstract performRedo(): void;

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
  performUndo(): void {
    for (let i = this.list.length - 1; i >= 0; --i) {
      this.list[i].undo();
    }
  }

  /**
   * Redoes this group, which means redoing all the operations that this group
   * has recorded.
   */
  performRedo(): void {
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
    // We need to forward the events onto this object.
    obj.events.subscribe(this._events);
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

/**
 * This is an undo object which does nothing but only serves as a marker in the
 * list of undo operations. It could be used for debugging or by modes to record
 * information they need in the undo list.
 */
export class UndoMarker extends Undo {
  /**
   * @param msg A message to identify the marker.
   */
  constructor(msg: string) {
    super(`*** MARKER *** ${msg}`);
  }

  // tslint:disable-next-line:no-empty
  performUndo(): void {}
  // tslint:disable-next-line:no-empty
  performRedo(): void {}
}

//  LocalWords:  boolean Dubeau MPL Mangalam UndoList desc
