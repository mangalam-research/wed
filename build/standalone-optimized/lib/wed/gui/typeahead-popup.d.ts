/**
 * Support for a typeahead field that pops up in the editing pane.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import "bootstrap";
import "typeahead";
export interface TypeaheadPopupOptions {
    /** Corresponds to the ``options`` parameter of Twitter Typeahead. */
    options: any;
    /** Corresponds to the ``datasets`` parameter of Twitter Typeahead. */
    datasets: any[];
}
/**
 * A typeahead popup GUI element.
 */
export declare class TypeaheadPopup {
    private readonly taWrapper;
    private readonly dismissCallback;
    private readonly backdrop;
    private readonly ta;
    private readonly $ta;
    private dismissed;
    /**
     * @param doc The DOM document for which to make this popup.
     *
     * @param x Position of popup. The popup may ignore the position if it would
     * overflow off the screen or not have enough space to reasonably show the
     * choices for typing ahead.
     *
     * @param y Position of popup.
     *
     * @param width The desired width of the popup. This value may get overridden.
     *
     * @param  placeholder The placeholder text to use.
     *
     * @param options The options to pass to the underlying Twitter Typeahead
     * menu.
     *
     * @param dismissCallback Function to call when the popup is dismissed.
     */
    constructor(doc: Document, x: number, y: number, width: number, placeholder: string, options: TypeaheadPopupOptions, dismissCallback: (obj?: any) => void);
    /**
     * Dismisses the popup. Calls the callback that was passed when the popup was
     * created, if any.
     *
     * @param obj This should be the object selected by the user, if any. This
     * will be passed to the ``dismissCallback`` that was passed when the popup
     * was created, if any. If you call this method directly and want a selection
     * to occur, take care to use an object which is from the data set passed in
     * the ``options`` parameter that was used when the popup was created. The
     * value ``undefined`` means no object was selected.
     */
    dismiss(obj?: any): void;
    /**
     * Event handler for keydown events on the popup. The default implementation
     * is to dismiss the popup if escape is pressed.
     */
    private _keydownHandler(ev);
    /**
     * Event handler for typeahead:selected events. The default implementation is
     * to dismiss the popup.
     */
    private _selectedHandler(ev, obj);
    /**
     * Hide the spinner that was created to indicate that the data is being
     * loaded.
     */
    hideSpinner(): void;
    /**
     * Set the value in the input field of the typeahead. This also updates the
     * suggestions.
     *
     * @param value The new value.
     */
    setValue(value: string): void;
}
