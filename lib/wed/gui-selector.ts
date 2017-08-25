/**
 * GUI tree selectors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { toGUISelector } from "./domutil";

const cache = new WeakMap<String, GUISelector>();

/**
 * A "GUI selector" is a CSS selector apt to be used in the GUI tree.
 */
export class GUISelector {
  /** The value that the selector holds. */
  public readonly value: string;
  /**
   * @param value The value that the selector holds.
   */
  private constructor(value: string) {
    const existing = cache.get(value);
    if (existing !== undefined) {
      return existing;
    }

    this.value = value;
  }

  /**
   * Make a GUI selector from a CSS selector, as-is.
   *
   * @param selector The value that the selector will hold.
   */
  static makeVerbatim(selector: string): GUISelector {
    return new GUISelector(selector);
  }

  /**
   * Make a GUI selector from a data selector. The limitations on the selector
   * are the same as for [["domutil".toGUISelector]].
   *
   * @param selector A selector fit for selecting in the data tree.
   *
   * @param namespaces The namespace mappings to use to convert prefixes in the
   * selector.
   *
   * @returns A [[GUISelector]] corresponding to the parameters used.
   */
  static fromDataSelector(selector: string,
                          namespaces: Record<string, string>): GUISelector {
    return new GUISelector(toGUISelector(selector, namespaces));
  }
}

//  LocalWords:  MPL
