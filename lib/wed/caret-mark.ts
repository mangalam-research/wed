/**
 * This module implements the "caret mark". The "caret mark" is the graphical
 * indicator showing the position of the caret.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as $ from "jquery";

import { CaretManager } from "./caret-manager";
import { isElement } from "./domtypeguards";
import { Layer } from "./gui/layer";
import { boundaryXY } from "./wed-util";

export interface Editor {
  caretManager: CaretManager;
}

/**
 * The "caret mark" is the graphical indicator
 * showing the position of the caret.
 */
export class CaretMark {
  /**
   * This is the element that represents the caret in the DOM tree.
   */
  private readonly el: HTMLElement;

  /**
   * This is an element used to calculate the position of the caret on the
   * screen. It is temporarily inserted in the the DOM to perform the position
   * calculations.
   */
  private readonly dummy: HTMLElement;
  private readonly $dummy: JQuery;

  private suspended: number = 0;
  private pendingRefresh: boolean = false;

  /**
   * The [[refresh]] method, already bound to this object.
   */
  readonly boundRefresh: () => void;

  /**
   * @param editor The editor for which this mark is created.
   *
   * @param doc The document that contains the caret.
   *
   * @param inputField The input field element that ought to be moved with the
   * caret.
   *
   * @param scroller The scroller element that contains the editor document for
   * which we are managing a caret.
   */
  constructor(private readonly editor: Editor,
              doc: Document,
              private readonly caretLayer: Layer,
              private readonly inputField: HTMLElement,
              private readonly scroller: HTMLElement) {
    const el = this.el = doc.createElement("span");
    el.className = "_wed_caret";
    el.setAttribute("contenteditable", "false");
    el.textContent = " ";

    const dummy = this.dummy = doc.createElement("span");
    dummy.textContent = "\u00A0";
    dummy.style.height = "100%";
    dummy.style.width = "1px";
    dummy.style.maxWidth = "1px";
    this.$dummy = $(dummy);

    this.boundRefresh = this.refresh.bind(this);
  }

  /**
   * Suspend refreshing the caret. Calling this function multiple times
   * increases the suspension count. [[resume]] must be called an equal number
   * of times before refreshes are resumed.
   */
  suspend(): void {
    this.suspended++;
  }

  /**
   * Resume refreshing the caret. This must be called the same number of times
   * [[suspend]] was called before refreshing is actually resumed.
   *
   * This function checks whether anything called [[refresh]] while refreshing
   * was suspended, and if so will call [[refresh]] as soon as refreshing is
   * resumed.
   */
  resume(): void {
    this.suspended--;
    if (this.suspended < 0) {
      throw new Error("too many calls to resume");
    }
    if (this.pendingRefresh) {
      this.refresh();
      this.pendingRefresh = false;
    }
  }

  /**
   * Refreshes the caret position on screen. If refreshing has been suspended,
   * it records that a refresh was requested but does not actually refresh the
   * caret.
   */
  refresh(): void {
    if (this.suspended > 0) {
      this.pendingRefresh = true;
      return;
    }

    const caret = this.editor.caretManager.caret;
    if (caret == null) {
      return;
    }

    const boundary = boundaryXY(caret);
    const grPosition = this.scroller.getBoundingClientRect();
    const position = {
      top: boundary.top - grPosition.top,
      left: boundary.left - grPosition.left,
    };

    const node = caret.node;
    const heightNode = isElement(node) ? node : (node.parentNode as Element);
    const height = getComputedStyle(heightNode).lineHeight;

    const el = this.el;
    const topStr = `${position.top}px`;
    const leftStr = `${position.left}px`;
    el.style.top = topStr;
    el.style.left = leftStr;
    el.style.height = height;
    el.style.maxHeight = height;
    el.style.minHeight = height;

    // The fake caret is removed from the DOM when not in use, reinsert it.
    if (el.parentNode === null) {
      this.caretLayer.append(this.el);
    }

    const inputField = this.inputField;
    if (Number(inputField.style.zIndex) > 0) {
      inputField.style.top = topStr;
      inputField.style.left = leftStr;
    }
    else {
      inputField.style.top = "";
      inputField.style.left = "";
    }
  }

  /**
   * @returns The coordinates of the caret marker relative to the GUI root.
   */
  getPositionFromGUIRoot(): { left: number, top: number } {
    // This function may be called when the caret layer is invisible. So we
    // can't rely on offset. Fortunately, the CSS values are what we want, so...
    const el = this.el;

    // Given our usage scenario, left and top cannot be null.
    const pos = {
      left: Number(el.style.left!.replace("px", "")),
      top: Number(el.style.top!.replace("px", "")),
    };

    if (isNaN(pos.left) || isNaN(pos.top)) {
      throw new Error("NAN for left or top");
    }

    // We don't need to subtract the offset of gui_root from these coordinates
    // since they are relative to the gui_root object to start with.
    pos.left += this.scroller.scrollLeft;
    pos.top += this.scroller.scrollTop;

    return pos;
  }

  /**
   * @returns True if the caret is in the DOM tree, false otherwise.
   */
  get inDOM(): boolean {
    return this.el.parentNode !== null;
  }

  /**
   * @returns The bounding client rectangle of the DOM element associated with
   * this marker.
   */
  getBoundingClientRect(): ClientRect {
    return this.el.getBoundingClientRect();
  }
}
