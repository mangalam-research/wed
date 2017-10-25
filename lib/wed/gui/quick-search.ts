/**
 * Quick search GUI.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Editor } from "../editor";
import { QUICKSEARCH_BACKWARDS, QUICKSEARCH_FORWARD } from "../key-constants";
import { ChangeEvent } from "./minibuffer";
import { Scroller } from "./scroller";
import { Context, Direction, SearchOptions,
         SearchReplace } from "./search-replace";

export { Direction };

/**
 * A quick search interface. The quick search sets the minibuffer to prompt the
 * user for a term and searches through the document in the specified search
 * direction. See the section on "Quick Search" in the editor's embedded help
 * for details of how it works for the user.
 */
export class QuickSearch {
  private readonly search: SearchReplace;

  /**
   * @param editor The editor for which we are searching.
   *
   * @param scroller The scroller that contains the document.
   *
   * @param direction The direction of the search.
   */
  constructor(private readonly editor: Editor, scroller: Scroller,
              private direction: Direction) {
    this.search = new SearchReplace(editor, scroller);
    editor.minibuffer.installClient(this);
    this.updatePrompt();
  }

  /** Update the prompt shown to the user to indicate a new direction. */
  private updatePrompt(): void {
    this.editor.minibuffer.prompt = {
      [Direction.FORWARD]: "Search forward:",
      [Direction.BACKWARDS]: "Search backwards:",
    }[this.direction];
  }

  /**
   * The minibuffer calls this function so that the quick search can handle
   * keydown events.
   *
   * @returns ``false`` if the key was handled, ``undefined`` otherwise.
   */
  onMinibufferKeydown(ev: JQueryKeyEventObject): boolean | undefined {
    if (QUICKSEARCH_FORWARD.matchesEvent(ev)) {
      this.direction = Direction.FORWARD;
      this.next();
      return false;
    }
    else if (QUICKSEARCH_BACKWARDS.matchesEvent(ev)) {
      this.direction = Direction.BACKWARDS;
      this.next();
      return false;
    }

    return undefined;
  }

  /**
   * Get the current search options to pass to the underlying search engine.
   */
  private getSearchOptions(): SearchOptions {
    return {
      direction: this.direction,
      context: Context.TEXT,
    };
  }

  /**
   * Move to the next hit in the direction specified by the user.
   */
  private next(): void {
    this.updatePrompt();
    this.search.next(this.getSearchOptions());
  }

  /**
   * Called by the minibuffer whenever the text in the minibuffer input changes.
   */
  onMinibufferChange(ev: ChangeEvent): void {
    this.search.updatePattern(ev.value, this.getSearchOptions());
  }

  /**
   * Called by the minibuffer when the user exits the minibuffer.
   */
  onUninstall(): void {
    this.search.clearHighlight();
    this.search.setCaretToMatch();
  }
}
