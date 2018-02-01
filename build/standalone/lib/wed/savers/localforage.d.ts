/// <reference types="localforage" />
import { Runtime, saver, treeUpdater } from "wed";
import TreeUpdater = treeUpdater.TreeUpdater;
/**
 * Create a localforage store instance. If you have code that needs to
 * access the store that this saver uses. You need to call this
 * function first.
 *
 * @returns A configured localforage instance.
 */
export declare function config(): LocalForage;
/**
 * @typedef Options
 * @type {Object}
 * @property {string} name
 */
export interface Options extends saver.SaverOptions {
    /**
     * The "name" of the file to save. This is the key used to save the file in
     * localforage.
     */
    name: string;
}
export interface FileRecord {
    /** The format version of the record. */
    version: number;
    /** The name of the file. */
    name: string;
    /** The data in the file. */
    data: string;
    /** The last date at which the file was uploaded or the string "never". */
    uploaded: Date | string;
    /** The last date at which the file was saved or the string "never". */
    saved: Date | string;
    /** The last date at which the file was downloaded or the string "never". */
    downloaded: Date | string;
}
/**
 * Utility function used to make file records.
 *
 * @param name The name of the file.
 *
 * @param data The data to save.
 *
 * @returns The record.
 */
export declare function makeFileRecord(name: string, data: string): FileRecord;
/**
 * Defines a saver that uses localforage to save documents.
 *
 * This saver stores the document as a "file" into a localforage instance. The
 * objects are not really files but similar to files. Henceforth, the name
 * "file" will be used without quotes to refer to the objects stored.
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
    private _update(name, data, autosave, savingGeneration);
    _recover(): Promise<boolean>;
}
