/**
 * An error record.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { ErrorData } from "salve-dom";

/**
 * Combines the error data with the elements that represent the error in the
 * GUI.
 */
export interface GUIValidationError {
  /** The error itself. */
  ev: ErrorData;

  /** The item in the list of errors that represents the error. */
  item: HTMLElement | undefined;

  /** The marker in the error layer that represents the error. */
  marker: HTMLElement | undefined;
}
