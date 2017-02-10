/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { GenericRecordsComponent } from "./generic-records.component";
import { ProcessingService } from "./processing.service";
import { SCHEMAS } from "./route-paths";
import { Schema } from "./schema";
import { SchemasService } from "./schemas.service";

@Component({
  // moduleId: module.id,
  selector: "schemas-component",
  templateUrl: "./schemas.component.html",
  providers: [
    { provide: "Loader", useExisting: SchemasService },
    { provide: "Clearable", useExisting: SchemasService },
  ],
})
export class SchemasComponent extends
GenericRecordsComponent<Schema, SchemasService> {
  // We must have the constructor here so that it can be annotated by the
  // decorator and Angular can find its bearings.
  constructor(router: Router,
              files: SchemasService,
              processing: ProcessingService) {
    super(router, files, processing, SCHEMAS);
  }

  protected getDownloadData(record: Schema): Promise<string> {
    return Promise.resolve(record.data);
  }
}
