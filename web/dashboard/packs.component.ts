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

import { ConfirmService } from "./confirm.service";
import { PacksService } from "./packs.service";
import { ProcessingService } from "./processing.service";
import { XMLFilesService } from "./xml-files.service";

@Component({
  moduleId: module.id,
  selector: "packs-component",
  templateUrl: "./packs.component.html",
  styleUrls: ["./generic-records.component.css"],
  providers: [
    { provide: "Loader", useExisting: PacksService },
    { provide: "Clearable", useExisting: PacksService },
  ],
})
export class PacksComponent extends
GenericRecordsComponent<Pack, PacksService> {
  // We must have the constructor here so that it can be annotated by the
  // decorator and Angular can find its bearings.
  constructor(router: Router,
              files: PacksService,
              processing: ProcessingService,
              confirmService: ConfirmService,
              private readonly xmlFiles: XMLFilesService) {
    super(router, files, processing, confirmService, PACKS);
  }

  del(record: Pack): Promise<void> {
    const handleResponse = (result: boolean) => {
      if (!result) {
        return;
      }

      return this.xmlFiles.getByPack(record.id!)
        .then((xmlFiles) => {
          const promises = [];
          for (const file of xmlFiles) {
            file.pack = undefined;
            promises.push(this.xmlFiles.updateRecord(file));
          }

          return Promise.all(promises);
        })
        .then(() => this.files.deleteRecord(record));
    };

    // Packs are special. They may be referrenced from an XML file. If that is
    // the case we cannot just delete the pack. So we check whether the pack is
    // in use. If so, we present a special confirmation prompt.
    return this.xmlFiles.isPackUsed(record.id!)
      .then((used) => {
        if (used) {
          return this.confirmService.confirm(
            `This pack is used by some XML files. If you delete it, the pack \
set for the files that use it will be reset and you will have to reassociated \
the files with this pack. Do you really want to delete "${record.name}"?`)
            .then(handleResponse);
        }

        // We always ask for confirmation.
        return this.confirmService.confirm(
          `Do you really want to delete "${record.name}"?`)
          .then(handleResponse);
      });

  }
}
