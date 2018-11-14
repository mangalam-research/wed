/**
 * Facilities for managing the selection mode.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

export enum SelectionMode {
  /** The span mode allows creating selections character-by-character. */
  SPAN,

  /**
   * The unit mode restricts selections to entire units. Like an entire element,
   * or an entire attribute.
   */
  UNIT,
}

export namespace SelectionMode {
  /**
   * Get the selection mode that follows another mode.
   *
   * @param mode A selection mode.
   *
   * @returns The mode that follows `mode`.
   */
  export function next(mode: SelectionMode): SelectionMode {
    const ret = mode + 1;
    return (SelectionMode[ret] === undefined) ? 0 : ret;
  }
}

/**
 * An event notifying of a selection mode change.
 */
export interface SelectionModeChange {
  name: "SelectionModeChange";
  value: SelectionMode;
}
