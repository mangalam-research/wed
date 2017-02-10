/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Component } from "@angular/core";
import { Router } from "@angular/router";

import * as bootbox from "bootbox";
import { GenericRecordsComponent } from "./generic-records.component";
import { PacksService } from "./packs.service";
import { ProcessingService } from "./processing.service";
import { XML_FILES } from "./route-paths";
import { safeConfirm } from "./util";
import { XMLFile } from "./xml-file";
import { XMLFilesService } from "./xml-files.service";

@Component({
  // moduleId: module.id,
  selector: "xml-files-component",
  templateUrl: "./xml-files.component.html",
  providers: [
    { provide: "Loader", useExisting: XMLFilesService },
    { provide: "Clearable", useExisting: XMLFilesService },
  ],
})
export class XMLFilesComponent
extends GenericRecordsComponent<XMLFile, XMLFilesService> {
  // We must have the constructor here so that it can be annotated by the
  // decorator and Angular can find its bearings.
  constructor(router: Router,
              files: XMLFilesService,
              processing: ProcessingService,
              private packsService: PacksService) {
    super(router, files, processing, XML_FILES);
  }

  download(record: XMLFile): void {
    super.download(record);

    // We update the last time it was downloaded. We do not detect whether the
    // download was cancelled. Not sure we *could*, even...
    record.downloaded = new Date();
    this.files.updateRecord(record);
  }

  protected getDownloadData(record: XMLFile): Promise<string> {
    return Promise.resolve(record.data);
  }

  edit(record: XMLFile): void {
    if (!record.pack) {
      throw new Error("edit launched on file without a pack");
    }

    const base = "../kitchen-sink.html?localstorage=";
    this.packsService.getRecordById(record.pack).then((pack) => {
      if (!pack) {
        throw new Error(`cannot load pack: ${record.pack}`);
      }
      const url = `${base}${this.files.makeIndexedDBURL(record)}`;
      window.location.href = url;
    });

  }

  newFile(): void {
    bootbox.prompt("Give a name to your new file", (name: string) => {
      if (!name) {
        return;
      }

      this.files.writeCheck(name, safeConfirm).then(({ write, record }) => {
        if (write) {
          const newRecord = new XMLFile(name, "");
          if (record) {
            newRecord.id = record.id;
          }
          this.files.updateRecord(newRecord);
        }
      });
    });
  }
}
