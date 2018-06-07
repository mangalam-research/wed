/**
 * This module implements the "caret mark". The "caret mark" is the graphical
 * indicator showing the position of the caret.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "./caret-manager";
import { Layer } from "./gui/layer";
import { Scroller } from "./gui/scroller";
/**
 * The "caret mark" is the graphical indicator
 * showing the position of the caret.
 */
export declare class CaretMark {
    private readonly manager;
    private readonly layer;
    private readonly inputField;
    private readonly scroller;
    /**
     * This is the element that represents the caret in the DOM tree.
     */
    private readonly el;
    /**
     * This is an element used to calculate the position of the caret on the
     * screen. It is temporarily inserted in the DOM to perform the position
     * calculations.
     */
    private readonly dummy;
    private suspended;
    private pendingRefresh;
    /**
     * The [[refresh]] method, already bound to this object.
     */
    readonly boundRefresh: () => void;
    /**
     * @param manager The caret manager that holds this marker.
     *
     * @param doc The document in which the caret is located.
     *
     * @param layer The layer that holds the caret.
     *
     * @param inputField The input field element that ought to be moved with the
     * caret.
     *
     * @param scroller The scroller element that contains the editor document for
     * which we are managing a caret.
     */
    constructor(manager: CaretManager, doc: Document, layer: Layer, inputField: HTMLElement, scroller: Scroller);
    /**
     * Suspend refreshing the caret. Calling this function multiple times
     * increases the suspension count. [[resume]] must be called an equal number
     * of times before refreshes are resumed.
     */
    suspend(): void;
    /**
     * Resume refreshing the caret. This must be called the same number of times
     * [[suspend]] was called before refreshing is actually resumed.
     *
     * This function checks whether anything called [[refresh]] while refreshing
     * was suspended, and if so will call [[refresh]] as soon as refreshing is
     * resumed.
     */
    resume(): void;
    /**
     * Refreshes the caret position on screen. If refreshing has been suspended,
     * it records that a refresh was requested but does not actually refresh the
     * caret.
     */
    refresh(): void;
    /**
     * @returns The coordinates of the caret marker relative to the scroller.
     */
    private getPositionFromScroller();
    /**
     * @returns True if the caret is in the DOM tree, false otherwise.
     */
    readonly inDOM: boolean;
    /**
     * Scroll the mark into view.
     */
    scrollIntoView(): void;
    /**
     * @returns The bounding client rectangle of the DOM element associated with
     * this marker.
     */
    getBoundingClientRect(): ClientRect;
}
