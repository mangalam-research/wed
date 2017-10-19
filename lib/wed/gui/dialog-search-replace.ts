/**
 * Search and replace GUI.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as bootbox from "bootbox";
import * as $ from "jquery";

import { Editor } from "../wed";
import { makeDraggable, makeResizable } from "./interactivity";
import { Scroller } from "./scroller";
import { Context, Direction, SearchOptions,
         SearchReplace } from "./search-replace";

export { Direction };

const dialogTemplate = `
<form>
 <div class='form-group'>
  <label>Search for:</label>
  <input type='text' name='search' class='form-control'>
 </div>
 <div class='form-group'>
  <label>Replace with:</label>
  <input type='text' name='replace' class='form-control'>
 </div>
 <div class='radio'>
  <span>Direction:</span>
  <div>
   <label class='radio-inline'>
    <input type='radio' name='direction' value='forward'> Forward
   </label>
  </div>
  <div>
   <label class='radio-inline'>
    <input type='radio' name='direction' value='backwards'> Backwards
   </label>
  <div>
 </div>
 <div class='radio'>
  <span>Context:</span>
  <div>
   <label class='radio-inline'>
    <input type='radio' name='context' value='text' checked>
    Only element text
   </label>
  </div>
  <div>
   <label class='radio-inline'>
    <input type='radio' name='context' value='attributes'>
    Only attributes values
   </label>
  </div>
 </div>
</form>`;

/**
 * Brings up a search and replace dialog box to allow the user to search through
 * a document. See the section on "Dialog Search" in the editor's embedded help
 * for details of how it works for users.
 */
export class DialogSearchReplace {
  private readonly search: SearchReplace;
  private readonly dialog: JQuery;
  private readonly searchField: HTMLInputElement;
  private readonly replaceField: HTMLInputElement;
  private readonly forwardRadioButton: HTMLInputElement;
  private readonly backwardRadioButton: HTMLInputElement;
  private readonly textRadioButton: HTMLInputElement;
  private readonly attributeRadioButton: HTMLInputElement;
  private previousSearchValue: string | undefined;
  private readonly replaceButton: HTMLButtonElement;
  private readonly replaceAll: HTMLButtonElement;

  /**
   * @param editor The editor for which we are searching.
   *
   * @param scroller The scroller holding the document being searched.
   *
   * @param direction The direction of the search.
   */
  constructor(editor: Editor, scroller: Scroller, direction: Direction) {
    this.search = new SearchReplace(editor, scroller);
    const body = $(dialogTemplate)[0] as HTMLFormElement;
    const dialog = this.dialog = bootbox.dialog({
      title: "Search/Replace",
      message: body,
      onEscape: true,
      backdrop: false,
      size: "small",
      buttons: {
        find: {
          label: "Find",
          className: "btn-primary",
          callback: this.onFind.bind(this),
        },
        replaceFind: {
          label: "Replace and Find",
          className: "btn-default replace-and-find",
          callback: this.onReplaceAndFind.bind(this),
        },
        replaceAll: {
          label: "Replace All",
          className: "btn-default replace-all",
          callback: this.onReplaceAll.bind(this),
        },
        close: {
          label: "Close",
        },
      },
    });
    makeResizable(dialog);
    makeDraggable(dialog);
    const directionItems = body.elements
      .namedItem("direction") as HTMLCollectionOf<HTMLInputElement>;
    this.forwardRadioButton = directionItems[0];
    this.backwardRadioButton = directionItems[1];

    const contextItems = body.elements
      .namedItem("context") as HTMLCollectionOf<HTMLInputElement>;
    this.textRadioButton = contextItems[0];
    this.attributeRadioButton = contextItems[1];

    let toCheck: HTMLInputElement;
    switch (direction) {
    case Direction.FORWARD:
      toCheck = this.forwardRadioButton;
      break;
    case Direction.BACKWARDS:
      toCheck = this.backwardRadioButton;
      break;
    default:
      const d: never = direction;
      throw new Error(`unknown direction: ${d}`);
    }
    toCheck.checked = true;

    dialog.on("hidden.bs.modal", () => {
      this.search.clearHighlight();
      // Return the focus to the editor.
      editor.caretManager.focusInputField();
    });

    const searchField = this.searchField =
      body.elements.namedItem("search") as HTMLInputElement;
    const $searchField = $(searchField);
    $searchField.on("input", this.onSearchInput.bind(this));

    const replaceField = this.replaceField =
      body.elements.namedItem("replace") as HTMLInputElement;
    const $replaceField = $(replaceField);
    $replaceField.on("input", this.onReplaceInput.bind(this));

    this.replaceButton =
      dialog[0].querySelector(".replace-and-find") as HTMLButtonElement;
    this.replaceAll =
      dialog[0].querySelector(".replace-all") as HTMLButtonElement;
    this.updateButtons();
  }

  /**
   * @returns The search option to pass to the search engine, given the user
   * choices.
   */
  private getSearchOptions(): SearchOptions {
    let direction: Direction;
    if (this.forwardRadioButton.checked) {
      direction = Direction.FORWARD;
    }
    else if (this.backwardRadioButton.checked) {
      direction = Direction.BACKWARDS;
    }
    else {
      throw new Error("cannot determine direction");
    }

    let context: Context;
    if (this.textRadioButton.checked) {
      context = Context.TEXT;
    }
    else if (this.attributeRadioButton.checked) {
      context = Context.ATTRIBUTE_VALUES;
    }
    else {
      throw new Error("cannot determine context");
    }

    return {
      direction,
      context,
    };
  }

  /**
   * Processes clicks on the "Find" button: searches the document and updates
   * the buttons.
   */
  private onFind(): boolean {
    this.next();
    this.updateButtons();
    return false;
  }

  /**
   * Updates the disabled status of the buttons depending on how the input
   * elements are set.
   */
  private updateButtons(): void {
    const fieldFilled = this.replaceField.value !== "";
    this.replaceButton.disabled = !(fieldFilled && this.search.canReplace);
    this.replaceAll.disabled = !fieldFilled;
  }

  /**
   * Processes clicks on the "Replace and Find" button: replaces the current hit
   * and find the next one.
   */
  private onReplaceAndFind(): boolean {
    this.replace();
    this.onFind();
    return false;
  }

  /**
   * Processes clicks on the "Replace All" button: replaces all replaceable
   * hits.
   */
  private onReplaceAll(): boolean {
    if (this.search.current === undefined) {
      this.onFind();
    }

    while (this.search.current !== null) {
      if (this.search.canReplace) {
        this.replace();
      }
      this.next();
    }

    this.updateButtons();
    return false;
  }

  /**
   * Replaces the current hit.
   */
  private replace(): void {
    this.search.replace(this.replaceField.value);
  }

  /**
   * Moves to the next hit in the direction specified by the user.
   */
  private next(): void {
    this.search.next(this.getSearchOptions());
  }

  /**
   * Processes an ``input`` event on the search field. May change the currently
   * highlighted hit.
   */
  private onSearchInput(): void {
    const value = this.searchField.value;
    if (value !== this.previousSearchValue) {
      this.previousSearchValue = value;

      this.search.updatePattern(value, this.getSearchOptions());
      this.updateButtons();
    }
  }

  /**
   * Processes an ``input`` event on the replace field. Updates the buttons.
   */
  private onReplaceInput(): void {
    this.updateButtons();
  }
}
