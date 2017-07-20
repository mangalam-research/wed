/**
 * Modal dialog boxes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import "bootstrap";
export interface Options {
    /**
     * Whether this modal can be resized.
     */
    resizable?: boolean;
    /**
     * Whether this modal can be dragged .
     */
    draggable?: boolean;
}
/**
 * A modal needs to be created only once per instance of wed. After creation it
 * must be installed into the DOM tree of the page on which it is going to be
 * used. The method [[Modal.getTopLevel]] must be used to get the top level DOM
 * element of the modal which will be inserted into the page. Once inserted, the
 * modal is ready to be used once, twice, or more times. It need not be removed,
 * re-created, etc. The method [[Modal.modal]] just needs to be called each time
 * the modal must be displayed.
 *
 * A typical usage scenario would be:
 *
 * <pre>
 *   // Modal setup.
 *   mymodal = new Modal();
 *   mymodal.setTitle("My modal");
 *   mymodal.setBody(...);
 *   mymodal.addYesNo();
 *   // This is a generic example of how to add the modal to a page.
 *   $("body").append(mymodal.getTopLevel());
 *
 *   ...
 *
 *   // Modal use
 *   mymodal.modal(function () {...});
 *   switch(mymodal.getClickedAsText()) {...}
 *
 *   ...
 *
 *   // A second use of the same modal
 *   mymodal.modal(function () {...});
 *   switch(mymodal.getClickedAsText()) {...}
 * </pre>
 *
 * If the same modal must be displayed on two different pages, then two Modal
 * objects should be created, one per page.
 */
export declare class Modal {
    private readonly _$dom;
    private readonly _$header;
    private readonly _$body;
    private readonly _$footer;
    private _$clicked;
    constructor(options?: Options);
    /**
     * @returns The top level node of the modal, to be inserted
     * into a page.
     */
    getTopLevel(): JQuery;
    /**
     * Set the title of this modal.
     */
    setTitle(title: string | JQuery | Element | Text): void;
    /**
     * Set the body of this modal.
     */
    setBody(body: string | JQuery | Element | Text): void;
    /**
     * Set the footer of this modal.
     */
    setFooter(footer: string | JQuery | Element | Text): void;
    /**
     * @param name The name of the button.
     *
     * @param isPrimary True if the button is primary. A modal takes only one
     * primary button but no check is made by this method to prevent it. The
     * primary button is the one clicked if the user hits enter.
     *
     * @returns The jQuery object for the button.
     */
    addButton(name: string, isPrimary?: boolean): JQuery;
    /**
     * Adds one Ok and one Cancel button.
     *
     * @returns The two buttons added.
     */
    addOkCancel(): JQuery[];
    /**
     * Adds one Yes and one No button.
     *
     * @returns The two buttons added.
     */
    addYesNo(): JQuery[];
    /**
     * Returns the primary button.
     *
     * @returns The primary button.
     */
    getPrimary(): JQuery;
    /**
     * @param callback A callback to call when the modal is dismissed by the
     * user. This modal would typically inspect the modal to determine what the
     * user did, and potentially clean up after itself. The callback is left out
     * if the modal is merely for informational purposes.
     */
    modal(callback?: () => void): void;
    /**
     * @returns The button that was clicked. Could be undefined if the modal
     * disappeared without being normally dismissed or if the modal has not been
     * used yet.
     */
    getClicked(): JQuery | undefined;
    /**
     * @returns The text of the button that was clicked. Could be undefined if the
     * modal disappeared without being normally dismissed or if the modal has not
     * been used yet.
     */
    getClickedAsText(): string | undefined;
    /**
     * Handles the ``shown`` event.
     *
     * @param {Event} ev The DOM event.
     */
    private _handleShown();
}
