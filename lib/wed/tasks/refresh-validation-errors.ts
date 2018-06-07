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
export class RefreshValidationErrors implements Task {
  private errors: GUIValidationError[] = [];
  private resumeAt: number = 0;

  constructor(private readonly controller: Controller) {}

  reset(): void {
    this.errors = this.controller.copyErrorList();
    this.resumeAt = 0;
  }

  cycle(): boolean {
    let ix = this.resumeAt;
    // The figure of 20 is arbitrary.
    const thisMax = Math.min(this.errors.length, this.resumeAt + 20);
    const errors = this.errors;
    while (ix < thisMax) {
      const error = errors[ix];
      // We work only on those that already have a marker.
      if (error.marker != null) {
        this.controller.processError(error);
      }

      ix++;
    }

    this.resumeAt = ix;
    return ix < errors.length;
  }
}

//  LocalWords:  MPL
