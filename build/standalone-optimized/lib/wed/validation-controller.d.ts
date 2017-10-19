/// <reference types="jquery" />
/**
 * Controller managing the validation logic of a wed editor.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { NameResolver } from "salve";
import { GUIValidationError } from "./gui-validation-error";
import { ErrorLayer } from "./gui/error-layer";
import { Scroller } from "./gui/scroller";
import { Validator } from "./validator";
import { Editor } from "./wed";
/**
 * The click event handler to use on list items created by the controller.
 */
export declare type ErrorItemHandler = (ev: JQueryMouseEventObject) => boolean;
/**
 * Controls the validator and the tasks that pertain to error processing and
 * refreshing. Takes care of reporting errors to the user.
 */
export declare class ValidationController {
    private readonly editor;
    private readonly validator;
    private readonly resolver;
    private readonly scroller;
    private readonly guiRoot;
    private readonly progressBar;
    private readonly validationMessage;
    private readonly errorLayer;
    private readonly errorList;
    private readonly errorItemHandler;
    readonly document: Document;
    private readonly refreshErrorsRunner;
    private readonly processErrorsRunner;
    private lastDoneShown;
    private processErrorsTimeout;
    /**
     * This holds the timeout set to process validation errors in batch.  The
     * delay in ms before we consider a batch ready to process.
     */
    private processErrorsDelay;
    private _errors;
    /**
     * Gives the index in errors of the last validation error that has
     * already been processed.
     */
    private processedErrorsUpTo;
    private readonly $errorList;
    /**
     * @param editor The editor for which this controller is created.
     *
     * @param validator The validator which is under control.
     *
     * @param resolver A name resolver to resolve names in errors.
     *
     * @param scroller The scroller for the edited contents.
     *
     * @param guiRoot The DOM element representing the root of the edited
     * document.
     *
     * @param progressBar: The DOM element which contains the validation progress
     * bar.
     *
     * @param validationMessage: The DOM element which serves to report the
     * validation status.
     *
     * @param errorLayer: The layer that holds error markers.
     *
     * @param errorList: The DOM element which serves to contain the error list.
     *
     * @param errorItemHandler: An event handler for the markers.
     */
    constructor(editor: Editor, validator: Validator, resolver: NameResolver, scroller: Scroller, guiRoot: Element, progressBar: HTMLElement, validationMessage: HTMLElement, errorLayer: ErrorLayer, errorList: HTMLElement, errorItemHandler: ErrorItemHandler);
    /**
     * @returns a shallow copy of the error list.
     */
    copyErrorList(): GUIValidationError[];
    /**
     * Stops all tasks and the validator.
     */
    stop(): void;
    /**
     * Resumes all tasks and the validator.
     */
    resume(): void;
    /**
     * Handles changes in the validator state. Updates the progress bar and the
     * validation status.
     */
    private onValidatorStateChange(workingState);
    /**
     * Handles a validation error reported by the validator. It records the error
     * and schedule future processing of the errors.
     */
    private onValidatorError(ev);
    /**
     * Handles resets of the validation state.
     */
    private onResetErrors(ev);
    /**
     * Resets the state of the error processing task and resumes it
     * as soon as possible.
     */
    processErrors(): void;
    /**
     * Find where the error represented by the event passed should be marked.
     *
     * @param ev The error reported by the validator.
     *
     * @returns A location, if possible.
     */
    private findInsertionPoint(ev);
    /**
     * Process a single error. This will compute the location of the error marker
     * and will create a marker to add to the error layer, and a list item to add
     * to the list of errors.
     *
     * @return ``false`` if there was no insertion point for the error, and thus
     * no marker or item were created. ``true`` otherwise.
     */
    processError(err: GUIValidationError): boolean;
    /**
     * Clear all validation errors. This makes the editor forget and updates the
     * GUI to remove all displayed errors.
     */
    private clearErrors();
    /**
     * Terminate the controller. This stops all runners and clears any unexpired
     * timeout.
     */
    terminate(): void;
    /**
     * This method updates the location markers of the errors.
     */
    refreshErrors(): void;
    /**
     * This method recreates the error messages and the error markers associated
     * with the errors that the editor already knows.
     */
    recreateErrors(): void;
    /**
     * Add items to the list of errors.
     *
     * @param items The items to add to the list of errors.
     */
    appendItems(items: HTMLElement[]): void;
    /**
     * Add markers to the layer that is used to contain error markers.
     *
     * @param markers The markers to add.
     */
    appendMarkers(markers: HTMLElement[]): void;
}
