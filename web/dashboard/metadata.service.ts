/**
 * @desc The files service for the files module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Injectable } from "@angular/core";
import md5 = require("blueimp-md5");

import { DBService, NameIdArray as NAI} from "./db.service";
import { Metadata } from "./metadata";
import { db } from "./store";

export type NameIdArray = NAI<number>;

@Injectable()
export class MetadataService extends DBService<Metadata, number> {
  constructor() {
    super(db.metadata);
  }

  makeRecord(name: string, data: string): Promise<Metadata> {
    return Promise.resolve(new Metadata(name, data));
  }

  getByData(data: string): Promise<Metadata> {
    return this.table.get({ sum: md5(data) });
  }

  getOrCreateByData(packName: string, data: string): Promise<Metadata> {
    return this.getByData(data)
      .then((record) => {
        if (record) {
          return record;
        }

        return this.updateRecord(new Metadata(`@@${packName}`, data));
      });
  }
}
