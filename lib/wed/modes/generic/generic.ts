/**
 * The main module for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as Promise from "bluebird";
import { NameResolver } from "salve";

import { Action } from "wed/action";
import { BaseMode, Editor } from "wed/mode";
import * as objectCheck from "wed/object-check";
import { Transformation, TransformationData } from "wed/transformation";
import { GenericDecorator } from "./generic-decorator";
import { makeTagTr } from "./generic-tr";
import { Metadata } from "./metadata";
import { MetadataMultiversionReader } from "./metadata-multiversion-reader";

export interface GenericModeOptions {
  metadata: string;
  autoinsert?: boolean;
}

/**
 * This is the class that implements the generic mode. This mode decorates all
 * the elements of the file being edited. On the basis of the schema used by wed
 * for validation, it allows the addition of the elements authorized by the
 * schema.
 *
 * Recognized options:
 *
 * - ``metadata``: this option can be a path (a string) pointing to a module
 *   that implements the metadata needed by the mode. Or it can be an object
 *   of the form:
 *
 *         {
 *             path: "path/to/the/metadata",
 *         }
 *
 * - ``autoinsert``: whether or not to fill newly inserted elements as much as
 *   possible. If this option is true, then when inserting a new element, the
 *   mode will try to detect whether the element has any mandatory children and
 *   if so will add these children to the element. For instance, if ``foo`` is
 *   invalid without the child ``baz`` then when inserting ``foo`` in the
 *   document, the following structure would be inserted
 *   ``<foo><baz></baz></foo>``. This automatic insertion of children happens
 *   only in non-ambiguous cases. Taking the same example as before, if ``foo``
 *   could contain ``a`` or ``b``, then the mode won't add any children. This
 *   option is ``true`` by default.
 */
class GenericMode extends BaseMode<GenericModeOptions> {
  protected resolver: NameResolver;
  protected metadata: Metadata;
  protected tagTr: Record<string, Transformation<TransformationData>>;
  /**
   * @param editor The editor with which the mode is being associated.
   *
   * @param options The options for the mode.
   */
  // tslint:disable-next-line:no-any
  constructor(editor: Editor, options: GenericModeOptions) {
    super(editor, options);

    if (this.constructor === GenericMode) {
      // Set our metadata.
      this.wedOptions.metadata = {
        name: "Generic",
        authors: ["Louis-Dominique Dubeau"],
        description:
        "This is a basic mode bundled with wed and which can, " +
          "and probably should be used as the base for other modes.",
        license: "MPL 2.0",
        copyright:
        "2013, 2014 Mangalam Research Center for Buddhist Languages",
      };
    }
    // else it is up to the derived class to set it.

    const template = {
      metadata: true,
      autoinsert: false,
    };

    // tslint:disable-next-line:no-any
    const ret = objectCheck.check(template, this.options as any);

    if (this.options.autoinsert === undefined) {
      this.options.autoinsert = true;
    }

    const errors: string[] = [];
    if (ret.missing !== undefined) {
      for (const name of ret.missing) {
        errors.push(`missing option: ${name}`);
      }
    }

    if (ret.extra !== undefined) {
      for (const name of ret.extra) {
        errors.push(`extra option: ${name}`);
      }
    }

    if (errors.length !== 0) {
      throw new Error(`incorrect options: ${errors.join(", ")}`);
    }
    this.wedOptions.attributes = "edit";
  }

  init(): Promise<void> {
    return Promise.resolve()
      .then(() => {
        this.tagTr = makeTagTr(this.editor);
        return this.editor.runtime.resolveToString(this.options.metadata)
          .then((data: string) => {
            const obj = JSON.parse(data);
            this.metadata = new MetadataMultiversionReader().read(obj);
          });
      })
      .then(() => {
        this.resolver = new NameResolver();
        const mappings = this.metadata.getNamespaceMappings();
        for (const key of Object.keys(mappings)) {
          this.resolver.definePrefix(key, mappings[key]);
        }
      });
  }

  getAbsoluteResolver(): NameResolver {
    return this.resolver;
  }

  makeDecorator(): GenericDecorator {
    const obj = Object.create(GenericDecorator.prototype);
    let args = Array.prototype.slice.call(arguments);
    args = [this, this.metadata, this.options].concat(args);
    GenericDecorator.apply(obj, args);
    return obj;
  }

  /**
   * Returns a short description for an element. The element should be named
   * according to the mappings reported by the resolve returned by
   * [["mode".Mode.getAbsoluteResolver]]. The generic mode delegates the call to
   * the metadata.
   *
   * @param name The name of the element.
   *
   * @returns The description. If the value returned is ``undefined``, then the
   * description is not available. If the value returned is ``null``, the
   * description has not been loaded yet.
   */
  shortDescriptionFor(name: string): string | null | undefined {
    const ename = this.resolver.resolveName(name);
    if (ename === undefined) {
      return undefined;
    }
    return this.metadata.shortDescriptionFor(ename);
  }

  /**
   * Returns a URL to the documentation for an element. The element should be
   * named according to the mappings reported by the resolve returned by
   * [["mode".Mode.getAbsoluteResolver]]. The generic mode delegates the call to
   * the metadata.
   *
   * @param name The name of the element.
   *
   * @returns The URL. If the value returned is ``undefined``, then URL is not
   * available. If the value returned is ``null``, the URL has not been loaded
   * yet.
   */
  documentationLinkFor(name: string): string | null | undefined {
    const ename = this.resolver.resolveName(name);
    if (ename === undefined) {
      return undefined;
    }

    return this.metadata.documentationLinkFor(ename);
  }

  /**
   * The generic mode's implementation merely returns what it has stored in its
   * transformation registry.
   */
  getContextualActions(transformationType: string | string[],
                       tag: string,
                       container: Node,
                       offset: number): Action<{}>[] {
    if (!(transformationType instanceof Array)) {
      transformationType = [transformationType];
    }

    const ret = [];
    for (const ttype of transformationType) {
      const val = this.tagTr[ttype];
      if (val !== undefined) {
        ret.push(val);
      }
    }
    return ret;
  }
}

export { GenericMode as Mode };

//  LocalWords:  gui jquery Mangalam MPL Dubeau
