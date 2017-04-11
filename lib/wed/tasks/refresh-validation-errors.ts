/**
 * A task that refreshes the position of the validation error markers.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Task } from "../task-runner";

// tslint:disable-next-line:no-any
export type Editor = any;

/**
 * This task refreshes the position of the validation error markers on the
 * screen.
 */
export class RefreshValidationErrors implements Task {
  // tslint:disable-next-line:no-any
  private _errors: any[];
  private _resumeAt: number;

  constructor(private readonly editor: Editor) {}

  reset(): void {
    this._errors = this.editor._validation_errors.slice();
    this._resumeAt = 0;
  }

  cycle(): boolean {
    let ix = this._resumeAt;
    // The figure of 20 is arbitrary.
    const thisMax = Math.min(this._errors.length, this._resumeAt + 20);
    const errors = this._errors;
    while (ix < thisMax) {
      const error = errors[ix];
      // We work only on those that already have a marker.
      if (error.marker != null) {
        this.editor._processValidationError(error);
      }

      ix++;
    }

    this._resumeAt = ix;
    return ix < errors.length;
  }
}
