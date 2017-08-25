/**
 * Label manager.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

/**
 * Maintains a mapping from HTML element id to labels meaningful to humans. Also
 * keeps a counter that can be used for assigning new ids to elements that don't
 * already have one.
 *
 */
export abstract class LabelManager {
  /** A mapping of element id to allocated label. */
  protected _idToLabel: Record<string, string> = Object.create(null);

  /**
   * A counter that must be incremented with each new label allocation. This
   * allows the allocation algorithm to know what the next label should be.
   */
  protected labelIndex: number = 0;

  /**
   * @param name The name of this label manager. This is a convenience that can
   * be used to produce distinctive error messages, for instance.
   */
  constructor(public readonly name: string) {}

  /**
   * Allocate a label for an id. The relation between id and label remains
   * constant until [[deallocateAll]] is called.
   *
   * @param id The id of the element.
   *
   * @returns The allocated label. If the method is called multiple times with
   * the same ``id``, the return value must be the same. It may change only if
   * [[deallocateAll]] has been called between the calls to this method.
   */
  abstract allocateLabel(id: string): string;

  /**
   * Gets the label associated with an id.
   *
   * @param id The id.
   *
   * @returns The label. The value returned by this method obeys the same rules
   * as that of [[allocateLabel]] with the exception that if a call returned
   * ``undefined`` it may return another value on a subsequent call. (That is,
   * an ``id`` that did not have a label allocated to it may acquire such
   * label.)
   */
  idToLabel(id: string): string | undefined {
    return this._idToLabel[id];
  }

  /**
   * Deallocate all mappings between ids and labels. This will reset
   * [[_idToLabel]] to an empty map and [[labelIndex]] to 0.
   */
  deallocateAll(): void {
    this._idToLabel = Object.create(null);
    this.labelIndex = 0;
    this._deallocateAllLabels();
  }

  /**
   * Clear out the labels that were allocated. This method is called by
   * [[deallocateAll]] to perform class-specific cleanup.
   */
  protected abstract _deallocateAllLabels(): void;

  /**
   * Gets the next number in the number sequence. This increments
   * [[labelIndex]].
   *
   * @returns The number.
   */
  nextNumber(): number {
    return ++this.labelIndex;
  }
}

const alphabet = "abcdefghijklmnopqrstuvwxyz";

/**
 * A label manager that associates alphabetical labels to each id given to
 * it. It will associate labels "a", "b", "c", ... up to "z" and then will
 * associate "aa", "bb", "cc", ... up to "zz", and continues repeating
 * characters each time it cycles over the alphabet.
 *
 * @param {string} name The name of this label manager.
 */
export class AlphabeticLabelManager extends LabelManager {

  allocateLabel(id: string): string {
    let label = this._idToLabel[id];
    if (label === undefined) {
      // nextNumber() will start with 1, so we have to subtract.
      const ix = this.nextNumber() - 1;
      const round = Math.floor(ix / 26) + 1;
      const charIx = ix % 26;
      label = alphabet[charIx].repeat(round);
      this._idToLabel[id] = label;
    }

    return label;
  }

  // tslint:disable-next-line:no-empty
  _deallocateAllLabels(): void {}
}

//  LocalWords:  LabelManager MPL allocateLabel Mangalam Dubeau
