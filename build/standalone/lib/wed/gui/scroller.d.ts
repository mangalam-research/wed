/**
 * Content scroller.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Observable } from "rxjs";
/**
 * Event emitted when the scroller scrolls.
 */
export interface ScrollEvent {
    /** The scroller that generated this event. */
    scroller: Scroller;
}
/**
 * Content scroller. This object is responsible for scrolling the GUI tree.
 */
export declare class Scroller {
    private readonly el;
    private readonly _events;
    /** This is where you can listen to scrolling events. */
    readonly events: Observable<ScrollEvent>;
    /**
     * @param el The DOM element responsible for scrolling.
     */
    constructor(el: HTMLElement);
    readonly scrollTop: number;
    readonly scrollLeft: number;
    getBoundingClientRect(): ClientRect;
    /**
     * Coerce this scroller to a specific height in pixels.
     *
     * @param height The height to which to coerce.
     */
    coerceHeight(height: number): void;
    /**
     * Determine whether a point is inside the DOM element managed by this
     * scroller.
     */
    isPointInside(x: number, y: number): boolean;
    /**
     * Scrolls the window and scroller so that the rectangle is visible to the
     * user. The rectangle coordinates must be relative to the scroller
     * element.
     *
     * This method tries to be the least disruptive it can: it will adjust the
     * scoller and the window *just enough* to show the rectangle.
     */
    scrollIntoView(left: number, top: number, right: number, bottom: number): void;
}
