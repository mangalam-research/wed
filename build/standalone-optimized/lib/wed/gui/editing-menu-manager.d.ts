/// <reference types="jquery" />
/**
 * Editing menu manager.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Action } from "../action";
import { Editor } from "../editor";
import { ActionContextMenu, Item } from "./action-context-menu";
import { TypeaheadPopup } from "./typeahead-popup";
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
    private currentTypeahead;
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
    /**
     * Compute an appropriate position for a context menu, and display it. This is
     * a convenience function that essentially combines [[computeMenuPosition]]
     * and [[displayContextMenu]].
     *
     * @param cmClass See [[displayContextMenu]].
     *
     * @param items See [[displayContextMenu]].
     *
     * @param readonly See [[displayContextMenu]].
     *
     * @param e See [[computeMenuPosition]].
     *
     * @param bottom See [[computeMenuPosition]].
     */
    setupContextMenu(cmClass: typeof ActionContextMenu, items: Item[], readonly: boolean, e: JQueryEventObject | undefined, bottom?: boolean): void;
    /**
     * Display a context menu.
     *
     * @param cmClass The class to use to create the menu.
     *
     * @param x The position of the menu.
     *
     * @param y The position of the menu.
     *
     * @param items The menu items to show.
     *
     * @param readonly If true, don't include in the menu any operation that
     *                 would trigger a ``Transformation``.
     */
    displayContextMenu(cmClass: typeof ActionContextMenu, x: number, y: number, items: Item[], readonly: boolean): void;
    private getMenuItemsForAttribute();
    private getMenuItemsForElement(node, offset, wrap);
    /**
     * Make the menu items that should appear in all contextual menus.
     *
     * @param dataNode The element for which we are creating the menu.
     *
     * @returns Menu items.
     */
    makeCommonItems(dataNode: Node): Item[];
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
    private getPossibleAttributeValues();
    setupCompletionMenu(): void;
    setupReplacementMenu(): void;
    /**
     * Compute an appropriate position for a typeahead popup, and display it. This
     * is a convenience function that essentially combines [[computeMenuPosition]]
     * and [[displayTypeaheadPopup]].
     *
     * @param width See [[displayTypeaheadPopup]].
     *
     * @param placeholder See [[displayTypeaheadPopup]].
     *
     * @param options See [[displayTypeaheadPopup]].
     *
     * @param dismissCallback See [[displayTypeaheadPopup]].
     *
     * @param e See [[computeMenuPosition]].
     *
     * @param bottom See [[computeMenuPosition]].
     *
     * @returns The popup that was created.
     */
    setupTypeaheadPopup(width: number, placeholder: string, options: any, dismissCallback: (obj?: any) => void, e: JQueryEventObject | undefined, bottom?: boolean): TypeaheadPopup;
    /**
     * Brings up a typeahead popup.
     *
     * @param x The position of the popup.
     *
     * @param y The position of the popup.
     *
     * @param width The width of the popup.
     *
     * @param placeholder Placeholder text to put in the input field.
     *
     * @param options Options for Twitter Typeahead.
     *
     * @param dismissCallback The callback to be called upon dismissal. It will be
     * called with the object that was selected, if any.
     *
     * @returns The popup that was created.
     */
    displayTypeaheadPopup(x: number, y: number, width: number, placeholder: string, options: any, dismissCallback: (obj?: {
        value: string;
    }) => void): TypeaheadPopup;
    /**
     * Computes where a menu should show up, depending on the event that triggered
     * it.
     *
     * @param e The event that triggered the menu. If no event is passed, it is
     * assumed that the menu was not triggered by a mouse event.
     *
     * @param bottom Only used when the event was not triggered by a mouse event
     * (``e === undefined``). If ``bottom`` is true, use the bottom of the DOM
     * entity used to compute the ``left`` coordinate. Otherwise, use its middle
     * to determine the ``left`` coordinate.
     *
     * @returns The top and left coordinates where the menu should appear.
     */
    computeMenuPosition(e: JQueryEventObject | undefined, bottom?: boolean): {
        top: number;
        left: number;
    };
}
