/**
 * @desc The files service for the files module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Injectable } from "@angular/core";
import { DBService } from "./db.service";
import { db } from "./store";
import { XMLFile } from "./xml-file";

@Injectable()
export class XMLFilesService extends DBService<XMLFile, number> {
  constructor() {
    super(db.xmlfiles);
  }

  makeRecord(name: string, data: string): Promise<XMLFile> {
    return Promise.resolve(new XMLFile(name, data));
  }

  makeIndexedDBURL(file: XMLFile, property?: string): string {
    return db.makeIndexedDBURL(db.xmlfiles, file, property);
  }
}
