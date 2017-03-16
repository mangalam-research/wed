import { Component } from "@angular/core";
import * as bootbox from "bootbox";

import { ProcessingService } from "./processing.service";
import { db } from "./store";
import { readFile } from "./store-util";
import { safeConfirm, triggerDownload } from "./util";

@Component({
  moduleId: module.id,
  selector: "control-component",
  templateUrl: "./control.component.html",
})
export class ControlComponent {

  constructor(private processing: ProcessingService) {};

  download(): void {
    const dump: any = {
      creationDate: new Date().toString(),
      interchangeVersion: 1,
      tables: {
      },
    };

    const tableDump = dump.tables;
    Promise.all(db.tables.map(
      (table) => table.toArray().then((records) => {
        tableDump[table.name] = records;
      })))
      .then(() => {
        triggerDownload("backup", JSON.stringify(dump));
      });
  }

  change(ev: Event): void {
    const target = (ev.target as HTMLInputElement);
    const filesToLoad = target.files;

    if (!filesToLoad) {
      return;
    }

    switch (filesToLoad.length) {
    case 0:
      return;
    case 1:
      break; // Continue on...
    default:
      throw new Error("internal error: the upload cannot " +
                      "be used for multiple files");
    }

    this.processing.start(1);
    safeConfirm(
      `This upload will wipe the data currently in your database. \
Do you really want to do this?\
`)
      .then((confirmed) => {
        if (!confirmed) {
          return;
        }

        return readFile(filesToLoad[0]).then((data): any | Promise<any> => {
          const dump = JSON.parse(data);
          if (dump.interchangeVersion !== 1) {
            bootbox.alert(
              `Cannot load this data. Incorrect version number: \
${dump.interchangeVersion}`);
            return;
          }

          const tableDump = dump.tables;
          return Promise.all(db.tables.map(
            (table) => table.clear()
              .then(() => table.bulkAdd(tableDump[table.name]))));
        });
      }).then(() => {
        this.processing.stop();
        target.value = "";
      });
  }

  clear(): void {
    safeConfirm("Do you really want to clear the database?")
      .then((confirmed): any | Promise<any> => {
        if (!confirmed) {
          return;
        }

        return Promise.all(db.tables.map((table) => table.clear()));
      });
  }
}
