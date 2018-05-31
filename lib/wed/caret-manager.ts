/**
 * Caret management.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import $ from "jquery";
import { Observable, Subject } from "rxjs";

import * as browsers from "./browsers";
import { CaretMark } from "./caret-mark";
import * as caretMovement from "./caret-movement";
import { DLoc, DLocRange, DLocRoot } from "./dloc";
import { isAttr, isElement, isText } from "./domtypeguards";
import { childByClass, closestByClass, contains, dumpRange,
         focusNode as focusTheNode, getSelectionRange, indexOf,
         RangeInfo } from "./domutil";
import { GUIUpdater } from "./gui-updater";
import { Layer } from "./gui/layer";
import { Scroller } from "./gui/scroller";
import { Mode } from "./mode";
import { ModeTree } from "./mode-tree";
import * as objectCheck from "./object-check";
import { GUIToDataConverter, WedSelection } from "./wed-selection";
import { getAttrValueNode } from "./wed-util";

/**
 * This is the template use with objectCheck to check whether the options passed
 * are correct. Changes to [[SetCaretOptions]] must be reflected here.
 */
const caretOptionTemplate = {
  textEdit: false,
  focus: false,
};

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

  /** The mode at which the current caret is located. */
  mode: Mode | undefined;

  /** The previous mode in effect before the change. */
  prevMode: Mode | undefined;

  /** The change options. */
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
 *
 * Given wed's notion of parallel data and GUI trees. A caret can either point
 * into the GUI tree or into the data tree. In the following documentation, if
 * the caret is not qualified, then it is a GUI caret.
 *
 * Similarly, a selection can either span a range in the GUI tree or in the data
 * tree. Again, "selection" without qualifier is a GUI selection.
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
  private prevCaret: DLoc | undefined;
  private prevMode: Mode | undefined;

  private readonly _events: Subject<CaretChange>;

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
  constructor(private readonly guiRoot: DLocRoot,
              private readonly dataRoot: DLocRoot,
              private readonly inputField: HTMLElement,
              private readonly guiUpdater: GUIUpdater,
              private readonly layer: Layer,
              private readonly scroller: Scroller,
              private readonly modeTree: ModeTree) {
    this.mark = new CaretMark(this, guiRoot.node.ownerDocument, layer,
                              inputField, scroller);
    const guiRootEl = this.guiRootEl = guiRoot.node;
    this.dataRootEl = dataRoot.node;
    this.doc = guiRootEl.ownerDocument;
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

  /**
   * The raw caret. Use [[getNormalizedCaret]] if you need it normalized.
   *
   * This is synonymous with the focus of the current selection. (`foo.caret ===
   * foo.focus === foo.sel.focus`).
   */
  get caret(): DLoc | undefined {
    return this.focus;
  }

  /**
   * The current selection.
   */
  get sel(): WedSelection | undefined {
    return this._sel;
  }

  /**
   * The focus of the current selection.
   */
  get focus(): DLoc | undefined {
    if (this._sel === undefined) {
      return undefined;
    }

    return this._sel.focus;
  }

  /**
   * The anchor of the current selection.
   */
  get anchor(): DLoc | undefined {
    if (this._sel === undefined) {
      return undefined;
    }

    return this._sel.anchor;
  }

  /**
   * The range formed by the current selection.
   */
  get range(): Range | undefined {
    const info = this.rangeInfo;
    return info !== undefined ? info.range : undefined;
  }

  /**
   * A range info object describing the current selection.
   */
  get rangeInfo(): RangeInfo | undefined {
    const sel = this._sel;

    if (sel === undefined) {
      return undefined;
    }

    return sel.rangeInfo;
  }

  get minCaret(): DLoc {
    return DLoc.mustMakeDLoc(this.guiRoot, this.guiRootEl, 0);
  }

  get maxCaret(): DLoc {
    return  DLoc.mustMakeDLoc(this.guiRoot, this.guiRootEl,
                              this.guiRootEl.childNodes.length);
  }

  get docDLocRange(): DLocRange {
    return new DLocRange(this.minCaret, this.maxCaret);
  }

  /**
   * Get a normalized caret.
   *
   * @returns A normalized caret, or ``undefined`` if there is no caret.
   */
  getNormalizedCaret(): DLoc | undefined {
    let caret = this.caret;
    if (caret === undefined) {
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

  /**
   * Same as [[getNormalizedCaret]] but must return a location.
   *
   * @throws {Error} If it cannot return a location.
   */
  mustGetNormalizedCaret(): DLoc {
    const ret = this.getNormalizedCaret();
    if (ret === undefined) {
      throw new Error("cannot get a normalized caret");
    }

    return ret;
  }

  normalizeToEditableRange(loc: DLoc): DLoc {
    if (loc.root !== this.guiRootEl) {
      throw new Error("DLoc object must be for the GUI tree");
    }

    let offset = loc.offset;
    const node = loc.node;

    if (isElement(node)) {
      // Normalize to a range within the editable nodes. We could be outside of
      // them in an element which is empty, for instance.
      const mode = this.modeTree.getMode(node);
      const [first, second] = mode.nodesAroundEditableContents(node);
      const firstIndex = first !== null ? indexOf(node.childNodes, first) : -1;
      if (offset <= firstIndex) {
        offset = firstIndex + 1;
      }
      else {
        const secondIndex = second !== null ?
          indexOf(node.childNodes, second) : node.childNodes.length;
        if (offset >= secondIndex) {
          offset = secondIndex;
        }
      }

      return loc.makeWithOffset(offset);
    }

    return loc;
  }

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
  getDataCaret(approximate?: boolean): DLoc | undefined {
    const caret = this.getNormalizedCaret();
    if (caret === undefined) {
      return undefined;
    }

    return this.toDataLocation(caret, approximate);
  }

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
      const mode = this.modeTree.getMode(node);
      const [first, second] = mode.nodesAroundEditableContents(node);
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
   * Does the same thing as [[fromDataLocation]] but must return a defined
   * location.
   *
   * @throws {Error} If it cannot return a location.
   */
  mustFromDataLocation(loc: DLoc): DLoc;
  mustFromDataLocation(node: Node, offset: number): DLoc;
  // @ts-ignore
  mustFromDataLocation(node: Node | DLoc, offset?: number): DLoc {
    const ret = this.fromDataLocation.apply(this, arguments);
    if (ret === undefined) {
      throw new Error("cannot convert to a data location");
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
   * could be ``undefined`` if the location does not correspond to a location in
   * the data tree.
   */
  toDataLocation(loc: DLoc, approximate?: boolean): DLoc | undefined;
  toDataLocation(node: Node, offset: number,
                 approximate?: boolean): DLoc | undefined;
  // tslint:disable-next-line:cyclomatic-complexity
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

  /**
   * Modify the passed position so that it if appears inside of a placeholder
   * node, the resulting position is moved out of it.
   *
   * @param loc The location to normalize.
   *
   * @returns The normalized position. If ``undefined`` or ``null`` was passed,
   * then the return value is the same as what was passed.
   */
  private _normalizeCaret(loc: DLoc | undefined | null):
  DLoc | undefined | null {
    if (loc == null) {
      return loc;
    }

    const pg = closestByClass(loc.node, "_placeholder", loc.root);
    // If we are in a placeholder: make the caret be the parent of the this
    // node.
    return (pg !== null) ? loc.make(pg) : loc;
  }

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
  makeCaret(node: Node | null | undefined, offset?: number,
            normalize: boolean = false): DLoc | undefined {
    if (node == null) {
      return undefined;
    }

    let root;
    if (this.guiRootEl.contains(node)) {
      root = this.guiRoot;
    }
    else if (contains(this.dataRootEl, node)) {
      root = this.dataRoot;
    }

    if (root === undefined) {
      return undefined;
    }

    return DLoc.mustMakeDLoc(root, node, offset, normalize);
  }

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
  setRange(anchorNode: Node, anchorOffset: number, focusNode: Node,
           focusOffset: number): void;
  setRange(anchor: DLoc, focus: DLoc): void;
  setRange(anchorNode: DLoc | Node, anchorOffset: DLoc | number,
           focusNode?: Node, focusOffset?: number): void {
    let anchor;
    let focus;
    if (anchorNode instanceof DLoc && anchorOffset instanceof DLoc) {
      anchor = anchorNode;
      focus = anchorOffset;
    }
    else {
      anchor = this.makeCaret(anchorNode as Node, anchorOffset as number);
      focus = this.makeCaret(focusNode, focusOffset);
    }

    if (anchor === undefined || focus === undefined) {
      throw new Error("must provide both anchor and focus");
    }

    if (anchor.root === this.dataRootEl) {
      anchor = this.fromDataLocation(anchor);
      focus = this.fromDataLocation(focus);

      if (anchor === undefined || focus === undefined) {
        throw new Error("cannot find GUI anchor and focus");
      }
    }

    const sel = this._sel = new WedSelection(this, anchor, focus);

    // This check reduces selection fiddling by an order of magnitude when just
    // straightforwardly selecting one character.
    if (this.prevCaret === undefined || !this.prevCaret.equals(focus)) {
      this.mark.refresh();
      const range = sel.range;
      if (range === undefined) {
        throw new Error("unable to make a range");
      }

      this._setDOMSelectionRange(range);
    }

    this._caretChange();
  }

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
  newPosition(pos: DLoc | undefined,
              direction: caretMovement.Direction): DLoc | undefined {
    return caretMovement.newPosition(pos, direction,
                                     this.guiRootEl,
                                     this.modeTree);
  }

  /**
   * Compute the position of the current caret if it were moved according to
   * some direction.
   *
   * @param direction The direction in which the caret would be moved.
   *
   * @return The position to the right of the caret position. Or ``undefined``
   * if there is no valid position to compute.
   */
  newCaretPosition(direction: caretMovement.Direction): DLoc | undefined {
    return this.newPosition(this.caret, direction);

  }

  /**
   * Move the caret in a specific direction. The caret may not move if it is
   * not possible to move in the specified direction.
   *
   * @param direction The direction in which to move.
   */
  move(direction: caretMovement.Direction, extend: boolean = false): void {
    const pos = this.newCaretPosition(direction);
    if (pos === undefined) {
      return;
    }

    if (!extend) {
      this.setCaret(pos);
    }
    else {
      const anchor = this.anchor;
      if (anchor !== undefined) {
        this.setRange(anchor, pos);
      }
    }
  }

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
  setCaret(node: Node | null | undefined,
           offset?: number, options?: SetCaretOptions): void;
  setCaret(node: Node | DLoc | null | undefined,
           offset?: number | SetCaretOptions,
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
      objectCheck.assertSummarily(caretOptionTemplate, options);
    }
    else {
      options = {};
    }

    this._setGUICaret(loc.root === this.guiRootEl ?
                      loc : this.fromDataLocation(loc)!, options);
  }

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
  setCaretToLabelPosition(target: Node, label: Element, location: DLoc): void {
    let node;
    let offset = 0;
    // Note that in the code that follows, the choice between testing against
    // ``target`` or against ``location.node`` is not arbitrary.
    const attr = closestByClass(target, "_attribute", label);
    if (attr !== null) {
      if (closestByClass(location.node, "_attribute_value", label) !== null) {
        ({ node, offset } = location);
      }
      else {
        node = getAttrValueNode(
          attr.getElementsByClassName("_attribute_value")[0]);
      }
    }
    else {
      // Find the element name and put it there.
      node = label.getElementsByClassName("_element_name")[0];
    }

    this.setCaret(node, offset);
  }

  /**
   * Save the current selection (and caret) on an internal selection stack.
   */
  pushSelection(): void {
    this.selectionStack.push(this._sel);
  }

  /**
   * Pop the last selection that was pushed with ``pushSelection`` and restore
   * the current caret and selection on the basis of the popped value.
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
   * Restores the caret and selection from the current selection. This is used
   * to deal with situations in which the caret and range may have been
   * "damaged" due to browser operations, changes of state, etc.
   *
   * @param gainingFocus Whether the restoration of the caret and selection is
   * due to regaining focus or not.
   */
  private _restoreCaretAndSelection(gainingFocus: boolean):
  void {
    if (this.caret !== undefined && this.anchor !== undefined &&
        // It is possible that the anchor has been removed after focus was lost
        // so check for it.
        this.guiRootEl.contains(this.anchor.node)) {
      const range = this.range;
      if (range === undefined) {
        throw new Error("could not make a range");
      }

      this._setDOMSelectionRange(range);

      // We're not selecting anything...
      if (range.collapsed) {
        this.focusInputField();
      }
      this.mark.refresh();
      this._caretChange({ gainingFocus });
    }
    else {
      this.clearSelection();
    }
  }

  /**
   * Clear the selection and caret.
   */
  clearSelection(): void {
    this._sel = undefined;
    this.mark.refresh();
    const sel = this._getDOMSelection();
    if (sel.rangeCount > 0 && this.guiRootEl.contains(sel.focusNode)) {
      sel.removeAllRanges();
    }
    this._caretChange();
  }

  /**
   * Get the current selection from the DOM tree.
   */
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

  /**
   * This function is meant to be used internally to manipulate the DOM
   * selection directly.
   */
  private _setDOMSelectionRange(range: Range): void {
    if (range.collapsed) {
      this._clearDOMSelection();
      return;
    }

    // tslint:disable-next-line:no-suspicious-comment
    // The focusTheNode call is required to work around bug:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
    if (browsers.FIREFOX) {
      focusTheNode(range.endContainer);
    }

    const sel = this._getDOMSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Sets the caret position in the GUI tree.
   *
   * @param loc The new position.
   *
   * @param options Set of options governing the caret movement.
   */
  private _setGUICaret(loc: DLoc, options: SetCaretOptions): void {
    let offset = loc.offset;
    let node = loc.node;

    // We accept a location which has for ``node`` a node which is an
    // _attribute_value with an offset. However, this is not an actually valid
    // caret location. So we normalize the location to point inside the text
    // node that contains the data.
    if (isElement(node)) {
      if (node.classList.contains("_attribute_value")) {
        const attr = getAttrValueNode(node);
        if (node !== attr) {
          node = attr;
          loc = loc.make(node, offset);
        }
      }

      // Placeholders attract adjacent carets into them.
      const ph = childByClass(node, "_placeholder");
      if (ph !== null && !ph.classList.contains("_dying")) {
        node = ph;
        offset = 0;
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

    // If we do not want to gain focus, we also don't want to take it away
    // from somewhere else, so don't change the DOM.
    if (options.focus !== false) {
      this._clearDOMSelection(true);
    }
    this._sel = new WedSelection(this, loc);
    this.mark.refresh();
    if (options.focus !== false) {
      this.focusInputField();
    }
    this._caretChange(options);
  }

  /**
   * Emit a caret change event.
   */
  private _caretChange(options: CaretChangeOptions = {}): void {
    const prevCaret = this.prevCaret;
    const caret = this.caret;
    const mode = caret !== undefined ?
      this.modeTree.getMode(caret.node) : undefined;
    if (prevCaret === undefined || !prevCaret.equals(caret)) {
      this._events.next({
        manager: this,
        caret,
        mode,
        prevCaret,
        prevMode: this.prevMode,
        options,
      });
      this.prevCaret = caret;
      this.prevMode = mode;
    }
  }

  private _clearDOMSelection(dontFocus: boolean = false): void {
    this._getDOMSelection().removeAllRanges();
    // Make sure the focus goes back there.
    if (!dontFocus) {
      this.focusInputField();
    }
  }

  private _getDOMSelection(): Selection {
    return this.win.getSelection();
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
   * This is called when the editing area is blurred. This is not something you
   * should be calling in a mode's implementation. It is public because other
   * parts of wed need to call it.
   */
  onBlur(): void {
    if (this.caret === undefined) {
      return;
    }

    this.selAtBlur = this._sel;
    this.$inputField.blur();
    this._sel = undefined;
    this.mark.refresh();
  }

  private onFocus(): void {
    if (this.selAtBlur !== undefined) {
      this._sel = this.selAtBlur;
      this._restoreCaretAndSelection(true);
      this.selAtBlur = undefined;
    }
  }

  highlightRange(range: DLocRange): Element {
    const domRange = range.mustMakeDOMRange();

    const grPosition = this.scroller.getBoundingClientRect();
    const topOffset = this.scroller.scrollTop - grPosition.top;
    const leftOffset = this.scroller.scrollLeft - grPosition.left;

    const highlight = this.doc.createElement("div");
    for (const rect of Array.from(domRange.getClientRects())) {
      const highlightPart = this.doc.createElement("div");
      highlightPart.className = "_wed_highlight";
      highlightPart.style.top = `${rect.top + topOffset}px`;
      highlightPart.style.left = `${rect.left + leftOffset}px`;
      highlightPart.style.height = `${rect.height}px`;
      highlightPart.style.width = `${rect.width}px`;
      highlight.appendChild(highlightPart);
    }

    this.layer.append(highlight);
    return highlight;
  }

  /**
   * Dump to the console caret-specific information.
   */
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

//  LocalWords:  MPL wed's DLoc sel setCaret clearDOMSelection rst focusTheNode
//  LocalWords:  bugzilla nd noop activeElement px rect grPosition topOffset
//  LocalWords:  leftOffset
