/**
 * A task that refreshes the position of the validation error markers.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { GUIValidationError } from "../gui-validation-error";
import { Task } from "../task-runner";
export interface Controller {
    copyErrorList(): GUIValidationError[];
    processError(error: GUIValidationError): boolean;
}
/**
 * This task refreshes the position of the validation error markers on the
 * screen.
 */
export declare class RefreshValidationErrors implements Task {
    private readonly controller;
    private errors;
    private resumeAt;
    constructor(controller: Controller);
    reset(): void;
    cycle(): boolean;
}
