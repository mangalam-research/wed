/// <reference types="jquery" />
/**
 * Quick search GUI.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Editor } from "../editor";
import { ChangeEvent } from "./minibuffer";
import { Scroller } from "./scroller";
import { Direction } from "./search-replace";
export { Direction };
/**
 * A quick search interface. The quick search sets the minibuffer to prompt the
 * user for a term and searches through the document in the specified search
 * direction. See the section on "Quick Search" in the editor's embedded help
 * for details of how it works for the user.
 */
export declare class QuickSearch {
    private readonly editor;
    private direction;
    private readonly search;
    /**
     * @param editor The editor for which we are searching.
     *
     * @param scroller The scroller that contains the document.
     *
     * @param direction The direction of the search.
     */
    constructor(editor: Editor, scroller: Scroller, direction: Direction);
    /** Update the prompt shown to the user to indicate a new direction. */
    private updatePrompt();
    /**
     * The minibuffer calls this function so that the quick search can handle
     * keydown events.
     *
     * @returns ``false`` if the key was handled, ``undefined`` otherwise.
     */
    onMinibufferKeydown(ev: JQueryKeyEventObject): boolean | undefined;
    /**
     * Get the current search options to pass to the underlying search engine.
     */
    private getSearchOptions();
    /**
     * Move to the next hit in the direction specified by the user.
     */
    private next();
    /**
     * Called by the minibuffer whenever the text in the minibuffer input changes.
     */
    onMinibufferChange(ev: ChangeEvent): void;
    /**
     * Called by the minibuffer when the user exits the minibuffer.
     */
    onUninstall(): void;
}
