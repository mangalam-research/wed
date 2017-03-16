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
import { DBService, NameIdArray as NAI} from "./db.service";
import { Metadata } from "./metadata";
import { db } from "./store";

export type NameIdArray = NAI<number>;

@Injectable()
export class MetadataService extends DBService<Metadata, number> {
  constructor(private readonly chunksService: ChunksService) {
    super(db.metadata);
  }

  makeRecord(name: string, data: string): Promise<Metadata> {
    return Chunk.makeChunk(data)
      .then((chunk) => this.chunksService.updateRecord(chunk))
      .then((chunk) => new Metadata(name, chunk));
  }

  getDownloadData(record: Metadata): Promise<string> {
    return record.getData();
  }

}
