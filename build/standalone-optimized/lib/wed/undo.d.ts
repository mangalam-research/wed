/**
 * Records operations that may be undone or redone. It maintains a single list
 * of [[Undo]] objects in the order by which they are passed to the
 * [[UndoList.record]] method.
 *
 * This object maintains a single history. So if operations A, B, C, D are
 * recorded, C and D are undone and then E is recorded, the list of recorded
 * operations will then be A, B, E.
 */
export declare class UndoList {
    private readonly stack;
    private list;
    private index;
    private _undoingOrRedoing;
    /**
     * This method makes the UndoList object record the object passed to it. Any
     * operations that had previously been undone are forgotten.
     *
     * @param obj An undo object to record.
     */
    record(obj: Undo): void;
    /**
     * Undoes the latest [[Undo]] that was recorded. If any [[UndoGroup]] objects
     * were in effect when called, they are terminated. It is an error to call
     * this method or [[redo]] from within this method. Does nothing if there is
     * nothing to undo.
     *
     * @throws {Error} If an undo is attempted when an undo or redo is already in
     * progress.
     */
    undo(): void;
    /**
     * Redoes the latest [[Undo]] object that was undone.  It is an error to call
     * this method or [[undo]] from within this method. Does nothing if there is
     * nothing to redo.
     *
     * @throws {Error} If an undo is attempted when an undo or redo is already in
     * progress.
     */
    redo(): void;
    /**
     * @returns True if the object is in the midst of undoing or redoing, false
     * otherwise.
     */
    undoingOrRedoing(): boolean;
    /**
     * @returns True if there is something to undo, false otherwise.
     */
    canUndo(): boolean;
    /**
     * @returns True if there is something to redo, false otherwise.
     */
    canRedo(): boolean;
    /**
     * Starts recording a group of undo operations.
     *
     * @param group The undo group to start.
     */
    startGroup(group: UndoGroup): void;
    /**
     * Ends recording a group of undo operations. The group currently in effect is
     * terminated, and made the last recorded operation (as if it had been passed
     * to [[UndoList.record]]).
     *
     * @throws {Error} If there is no current undo group.
     */
    endGroup(): void;
    /**
     * Ends all groups currently in effect. This is the same as calling
     * [[endGroup]] repeatedly until there are no more groups to end.
     */
    endAllGroups(): void;
    /**
     * @returns The group currently being recorded.
     */
    getGroup(): UndoGroup;
    /**
     * @returns A string showing all the undo steps and undo groups stored in this
     * undo list.
     */
    toString(): string;
}
/**
 * An undo operation.
 * @param {string} desc The description of this undo operation.
 */
export declare abstract class Undo {
    readonly desc: string;
    constructor(desc: string);
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
    toString(): string;
}
/**
 * A group of undo operations.
 */
export declare class UndoGroup extends Undo {
    protected readonly list: Undo[];
    /**
     * Undoes this group, which means undoing all the operations that this group
     * has recorded.
     */
    undo(): void;
    /**
     * Redoes this group, which means redoing all the operations that this group
     * has recorded.
     */
    redo(): void;
    /**
     * Records an operation as part of this group.
     *
     * @param obj The operation to record.
     */
    record(obj: Undo): void;
    /**
     * This method is called by [[UndoList.endGroup]] when it ends a group. The
     * default implementation does nothing.
     */
    end(): void;
    toString(): string;
}
