/**
 * @desc The files service for the files module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Injectable } from "@angular/core";

import { DBService, NameIdArray as NIA } from "./db.service";
import { MetadataService } from "./metadata.service";
import { Pack, PackPayload } from "./pack";
import { SchemasService } from "./schemas.service";
import { db } from "./store";

export type NameIdArray = NIA<number>;

@Injectable()
export class PacksService extends DBService<Pack, number> {
  constructor(private readonly schemasService: SchemasService,
              private readonly metadataService: MetadataService) {
    super(db.packs);
  }

  makeRecord(name: string, data: string): Promise<Pack> {
    const obj = JSON.parse(data);
    if (obj.interchangeVersion !== 1) {
      throw new Error(`unknown interchangeVersion: ${obj.interchangeVersion}`);
    }

    // We have to store the schema and metadata into their respective tables,
    // and obtain the saved records.
    return Promise.all([this.schemasService.getOrCreateByData(name,
                                                              obj.schema),
                        this.metadataService.getOrCreateByData(name,
                                                               obj.metadata)])
      .then(([schema, metadata]) => {
        const payload: PackPayload = {
          mode: obj.mode,
          meta: obj.meta,
          schema: "" + schema.id,
          metadata: "" + metadata.id,
        };
        return new Pack(obj.name, payload);
      });
  }
}
