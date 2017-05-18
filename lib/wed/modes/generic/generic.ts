/**
 * The main module for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as Promise from "bluebird";
import * as $ from "jquery";
import { NameResolver } from "salve";

import { Action } from "wed/action";
import { BaseMode, Editor } from "wed/mode";
import * as objectCheck from "wed/object-check";
import { Transformation, TransformationData } from "wed/transformation";
import { GenericDecorator } from "./generic-decorator";
import { Meta } from "./generic-meta";
import { makeTagTr } from "./generic-tr";

/**
 * This is the class that implements the generic mode. This mode decorates all
 * the elements of the file being edited. On the basis of the schema used by wed
 * for validation, it allows the addition of the elements authorized by the
 * schema.
 *
 * Recognized options:
 *
 * - ``meta``: this option can be a path (a string) pointing to a module that
 *   implements the meta object needed by the mode. Or it can be an object of
 *   the form:
 *
 *         {
 *             path: "path/to/the/meta",
 *             options: {
 *                 // Meta-specific options.
 *             }
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
// tslint:disable-next-line:no-any
class GenericMode extends BaseMode<any> {
  protected resolver: NameResolver;
  protected meta: Meta;
  protected tagTr: Record<string, Transformation<TransformationData>>;
  /**
   * @param editor The editor with which the mode is being associated.
   *
   * @param options The options for the mode.
   */
  // tslint:disable-next-line:no-any
  constructor(editor: Editor, options: any) {
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
      meta: true,
      autoinsert: false,
    };

    const ret = objectCheck.check(template, this.options);

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
        const options = this.options;
        const resolved = $.extend(true, {}, options);
        if (options != null && options.meta != null) {
          let meta = resolved.meta;
          if (typeof meta === "string") {
            meta = resolved.meta = {
              path: meta,
            };
          }
          else if (typeof meta.path !== "object") {
            return this.editor.runtime.resolveModules(meta.path)
              .then((mods: {}[]) => {
                const mod = mods[0];
                resolved.meta.path = mod;
                this.options = resolved;
              });
          }
        }

        return undefined;
      })
      .then(() => {
        // tslint:disable-next-line:variable-name
        const MetaClass = this.options.meta.path.Meta;
        this.meta = new MetaClass(this.editor.runtime,
                                  this.options.meta.options);
        return this.meta.init();
      })
      .then(() => {
        this.resolver = new NameResolver();
        const mappings = this.meta.getNamespaceMappings();
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
    args = [this, this.meta, this.options].concat(args);
    GenericDecorator.apply(obj, args);
    return obj;
  }

  /**
   * Returns a short description for an element. The element should be named
   * according to the mappings reported by the resolve returned by
   * [["mode".Mode.getAbsoluteResolver]]. The generic mode delegates the call to
   * the meta object it was asked to use.
   *
   * @param name The name of the element.
   *
   * @returns The description. If the value returned is ``undefined``, then the
   * description is not available. If the value returned is ``null``, the
   * description has not been loaded yet.
   */
  shortDescriptionFor(name: string): string | null | undefined {
    return this.meta.shortDescriptionFor(name);
  }

  /**
   * Returns a URL to the documentation for an element. The element should be
   * named according to the mappings reported by the resolve returned by
   * [["mode".Mode.getAbsoluteResolver]]. The generic mode delegates the call to
   * the meta object it was asked to use.
   *
   * @param name The name of the element.
   *
   * @returns The URL. If the value returned is ``undefined``, then URL is not
   * available. If the value returned is ``null``, the URL has not been loaded
   * yet.
   */
  documentationLinkFor(name: string): string | null | undefined {
    return this.meta.documentationLinkFor(name);
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
