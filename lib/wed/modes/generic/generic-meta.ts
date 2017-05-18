/**
 * Meta-information regarding the schema.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as Promise from "bluebird";
import * as $ from "jquery";

import { Runtime } from "wed/runtime";

/**
 * Meta-information for the generic mode. This is information that cannot be
 * simply derived from the schema.
 *
 * Objects of this class take the following options:
 *
 * + ``metadata``: a URL to a JSON file that contains metadata that
 * this meta should read.
 *
 * It is illegal to use the meta before the value from ``init`` has resolved.
 */
export class Meta {

  protected descMap: Record<string, string> | null = null;
  protected namespaceMappings: Record<string, string>;
  protected reverseMapping: Record<string, string>;
  // tslint:disable-next-line:no-any
  protected metadata: any;
  /**
   * @param runtime The runtime in which this meta is executing.
   *
   * @param options The options to pass to the Meta.
   */
  constructor(protected readonly runtime: Runtime,
              // tslint:disable-next-line:no-any
              protected options: any = {}) {}

  /**
   * Initialize the meta.
   *
   * @returns A promise that resolves when the meta is ready.
   */
  init(): Promise<void> {
    return Promise.resolve()
      .then(() => {
        const options = this.options;
        const resolved = $.extend(true, {}, options);
        if (options != null && options.metadata != null) {
          return this.runtime.resolveToString(options.metadata)
            .then((data) => {
              data = JSON.parse(data);
              resolved.metadata = data;
              this.options = resolved;
            });
        }

        return undefined;
      })
      .then(() => {
        this.metadata = this.options.metadata;

        if (this.metadata != null) {
          if (this.metadata.version !== "1") {
            throw new Error(
              `unexpected version number: ${this.metadata.version}`);
          }

          this.namespaceMappings = this.metadata.namespaces;
          if ("xml" in this.namespaceMappings) {
            throw new Error("xml mapping already defined");
          }

          // tslint:disable-next-line:no-http-string
          this.namespaceMappings.xml = "http://www.w3.org/XML/1998/namespace";

          this.reverseMapping = Object.create(null);
          // tslint:disable-next-line:forin
          for (const prefix in this.namespaceMappings) {
            const ns = this.namespaceMappings[prefix];
            // If prefix foo resolves to http://bar and bar resolves to the same
            // URI and foo is before bar, then foo wins.
            if (this.reverseMapping[ns] === undefined) {
              this.reverseMapping[ns] = prefix;
            }
          }
          this.reverseMapping[this.namespaceMappings[""]] = "";

          const elements = this.metadata.elements;
          const descMap: Record<string, string> = Object.create(null);
          for (const el of elements) {
            // Here, an undefined namespace is the tei namespace.
            const elNs = el.ns !== undefined ? el.ns :
              // tslint:disable-next-line:no-http-string
              "http://www.tei-c.org/ns/1.0";
            const elPrefix = this.reverseMapping[elNs];
            if (elPrefix === undefined) {
              throw new Error(`undefined namespace: ${elNs}`);
            }
            const name = elPrefix === "" ? el.name : `${elPrefix}:${el.name}`;
            descMap[name] = el.desc;
          }
          this.descMap = descMap;
        }
      });
  }

  /**
   * This method determines whether a node needs to be represented inline.
   *
   * @param node The node to examine.
   *
   * @return True if the node should be inline, false otherwise.
   */
  isInline(node: Element): boolean {
    return false;
  }

  /**
   * Returns additional classes that should apply to a node.
   *
   * @param node The node to check.
   *
   * @returns A string that contains all the class names separated by spaces. In
   * other words, a string that could be put as the value of the ``class``
   * attribute in an HTML tree.
   */
  getAdditionalClasses(node: Element): string {
    const ret = [];
    if (this.isInline(node)) {
      ret.push("_inline");
    }
    return ret.join(" ");
  }

  /**
   * Returns absolute namespace mappings. The default implementation returns an
   * empty mapping.
   *
   * @returns An object whose keys are namespace prefixes and values are
   * namespace URIs. The object returned by this method should not be modified.
   */
  getNamespaceMappings(): Record<string, string> {
    return this.namespaceMappings;
  }

  /**
   * Returns a short description for an element. The element should be named
   * according to the mappings reported by [[Meta.getNamespaceMappings]]. The
   * default implementation returns the description provided by the metadata
   * file loaded when the Meta object was created.
   *
   * While this API provides for the case where descriptions have not been
   * loaded yet or cannot be loaded, this class does not allow such eventuality
   * to occur. Derived classes could allow it.
   *
   * @param name The name of the element.
   *
   * @returns The description. If the value returned is ``undefined``, then the
   * description is not available. If the value returned is ``null``, the
   * description has not been loaded yet.
   */
  shortDescriptionFor(name: string): string | null | undefined {
    return this.descMap != null ? this.descMap[name] : null;
  }

  /**
   * Returns a URL to the documentation for an element. The element should be
   * named according to the mappings reported by the resolve returned by
   * [["mode".Mode.getAbsoluteResolver]].
   *
   * While this API provides for the case such URL have not been loaded yet or
   * cannot be loaded, this class does not allow such eventuality to
   * occur. Derived classes could allow it.
   *
   * @param name The name of the element.
   *
   * @returns The URL. If the value returned is ``undefined``, then the URL is
   * not available. If the value returned is ``null``, the URL has not been
   * loaded yet.
   */
  documentationLinkFor(name: string): string | null | undefined {
    if (this.metadata == null) {
      return undefined;
    }

    const root = this.metadata.dochtml;

    // The TEI odd2html stylesheet creates file names of the form
    // prefix_local-name.html. So replace the colon with an underscore.
    name = name.replace(":", "_");

    return `${root}ref-${name}.html`;
  }
}

//  LocalWords:  classdesc Mangalam MPL Dubeau
