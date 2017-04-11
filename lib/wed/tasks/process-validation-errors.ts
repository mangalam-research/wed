/**
 * A task that processes the validation errors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Task } from "../task-runner";

// tslint:disable-next-line:no-any
export type Editor = any;

/**
 * This task processes the new validation errors that have not been processed
 * yet.
 */
export class ProcessValidationErrors implements Task {
  // tslint:disable-next-line:no-any
  private _errors: any[];
  private _doc: Document;

  constructor(private readonly editor: Editor) {
    this._doc = this.editor.$error_list[0].ownerDocument;
  }

  reset(): void {
    this._errors = this.editor._validation_errors.slice();

    // If we are not using the navigation panel, then we should
    // always show the error list.
    if (this.editor._$navigation_panel.css("display") === "none") {
      this.editor.$error_list.parents(".panel-collapse").collapse("show");
    }
  }

  cycle(): boolean {
    const editor = this.editor;
    const errors = this._errors;
    if (errors.length === 0) {
      return false;
    }

    // The figure in the next line is arbitrary.
    let count = Math.min(errors.length, 30);

    const doc = this._doc;
    const itemFrag = doc.createDocumentFragment();
    const markerFrag = doc.createDocumentFragment();
    let ix = 0;
    while (count !== 0) {
      count--;
      const error = errors[ix];
      if (editor._processValidationError(error) as boolean) {
        errors.splice(ix, 1);
        itemFrag.appendChild(error.item);
        const marker = error.marker;
        // There may be no marker set.
        if (marker != null) {
          markerFrag.appendChild(marker);
        }
      }
      else {
        ++ix;
      }
    }

    editor.$error_list[0].appendChild(itemFrag);
    editor._$error_layer[0].appendChild(markerFrag);
    return errors.length !== 0;
  }
}
