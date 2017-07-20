/**
 * A task that processes the validation errors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { GUIValidationError } from "../gui-validation-error";
import { Task } from "../task-runner";
export interface Controller {
    copyErrorList(): GUIValidationError[];
    processError(error: GUIValidationError): boolean;
    appendItems(items: HTMLElement[]): void;
    appendMarkers(markers: HTMLElement[]): void;
}
/**
 * This task processes the new validation errors that have not been processed
 * yet.
 */
export declare class ProcessValidationErrors implements Task {
    private readonly controller;
    private errors;
    constructor(controller: Controller);
    reset(): void;
    cycle(): boolean;
}
