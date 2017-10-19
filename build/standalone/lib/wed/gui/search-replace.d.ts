import { DLocRange } from "../dloc";
import { Context, Direction } from "../search";
import { Editor } from "../wed";
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
/**
 * A search-and-replace engine for editor instances. This implements the code
 * that is common to quick searches and more complex searches. This object is
 * responsible for maintaining a search position in the document, and replacing
 * hits as required.
 */
export declare class SearchReplace {
    private readonly editor;
    private readonly scroller;
    private search;
    private readonly caretManager;
    private highlight;
    private lastMatch;
    /**
     * @param editor The editor for which we are searching.
     *
     * @param scroller The scroller holding the document.
     */
    constructor(editor: Editor, scroller: Scroller);
    /**
     * The current match. This is ``undefined`` if we have not searched yet.  It
     * is ``null`` if nothing matches.
     */
    readonly current: DLocRange | undefined | null;
    /**
     * Whether we can replace the current hit. If there is no hit, then this is
     * ``false``. If the hit is somehow collapsed, this is also
     * ``false``. Otherwise, the hit must be a well-formed range.
     */
    readonly canReplace: boolean;
    /**
     * Update the pattern to a new value. Calling this method attempts to update
     * the current hit first, and may move in the direction of the search if
     * updating the current hit is not possible. This updates [[current]].
     *
     * @param value The new pattern value.
     *
     * @param options The search options.
     */
    updatePattern(value: string, options: SearchOptions): void;
    /**
     * Find the next hit in the direction of the search. This updates [[current]].
     *
     * @param options The search options.
     */
    next(options: SearchOptions): void;
    /**
     * Update the highlight marking the current hit.
     */
    private updateHighlight();
    /**
     * Clear the highlight that this object produced to mark a hit.
     */
    clearHighlight(): void;
    /**
     * Set the caret position to the latest hit we ran into.
     */
    setCaretToMatch(): void;
    private getDirectionalEnd(range);
    private getDirectionalStart(range);
    private getDirectionalEdge(range, edge);
    /**
     * Replace the current hit with text.
     *
     * @param value The new text.
     *
     * @throw {Error} When called if [[canReplace]] is false.
     */
    replace(value: string): void;
}
