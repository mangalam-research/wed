/**
 * Wed-specific undo functionality.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { Editor } from "./editor";
import * as undo from "./undo";

export type Caret = [string | undefined, number | undefined];

/**
 * This class extends the vanilla UndoGroup class by recording the
 * location of the caret when the group is created and when group
 * recording ends. This allows restoring the caret to sensible
 * positions before and after undoing or redoing.
 */
export class UndoGroup extends undo.UndoGroup {
  private readonly editor: Editor;
  private readonly caretAsPathBefore: Caret;
  private caretAsPathAfter: Caret | undefined;

  /**
   * @param desc The description of this group.
   *
   * @param editor The editor for which this undo group is created.
   */
  constructor(desc: string, editor: Editor) {
    super(desc);
    this.editor = editor;
    this.caretAsPathBefore = this.getDataCaretAsPath();
  }

  performUndo(): void {
    super.performUndo();
    this.setDataCaretAsPath(this.caretAsPathBefore);
  }

  performRedo(): void {
    super.performRedo();
    if (this.caretAsPathAfter === undefined) {
      throw new Error(`caretAsPathAfter is undefined, this indicates a \
corrupted state and thus an internal error`);
    }
    this.setDataCaretAsPath(this.caretAsPathAfter);
  }

  /**
   * Get the current data caret position as a path.
   *
   * @returns A caret.
   */
  getDataCaretAsPath(): Caret {
    const caret = this.editor.caretManager.getDataCaret(true);
    if (caret === undefined) {
      // Returning undefined for "the caret was undefined" would not
      // trap stupid mistakes in managing the data.
      return [undefined, undefined];
    }
    return [this.editor.dataUpdater.nodeToPath(caret.node), caret.offset];
  }

  /**
   * Set the data caret.
   *
   * @param caret A caret.
   */
  setDataCaretAsPath(caret: Caret): void {
    // [undefined, undefined] === the caret was undefined. We can't do anything.
    if (caret[0] === undefined && caret[1] === undefined) {
      return;
    }
    this.editor.caretManager.setCaret(
      this.editor.dataUpdater.pathToNode(caret[0]!), caret[1]);
  }

  /**
   * This method can be used to record the caret position after the acts
   * recorded by this undo are performed. If the caret is recorded by means of
   * this method, then [[end]] will not record the caret position again. This
   * can be useful in cases for which it is not clear when an UndoGroup might
   * end. [[TextUndoGroup]] is a case in point. This method can be called any
   * number of times to update the caret position at the end of the group.
   */
  recordCaretAfter(): void {
    this.caretAsPathAfter = this.getDataCaretAsPath();
  }

  end(): void {
    if (this.caretAsPathAfter === undefined) {
      this.recordCaretAfter();
    }
  }
}

/**
 * Grouping of text operations should be limited in size. For instance, if the
 * user hits backspace to delete a whole sentence and then wants to undo this
 * operation. It is better to undo it in chunks instead of reinserting the whole
 * sentence. This class allows for limiting the length of such chunks.
 */
export class TextUndoGroup extends UndoGroup {
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
  constructor(desc: string, editor: Editor,
              private readonly undoList: undo.UndoList,
              private readonly limit: number) {
    super(desc, editor);
  }

  record(undoToRecord: undo.Undo): void {
    if (this.list.length >= this.limit) {
      throw new Error("TextUndoGroup.record called beyond the limit");
    }
    super.record(undoToRecord);
    if (this.list.length === this.limit) {
      this.undoList.endGroup();
    }
  }
}

//  LocalWords:  pathToNode nodeToPath Dubeau MPL Mangalam param UndoGroup
//  LocalWords:  TextUndoGroup caretAsPathAfter
