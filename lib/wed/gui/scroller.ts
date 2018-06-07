/**
 * Content scroller.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import $ from "jquery";
import { Observable, Subject } from "rxjs";

import { pointInContents } from "../domutil";

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
export class Scroller {
  private readonly _events: Subject<ScrollEvent> = new Subject();

  /** This is where you can listen to scrolling events. */
  readonly events: Observable<ScrollEvent> = this._events.asObservable();

  /**
   * @param el The DOM element responsible for scrolling.
   */
  constructor(private readonly el: HTMLElement) {
    $(el).on("scroll", () => {
      this._events.next({ scroller: this });
    });
  }

  get scrollTop(): number {
    return this.el.scrollTop;
  }

  get scrollLeft(): number {
    return this.el.scrollLeft;
  }

  getBoundingClientRect(): ClientRect {
    return this.el.getBoundingClientRect();
  }

  /**
   * Coerce this scroller to a specific height in pixels.
   *
   * @param height The height to which to coerce.
   */
  coerceHeight(height: number): void {
    this.el.style.height = `${height}px`;
  }

  /**
   * Determine whether a point is inside the DOM element managed by this
   * scroller.
   */
  isPointInside(x: number, y: number): boolean {
    return pointInContents(this.el, x, y);
  }

  /**
   * Scrolls the window and scroller so that the rectangle is visible to the
   * user. The rectangle coordinates must be relative to the scroller
   * element.
   *
   * This method tries to be the least disruptive it can: it will adjust the
   * scroller and the window *just enough* to show the rectangle.
   */
  scrollIntoView(left: number, top: number, right: number,
                 bottom: number): void {
    // Adjust gui_root.
    const el = this.el;
    let vtop = el.scrollTop;
    const vheight = el.clientHeight;
    const vbottom = vtop + vheight;

    if (top < vtop || bottom > vbottom) {
      // Not already in view.
      vtop = top < vtop ? top : bottom - vheight;
      el.scrollTop = vtop;
    }

    let vleft = el.scrollLeft;
    const vwidth = el.clientWidth;
    const vright = vleft + vwidth;

    if (left < vleft || right > vright) {
      // Not already in view.
      vleft = left < vleft ? left : right - vwidth;
      el.scrollLeft = vleft;
    }

    const pos = el.getBoundingClientRect();

    // Compute the coordinates relative to the client.
    left = left - vleft + pos.left;
    right = right - vleft + pos.left;
    top = top - vtop + pos.top;
    bottom = bottom - vtop + pos.top;

    const doc = el.ownerDocument;
    const sheight = doc.body.scrollHeight;
    const swidth = doc.body.scrollWidth;

    let byY = 0;
    if (top < 0 || bottom > sheight) {
      byY = top < 0 ? top : bottom;
    }

    let byX = 0;
    if (left < 0 || right > swidth) {
      byX = left < 0 ? left : right;
    }

    doc.defaultView.scrollBy(byX, byY);
  }
}

//  LocalWords:  scroller MPL px
