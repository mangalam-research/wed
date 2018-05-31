/**
 * Actions that all editors support.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Observable, Subject } from "rxjs";

import { Action } from "./action";
import { Button, ToggleButton } from "./gui/button";
import { makeHTML } from "./gui/icon";
import { EditorAPI } from "./mode-api";

export type ActionCtor = { new (editor: EditorAPI): Action<{}> };

export type Handler = (editor: EditorAPI) => void;

export function makeAction(desc: string,
                           icon: string,
                           needsInput: boolean,
                           fn: Handler): ActionCtor;
export function makeAction(desc: string,
                           icon: string,
                           abbreviatedDesc: string,
                           needsInput: boolean,
                           fn: Handler): ActionCtor;
export function makeAction(desc: string,
                           abbreviatedDesc: string | undefined,
                           icon: string | boolean,
                           needsInput: boolean | Handler,
                           fn?: Handler): ActionCtor {
  let actualAbbreviatedDesc: string | undefined;
  let actualIcon: string;
  let actualNeedsInput: boolean;
  let actualFn: Handler;
  if (typeof icon === "boolean") {
    actualAbbreviatedDesc = undefined;
    actualIcon = abbreviatedDesc as string;
    actualNeedsInput = icon;
    actualFn = needsInput as Handler;
  }
  else {
    actualAbbreviatedDesc = abbreviatedDesc;
    actualIcon = icon;
    actualNeedsInput = needsInput as boolean;
    actualFn = fn as Handler;
  }

  return class extends Action<{}> {
    constructor(editor: EditorAPI) {
      super(editor, desc, actualAbbreviatedDesc, actualIcon, actualNeedsInput);
    }

    execute(): void {
      actualFn(this.editor);
    }
  };
}

// tslint:disable-next-line:variable-name
export const Save =
  makeAction("Save", makeHTML("upload"), false,
             (editor) => {
               // tslint:disable-next-line:no-floating-promises
               editor.save();
             });

// tslint:disable-next-line:variable-name
export const Undo =
  makeAction("Undo", makeHTML("undo"), false,
             (editor) => {
               editor.undo();
             });

// tslint:disable-next-line:variable-name
export const Redo =
  makeAction("Redo", makeHTML("redo"), false,
             (editor) => {
               editor.redo();
             });

// tslint:disable-next-line:variable-name
export const DecreaseLabelVisibilityLevel =
  makeAction("Decrease label visibility level", "Decrease label visibility",
             makeHTML("arrow-down"), false,
             (editor) => {
               editor.decreaseLabelVisiblityLevel();
             });

// tslint:disable-next-line:variable-name
export const IncreaseLabelVisibilityLevel =
  makeAction("Increase label visibility level", "Increase label visibility",
             makeHTML("arrow-up"), false,
             (editor) => {
               editor.increaseLabelVisibilityLevel();
             });

export interface PressedEvent {
  name: "Pressed";
  action: ToggleAttributeHiding;
}

/**
 * An action that toggles the editors attribute hiding.
 */
export class ToggleAttributeHiding extends Action<boolean> {
  protected pressed: boolean = true;

  /**
   * The object on which this class and subclasses may push new events.
   */
  protected readonly _events: Subject<PressedEvent> = new Subject();

  /**
   * The observable on which clients can listen for events.
   */
  readonly events: Observable<PressedEvent> = this._events.asObservable();

  constructor(editor: EditorAPI) {
    super(editor, "Toggle attribute hiding", "AH", undefined, false);
  }

  execute(data: boolean): void {
    if (this.pressed !== data) {
      this.pressed = data;
      this.editor.toggleAttributeHiding();
      this._events.next({ name: "Pressed", action: this });
    }
  }

  makeButton(data?: boolean): Button {
    const button = new ToggleButton(
      this.pressed,
      data !== undefined ? this.getDescriptionFor(data) : this.getDescription(),
      this.getAbbreviatedDescription(),
      this.getIcon());

    button.events.subscribe(() => {
      this.execute(button.pressed);
    });

    this.events.subscribe(() => {
      button.pressed = this.pressed;
    });

    return button;
  }
}
