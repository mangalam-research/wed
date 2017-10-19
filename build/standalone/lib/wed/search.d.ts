import { CaretManager } from "./caret-manager";
import { DLoc, DLocRange } from "./dloc";
/** The direction of searches. */
export declare enum Direction {
    FORWARD = 0,
    BACKWARDS = 1,
}
/** The context for searches. */
export declare enum Context {
    /** Everywhere in a document, including non-editable graphical elements. */
    EVERYWHERE = 0,
    /** Only element text. */
    TEXT = 1,
    /** Only attribute values. */
    ATTRIBUTE_VALUES = 2,
}
/**
 * This models a search on the GUI tree. Performing searches directly on the
 * data tree is theoretically possible but fraught with problems. For instance,
 * some data may not be visible to users and so the search in the data tree
 * would have to constantly refer to the GUI tree to determine whether a hit
 * should be shown. Additionally, the order of the data shown in the GUI tree
 * may differ from the order in the data tree.
 */
export declare class Search {
    readonly caretManager: CaretManager;
    readonly guiRoot: Document | Element;
    private start;
    private readonly root;
    private _pattern;
    private _scope;
    private prevEnd;
    /**
     * The current match. This is ``undefined`` if we have not searched yet.  It
     * is ``null`` if nothing matches.
     */
    current: DLocRange | null | undefined;
    /** The direction in which the search moves. */
    direction: Direction;
    /** The context for the search. */
    context: Context;
    constructor(caretManager: CaretManager, guiRoot: Document | Element, start: DLoc, scope: DLocRange | undefined);
    pattern: string;
    /**
     * Set the search scope. No result will be returned outside the scope. Setting
     * the scope to ``undefined`` means "search the whole document".
     */
    private setScope(range);
    private readonly scope;
    updateCurrent(): void;
    next(): void;
    private _next(includeCurrent);
    private find(start, direction);
    private findText(start, direction);
    private findAttributeValue(start, direction);
    private getForwardSearchStart(includeCurrent);
    private getBackwardSearchStart(includeCurrent);
}
