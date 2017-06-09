/**
 * Caret management.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as $ from "jquery";
import * as rangy from "rangy";
import { Observable, Subject } from "rxjs";

import * as browsers from "./browsers";
import { CaretMark } from "./caret-mark";
import * as caretMovement from "./caret-movement";
import { DLoc, DLocRoot } from "./dloc";
import { isAttr, isElement, isText } from "./domtypeguards";
import { closestByClass, dumpRange, focusNode, getSelectionRange, indexOf,
         RangeInfo } from "./domutil";
import { GUIUpdater } from "./gui-updater";
import { Mode } from "./mode";
import * as objectCheck from "./object-check";
import { GUIToDataConverter, WedSelection } from "./wed-selection";
import { getAttrValueNode } from "./wed-util";

const caretOptionTemplate = {
  textEdit: false,
};

export interface SetCaretOptions {
  textEdit?: boolean;
}

export interface CaretChangeOptions extends SetCaretOptions {
  focus?: boolean;
}

export interface CaretChange {
  options: CaretChangeOptions;
}

/**
 * Find a previous sibling which is either a text node or a node with the class
 * ``_real``.
 *
 * @param node The element whose sibling we are looking for.
 *
 * @param cl The class to use for matches.
 *
 * @returns The first sibling (searing in reverse document order from ``node``)
 * that matches the class, or ``null`` if nothing matches.
 */
function previousTextOrReal(node: Node): Text | Element | null {
  if (!isElement(node)) {
    return null;
  }

  let child = node.previousSibling;
  while (child !== null &&
         !(isText(child) ||
          (isElement(child) && child.classList.contains("_real")))) {
    child = child.previousSibling;
  }
  return child;
}

/**
 * A caret manager maintains and modifies caret and selection positions. It also
 * manages associated GUI elements like the input field. It is also responsible
 * for converting positions in the GUI tree to positions in the data tree and
 * vice-versa.
 */
export class CaretManager implements GUIToDataConverter {
  private _sel: WedSelection | undefined;
  private selAtBlur: WedSelection | undefined;
  private readonly guiRootEl: Document | Element;
  private readonly dataRootEl: Document | Element;
  private readonly $inputField: JQuery;
  private readonly doc: Document;
  private readonly win: Window;
  private readonly selectionStack: (WedSelection | undefined)[] = [];
  private prevSelFocus: DLoc | undefined;

  private readonly _events: Subject<CaretChange>;
  public readonly events: Observable<CaretChange>;

  /**
   * @param guiRoot: The object representing the root of the gui tree.
   *
   * @param dataRoot: The object representing the root of the data tree.
   *
   * @param inputField: The HTML element that is the input field.
   *
   * @param guiUpdater: The GUI updater that is responsible for updating the
   * tree whose root is ``guiRoot``.
   *
   * @param caretMark: The mark to use to represent the caret on screen.
   *
   * @param inAttributes: Whether or not to move into attributes.
   *
   * @param mode: The current mode in effect.
   */
  constructor(private readonly guiRoot: DLocRoot,
              private readonly dataRoot: DLocRoot,
              private readonly inputField: HTMLElement,
              private readonly guiUpdater: GUIUpdater,
              private readonly caretMark: CaretMark,
              private readonly inAttributes: boolean,
              private readonly mode: Mode<{}>) {
    this.guiRootEl = guiRoot.node;
    this.dataRootEl = dataRoot.node;
    this.doc = this.guiRootEl.ownerDocument;
    this.win = this.doc.defaultView;
    this.$inputField = $(this.inputField);
    this._events = new Subject();
    this.events = this._events.asObservable();

    $(this.guiRootEl).on("focus", (ev) => {
      this.focusInputField();
      ev.preventDefault();
      ev.stopPropagation();
    });

    $(this.win).on("blur.wed", this.onBlur.bind(this));
    $(this.win).on("focus.wed", this.onFocus.bind(this));
  }

  get caret(): DLoc | undefined {
    if (this._sel === undefined) {
      return undefined;
    }

    return this._sel.focus;
  }

  set caret(caret: DLoc | undefined) {
    if (caret === undefined) {
      this._sel = undefined;
      return;
    }

    if (caret.root === this.guiRootEl) {
      this._sel = new WedSelection(this, caret);
    }
    else {
      const guiCaret = this.fromDataLocation(caret);

      if (guiCaret === undefined) {
        throw new Error("data caret has no GUI location");
      }

      this._sel = new WedSelection(this, guiCaret);
    }
  }

  get sel(): WedSelection | undefined {
    return this._sel;
  }

  get range(): rangy.RangyRange | undefined {
    const info = this.rangeInfo;
    return info !== undefined ? info.range : undefined;
  }

  get rangeInfo(): RangeInfo | undefined {
    const sel = this._sel;

    if (sel === undefined) {
      return undefined;
    }

    return sel.rangeInfo;
  }

  get focus(): DLoc | undefined {
    return this.caret;
  }

  get anchor(): DLoc | undefined {
    if (this._sel === undefined) {
      return undefined;
    }

    return this._sel.anchor;
  }

  getGUICaret(raw: boolean = false): DLoc | undefined {
    let caret = this.caret;
    if (caret === undefined) {
      return undefined;
    }

    if (raw) {
      return caret;
    }

    // The node is not in the root. This could be due to a stale location.
    if (!this.guiRootEl.contains(caret.node)) {
      return undefined;
    }

    if (!caret.isValid()) {
      const newSel =  new WedSelection(this,
                                       this.anchor!, caret.normalizeOffset());
      this._sel = newSel;
      caret = newSel.focus;
    }

    const normalized = this._normalizeCaret(caret);
    return normalized == null ? undefined : normalized;
  }

  getDataCaret(approximate?: boolean): DLoc | undefined {
    const caret = this.getGUICaret();
    if (caret === undefined) {
      return undefined;
    }

    return this.toDataLocation(caret, approximate);
  }

  fromDataLocation(loc: DLoc): DLoc | undefined;
  fromDataLocation(node: Node, offset: number): DLoc | undefined;
  fromDataLocation(node: Node | DLoc, offset?: number): DLoc | undefined {
    if (node instanceof DLoc) {
      offset = node.offset;
      node = node.node;
    }

    if (offset === undefined) {
      throw new Error("offset is undefined");
    }

    const ret = this.guiUpdater.fromDataLocation(node, offset);
    if (ret === null) {
      return undefined;
    }

    let newOffset = ret.offset;
    node = ret.node;
    if (isElement(node)) {
      // Normalize to a range within the editable nodes. We could be outside of
      // them in an element which is empty, for instance.
      const [first, second] = this.mode.nodesAroundEditableContents(node);
      const firstIndex = (first !== null) ? indexOf(node.childNodes, first) :
        -1;

      if (newOffset <= firstIndex) {
        newOffset = firstIndex + 1;
      }
      else {
        const secondIndex = second !== null ? indexOf(node.childNodes, second) :
              node.childNodes.length;
        if (newOffset >= secondIndex) {
          newOffset = secondIndex;
        }
      }

      return ret.makeWithOffset(newOffset);
    }

    return ret;
  }

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
   * could be undefined if the location does not correspond to a location in the
   * data tree.
   */
  toDataLocation(loc: DLoc, approximate?: boolean): DLoc | undefined;
  toDataLocation(node: Node, offset: number,
                 approximate?: boolean): DLoc | undefined;
  toDataLocation(loc: DLoc | Node, offset: number | boolean = false,
                 approximate: boolean = false): DLoc | undefined {
    let node;
    let root;
    if (loc instanceof DLoc) {
      if (typeof offset !== "boolean") {
        throw new Error("2nd argument must be a boolean");
      }
      approximate = offset;
      ({ offset, node, root } = loc);
    }
    else {
      node = loc;
    }

    if (typeof offset !== "number") {
      throw new Error("offset must be a number");
    }

    let initialCaret = this.makeCaret(node, offset);
    if (closestByClass(node, "_attribute_value", root) === null) {
      const wrap = closestByClass(node, "_phantom_wrap", root);
      if (wrap !== null) {
        // We are in a phantom wrap. Set position to the real element being
        // wrapped. This is not considered to be an "approximation" because
        // _phantom_wrap elements are considered visual parts of the real
        // element.
        initialCaret = this.makeCaret(wrap.getElementsByClassName("_real")[0]);
      }
      else {
        let topPg;
        let check = (isText(node) ? node.parentNode : node) as Element;
        while (check !== null && check !== this.guiRootEl) {
          if ((check.classList.contains("_phantom") ||
               check.classList.contains("_gui"))) {
            // We already know that the caller does not want an approximation.
            // No point in going on.
            if (!approximate) {
              return undefined;
            }
            topPg = check;
          }

          check = check.parentNode as Element;
        }

        if (topPg !== undefined) {
          initialCaret = this.makeCaret(topPg);
        }
      }
    }

    const normalized = this._normalizeCaret(initialCaret);
    if (normalized == null) {
      return undefined;
    }
    ({ node, offset } = normalized);

    let dataNode = this.dataRoot.pathToNode(this.guiRoot.nodeToPath(node));
    if (isText(node)) {
      return this.makeCaret(dataNode, offset, true);
    }

    if (offset >= node.childNodes.length) {
      return dataNode === null ? undefined :
        this.makeCaret(dataNode, dataNode.childNodes.length);
    }

    // If pointing to a node that is not a text node or a real element, we must
    // find the previous text node or real element and return a position which
    // points after it.
    const child = node.childNodes[offset];
    if (isElement(child) && !child.classList.contains("_real")) {
      const found = previousTextOrReal(child);
      if (found === null) {
        return this.makeCaret(dataNode, 0);
      }

      dataNode = this.dataRoot.pathToNode(this.guiRoot.nodeToPath(found));

      if (dataNode === null) {
        return undefined;
      }

      const parent = dataNode.parentNode!;
      return this.makeCaret(parent, indexOf(parent.childNodes, dataNode) + 1);
    }

    dataNode = this.dataRoot.pathToNode(this.guiRoot.nodeToPath(child));
    return this.makeCaret(dataNode, isAttr(dataNode) ? offset : undefined);
  }

  _normalizeCaret(loc: DLoc | undefined | null): DLoc | undefined | null {
    if (loc == null) {
      return loc;
    }

    const pg = closestByClass(loc.node, "_placeholder", loc.root);
    // We are in a placeholder: make the caret be the parent of the
    // this node.
    if (pg !== null) {
      const parent = pg.parentNode!;
      return loc.make(parent, indexOf(parent.childNodes, pg));
    }

    return loc;
  }

  makeCaret(node: Node | null | undefined, offset?: number,
            normalize: boolean = false): DLoc | undefined {
    if (node == null) {
      return undefined;
    }

    // Attribute nodes are not "contained" by anything. :-/
    let check = node;
    if (isAttr(node)) {
      check = node.ownerElement;
    }

    let root;
    if (this.guiRootEl.contains(check)) {
      root = this.guiRoot;
    }
    else if (this.dataRootEl.contains(check)) {
      root = this.dataRoot;
    }

    if (root === undefined) {
      return undefined;
    }

    return DLoc.mustMakeDLoc(root, node, offset, normalize);
  }

  setRange(anchor: DLoc, focus: DLoc): void {
    const sel = this._sel = new WedSelection(this, anchor, focus);

    // This check reduces selection fiddling by an order of magnitude when just
    // straightforwardly selecting one character.
    if (this.prevSelFocus === undefined || !this.prevSelFocus.equals(focus)) {
      this.caretMark.refresh();
      const rr = sel.rangeInfo;
      if (rr === undefined) {
        throw new Error("unable to make a range");
      }

      // We use _setDOMSelectionRange here because using setSelectionRange would
      // incur some redundant operations.
      this._setDOMSelectionRange(rr.range, rr.reversed);
      this.prevSelFocus = focus;
    }
  }

  caretPositionRight(): DLoc | undefined {
    return this.positionRight(this.caret);
  }

  positionRight(pos: DLoc | undefined): DLoc | undefined {
    return caretMovement.positionRight(pos, this.inAttributes, this.guiRootEl,
                                       this.mode);
  }

  moveRight(): void {
    const pos = this.caretPositionRight();
    if (pos !== undefined) {
      this.setCaret(pos);
    }
  }

  caretPositionLeft(): DLoc | undefined {
    return this.positionLeft(this.caret);
  }

  positionLeft(pos: DLoc | undefined): DLoc | undefined {
    return caretMovement.positionLeft(pos, this.inAttributes, this.guiRootEl,
                                      this.mode);
  }

  moveLeft(): void {
    const pos = this.caretPositionLeft();
    if (pos !== undefined) {
      this.setCaret(pos);
    }
  }

  caretPositionDown(): DLoc | undefined {
    return this.positionDown(this.caret);
  }

  positionDown(pos: DLoc | undefined): DLoc | undefined {
    return caretMovement.positionDown(pos, this.inAttributes, this.guiRootEl,
                                      this.mode);
  }

  moveDown(): void {
    const pos = this.caretPositionDown();
    if (pos !== undefined) {
      this.setCaret(pos);
    }
  }

  caretPositionUp(): DLoc | undefined {
    return this.positionUp(this.caret);
  }

  positionUp(pos: DLoc | undefined): DLoc | undefined {
    return caretMovement.positionUp(pos,
                                    this.inAttributes,
                                    this.guiRootEl,
                                    this.mode);
  }

  moveUp(): void {
    const pos = this.caretPositionUp();
    if (pos !== undefined) {
      this.setCaret(pos);
    }
  }

  setCaret(loc: DLoc, options?: SetCaretOptions): void;
  setCaret(node: Node, offset: number, options?: SetCaretOptions): void;
  setCaret(node: Node | DLoc, offset?: number | SetCaretOptions,
           options?: SetCaretOptions): void {
    let loc: DLoc;
    if (node instanceof DLoc) {
      loc = node;
      if (typeof offset === "number") {
        throw new Error("2nd argument must be options");
      }
      options = offset;
      offset = undefined;
    }
    else {
      if (offset !== undefined && typeof offset !== "number") {
        throw new Error("2nd argument must be number");
      }
      const newLoc = this.makeCaret(node, offset);

      if (newLoc === undefined) {
        return;
      }

      loc = newLoc;
    }

    if (options !== undefined) {
      const result = objectCheck.check(
        caretOptionTemplate, options as objectCheck.CheckedObject);
      // We don't have mandatory options but have a minimal handling of this
      // case.
      if (result.missing !== undefined) {
        throw new Error("there are missing options");
      }

      if (result.extra !== undefined) {
        throw new Error(
          `unknown options passed to setCaret: ${result.extra.join(",")}`);
      }
    }
    else {
      options = {};
    }

    this._setGUICaret(loc.root === this.guiRootEl ?
                      loc : this.fromDataLocation(loc)!, options);
  }

  /**
   * Save the current selection (and caret) on an internal selection stack.
   */
  pushSelection(): void {
    this.selectionStack.push(this._sel);
    // _clearDOMSelection is to work around a problem in Rangy
    // 1.3alpha.804. See ``tech_notes.rst``.
    if (browsers.MSIE_TO_10) {
      this._clearDOMSelection();
    }
  }

  /**
   * Pop the last selection that was pushed with ``pushSelection`` and restore
   * the current caret and selection on the basis of the poped value.
   */
  popSelection(): void {
    this._sel = this.selectionStack.pop();
    this._restoreCaretAndSelection(false);
  }

  /**
   * Pop the last selection that was pushed with ``pushSelection`` but do not
   * restore the current caret and selection from the popped value.
   */
  popSelectionAndDiscard(): void {
    this.selectionStack.pop();
  }

  /**
   * Restores the caret and selection from the ``this.caretManager.anchor`` and
   * ``this.caretManager.caret`` fields. This is used to deal with situations in
   * which the caret and range may have been "damaged" due to browser
   * operations, changes of state, etc.
   *
   * @param focus Whether the restoration of the caret and selection is due to
   * regaining focus or not.
   */
  _restoreCaretAndSelection(focus: boolean = false): void {
    if (this.caret !== undefined && this.anchor !== undefined &&
        // It is possible that the anchor has been removed after focus was lost
        // so check for it.
        this.guiRootEl.contains(this.anchor.node)) {
      const rr = this.anchor.makeRange(this.caret);
      if (rr === undefined) {
        throw new Error("could not make a range");
      }
      this._setDOMSelectionRange(rr.range, rr.reversed);
      this.caretMark.refresh();
      // We're not selecting anything...
      if (rr.range.collapsed) {
        this.focusInputField();
      }
      this._caretChange({ focus: focus });
    }
    else {
      this.clearSelection();
    }
  }

  clearSelection(): void {
    this.caret = undefined;
    this.caretMark.refresh();
    const sel = this._getDOMSelection();
    if (sel.rangeCount > 0 && this.guiRootEl.contains(sel.focusNode)) {
      sel.removeAllRanges();
    }
    this._caretChange();
  }

  private _getDOMSelectionRange(): Range | undefined {
    const range = getSelectionRange(this.win);

    if (range === undefined) {
      return undefined;
    }

    // Don't return a range outside our editing framework.
    if (!this.guiRootEl.contains(range.startContainer) ||
        !this.guiRootEl.contains(range.endContainer)) {
      return undefined;
    }

    return range;
  }

  setSelectionRange(range: Range, reverse: boolean = false): void {
    const start = this.makeCaret(range.startContainer, range.startOffset);
    const end = this.makeCaret(range.endContainer, range.endOffset);

    if (start === undefined) {
      throw new Error("could not make the start caret");
    }

    if (end === undefined) {
      throw new Error("could not make the end caret");
    }

    if (reverse) {
      this.setRange(end, start);
    }
    else {
      this.setRange(start, end);
    }

    this._caretChange();
  }

  /**
   * This function is meant to be used internally to manipulate the DOM
   * selection directly. Generally, you want to use {@link
   * module:wed~Editor#setSelectionRange setSelectionRange} instead.
   */
  private _setDOMSelectionRange(range: Range, reverse: boolean): void {
    if (range.collapsed) {
      this._clearDOMSelection();
      return;
    }

    // tslint:disable-next-line:no-suspicious-comment
    // The domutil.focusNode call is required to work around bug:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
    if (browsers.FIREFOX) {
      focusNode(range.endContainer);
    }

    // _clearDOMSelection is to work around a problem in Rangy 1.3alpha.804. See
    // ``tech_notes.rst``.
    if (browsers.MSIE_TO_10) {
      this._clearDOMSelection();
    }
    const sel = this._getDOMSelection();
    sel.setSingleRange(range, reverse);
  }

  /**
   * Sets the caret position in the GUI tree.
   *
   * @param {module:dloc~DLoc} loc The new position.
   * @param {string} op The operation which is causing the caret to
   * move. See {@link module:wed~Editor#_caretChange _caretChange} for
   * the possible values.
   */
  _setGUICaret(loc: DLoc, options: SetCaretOptions): void {
    const offset = loc.offset;
    let node = loc.node;

    // We accept a location which has for ``node`` a node which is an
    // _attribute_value with an offset. However, this is not an actually valid
    // caret location. So we normalize the location to point inside the text
    // node that contains the data.
    if (isElement(node) && node.classList.contains("_attribute_value")) {
      const attr = getAttrValueNode(node);
      if (node !== attr) {
        node = attr;
        loc = loc.make(node, offset);
      }
    }

    // Don't update if noop.
    if (this.caret !== undefined &&
        this.anchor === this.caret &&
        this.caret.node === node &&
        this.caret.offset === offset) {
      return;
    }

    this._clearDOMSelection();
    this.caret = loc;
    this.caretMark.refresh();
    this.focusInputField();
    this._caretChange(options);
  }

  private _caretChange(options: CaretChangeOptions = {}): void {
    this._events.next({ options });
  }

  private _clearDOMSelection(dontFocus: boolean = false): void {
    this._getDOMSelection().removeAllRanges();
    // Make sure the focus goes back there.
    if (!dontFocus) {
      this.focusInputField();
    }
  }

  private _getDOMSelection(): rangy.RangySelection {
    return rangy.getSelection(this.win);
  }

  getDataSelectionRange(): Range | undefined {
    const range = this.range;

    if (range === undefined) {
      return undefined;
    }

    const start = this.toDataLocation(range.startContainer, range.startOffset);
    if (start === undefined) {
      throw new Error("cannot find a start caret");
    }

    let end;
    if (!range.collapsed) {
      end = this.toDataLocation(range.endContainer, range.endOffset);
      if (end === undefined) {
        throw new Error("cannot find an end caret");
      }
    }
    else {
      end = start;
    }

    const rr = start.makeRange(end);
    if (rr === undefined) {
      throw new Error("cannot make a range");
    }

    return rr.range;
  }

  setDataSelectionRange(range: Range): void {
    const start = this.fromDataLocation(range.startContainer,
                                        range.startOffset);

    if (start === undefined) {
      throw new Error("cannot find a start caret");
    }

    let end;
    if (!range.collapsed) {
      end = this.fromDataLocation(range.endContainer, range.endOffset);

      if (end === undefined) {
        throw new Error("cannot find an end caret");
      }
    }
    else {
      end = start;
    }

    const rr = start.makeRange(end);
    if (rr === undefined) {
      throw new Error("cannot make a range");
    }

    this.setSelectionRange(rr.range);
  }

  /**
   * Focus the field use for input events.  It is used by wed on some occasions
   * where it is needed. Mode authors should never need to call this. If they do
   * find that calling this helps solve a problem they ran into, they probably
   * should file an issue report.
   */
  focusInputField(): void {
    // The following call was added to satisfy IE 11. The symptom is that when
    // clicking on an element's label **on a fresh window that has never
    // received focus**, it is not possible to move off the label using the
    // keyboard. This issue happens only with IE 11.
    this.win.focus();
    // The call to blur here is here ***only*** to satisfy Chrome 29!
    this.$inputField.blur();
    this.$inputField.focus();
  }

  /**
   * @returns {{left: number, top: number}} The coordinates of the
   * current caret position relative to the screen root.
   */
  _caretPositionOnScreen(): ClientRect | undefined {
    if (this.caret === undefined) {
      return undefined;
    }

    if (this.caretMark.inDOM) {
      return this.caretMark.getBoundingClientRect();
    }

    const node = this.caret.node;
    if (isElement(node) && node.classList.contains("_gui")) {
      return node.getBoundingClientRect();
    }

    const range = this.range;
    if (range !== undefined) {
      return range.nativeRange.getBoundingClientRect();
    }

    throw new Error("can't find position of caret");
  }

  onBlur(): void {
    if (this.caret === undefined) {
      return;
    }

    this.selAtBlur = this._sel;
    this.$inputField.blur();
    this.caret = undefined;
    this.caretMark.refresh();
  }

  private onFocus(): void {
    if (this.selAtBlur !== undefined) {
      this._sel = this.selAtBlur;
      this._restoreCaretAndSelection(true);
      this.selAtBlur = undefined;
    }
  }

  dumpCaretInfo(): void {
    const dataCaret = this.getDataCaret();

    /* tslint:disable:no-console */
    if (dataCaret !== undefined) {
      console.log("data caret", dataCaret.node, dataCaret.offset);
    }
    else {
      console.log("no data caret");
    }

    if (this.anchor !== undefined) {
      console.log("selection anchor",
                  this.anchor.node, this.anchor.offset);
    }
    else {
      console.log("no selection anchor");
    }

    const caret = this.caret;
    if (caret !== undefined) {
      const { node, offset } = caret;
      console.log("selection focus", node, offset);
      console.log("selection focus closest real",
                  closestByClass(node, "_real", this.guiRootEl));
      if (isText(node)) {
        if (offset < node.data.length) {
          const range = this.doc.createRange();
          range.setStart(node, offset);
          range.setEnd(node, offset + 1);
          const rect = range.getBoundingClientRect();
          console.log("rectangle around character at caret:", rect);
        }
      }
    }
    else {
      console.log("no selection focus");
    }

    dumpRange("DOM range: ", this._getDOMSelectionRange());
    console.log("input field location", this.inputField.style.top,
                this.inputField.style.left);
    console.log("document.activeElement", document.activeElement);
    /* tslint:enable:no-console */
  }
}
