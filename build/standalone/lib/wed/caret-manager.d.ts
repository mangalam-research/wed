import * as rangy from "rangy";
import { Observable } from "rxjs";
import { CaretMark } from "./caret-mark";
import * as caretMovement from "./caret-movement";
import { DLoc, DLocRange, DLocRoot } from "./dloc";
import { RangeInfo } from "./domutil";
import { GUIUpdater } from "./gui-updater";
import { Layer } from "./gui/layer";
import { Scroller } from "./gui/scroller";
import { ModeTree } from "./mode-tree";
import { GUIToDataConverter, WedSelection } from "./wed-selection";
/** Options affecting how a caret gets set. */
export interface SetCaretOptions {
    /**
     * When ``true`` indicates that the caret movement is due to a text editing
     * operation. This matters for managing undo steps. Text edits are gathered
     * into an single text undo step unless they are interrupted by some other
     * operation (or reach a maximum size). Caret movements also interrupt the
     * text undo steps, unless this flag is ``true``. The default is ``false``.
     */
    textEdit?: boolean;
    /**
     * Indicates whether the caret change should set the focus. The default is
     * ``true``.
     */
    focus?: boolean;
}
/** These are options that wed passes to itself. */
export interface CaretChangeOptions extends SetCaretOptions {
    /** Indicates whether the caret is being changed due to a gain in focus. */
    gainingFocus?: boolean;
}
/**
 * An event generated when the caret changes.
 */
export interface CaretChange {
    /** The manager from which the event originates. */
    manager: CaretManager;
    /** The new caret. */
    caret: DLoc | undefined;
    /** The previous caret value before the change. */
    prevCaret: DLoc | undefined;
    /** The change options. */
    options: CaretChangeOptions;
}
/**
 * A caret manager maintains and modifies caret and selection positions. It also
 * manages associated GUI elements like the input field. It is also responsible
 * for converting positions in the GUI tree to positions in the data tree and
 * vice-versa.
 *
 * Given wed's notion of parallel data and GUI trees. A caret can either point
 * into the GUI tree or into the data tree. In the following documentation, if
 * the caret is not qualified, then it is a GUI caret.
 *
 * Similarly, a selection can either span a range in the GUI tree or in the data
 * tree. Again, "selection" without qualifier is a GUI selection.
 */
export declare class CaretManager implements GUIToDataConverter {
    private readonly guiRoot;
    private readonly dataRoot;
    private readonly inputField;
    private readonly guiUpdater;
    private readonly layer;
    private readonly scroller;
    private readonly modeTree;
    private _sel;
    private selAtBlur;
    private readonly guiRootEl;
    private readonly dataRootEl;
    private readonly $inputField;
    private readonly doc;
    private readonly win;
    private readonly selectionStack;
    private prevCaret;
    private readonly _events;
    /** This is where you can listen to caret change events. */
    readonly events: Observable<CaretChange>;
    /** The caret mark that represents the caret managed by this manager. */
    readonly mark: CaretMark;
    /**
     * @param guiRoot The object representing the root of the gui tree.
     *
     * @param dataRoot The object representing the root of the data tree.
     *
     * @param inputField The HTML element that is the input field.
     *
     * @param guiUpdater The GUI updater that is responsible for updating the
     * tree whose root is ``guiRoot``.
     *
     * @param layer The layer that holds the caret.
     *
     * @param scroller The element that scrolls ``guiRoot``.
     *
     * @param modeTree The mode tree from which to get modes.
     */
    constructor(guiRoot: DLocRoot, dataRoot: DLocRoot, inputField: HTMLElement, guiUpdater: GUIUpdater, layer: Layer, scroller: Scroller, modeTree: ModeTree);
    /**
     * The raw caret. Use [[getNormalizedCaret]] if you need it normalized.
     *
     * This is synonymous with the focus of the current selection. (`foo.caret ===
     * foo.focus === foo.sel.focus`).
     */
    readonly caret: DLoc | undefined;
    /**
     * The current selection.
     */
    readonly sel: WedSelection | undefined;
    /**
     * The focus of the current selection.
     */
    readonly focus: DLoc | undefined;
    /**
     * The anchor of the current selection.
     */
    readonly anchor: DLoc | undefined;
    /**
     * The range formed by the current selection.
     */
    readonly range: rangy.RangyRange | undefined;
    /**
     * A range info object describing the current selection.
     */
    readonly rangeInfo: RangeInfo | undefined;
    readonly minCaret: DLoc;
    readonly maxCaret: DLoc;
    readonly docDLocRange: DLocRange;
    /**
     * Get a normalized caret.
     *
     * @returns A normalized caret, or ``undefined`` if there is no caret.
     */
    getNormalizedCaret(): DLoc | undefined;
    /**
     * Same as [[getNormalizedCaret]] but must return a location.
     *
     * @throws {Error} If it cannot return a location.
     */
    mustGetNormalizedCaret(): DLoc;
    normalizeToEditableRange(loc: DLoc): DLoc;
    /**
     * Get the current caret position in the data tree.
     *
     * @param approximate Some GUI locations do not correspond to data
     * locations. Like if the location is in a gui element or phantom text. By
     * default, this method will return undefined in such case. If this parameter
     * is true, then this method will return the closest position.
     *
     * @returns A caret position in the data tree, or ``undefined`` if no such
     * position exists.
     */
    getDataCaret(approximate?: boolean): DLoc | undefined;
    /**
     * Convert a caret location in the data tree into one in the GUI tree.
     *
     * @param loc A location in the data tree.
     *
     * @param node A node in the data tree, if ``loc`` is not used.
     *
     * @param offset An offset into ``node`` if ``loc`` is not used.
     *
     * @returns A location in the GUI tree, or ``undefined`` if no such location
     * exists.
     */
    fromDataLocation(loc: DLoc): DLoc | undefined;
    fromDataLocation(node: Node, offset: number): DLoc | undefined;
    /**
     * Does the same thing as [[fromDataLocation]] but must return a defined
     * location.
     *
     * @throws {Error} If it cannot return a location.
     */
    mustFromDataLocation(loc: DLoc): DLoc;
    mustFromDataLocation(node: Node, offset: number): DLoc;
    /**
     * Converts a gui location to a data location.
     *
     * @param loc A location in the GUI tree.
     *
     * @param node A node which, with the next parameter, represents a position.
     *
     * @param offset The offset in the node in the first parameter.
     *
     * @param approximate Some GUI locations do not correspond to data
     * locations. Like if the location is in a gui element or phantom text. By
     * default, this method will return undefined in such case. If this parameter
     * is true, then this method will return the closest position.
     *
     * @returns The data location that corresponds to the location passed. This
     * could be ``undefined`` if the location does not correspond to a location in
     * the data tree.
     */
    toDataLocation(loc: DLoc, approximate?: boolean): DLoc | undefined;
    toDataLocation(node: Node, offset: number, approximate?: boolean): DLoc | undefined;
    /**
     * Modify the passed position so that it if appears inside of a placeholder
     * node, the resulting position is moved out of it.
     *
     * @param loc The location to normalize.
     *
     * @returns The normalized position. If ``undefined`` or ``null`` was passed,
     * then the return value is the same as what was passed.
     */
    private _normalizeCaret(loc);
    /**
     * Make a caret from a node and offset pair.
     *
     * @param node The node from which to make the caret. The node may be in the
     * GUI tree or the data tree. If ``offset`` is omitted, the resulting location
     * will point to this node (rather than point to some offset *inside* the
     * node.)
     *
     * @param offset The offset into the node.
     *
     * @param normalize Whether to normalize the location. (Note that this is
     * normalization in the [[DLoc]] sense of the term.)
     *
     * @returns A new caret. This will be ``undefined`` if the value passed for
     * ``node`` was undefined or if the node is not in the GUI or data trees.
     */
    makeCaret(node: Node | null | undefined, offset?: number, normalize?: boolean): DLoc | undefined;
    /**
     * Set the range to a new value.
     *
     * @param anchor The range's anchor.
     *
     * @param anchorNode The anchor's node.
     *
     * @param anchorOffset The anchor's offset.
     *
     * @param focus The range's focus.
     *
     * @param focusNode The focus' node.
     *
     * @param focusOffset The focus's offset.
     */
    setRange(anchorNode: Node, anchorOffset: number, focusNode: Node, focusOffset: number): void;
    setRange(anchor: DLoc, focus: DLoc): void;
    /**
     * Compute a position derived from an arbitrary position. Note that
     * this method is meant to be used for positions in the GUI tree. Computing
     * positions in the data tree requires no special algorithm.
     *
     * This method does not allow movement outside of the GUI tree.
     *
     * @param pos The starting position in the GUI tree.
     *
     * @param direction The direction in which to move.
     *
     * @return The position to the right of the starting position. Or
     * ``undefined`` if the starting position was undefined or if there is no
     * valid position to compute.
     */
    newPosition(pos: DLoc | undefined, direction: caretMovement.Direction): DLoc | undefined;
    /**
     * Compute the position of the current caret if it were moved according to
     * some direction.
     *
     * @param direction The direction in which the caret would be moved.
     *
     * @return The position to the right of the caret position. Or ``undefined``
     * if there is no valid position to compute.
     */
    newCaretPosition(direction: caretMovement.Direction): DLoc | undefined;
    /**
     * Move the caret in a specific direction. The caret may not move if it is
     * not possible to move in the specified direction.
     *
     * @param direction The direction in which to move.
     */
    move(direction: caretMovement.Direction, extend?: boolean): void;
    /**
     * Set the caret to a new position.
     *
     * @param loc The new position for the caret.
     *
     * @param node The new position for the caret. This may be ``undefined`` or
     * ``null``, in which case the method does not do anything.
     *
     * @param offset The offset in ``node``.
     *
     * @param options The options for moving the caret.
     */
    setCaret(loc: DLoc, options?: SetCaretOptions): void;
    setCaret(node: Node | null | undefined, offset?: number, options?: SetCaretOptions): void;
    /**
     * Set the caret into a normalized label position. There are only some
     * locations in which it is valid to put the caret inside a label:
     *
     * - The element name.
     *
     * - Inside attribute values.
     *
     * This method is used by DOM event handlers (usually mouse events handlers)
     * to normalize the location of the caret to one of the valid locations listed
     * above.
     *
     * @param target The target of the DOM event that requires moving the caret.
     *
     * @param label The label element that contains ``target``.
     *
     * @param location The location of the event, which is what is normalized by
     * this method.
     */
    setCaretToLabelPosition(target: Node, label: Element, location: DLoc): void;
    /**
     * Save the current selection (and caret) on an internal selection stack.
     */
    pushSelection(): void;
    /**
     * Pop the last selection that was pushed with ``pushSelection`` and restore
     * the current caret and selection on the basis of the popped value.
     */
    popSelection(): void;
    /**
     * Pop the last selection that was pushed with ``pushSelection`` but do not
     * restore the current caret and selection from the popped value.
     */
    popSelectionAndDiscard(): void;
    /**
     * Restores the caret and selection from the current selection. This is used
     * to deal with situations in which the caret and range may have been
     * "damaged" due to browser operations, changes of state, etc.
     *
     * @param gainingFocus Whether the restoration of the caret and selection is
     * due to regaining focus or not.
     */
    private _restoreCaretAndSelection(gainingFocus);
    /**
     * Clear the selection and caret.
     */
    clearSelection(): void;
    /**
     * Get the current selection from the DOM tree.
     */
    private _getDOMSelectionRange();
    /**
     * This function is meant to be used internally to manipulate the DOM
     * selection directly.
     */
    private _setDOMSelectionRange(range, reverse);
    /**
     * Sets the caret position in the GUI tree.
     *
     * @param loc The new position.
     *
     * @param options Set of options governing the caret movement.
     */
    private _setGUICaret(loc, options);
    /**
     * Emit a caret change event.
     */
    private _caretChange(options?);
    private _clearDOMSelection(dontFocus?);
    private _getDOMSelection();
    /**
     * Focus the field use for input events.  It is used by wed on some occasions
     * where it is needed. Mode authors should never need to call this. If they do
     * find that calling this helps solve a problem they ran into, they probably
     * should file an issue report.
     */
    focusInputField(): void;
    /**
     * This is called when the editing area is blurred. This is not something you
     * should be calling in a mode's implementation. It is public because other
     * parts of wed need to call it.
     */
    onBlur(): void;
    private onFocus();
    highlightRange(range: DLocRange): Element;
    /**
     * Dump to the console caret-specific information.
     */
    dumpCaretInfo(): void;
}
