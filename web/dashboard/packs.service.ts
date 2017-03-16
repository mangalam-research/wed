/**
 * @desc The files service for the files module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Injectable } from "@angular/core";

import { ChunksService } from "./chunks.service";
import { DBService, NameIdArray as NIA } from "./db.service";
import { Pack, PackPayload } from "./pack";
import { db } from "./store";

export type NameIdArray = NIA<number>;

@Injectable()
export class PacksService extends DBService<Pack, number> {
  constructor(private readonly chunksService: ChunksService) {
    super(db.packs);
  }

  /**
   * The string passed must be in the interchange format for packs.
   */
  makeRecord(data: string): Promise<Pack> {
    const obj = JSON.parse(data);
    if (obj.interchangeVersion !== 1) {
      throw new Error(`unknown interchangeVersion: ${obj.interchangeVersion}`);
    }

    // We have to store the schema and metadata into their respective tables,
    // and obtain the saved records.
    return Promise.all([this.chunksService.createRecord(obj.schema),
                        this.chunksService.createRecord(obj.metadata)])
      .then(([schema, metadata]) => {
        const payload: PackPayload = {
          mode: obj.mode,
          meta: obj.meta,
          schema: schema.id,
          metadata: metadata.id,
        };
        return new Pack(obj.name, payload);
      });
  }

  getDownloadData(record: Pack): Promise<string> {
    // We need to resolve the record ids stored for the schema and metadata.
    return Promise.all([record.schema, record.metadata]
                       .map((x) => this.chunksService.getRecordById(x)
                            .then((chunk) => chunk.getData())))
      .then(([schema, metadata]) => {
        return JSON.stringify({
          interchangeVersion: 1,
          name: record.name,
          schema,
          mode: record.mode,
          meta: record.meta,
          metadata,
        });
      });
  }
}
