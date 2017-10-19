/**
 * Data saving functionality, using IndexedDB. Note that this saver is mainly
 * designed for demonstration purposes.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Runtime } from "../runtime";
import * as saver from "../saver";
import { TreeUpdater } from "../tree-updater";
export interface Store {
    put(name: string, data: string): Promise<void>;
}
export interface Options extends saver.SaverOptions {
    /**
     * The "name" of the file to save. This is the key used to save the file.
     */
    name: string;
    getStore(): Store;
}
/**
 * Defines a saver that uses IndexedDB to save documents.
 *
 * This saver stores the document as a "file" into an IndexedDB instance. The
 * objects are not really files but similar to files. Henceforth, the name
 * "file" will be used without quotes to refer to the objects stored.
 *
 * @param version The version of wed for which this object is
 * created.
 *
 * @param dataUpdater The updater that the editor created for its data tree.
 *
 * @param dataTree The editor's data tree.
 *
 * @param options The options specific to this class.
 */
export declare class Saver extends saver.Saver {
    private readonly name;
    private readonly store;
    private readonly initPromise;
    /**
     * @param runtime The runtime under which this saver is created.
     *
     * @param version The version of wed for which this object is created.
     *
     * @param dataUpdater The updater that the editor created for its data tree.
     *
     * @param dataTree The editor's data tree.
     *
     * @param options The options specific to this class.
     */
    constructor(runtime: Runtime, version: string, dataUpdater: TreeUpdater, dataTree: Node, options: Options);
    init(): Promise<void>;
    _save(autosave: boolean): Promise<void>;
    _update(name: string, data: string, autosave: boolean, savingGeneration: number): Promise<void>;
    _recover(): Promise<boolean>;
}
