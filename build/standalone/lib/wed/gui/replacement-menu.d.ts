import { Editor } from "../editor";
import { ContextMenu } from "./context-menu";
export declare type DismissCallback = (selected: string | undefined) => void;
/**
 * A menu for displaying replacement values.
 */
export declare class ReplacementMenu extends ContextMenu {
    private readonly replacementItems;
    private readonly editor;
    private selected;
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
     * @param items An array of possible replacement values.
     *
     * @param dismissCallback Function to call when the menu is dismissed.
     */
    constructor(editor: Editor, document: Document, x: number, y: number, items: string[], dismissCallback: DismissCallback);
    render(): void;
    dismiss(): void;
}
