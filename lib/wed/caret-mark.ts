/**
 * This module implements the "caret mark". The "caret mark" is the graphical
 * indicator showing the position of the caret.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as $ from "jquery";

import { CaretManager } from "./caret-manager";
import { DLoc } from "./dloc";
import * as domutil from "./domutil";

export interface Editor {
  getGUICaret(raw: boolean): DLoc;
  caretManager: CaretManager;
  _setDOMSelectionRange(range: Range, reversed: boolean): void;
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
              private readonly caretLayer: HTMLElement,
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

    const caret = this.editor.getGUICaret(true);
    if (caret == null) {
      return;
    }

    const { node, offset } =  caret;

    let parent;
    let prev;
    let next;
    switch (node.nodeType) {
    case Node.TEXT_NODE:
      parent = node.parentNode;
      prev = node.previousSibling;
      next = node.nextSibling;
      domutil.insertIntoText(node as Text, offset, this.dummy);
      break;
    case Node.ELEMENT_NODE:
      const child = node.childNodes[offset];
      node.insertBefore(this.dummy, child !== undefined ? child : null);
      break;
    default:
      throw new Error(`unexpected node type: ${node.nodeType}`);
    }

    let position: { top: number, left: number } =
      this.dummy.getBoundingClientRect();

    //
    // The position is relative to the *screen*. We need to make it relative to
    // the start of scroller.
    //
    const grPosition = this.scroller.getBoundingClientRect();
    position = {
      top: position.top - grPosition.top,
      left: position.left - grPosition.left,
    };

    const height = this.$dummy.height();

    if (node.nodeType === Node.TEXT_NODE) {
      // node was deleted from the DOM tree by the insertIntoText operation, we
      // need to bring it back.

      // We delete everything after what was prev to the original node, and
      // before what was next to it.
      let deleteThis = prev != null ? prev.nextSibling : parent!.firstChild;
      while (deleteThis !== next) {
        if (deleteThis !== null) {
          parent!.removeChild(deleteThis);
        }
        deleteThis = prev != null ? prev.nextSibling : parent!.firstChild;
      }
      parent!.insertBefore(node, next != null ? next : null);
    }
    else {
      this.dummy.parentNode!.removeChild(this.dummy);
    }

    // We may need to restore the selection. We cannot use push/popSelection
    // here because they would call ``refresh`` and we'd end up in an infinite
    // recursion.
    const rr = this.editor.caretManager.rangeInfo;
    if (rr !== undefined) {
      // Restore the range but we *must not* restore the range if it is
      // collapsed because this will cause a problem with scrolling. (The pane
      // will jump up and down while scrolling.)
      if (!rr.range.collapsed) {
        this.editor.caretManager._setDOMSelectionRange(rr.range, rr.reversed);
      }
    }

    const el = this.el;
    const topStr = `${position.top}px`;
    const leftStr = `${position.left}px`;
    const heightStr = `${height}px`;
    el.style.top = topStr;
    el.style.left = leftStr;
    el.style.height = heightStr;
    el.style.maxHeight = heightStr;
    el.style.minHeight = heightStr;

    // The fake caret is removed from the DOM when not in use, reinsert it.
    if (el.parentNode === null) {
      this.caretLayer.appendChild(this.el);
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
