/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { Pack } from "./pack";
import { PACKS } from "./route-paths";

import { GenericRecordsComponent } from "./generic-records.component";

import { MetadataService } from "./metadata.service";
import { PacksService } from "./packs.service";
import { ProcessingService } from "./processing.service";
import { SchemasService } from "./schemas.service";

@Component({
  // moduleId: module.id,
  selector: "packs-component",
  templateUrl: "./packs.component.html",
  providers: [
    { provide: "Loader", useExisting: PacksService },
    { provide: "Clearable", useExisting: PacksService },
  ],
})
export class PacksComponent extends GenericRecordsComponent<Pack, PacksService> {
  // We must have the constructor here so that it can be annotated by the
  // decorator and Angular can find its bearings.
  constructor(router: Router,
              files: PacksService,
              processing: ProcessingService,
              private readonly schemasService: SchemasService,
              private readonly metadataService: MetadataService) {
    super(router, files, processing, PACKS);
  }

  protected getDownloadData(record: Pack): Promise<string> {
    // We need to resolve the record ids stored for the schema and metadata.
    return Promise.all([
      this.schemasService.getRecordById(+record.schema),
      this.metadataService.getRecordById(+record.metadata),
    ]).then(([schema, metadata]) => {
      return JSON.stringify({
        interchangeVersion: 1,
        name: record.name,
        schema: schema.data,
        mode: record.mode,
        meta: record.meta,
        metadata: metadata.data,
      });
    });
  }
}
