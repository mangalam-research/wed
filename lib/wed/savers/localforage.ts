/**
 * Data saving functionality, using localforage. Note that this saver is mainly
 * designed for demonstration purposes.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as localforage from "localforage";

// Everything from wed must be loaded from "wed".
import { Runtime, saver, treeUpdater } from "wed";

import TreeUpdater = treeUpdater.TreeUpdater;

/**
 * Create a localforage store instance. If you have code that needs to
 * access the store that this saver uses. You need to call this
 * function first.
 *
 * @returns A configured localforage instance.
 */
export function config(): LocalForage {
  return localforage.createInstance({
    name: "wed",
    storeName: "files",
  });
}

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
export function makeFileRecord(name: string, data: string): FileRecord {
  const ret: FileRecord = Object.create(null);
  ret.version = 1;
  ret.name = name;
  ret.data = data;
  ret.uploaded = new Date();
  ret.saved = "never";
  ret.downloaded = "never";
  return ret;
}

/**
 * Defines a saver that uses localforage to save documents.
 *
 * This saver stores the document as a "file" into a localforage instance. The
 * objects are not really files but similar to files. Henceforth, the name
 * "file" will be used without quotes to refer to the objects stored.
 */
export class Saver extends saver.Saver {
  private readonly name: string;
  private readonly store: LocalForage;
  private readonly initPromise: Promise<void> = Promise.resolve();

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
  constructor(runtime: Runtime, version: string, dataUpdater: TreeUpdater,
              dataTree: Node, options: Options) {
    super(runtime, version, dataUpdater, dataTree, options);

    this.initialized = true;
    this.failed = false;
    this.name = options.name;

    this.store = config();

    this.setAutosaveInterval(5 * 60 * 1000);
  }

  init(): Promise<void> {
    // It is initialized from the get-go.
    return this.initPromise;
  }

  _save(autosave: boolean): Promise<void> {
    return Promise.resolve().then(() => {
      if (!this.initialized) {
        return;
      }

      return this._update(this.name, this.getData(), autosave,
                          this.currentGeneration)
      // All save errors produced by this saver are handled with this._fail.
        .catch(() => undefined);
    });
  }

  private _update(name: string, data: string, autosave: boolean,
                  savingGeneration: number): Promise<void> {
    return this.store.getItem(name).then(((rec: FileRecord) => {
      if (rec.version !== 1) {
        throw new Error(`unexpected record version number: ${rec.version}`);
      }
      rec.data = data;
      rec.saved = new Date();
      return this.store.setItem(name, rec).then(() => {
        this._saveSuccess(autosave, savingGeneration);
      }).catch(() => {
        const error = { type: undefined, msg: "Failed to save!" };
        this._fail(error);
        throw new Error("save failed");
      });
      // tslint:disable-next-line:no-any
    }) as (rec: {}) => Promise<void>);
  }

  _recover(): Promise<boolean> {
    return this._save(false)
      .then(() => true)
      .catch(() => false);
  }
}

//  LocalWords:  localforage MPL runtime
