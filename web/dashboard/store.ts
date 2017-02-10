/**
 * @desc The store for the dashboard.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

//
// See these issues regarding dexie:
//
// https://github.com/dfahlander/Dexie.js/issues/317
// https://github.com/dfahlander/Dexie.js/issues/116
//
// https://github.com/inexorabletash/indexeddb-promises
//
import Dexie from "dexie";

import { Metadata } from "./metadata";
import { Pack } from "./pack";
import { Schema } from "./schema";
import { XMLFile } from "./xml-file";

export type XMLFilesTable = Dexie.Table<XMLFile, number>;
export type PackTable = Dexie.Table<Pack, number>;
export type SchemaTable = Dexie.Table<Schema, number>;
export type MetadataTable = Dexie.Table<Metadata, number>;

export class Store extends Dexie {
  xmlfiles: XMLFilesTable;
  packs: PackTable;
  schemas: SchemaTable;
  metadata: MetadataTable;

  constructor() {
    super("wed");
    this.version(1).stores({
      xmlfiles: "++id,&name",
      packs: "++id,&name",
      schemas: "++id,&name,&sum",
      metadata: "++id,&name,&sum",
    });

    this.xmlfiles.mapToClass(XMLFile);
    this.packs.mapToClass(Pack);
    this.schemas.mapToClass(Schema);
    this.metadata.mapToClass(Metadata);

    // As a matter of convention in this application we remove keys that
    // start with __.
    function creationHook(_key: any, obj: any): void {
      for (const prop in obj) {
        if (prop.lastIndexOf("__", 0) === 0) {
          delete obj[prop];
        }
      }
    }

    function updateHook(modifications: any, _key: any, _obj: any): any {
      const ret: {[name: string]: any} = {};
      for (const prop in modifications) {
        if (prop.lastIndexOf("__", 0) === 0) {
          // This is an instruction to Dexie to remove the value.
          ret[prop] = undefined;
        }
      }
      return ret;
    }

    for (const table of this.tables) {
      table.hook("creating", creationHook);
      table.hook("updating", updateHook);
    }
  }

  makeIndexedDBURL(table: Dexie.Table<any, any>, object: any,
                   property?: string): string {
    const keyPath = table.schema.primKey.keyPath;
    if (keyPath instanceof Array) {
      throw new Error("does not support compound indexes");
    }

    const key = object[keyPath];
    const keyType = typeof key;

    if (["number", "string"].indexOf(keyType) === -1) {
      throw new Error("cannot use primary key of type: " + keyType);
    }

    const dbname = this.name;
    const tname = table.name;
    let url = `indexeddb://v1/${dbname}/${tname}/${keyType}/${key}`;
    if (property) {
      url += `/${property}`;
    }

    return url;
  }
};

export const db: Store = new Store();
