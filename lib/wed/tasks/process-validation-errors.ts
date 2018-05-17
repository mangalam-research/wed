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
export class ProcessValidationErrors implements Task {
  private errors: GUIValidationError[] = [];

  constructor(private readonly controller: Controller) {}

  reset(): void {
    this.errors = this.controller.copyErrorList();
  }

  cycle(): boolean {
    const controller = this.controller;
    const errors = this.errors;
    if (errors.length === 0) {
      return false;
    }

    // The figure in the next line is arbitrary.
    let count = Math.min(errors.length, 30);

    const items = [];
    const markers = [];
    let ix = 0;
    while (count !== 0) {
      count--;
      const error = errors[ix];
      if (controller.processError(error)) {
        errors.splice(ix, 1);
        const item = error.item;
        if (item === undefined) {
          throw new Error("there should be an item");
        }

        items.push(item);
        const marker = error.marker;
        // There may be no marker set.
        if (marker != null) {
          markers.push(marker);
        }
      }
      else {
        ++ix;
      }
    }

    controller.appendItems(items);
    controller.appendMarkers(markers);
    return errors.length !== 0;
  }
}

//  LocalWords:  MPL
