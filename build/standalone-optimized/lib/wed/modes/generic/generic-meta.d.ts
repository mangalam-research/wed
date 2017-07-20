/// <reference types="bluebird" />
/**
 * Meta-information regarding the schema.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as Promise from "bluebird";
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
export declare class Meta {
    protected readonly runtime: Runtime;
    protected options: any;
    protected descMap: Record<string, string> | null;
    protected namespaceMappings: Record<string, string>;
    protected reverseMapping: Record<string, string>;
    protected metadata: any;
    /**
     * @param runtime The runtime in which this meta is executing.
     *
     * @param options The options to pass to the Meta.
     */
    constructor(runtime: Runtime, options?: any);
    /**
     * Initialize the meta.
     *
     * @returns A promise that resolves when the meta is ready.
     */
    init(): Promise<void>;
    /**
     * This method determines whether a node needs to be represented inline.
     *
     * @param node The node to examine.
     *
     * @return True if the node should be inline, false otherwise.
     */
    isInline(node: Element): boolean;
    /**
     * Returns additional classes that should apply to a node.
     *
     * @param node The node to check.
     *
     * @returns A string that contains all the class names separated by spaces. In
     * other words, a string that could be put as the value of the ``class``
     * attribute in an HTML tree.
     */
    getAdditionalClasses(node: Element): string;
    /**
     * Returns absolute namespace mappings. The default implementation returns an
     * empty mapping.
     *
     * @returns An object whose keys are namespace prefixes and values are
     * namespace URIs. The object returned by this method should not be modified.
     */
    getNamespaceMappings(): Record<string, string>;
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
    shortDescriptionFor(name: string): string | null | undefined;
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
    documentationLinkFor(name: string): string | null | undefined;
}
