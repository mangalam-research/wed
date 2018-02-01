import { Editor } from "../editor";
import { Scroller } from "./scroller";
import { Direction } from "./search-replace";
export { Direction };
/**
 * Brings up a search and replace dialog box to allow the user to search through
 * a document. See the section on "Dialog Search" in the editor's embedded help
 * for details of how it works for users.
 */
export declare class DialogSearchReplace {
    private readonly search;
    private readonly dialog;
    private readonly searchField;
    private readonly replaceField;
    private readonly forwardRadioButton;
    private readonly backwardRadioButton;
    private readonly textRadioButton;
    private readonly attributeRadioButton;
    private previousSearchValue;
    private readonly replaceButton;
    private readonly replaceAll;
    /**
     * @param editor The editor for which we are searching.
     *
     * @param scroller The scroller holding the document being searched.
     *
     * @param direction The direction of the search.
     */
    constructor(editor: Editor, scroller: Scroller, direction: Direction);
    /**
     * @returns The search option to pass to the search engine, given the user
     * choices.
     */
    private getSearchOptions();
    /**
     * Processes clicks on the "Find" button: searches the document and updates
     * the buttons.
     */
    private onFind();
    /**
     * Updates the disabled status of the buttons depending on how the input
     * elements are set.
     */
    private updateButtons();
    /**
     * Processes clicks on the "Replace and Find" button: replaces the current hit
     * and find the next one.
     */
    private onReplaceAndFind();
    /**
     * Processes clicks on the "Replace All" button: replaces all replaceable
     * hits.
     */
    private onReplaceAll();
    /**
     * Replaces the current hit.
     */
    private replace();
    /**
     * Moves to the next hit in the direction specified by the user.
     */
    private next();
    /**
     * Processes an ``input`` event on the search field. May change the currently
     * highlighted hit.
     */
    private onSearchInput();
    /**
     * Processes an ``input`` event on the replace field. Updates the buttons.
     */
    private onReplaceInput();
}
