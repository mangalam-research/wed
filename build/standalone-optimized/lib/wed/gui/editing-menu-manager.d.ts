/// <reference types="jquery" />
/**
 * Editing menu manager.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Action } from "../action";
import { Editor } from "../wed";
import { ActionContextMenu, Item } from "./action-context-menu";
/**
 * Manages the editing menus for a specific editing view. An "editing menu" is a
 * menu that appears in the editing pane. The context menu and completion menu
 * are editing menus.
 *
 * Only one editing menu may be shown at any given time.
 */
export declare class EditingMenuManager {
    private readonly editor;
    private readonly caretManager;
    private readonly guiRoot;
    private readonly dataRoot;
    private currentDropdown;
    private readonly modeTree;
    private readonly doc;
    /**
     * @param editor The editor for which the manager is created.
     */
    constructor(editor: Editor);
    /**
     * This is the default menu handler called when the user right-clicks in the
     * contents of a document or uses the keyboard shortcut.
     *
     * The menu handler which is invoked when a user right-clicks on an element
     * start or end label is defined by the decorator that the mode is using.
     */
    contextMenuHandler(e: JQueryEventObject): boolean;
    /**
     * Dismiss the menu currently shown. If there is no menu currently shown, does
     * nothing.
     */
    dismiss(): void;
    displayContextMenu(cmClass: typeof ActionContextMenu, x: number, y: number, items: Item[], readonly: boolean): void;
    private getMenuItemsForAttribute();
    private getMenuItemsForElement(node, offset, wrap);
    /**
     * Make a standardized menu item for a specific action. This method formats
     * the menu item and sets an even handler appropriate to invoke the action's
     * event handler.
     *
     * @param action The action for which we make a menu item.
     *
     * @param data The data that accompanies the action.
     *
     * @param start This parameter determines whether we are creating an item for
     *              a start label (``true``) an end label (``false``) or
     *              something which is neither a start or end label
     *              (``undefined``).
     *
     * @returns A HTML element which is fit to serve as a menu item.
     */
    makeMenuItemForAction<D>(action: Action<D>, data: D, start?: boolean): HTMLElement;
    /**
     * Makes an HTML link to open the documentation of an element.
     *
     * @param docUrl The URL to the documentation to open.
     *
     * @returns A ``&lt;a>`` element that links to the documentation.
     */
    makeDocumentationMenuItem(docURL: string): HTMLElement;
    setupCompletionMenu(): void;
    /**
     * Computes where a menu should show up, depending on the event that triggered
     * it.
     *
     * @param e The event that triggered the menu. If no event is passed, it is
     * assumed that the menu was not triggered by a mouse event.
     *
     * @param bottom If the event was not triggered by a mouse event, then use the
     * bottom of the DOM entity used to compute the position, rather than its
     * middle to determine the ``y`` coordinate of the context menu.
     *
     * @returns The top and left coordinates where the menu should appear.
     */
    computeMenuPosition(e: JQueryEventObject | undefined, bottom?: boolean): {
        top: number;
        left: number;
    };
}
