/**
 * @desc The files service for the files module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Injectable } from "@angular/core";
import md5 = require("blueimp-md5");

import { DBService, NameIdArray as NAI } from "./db.service";
import { Schema } from "./schema";
import { db } from "./store";

export type NameIdArray = NAI<number>;

@Injectable()
export class SchemasService extends DBService<Schema, number> {
  constructor() {
    super(db.schemas);
  }

  makeRecord(name: string, data: string): Promise<Schema> {
    return Promise.resolve(new Schema(name, data));
  }

  getByData(data: string): Promise<Schema> {
    return this.table.get({ sum: md5(data) });
  }

  getOrCreateByData(packName: string, data: string): Promise<Schema> {
    return this.getByData(data)
      .then((record) => {
        if (record) {
          return record;
        }

        return this.updateRecord(new Schema(`@@${packName}`, data));
      });
  }
}
