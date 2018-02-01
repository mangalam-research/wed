/**
 * Facilities for searching through a document.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as rangy from "rangy";

import { CaretManager } from "./caret-manager";
import { DLoc, DLocRange, DLocRoot, getRoot } from "./dloc";
import { isElement } from "./domtypeguards";
import { closestByClass } from "./domutil";

/** The direction of searches. */
export enum Direction {
  FORWARD,
  BACKWARDS,
}

/** The context for searches. */
export enum Context {
  /** Everywhere in a document, including non-editable graphical elements. */
  EVERYWHERE,

  /** Only element text. */
  TEXT,

  /** Only attribute values. */
  ATTRIBUTE_VALUES,
}

function unknownDirection(d: never): never {
  throw new Error(`unknown direction: ${d}`);
}

function directionToRangyDirection(direction: Direction): rangy.Direction {
  // There does not seem to be a way currently to declare this map in a way
  // that will enforce that all directions have a value. :-/
  const ret = ({
    [Direction.FORWARD]: "forward",
    [Direction.BACKWARDS]: "backward",
  } as Record<string, rangy.Direction>)[direction];

  if (ret === undefined) {
    // We have to cast to never since we're not using the switch exhaustion.
    return unknownDirection(direction as never);
  }

  return ret;
}

function nodeInScope(doc: Document, node: Node, scope: Range): boolean {
  const vrange = doc.createRange();
  vrange.selectNode(node);

  // The range that encompasses the node, must be completely within scope.
  return (vrange.compareBoundaryPoints(Range.START_TO_START, scope) >= 0) &&
    (vrange.compareBoundaryPoints(Range.END_TO_END, scope) <= 0);
}

/**
 * This is a utility class that holds a position among a list of elements
 * (representing attributes, in our usage).
 */
class AttributeValueCursor {
  private current!: number;

  /**
   * @param values The values to iterate over.
   *
   * @param direction The direction to iterate over.
   */
  constructor(private readonly values: Element[],
              private readonly direction: Direction) {
    this.resetToStart();
  }

  /**
   * @param value The index to reset this iterator to.
   */
  reset(value: number): void {
    this.current = value;
  }

  /**
   * @param value Reset to the start of [[values]]. This will be position 0 for
   * an iterator moving forward. Or the end of [[values]] for an iterator moving
   * backwards.
   */
  resetToStart(): void {
    switch (this.direction) {
    case Direction.FORWARD:
      this.current = 0;
      break;
    case Direction.BACKWARDS:
      this.current = this.values.length - 1;
      break;
    default:
      return unknownDirection(this.direction);
    }
  }

  /**
   * @returns ``true`` if we have not reached the end of the array.
   */
  get hasNext(): boolean {
    switch (this.direction) {
    case Direction.FORWARD:
      return this.current < this.values.length;
    case Direction.BACKWARDS:
      return this.current >= 0;
    default:
      return unknownDirection(this.direction);
    }
  }

  /**
   * This is the next element in iteration order. Moves the iterator in the
   * direction of travel.
   */
  get next(): Element {
    const ret = this.values[this.current];
    this.inc();
    return ret;
  }

  /**
   * Moves the iterator in the direction of travel.
   */
  inc(): void {
    switch (this.direction) {
    case Direction.FORWARD:
      this.current++;
      break;
    case Direction.BACKWARDS:
      this.current--;
      break;
    default:
      return unknownDirection(this.direction);
    }
  }

}

/**
 * This models a search on the GUI tree. Performing searches directly on the
 * data tree is theoretically possible but fraught with problems. For instance,
 * some data may not be visible to users and so the search in the data tree
 * would have to constantly refer to the GUI tree to determine whether a hit
 * should be shown. Additionally, the order of the data shown in the GUI tree
 * may differ from the order in the data tree.
 */
export class Search {
  private readonly root: DLocRoot;
  private _pattern: string = "";
  private _scope: DLocRange | undefined;

  private prevEnd: DLoc | undefined;

  /**
   * The current match. This is ``undefined`` if we have not searched yet.  It
   * is ``null`` if nothing matches.
   */
  current: DLocRange | null | undefined;

  /** The direction in which the search moves. */
  direction: Direction = Direction.FORWARD;

  /** The context for the search. */
  context: Context = Context.EVERYWHERE;

  constructor(public readonly caretManager: CaretManager,
              public readonly guiRoot: Document | Element,
              private start: DLoc,
              scope: DLocRange | undefined) {
    this.root = getRoot(guiRoot);
    this.setScope(scope);
    const realScope = this.scope;
    if (realScope.start.compare(start) > 0 ||
        realScope.end.compare(start) < 0) {
      throw new Error("the scope does not contain the start position");
    }

    this.start = start;
  }

  set pattern(value: string) {
    this._pattern = value;
  }

  get pattern(): string {
    return this._pattern;
  }

  /**
   * Set the search scope. No result will be returned outside the scope. Setting
   * the scope to ``undefined`` means "search the whole document".
   */
  private setScope(range: DLocRange | undefined): void {
    if (range === undefined) {
      this._scope = undefined;
      return;
    }

    if (!range.isValid()) {
      throw new Error("passed an invalid range");
    }

    const { start, end } = range;
    if (start.root !== this.root.node) {
      throw new Error("the range does not use the search's root");
    }

    // Since the start and end of a range must share the same root, we don't
    // have to test the end of the range.

    this._scope = start.compare(end) > 0 ?
      // Start is after end, flip them.
      new DLocRange(end, start) :
      // Regular order
      new DLocRange(start, end);
  }

  private get scope(): DLocRange {
    if (this._scope === undefined) {
      this._scope = new DLocRange(
        DLoc.mustMakeDLoc(this.root, this.guiRoot, 0),
        DLoc.mustMakeDLoc(this.root, this.guiRoot,
                          this.guiRoot.childNodes.length));
    }

    return this._scope;
  }

  updateCurrent(): void {
    this._next(true);
  }

  next(): void {
    this._next(false);
  }

  private _next(includeCurrent: boolean): void {
    let ret: DLocRange | null = null;
    if (this.pattern !== "") {
      let rollPosition: DLoc;
      let start: DLoc;
      switch (this.direction) {
      case Direction.FORWARD: {
        start = this.getForwardSearchStart(includeCurrent);
        rollPosition = this.scope.start;
        break;
      }
      case Direction.BACKWARDS: {
        start = this.getBackwardSearchStart(includeCurrent);
        rollPosition = this.scope.end;
        break;
      }
      default:
        return unknownDirection(this.direction);
      }

      const hit = this.find(start, this.direction);
      if (hit !== null) {
        ret = new DLocRange(
          DLoc.mustMakeDLoc(this.root, hit.startContainer, hit.startOffset),
          DLoc.mustMakeDLoc(this.root, hit.endContainer, hit.endOffset));
      }
      else {
        // If we did not get a hit, we roll over on the next search.
        this.start = rollPosition;
      }
    }

    this.current = ret;
  }

  private find(start: DLoc, direction: Direction): Range | null {
    if (this.context === Context.ATTRIBUTE_VALUES) {
      return this.findAttributeValue(start, direction);
    }

    return this.findText(start, directionToRangyDirection(direction));
  }

  private findText(start: DLoc, direction: rangy.Direction): Range | null {
    // tslint:disable-next-line:no-any
    const config = (rangy as any).config;
    const range = new rangy.WrappedRange(start.makeRange()!);
    if (this.context === Context.TEXT) {
      config.customIsCollapsedNode = (node: Node) => {
        return isElement(node) && node.closest("._phantom") !== null;
      };
    }

    let found = range.findText(this.pattern, {
      withinRange: this.scope.mustMakeDOMRange(),
      direction,
    });

    // There is a bug in Rangy that makes it so that it may sometimes return
    // hits outside the scope. Test for it.
    if (found) {
      const hitStart = DLoc.mustMakeDLoc(this.guiRoot, range.startContainer,
                                         range.startOffset);
      if (!this.scope.contains(hitStart)) {
        found = false;
      }
    }

    config.customIsCollapsedNode = undefined;
    return found ? range.nativeRange : null;
  }

  private findAttributeValue(start: DLoc, direction: Direction): Range | null {
    // Implement our own logic instead of relying on rangy. We can just move
    // from attribute value to attribute value and checks the values.
    const guiRoot = this.guiRoot;
    const allValues =
      Array.from(guiRoot.getElementsByClassName("_attribute_value"));
    const caretManager = this.caretManager;

    const valueCursor = new AttributeValueCursor(allValues, direction);
    const attrValue = closestByClass(start.node, "_attribute_value", guiRoot);
    const doc = guiRoot.ownerDocument;
    const scope = this.scope.mustMakeDOMRange();
    if (attrValue === null) {
      // We need to find the next attribute.
      let found: Node | undefined;
      while (valueCursor.hasNext) {
        const value = valueCursor.next;
        if (nodeInScope(doc, value, scope) &&
            // tslint:disable-next-line:no-bitwise
            ((value.compareDocumentPosition(start.node) &
              Node.DOCUMENT_POSITION_PRECEDING) !== 0)) {
          found = value;
          break;
        }
      }

      if (found === undefined) {
        return null;
      }

      start = start.make(found, 0);
    }
    else {
      const index = allValues.indexOf(attrValue);
      if (index === -1) {
        throw new Error("internal error: cannot find value in array!");
      }
      valueCursor.reset(index);
      valueCursor.inc();
    }

    let dataLoc = caretManager.toDataLocation(start)!;
    // tslint:disable-next-line:no-constant-condition
    while (true) {
      // Going into the data tree simplifies some of the work here.
      const node = dataLoc.node as Attr;
      let index: number;
      switch (direction) {
      case Direction.FORWARD:
        index = node.value.indexOf(this.pattern, dataLoc.offset);
        break;
      case Direction.BACKWARDS:
        // For a backward search, the hit is not allowed to cross the start
        // position. (This, by the way, is the same way Emacs operates.)
        const startOffset = dataLoc.offset - this.pattern.length;
        index = (startOffset < 0) ?
          -1 : node.value.lastIndexOf(this.pattern, startOffset);
        break;
      default:
        return unknownDirection(direction);
      }

      if (index !== -1) {
        const rangeStart =
          caretManager.mustFromDataLocation(dataLoc.makeWithOffset(index));
        const rangeEnd =
          caretManager.mustFromDataLocation(
            dataLoc.makeWithOffset(index + this.pattern.length));
        if (this.scope.contains(rangeStart) && this.scope.contains(rangeEnd)) {
          return new DLocRange(rangeStart, rangeEnd).mustMakeDOMRange();
        }
      }

      // We did not find a good hit, so continue searching other values.
      let next: Element | null = null;
      while (next === null && valueCursor.hasNext) {
        next = valueCursor.next;
        if (!nodeInScope(doc, next, scope)) {
          next = null;
        }
      }

      if (next === null) {
        return null;
      }

      let dataNext = caretManager.toDataLocation(next, 0)!;
      switch (direction) {
      case Direction.FORWARD:
        break;
      case Direction.BACKWARDS:
        dataNext =
          dataNext.makeWithOffset((dataNext.node as Attr).value.length);
        break;
      default:
        return unknownDirection(direction);
      }

      dataLoc = dataNext;
    }
  }

  private getForwardSearchStart(includeCurrent: boolean): DLoc {
    if (this.current != null) {
      return includeCurrent ? this.current.start : this.current.end;
    }

    return this.start;
  }

  private getBackwardSearchStart(includeCurrent: boolean): DLoc {
    let ret: DLoc | undefined;
    if (this.current != null) {
      ret = includeCurrent ? this.prevEnd : this.current.start;
    }

    if (ret === undefined) {
      ret = this.start;
    }

    this.prevEnd = ret;
    return ret;
  }
}
