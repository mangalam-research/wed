/**
 * The main module for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import mergeOptions from "merge-options";
import { DefaultNameResolver, EName } from "salve";

import { Action, BaseMode, CommonModeOptions, Decorator, EditorAPI, objectCheck,
         transformation } from "wed";
import { GenericDecorator } from "./generic-decorator";
import { makeTagTr } from "./generic-tr";
import { Metadata } from "./metadata";
import { MetadataMultiversionReader } from "./metadata-multiversion-reader";

import Transformation = transformation.Transformation;
import NamedTransformationData = transformation.NamedTransformationData;

export interface GenericModeOptions extends CommonModeOptions {
  metadata: string;
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
 *   that implements the metadata needed by the mode.
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
class GenericMode<Options extends GenericModeOptions>
  extends BaseMode<Options> {
  protected resolver!: DefaultNameResolver;
  protected metadata!: Metadata;
  protected tagTr!: Record<string, Transformation<NamedTransformationData>>;

  /**
   * The template that [[checkOptions]] uses to check the options passed
   * to this mode. Consider this object to be immutable.
   */
  readonly optionTemplate: objectCheck.Template = {
    metadata: true,
    autoinsert: false,
  };

  // tslint:disable-next-line:no-any
  constructor(editor: EditorAPI, options: Options) {
    super(editor, options);

    if (this.constructor === GenericMode) {
      // Set our metadata.
      this.wedOptions = mergeOptions({}, this.wedOptions);
      this.wedOptions.metadata = {
        name: "Generic",
        authors: ["Louis-Dominique Dubeau"],
        description:
        "This is a basic mode bundled with wed and which can, " +
          "and probably should be used as the base for other modes.",
        license: "MPL 2.0",
        copyright: "Mangalam Research Center for Buddhist Languages",
      };
    }
    // else it is up to the derived class to set it.

    this.wedOptions.attributes = "edit";
  }

  init(): Promise<void> {
    this.checkOptions(this.options);

    if (this.options.autoinsert === undefined) {
      this.options.autoinsert = true;
    }

    return Promise.resolve()
      .then(() => {
        this.tagTr = makeTagTr(this.editor);
        return this.makeMetadata().then((metadata) => {
          this.metadata = metadata;
        });
      })
      .then(() => {
        this.resolver = new DefaultNameResolver();
        const mappings = this.metadata.getNamespaceMappings();
        for (const key of Object.keys(mappings)) {
          this.resolver.definePrefix(key, mappings[key]);
        }
      });
  }

  /**
   * Check that the options are okay. This method will throw if there are any
   * unexpected options or mandatory options are missing.
   *
   * @param options The options to check.
   */
  checkOptions(options: GenericModeOptions): void {
    objectCheck.assertExtensively(this.optionTemplate, options);
  }

  /**
   * Make a [[Metadata]] object for use with this mode. The default
   * implementation requires that there be a ``metadata`` option set and
   * uses that to load a metadata file. Derived classes can override
   * this as needed.
   */
  makeMetadata(): Promise<Metadata> {
    return this.editor.runtime.resolveToString(this.options.metadata)
      .then((data: string) => {
        const obj = JSON.parse(data);
        return new MetadataMultiversionReader().read(obj);
      });
  }

  getAbsoluteNamespaceMappings(): Record<string, string> {
    // We return a copy of the metadata's namespace mapping. A shallow copy
    // is good enough.
    return {... this.metadata.getNamespaceMappings()};
  }

  unresolveName(name: EName): string | undefined {
    return this.metadata.unresolveName(name);
  }

  getAbsoluteResolver(): DefaultNameResolver {
    return this.resolver;
  }

  makeDecorator(): Decorator {
    return new GenericDecorator(this, this.editor, this.metadata, this.options);
  }

  /**
   * Returns a short description for an element. The element should be named
   * according to the mappings reported by the resolve returned by
   * [["wed/mode".Mode.getAbsoluteResolver]]. The generic mode delegates the
   * call to the metadata.
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
   * [["wed/mode".Mode.getAbsoluteResolver]]. The generic mode delegates the
   * call to the metadata.
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
                       _tag: string,
                       _container: Node,
                       _offset: number): Action<{}>[] {
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

//  LocalWords:  gui jquery Mangalam MPL Dubeau metadata's
