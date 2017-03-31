/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Component, Inject, Optional } from "@angular/core";
import { Router } from "@angular/router";

import { ConfirmService } from "./confirm.service";
import { GenericRecordsComponent } from "./generic-records.component";
import { PacksService } from "./packs.service";
import { ProcessingService } from "./processing.service";
import { XML_FILES } from "./route-paths";
import { XMLFile } from "./xml-file";
import { XMLFilesService } from "./xml-files.service";
import { XMLTransformService } from "./xml-transform.service";

@Component({
  moduleId: module.id,
  selector: "xml-files-component",
  templateUrl: "./xml-files.component.html",
  styleUrls: ["./generic-records.component.css"],
  providers: [
    { provide: "Loader", useExisting: XMLFilesService },
    { provide: "Clearable", useExisting: XMLFilesService },
  ],
})
export class XMLFilesComponent
extends GenericRecordsComponent<XMLFile, XMLFilesService> {
  constructor(router: Router,
              files: XMLFilesService,
              processing: ProcessingService,
              confirmService: ConfirmService,
              @Optional() @Inject(XMLTransformService)
              readonly xmlTransforms: XMLTransformService[] | null,
              private readonly packsService: PacksService) {
    super(router, files, processing, confirmService, XML_FILES);
  }

  download(record: XMLFile): Promise<void> {
    return super.download(record).then(() => {
      // We update the last time it was downloaded. We do not detect whether the
      // download was cancelled. Not sure we *could*, even...
      record.downloaded = new Date();
      return this.files.updateRecord(record)
      // Make sure we don't return anything.
        .then(() => { return; });
    });
  }

  edit(record: XMLFile): Promise<void> {
    return Promise.resolve().then(() => {
      if (record.pack === undefined) {
        throw new Error("edit launched on file without a pack");
      }

      const base = "../kitchen-sink.html?nodemo=1&localstorage=";
      return this.packsService.getRecordById(record.pack).then((pack) => {
        if (pack === undefined) {
          throw new Error(`cannot load pack: ${record.pack}`);
        }
        const here = window.location.href;
        const url =
          `${base}${this.files.makeIndexedDBURL(record)}&management=${here}`;
        this.goTo(url);
      });
    });
  }

  private goTo(url: string): void {
    window.location.href = url;
  }

  editButtonTitle(record: XMLFile): string {
    return record.pack !== undefined ? "Edit" :
      "This file needs a pack before editing.";
  }

  newFile(): Promise<void> {
    return this.confirmService.prompt("Give a name to your new file")
      .then((name) => {
        if (name === "") {
          return;
        }

        return this.files.writeCheck(name, this.confirmService.confirm)
          .then(({ write, record }) => {
            if (!write) {
              return;
            }

            return this.files.makeRecord(name, "")
              .then((newRecord) => {
                if (record !== null) {
                  newRecord.id = record.id;
                }

                return this.files.updateRecord(newRecord)
                // Void the return value.
                  .then(() => { return; });
              });
          });
      });
  }
}
