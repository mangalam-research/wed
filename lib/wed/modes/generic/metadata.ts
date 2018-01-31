/**
 * Mode metadata.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { EName } from "salve";

export interface Metadata {
  /**
   * The name of the software that generated the JSON metadata used by this
   * object.
   */
  readonly generator?: string;

  /**
   * The date at which the file was generated.
   */
  readonly date?: string;

  /**
   * Records the version number of the format of the metadata file.
   */
  readonly version: string;

  /**
   * Returns absolute namespace mappings.
   *
   * @returns An object whose keys are namespace prefixes and values are
   * namespace URIs. The object returned by this method should not be modified.
   */
  getNamespaceMappings(): Record<string, string>;

  /**
   * This method determines whether a node needs to be represented inline.
   *
   * @param node The node to examine.
   *
   * @return True if the node should be inline, false otherwise.
   */
  isInline(node: Element): boolean;

  /**
   * Returns a short description for an element. The element should be named
   * according to the mappings reported by [[getNamespaceMappings]].
   *
   * @param name The name of the element.
   *
   * @returns The description. If the value returned is ``undefined``, then the
   * description is not available.
   */
  shortDescriptionFor(name: EName): string | undefined;

  /**
   * Returns a URL to the documentation for an element. The element should be
   * named according to the mappings reported by the resolve returned by
   * [["wed/mode".Mode.getAbsoluteResolver]].
   *
   * @param name The name of the element.
   *
   * @returns The URL. If the value returned is ``undefined``, then the URL is
   * not available.
   */
  documentationLinkFor(name: EName): string | undefined;

  /**
   * Unresolve a name using the mapping defined by the metadata.
   *
   * @param name The name to unresolve.
   *
   * @returns The unresolved name or ``undefined`` if the name cannot be
   * unresolved.
   */
  unresolveName(name: EName): string | undefined;
}

//  LocalWords:  MPL URIs
