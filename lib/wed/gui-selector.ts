/**
 * GUI tree selectors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { toGUISelector } from "./domutil";

/**
 * A "GUI selector" is a CSS selector apt to be used in the GUI tree.
 */
export class GUISelector {
  // tslint:disable-next-line:variable-name
  private static __cache: Record<string, GUISelector> = Object.create(null);

  /**
   * @param value The value that the selector holds.
   */
  private constructor(readonly value: string) {
    const existing = GUISelector.__cache[value];
    if (existing !== undefined) {
      return existing;
    }

    GUISelector.__cache[value] = this;
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
   * are the same as for [["wed/domutil".toGUISelector]].
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
