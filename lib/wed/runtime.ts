/**
 * An execution runtime for editors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as Promise from "bluebird";
import * as bluejax from "bluejax";
import { Dexie } from "dexie";
import * as mergeOptions from "merge-options";

import { make as ajax } from "./ajax";
import * as util from "./util";

/**
 * An object representing the runtime environment in which an editor is
 * running. In particular it allows loading external resources.
 */
export class Runtime {
  // tslint:disable-next-line:no-any
  private readonly options: any;
  private readonly ajax: bluejax.AjaxCall;
  private readonly ajax$: bluejax.AjaxCall$;

  // tslint:disable-next-line:no-any
  constructor(options: any) {
    // Make a private deep copy.
    options = mergeOptions({}, options);
    this.options = options;
    const bluejaxOptions = options.bluejaxOptions != null ?
      options.bluejaxOptions : {
      tries: 3,
      delay: 100,
      diagnose: {
        on: true,
        // It would be desirable to support this...
        // serverURL: "/ping",
        knownServers: [
          // tslint:disable:no-http-string
          "http://www.google.com/",
          "http://www.cloudfront.com/",
          // tslint:enable:no-http-string
        ],
      },
    };
    const made = ajax(bluejaxOptions);

    this.ajax = made.ajax;
    this.ajax$ = made.ajax$;
  }

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
  resolve(resource: string): Promise<{}> {
    return Promise.resolve().then(() => {
      const schemeSep = resource.indexOf("://");

      if (schemeSep === -1) {
        return this.ajax({
          url: resource,
          dataType: "text",
        });
      }

      const scheme = resource.substr(0, schemeSep);
      if (scheme === "indexeddb") {
        const path = resource.substr(schemeSep + 3);
        const parts = path.split("/");
        const version = parts[0];
        const db = parts[1];
        const table = parts[2];
        const keyType = parts[3];
        let key: string | number = parts[4];
        const property = parts[5];

        if (version !== "v1") {
          throw new Error("unsupported version number: " + version);
        }

        switch (keyType) {
        case "string":
          break;
        case "number":
          key = Number(key);
          break;
        default:
          throw new Error("unknown type: " + keyType);
        }

        const store = new Dexie(db);
        return store.open()
          .then(() => store.table(table).get(key))
          .then((record) => {
            if (record == null) {
              throw Error(`cannot resolve key from: ${resource}`);
            }

            if (property === undefined) {
              return record;
            }

            if (!(property in record)) {
              throw Error(
                `cannot resolve property in the record of: ${resource}`);
            }

            return record[property];
          });
      }

      throw new Error(`unknown scheme: ${scheme}`);
    });
  }

  resolveToString(resource: string): Promise<string> {
    return this.resolve(resource).then((data: {}) => {
      if (typeof data === "string") {
        return data;
      }

      if (data instanceof File) {
        return util.readFile(data);
      }

      return String(data);
    });
  }

  /**
   * Resolve modules through the underlying module loader.
   *
   * @param resources A single module name or an array of such names.
   *
   * @returns promise of modules.
   */
  resolveModules(resources: string | string[]): Promise<{}[]> {
    return Promise.resolve().then(() => {
      if (!(resources instanceof Array)) {
        resources = [resources];
      }

      return new Promise((resolve, reject) => {
        requirejs(resources as string[], function success(): void {
          resolve(Array.prototype.slice.call(arguments));
        }, reject);
      }) as Promise<{}[]>;
    });
  }
}
