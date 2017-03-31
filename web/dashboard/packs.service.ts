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
  makeRecord(_name: string, data: string): Promise<Pack> {
    // We do not use the _name parameter as the name of packs is stored in the
    // pack.
    const obj = JSON.parse(data);
    if (obj.interchangeVersion !== 1) {
      throw new Error(`unknown interchangeVersion: ${obj.interchangeVersion}`);
    }

    // We have to store the schema and metadata into their respective tables,
    // and obtain the saved records.
    const metadataRecord = obj.metadata === undefined ?
      Promise.resolve(undefined) :
      this.chunksService.createRecord(obj.metadata);

    return Promise.all([this.chunksService.createRecord(obj.schema),
                        metadataRecord])
      .then(([schema, metadata]: [Chunk, Chunk | undefined]) => {
        const payload: PackPayload = {
          mode: obj.mode,
          meta: obj.meta,
          schema: schema.id,
          metadata: metadata === undefined ? undefined : metadata.id,
        };
        return new Pack(obj.name, payload);
      });
  }

  getDownloadData(record: Pack): Promise<string> {
    // We need to resolve the record ids stored for the schema and metadata.
    return Promise.all([record.schema, record.metadata]
                       .map((x) => {
                         if (x === undefined) {
                           return Promise.resolve(undefined);
                         }

                         return this.chunksService.getRecordById(x)
                            .then((chunk) => {
                              if (chunk === undefined) {
                                throw new Error("missing chunk");
                              }

                              return chunk.getData();
                            });
                       }))
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
