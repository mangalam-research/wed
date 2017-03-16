/**
 * @desc The files service for the files module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Injectable } from "@angular/core";
import { Chunk } from "./chunk";
import { ChunksService } from "./chunks.service";
import { DBService } from "./db.service";
import { db } from "./store";
import { XMLFile } from "./xml-file";

@Injectable()
export class XMLFilesService extends DBService<XMLFile, number> {
  constructor(private readonly chunksService: ChunksService) {
    super(db.xmlfiles);
  }

  makeRecord(name: string, data: string): Promise<XMLFile> {
    return Chunk.makeChunk(data)
      .then((chunk) => this.chunksService.updateRecord(chunk))
      .then((chunk) => new XMLFile(name, chunk));
  }

  getDownloadData(record: XMLFile): Promise<string> {
    return record.getData();
  }

  makeIndexedDBURL(file: XMLFile, property?: string): string {
    return db.makeIndexedDBURL(db.xmlfiles, file, property);
  }

  isPackUsed(pack: number): Promise<boolean> {
    // We just check whether there are any records in the query and return true
    // if there are.
    return this.table.where({ pack }).first()
      .then((record) => record !== undefined);
  }

  getByPack(pack: number): Promise<XMLFile[]> {
    return this.table.where({ pack }).toArray();
  }
}
