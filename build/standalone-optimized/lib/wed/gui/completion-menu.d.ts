import { Editor } from "../wed";
import { ContextMenu, DismissCallback } from "./context-menu";
/**
 * A menu for displaying completions.
 */
export declare class CompletionMenu extends ContextMenu {
    private readonly completionPrefix;
    private readonly completionItems;
    private readonly editor;
    private readonly boundCompletionKeydownHandler;
    private _focused;
    /**
     * @param editor The editor for which to create this menu.
     *
     * @param document The DOM document for which to make this context menu.
     *
     * @param x Position of the menu. The context menu may ignore this position if
     * the menu would appear off-screen.
     *
     * @param y Position of the menu.
     *
     * @param prefix The prefix. This is the data which is currently present in
     * the document and that has to be completed.
     *
     * @param items An array of possible completions.
     *
     * @param dismissCallback Function to call when the menu is dismissed.
     */
    constructor(editor: Editor, document: Document, x: number, y: number, prefix: string, items: string[], dismissCallback?: DismissCallback);
    /** Whether the completion menu has been focused. */
    readonly focused: boolean;
    private globalKeydownHandler(wedEv, ev);
    render(): void;
    dismiss(): void;
}
