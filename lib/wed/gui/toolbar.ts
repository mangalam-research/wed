/**
 * A toolbar for editors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { Button } from "./button";

export interface AddOptions {
  /**
   * If true, push the options at the right end of the toolbar. Note that this
   * is can only be used when appending buttons. And this is something
   * independent from the mere fact of appending. When using this option, the
   * appended button will be visually pushed away from the previous button,
   * towards the right end of the toolbar.
   */
  right?: boolean;

  /** If true, prepend the buttons rather than append them. */
  prepend?: boolean;
}

/**
 * A toolbar is a horizontal element which contains a series of buttons from
 * which the user can initiate actions.
 *
 * The toolbar contains buttons for two types of buttons:
 *
 * - Buttons not associated with any specific mode. These are editor-wide
 *   actions that may be set by the application in which the editor instance is
 *   used.
 *
 * - Buttons specific to a mode.
 */
export class Toolbar {
  private readonly divider: Element;
  private readonly modeSpan: Element;

  /** The top DOM element of the toolbar. */
  readonly top: Element;

  constructor() {
    const top = this.top = document.createElement("div");
    this.top.className = "wed-toolbar";
    this.divider = document.createElement("span");
    this.divider.className = "wed-toolbar-divider";
    this.modeSpan = document.createElement("span");
    top.appendChild(this.divider);
    top.appendChild(this.modeSpan);
  }

  /**
   * Add one or more buttons to the toolbar.
   *
   * @param buttons A single button or an array of buttons to add.
   *
   * @param options Parameters affecting how the addition is made.
   */
  addButton(buttons: ReadonlyArray<Button> | Button,
            options: AddOptions = {}): void {
    if ((buttons instanceof Button)) {
      buttons = [buttons] as ReadonlyArray<Button>;
    }

    const prepend = options.prepend === true;
    const right = options.right === true;
    if (prepend && right) {
      throw new Error("cannot use prepend and right at the same time.");
    }

    const top = this.top;
    const frag = top.ownerDocument.createDocumentFragment();
    for (const button of buttons) {
      if (right) {
        const wrap = top.ownerDocument.createElement("span");
        wrap.className = right ? "pull-right" : "";
        button.render(wrap);
        frag.appendChild(wrap);
      }
      else {
        button.render(frag);
      }
    }

    if (right) {
      top.appendChild(frag);
    }
    else {
      top.insertBefore(frag, prepend ? top.firstChild : this.divider);
    }
  }

  /**
   * Set the mode related buttons. This replaces any buttons previously set by
   * this method.
   *
   * @param buttons The buttons to add to the toolbar.
   */
  setModeButtons(buttons: Button[]): void {
    // tslint:disable-next-line:no-inner-html
    this.modeSpan.innerHTML = "";
    for (const button of buttons) {
      button.render(this.modeSpan);
    }
  }
}
