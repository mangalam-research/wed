/**
 * The API for client code. That is, for code that creates and manipulates
 * editor instances.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { AddOptions } from "./gui/toolbar";
import { ActionCtor } from "./editor-actions";

export interface EditorInstance {
  /** A name for this editor. */
  readonly name: string;

  /** A promise that resolves once the first validation is complete. */
  readonly firstValidationComplete: Promise<EditorInstance>;

  /** A promise that resolves once the editor is initialized. */
  readonly initialized: Promise<EditorInstance>;

  /**
   * Initialize the editor.
   *
   * @param xmlData The XML document to load.
   *
   * @return A promise that resolves once the editor is initialized.
   */
  init(xmlData?: string): Promise<EditorInstance>;

  /**
   * Add an action to the toolbar. This is meant to be used to add "general"
   * actions that are tied to the application in which wed is embedded rather
   * than to the mode being used.
   *
   * @param actionClass The class to instantiate to provide the action.
   *
   * @param options The options to use for adding the action.
   */
  addToolbarAction(actionClass: ActionCtor, options: AddOptions): void;

  /**
   * Triggers the resizing algorithm.
   */
  resize(): void;

  /**
   * Destroy this instance. This will stop all task runners and run clean up
   * code. After this is called, it is illegal to call any methods other than
   * this one.
   */
  destroy(): void;
}
