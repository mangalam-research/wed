/**
 * Search and replace engine common to quick search and more complex searches.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "../caret-manager";
import { DLoc, DLocRange } from "../dloc";
import { isWellFormedRange} from "../domutil";
import { Editor, ReplaceRangeTransformationData } from "../editor";
import { Context, Direction, Search } from "../search";
import { Scroller } from "./scroller";

export { Context, Direction };

/**
 * The options directing new searches.
 */
export interface SearchOptions {
  /** The direction in which to search. */
  direction: Direction;

  /** The context of the search. */
  context: Context;
}

enum Edge {
  START,
  END,
}

/**
 * A search-and-replace engine for editor instances. This implements the code
 * that is common to quick searches and more complex searches. This object is
 * responsible for maintaining a search position in the document, and replacing
 * hits as required.
 */
export class SearchReplace {
  private search: Search;
  private readonly caretManager: CaretManager;
  private highlight: Element | undefined;
  private lastMatch: DLocRange | null = null;

  /**
   * @param editor The editor for which we are searching.
   *
   * @param scroller The scroller holding the document.
   */
  constructor(private readonly editor: Editor,
              private readonly scroller: Scroller) {
    this.caretManager = this.editor.caretManager;
    const sel = this.caretManager.sel;
    const scope = (sel !== undefined && !sel.collapsed) ?
      new DLocRange(sel.anchor, sel.focus) : undefined;

    // If we have a scope, then we had a selection and we want to use the
    // selection's anchor, which is scope.start at this point.
    const start = scope !== undefined ? scope.start : this.caretManager.caret;
    if (start === undefined) {
      throw new Error("search without a caret!");
    }
    this.search = new Search(this.caretManager, editor.guiRoot, start, scope);
  }

  /**
   * The current match. This is ``undefined`` if we have not searched yet.  It
   * is ``null`` if nothing matches.
   */
  get current(): DLocRange | undefined | null {
    return this.search.current;
  }

  /**
   * Whether we can replace the current hit. If there is no hit, then this is
   * ``false``. If the hit is somehow collapsed, this is also
   * ``false``. Otherwise, the hit must be a well-formed range.
   */
  get canReplace(): boolean {
    const current = this.search.current;
    if (current == null) {
      return false;
    }

    if (current.collapsed) {
      return false;
    }

    return isWellFormedRange(current.mustMakeDOMRange());
  }

  /**
   * Update the pattern to a new value. Calling this method attempts to update
   * the current hit first, and may move in the direction of the search if
   * updating the current hit is not possible. This updates [[current]].
   *
   * @param value The new pattern value.
   *
   * @param options The search options.
   */
  updatePattern(value: string, options: SearchOptions): void {
    this.search.pattern = value;
    this.search.direction = options.direction;
    this.search.context = options.context;
    this.search.updateCurrent();
    this.updateHighlight();
  }

  /**
   * Find the next hit in the direction of the search. This updates [[current]].
   *
   * @param options The search options.
   */
  next(options: SearchOptions): void {
    this.search.direction = options.direction;
    this.search.context = options.context;
    this.search.next();
    this.updateHighlight();
  }

  /**
   * Update the highlight marking the current hit.
   */
  private updateHighlight(): void {
    this.clearHighlight();
    const match = this.current;
    if (match != null) {
      this.lastMatch = match;
      this.setCaretToMatch();
      const range = match.start.mustMakeDLocRange(match.end);
      const domRange = range.mustMakeDOMRange();
      this.highlight = this.caretManager.highlightRange(range);
      const scRect = this.scroller.getBoundingClientRect();
      const rect = domRange.getBoundingClientRect();
      const leftOffset = this.scroller.scrollLeft - scRect.left;
      const topOffset = this.scroller.scrollTop - scRect.top;

      this.scroller.scrollIntoView(rect.left + leftOffset,
                                   rect.top + topOffset,
                                   rect.right + leftOffset,
                                   rect.bottom + topOffset);
    }
  }

  /**
   * Clear the highlight that this object produced to mark a hit.
   */
  clearHighlight(): void {
    if (this.highlight !== undefined) {
      this.highlight.parentNode!.removeChild(this.highlight);
      this.highlight = undefined;
    }
  }

  /**
   * Set the caret position to the latest hit we ran into.
   */
  setCaretToMatch(): void {
    if (this.lastMatch !== null) {
      const loc = this.getDirectionalEnd(this.lastMatch);
      this.caretManager.setCaret(loc, { focus: false });
    }
  }

  private getDirectionalEnd(range: DLocRange): DLoc {
    return this.getDirectionalEdge(range, Edge.END);
  }

  private getDirectionalStart(range: DLocRange): DLoc {
    return this.getDirectionalEdge(range, Edge.START);
  }

  private getDirectionalEdge(range: DLocRange, edge: Edge): DLoc {
    let field: "start" | "end";
    const direction = this.search.direction;
    const start = edge === Edge.START;
    switch (direction) {
    case Direction.FORWARD:
      field = start ? "start" : "end";
      break;
    case Direction.BACKWARDS:
      field = start ? "end" : "start";
      break;
    default:
      const d: never = direction;
      throw new Error(`unknown direction: ${d}`);
    }

    return range[field];
  }

  /**
   * Replace the current hit with text.
   *
   * @param value The new text.
   *
   * @throw {Error} When called if [[canReplace]] is false.
   */
  replace(value: string): void {
    if (!this.canReplace) {
      throw new Error("tried to replace when it is not possible");
    }

    const current = this.current;

    // With the !this.canReplace test above, it is not currently possible to
    // hit this condition.
    if (current == null) {
      throw new Error("no current match");
    }

    const caret = this.getDirectionalStart(current);
    this.caretManager.setCaret(caret, { focus: false });
    // tslint:disable-next-line:no-object-literal-type-assertion
    this.editor.fireTransformation(this.editor.replaceRangeTr, {
      range: current,
      newText: value,
      caretAtEnd: false,
    } as ReplaceRangeTransformationData);
    this.clearHighlight();
    const caretAfter = this.caretManager.caret;
    if (caretAfter === undefined) {
      throw new Error("no caret after replacement!");
    }

    // We must update the current match because the old range is no longe valid.
    this.search.current = caretAfter.mustMakeDLocRange();
  }
}
