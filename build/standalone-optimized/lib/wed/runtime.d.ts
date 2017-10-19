/**
 * An execution runtime for editors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as bluejax from "bluejax";
import { Options } from "./options";
/**
 * An object representing the runtime environment in which an editor is
 * running. In particular it allows loading external resources.
 */
export declare class Runtime {
    readonly options: Options;
    readonly ajax: bluejax.AjaxCall;
    readonly ajax$: bluejax.AjaxCall$;
    constructor(options: Options);
    /**
     * Resolve resource references. References may be of the form:
     *
     * - String without a URL scheme identifier. Performs an Ajax query with the
     *   resource string as-is.
     *
     * - `indexeddb://v1/database/table/type/key/property` Loads from
     *    IndexedDB. It opens the database `database`, looks for the table
     *    `table`, loads the item with primary key `key` and extracts the value of
     *    the property `property`. (`property` is optional. When not specified,
     *    the whole record will be returned.) The `type` must have the values
     *    `number` or `string` determining how `key` is going to be
     *    interpreted. `v1` is the version number of the interpretation scheme
     *    used.
     */
    resolve(resource: string): Promise<any>;
    resolveToString(resource: string): Promise<string>;
    /**
     * Resolve modules through the underlying module loader.
     *
     * @param resources A single module name or an array of such names.
     *
     * @returns promise of modules.
     */
    resolveModules(resources: string | string[]): Promise<{}[]>;
}
