/// <reference types="bluebird" />
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
import { Metadata } from "./metadata";
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
declare class GenericMode<Options extends GenericModeOptions> extends BaseMode<Options> {
    protected resolver: NameResolver;
    protected metadata: Metadata;
    protected tagTr: Record<string, Transformation<TransformationData>>;
    /**
     * The template that [[checkOptions]] uses to check the options passed
     * to this mode. Consider this object to be immutable.
     */
    readonly optionTemplate: objectCheck.Template;
    /**
     * @param editor The editor with which the mode is being associated.
     *
     * @param options The options for the mode.
     */
    constructor(editor: Editor, options: Options);
    init(): Promise<void>;
    /**
     * Check that the options are okay. This method will throw if there are any
     * unexpected options or mandatory options are missing.
     *
     * @param options The options to check.
     */
    checkOptions(options: GenericModeOptions): void;
    /**
     * Make a [[Metadata]] object for use with this mode. The default
     * implementation requires that there be a ``metadata`` option set and
     * uses that to load a metadata file. Derived classes can override
     * this as needed.
     */
    makeMetadata(): Promise<Metadata>;
    getAbsoluteResolver(): NameResolver;
    makeDecorator(): GenericDecorator;
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
    shortDescriptionFor(name: string): string | null | undefined;
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
    documentationLinkFor(name: string): string | null | undefined;
    /**
     * The generic mode's implementation merely returns what it has stored in its
     * transformation registry.
     */
    getContextualActions(transformationType: string | string[], tag: string, container: Node, offset: number): Action<{}>[];
}
export { GenericMode as Mode };
