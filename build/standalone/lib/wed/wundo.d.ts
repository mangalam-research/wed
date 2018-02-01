/**
 * Wed-specific undo functionality.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Editor } from "./editor";
import * as undo from "./undo";
export declare type Caret = [string | undefined, number | undefined];
/**
 * This class extends the vanilla UndoGroup class by recording the
 * location of the caret when the group is created and when group
 * recording ends. This allows restoring the caret to sensible
 * positions before and after undoing or redoing.
 */
export declare class UndoGroup extends undo.UndoGroup {
    private readonly editor;
    private readonly caretAsPathBefore;
    private caretAsPathAfter;
    /**
     * @param desc The description of this group.
     *
     * @param editor The editor for which this undo group is created.
     */
    constructor(desc: string, editor: Editor);
    performUndo(): void;
    performRedo(): void;
    /**
     * Get the current data caret position as a path.
     *
     * @returns A caret.
     */
    getDataCaretAsPath(): Caret;
    /**
     * Set the data caret.
     *
     * @param caret A caret.
     */
    setDataCaretAsPath(caret: Caret): void;
    /**
     * This method can be used to record the caret position after the acts
     * recorded by this undo are performed. If the caret is recorded by means of
     * this method, then [[end]] will not record the caret position again. This
     * can be useful in cases for which it is not clear when an UndoGroup might
     * end. [[TextUndoGroup]] is a case in point. This method can be called any
     * number of times to update the caret position at the end of the group.
     */
    recordCaretAfter(): void;
    end(): void;
}
/**
 * Grouping of text operations should be limited in size. For instance, if the
 * user hits backspace to delete a whole sentence and then wants to undo this
 * operation. It is better to undo it in chunks instead of reinserting the whole
 * sentence. This class allows for limiting the length of such chunks.
 */
export declare class TextUndoGroup extends UndoGroup {
    private readonly undoList;
    private readonly limit;
    /**
     * @param desc The description of this group.
     *
     * @param editor The editor for which this undo group is created.
     *
     * @param undoList The list which will hold this group.
     *
     * @param limit The maximum number of undo operations that this group should
     * record.
     */
    constructor(desc: string, editor: Editor, undoList: undo.UndoList, limit: number);
    record(undoToRecord: undo.Undo): void;
}
