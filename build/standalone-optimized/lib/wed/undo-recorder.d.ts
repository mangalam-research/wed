import { TreeUpdater } from "./tree-updater";
import { Editor } from "./wed";
/**
 * Records undo operations.
 */
export declare class UndoRecorder {
    private readonly editor;
    private readonly treeUpdater;
    private suppress;
    /**
     * @param editor The editor for which this recorder is created.
     *
     * @param treeUpdater The tree updater on which to listen for modifications.
     */
    constructor(editor: Editor, treeUpdater: TreeUpdater);
    /**
     * Sets the suppression state. When suppression is on, the recorder does not
     * record anything. When off, the recorder records. The recorder's suppression
     * state is initially off.
     *
     * @param suppress Whether to suppress or not.
     *
     * @throws {Error} If the call does not change the suppression state.
     */
    suppressRecording(suppress: boolean): void;
    private insertNodeAtHandler(ev);
    private setTextNodeValueHandler(ev);
    private beforeDeleteNodeHandler(ev);
    private setAttributeNSHandler(ev);
}
