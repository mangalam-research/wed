/**
 * Wed's notion of a selection.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { DLoc } from "./dloc";
import { isWellFormedRange, RangeInfo } from "./domutil";

export interface GUIToDataConverter {
  toDataLocation(node: Node, offset: number): DLoc | undefined;
}

/**
 * Represents a selection as wed understands it.
 */
export class WedSelection {
  public readonly focus: DLoc;

  /**
   * @param anchor The anchor point of the selection. The anchor is where the
   * selection started. It does not move when the user selects text.
   *
   * @param focus The focus point of the selection. It is the part of the
   * selection that moves when the user selects text. Omitting ``focus`` will
   * result in a collapsed selection.
   */
  constructor(public readonly converter: GUIToDataConverter,
              public readonly anchor: DLoc, focus?: DLoc | undefined) {
    this.focus = (focus === undefined) ? anchor : focus;
  }

  get range(): Range | undefined {
    const rr = this.rangeInfo;

    if (rr === undefined) {
      return undefined;
    }

    return rr.range;
  }

  get rangeInfo(): RangeInfo | undefined {
    return this.anchor.makeRange(this.focus);
  }

  get collapsed(): boolean {
    return this.anchor.equals(this.focus);
  }

  get wellFormed(): boolean {
    const range = this.range;
    if (range === undefined) {
      return false;
    }

    return isWellFormedRange(range);
  }

  asDataCarets(): [DLoc, DLoc] | undefined {
    const range = this.range;
    if (range === undefined) {
      return undefined;
    }

    const startCaret = this.converter.toDataLocation(range.startContainer,
                                                    range.startOffset);
    const endCaret = this.converter.toDataLocation(range.endContainer,
                                                   range.endOffset);
    if (startCaret === undefined || endCaret === undefined) {
      return undefined;
    }

    return [startCaret, endCaret];
  }

  mustAsDataCarets(): [DLoc, DLoc] {
    const ret = this.asDataCarets();
    if (ret === undefined) {
      throw new Error("cannot get the selection as data carets");
    }

    return ret;
  }

  /**
   * @returns Whether the two objects are equal. They are equal if they are the
   * same object or if they have equal focuses (foci?) and equal anchors.
   */
  equals<T extends WedSelection>(other: T | undefined | null): boolean {
    if (other == null) {
      return false;
    }

    return this.focus.equals(other.focus) && this.anchor.equals(other.anchor);
  }
}

//  LocalWords:  MPL foci
