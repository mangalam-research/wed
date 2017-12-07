/**
 * A toolbar for editors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { Action } from "../action";

export interface AddOptions {
  /**
   * If true, push the options at the right end of the toolbar. Note that this
   * is can only be used when appending actions. And this is something
   * independent from the mere fact of appending. When using this option, the
   * appended action will be visually pushed away from the previous action,
   * towards the right end of the toolbar.
   */
  right?: boolean;

  /** If true, prepend the actions rather than append them. */
  prepend?: boolean;
}

/**
 * A toolbar is a horizontal element which contains a series of buttons from
 * which the user can initiate actions.
 *
 * The toolbar contains buttons for two types of actions:
 *
 * - Actions not associated with any specific mode. These are editor-wide
 *   actions that may be set by the application in which the editor instance is
 *   used.
 *
 * - Actions specific to a mode.
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
   * Add one or more actions to the toolbar.
   *
   * @param actions A single action or an array of actions to add.
   *
   * @param options Parameters affecting how the addition is made.
   */
  addAction(actions: ReadonlyArray<Action<{}>> | Action<{}>,
            options: AddOptions =  {}): void {
    if ((actions instanceof Action)) {
      actions = [actions] as ReadonlyArray<Action<{}>>;
    }

    const prepend = options.prepend === true;
    const right = options.right === true;
    if (prepend && right) {
      throw new Error("cannot use prepend and right at the same time.");
    }

    const extraClass = right ? " pull-right" : "";

    const top = this.top;
    const frag = top.ownerDocument.createDocumentFragment();
    for (const action of actions) {
      frag.appendChild(this.makeButtonFor(action, extraClass));
    }

    if (right) {
      top.appendChild(frag);
    }
    else {
      top.insertBefore(frag, prepend ? top.firstChild : this.divider);
    }
  }

  private makeButtonFor(action: Action<{}>, extraClass: string): HTMLElement {
    const icon = action.getIcon();
    const button = this.top.ownerDocument.createElement("button");
    button.className = `btn btn-default${extraClass}`;
    let abbrev = action.getAbbreviatedDescription();
    const desc = action.getDescription();
    // If we don't have an abbreviation, we get the regular description.
    if (abbrev === undefined) {
      abbrev = desc;
    }

    let needsTooltip = true;
    if (icon !== "") {
      // tslint:disable-next-line:no-inner-html
      button.innerHTML = icon;
    }
    else {
      button.textContent = abbrev;
      needsTooltip = abbrev !== desc;
    }
    const $button = $(button);
    if (needsTooltip) {
      button.setAttribute("title", desc);
      $button.tooltip({ title: desc,
                        container: "body",
                        placement: "auto",
                        trigger: "hover" });
    }
    $button.click(action.boundTerminalHandler);
    // Prevents acquiring the focus.
    $button.mousedown(false);
    return button;
  }

  /**
   * Set the mode related actions. This replaces any actions previously set by
   * this method.
   *
   * @param actions The actions to add to the toolbar.
   */
  setModeActions(actions: Action<{}>[]): void {
    // tslint:disable-next-line:no-inner-html
    this.modeSpan.innerHTML = "";
    for (const action of actions) {
      this.modeSpan.appendChild(this.makeButtonFor(action, ""));
    }
  }
}
