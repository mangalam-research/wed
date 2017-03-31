import { Component } from "@angular/core";
import * as bootbox from "bootbox";

import { ConfirmService } from "./confirm.service";
import { ProcessingService } from "./processing.service";
import { db } from "./store";
import { readFile } from "./store-util";
import { triggerDownload } from "./util";

@Component({
  moduleId: module.id,
  selector: "control-component",
  templateUrl: "./control.component.html",
})
export class ControlComponent {

  constructor(private readonly processing: ProcessingService,
              private readonly confirmService: ConfirmService) {};

  download(): void {
    // tslint:disable-next-line:no-floating-promises
    this.dump().then((dump) => {
      this.triggerDownload("backup", dump);
    });
  }

  triggerDownload(name: string, data: string): void {
    triggerDownload(name, data);
  }

  /**
   * Dumps the database data to a string.
   */
  dump(): Promise<string> {
    // tslint:disable-next-line:no-any
    const dump: any = {
      creationDate: new Date().toString(),
      interchangeVersion: 1,
      tables: {
      },
    };

    const tableDump = dump.tables;
    return Promise.all(db.tables.map(
      (table) => table.toArray().then((records) => {
        tableDump[table.name] = records;
        if (table.name === "chunks") {
          // The chunks table is special. Each chunk contains a file field which
          // is a File object. However, File is not serializable. The only part
          // of the File we use is its content, so replace the file with the
          // string value of its content.
          return Promise.all(records.map(
            (record) => readFile(record.file).then((read) => {
              record.file = read;
            }))).then(() => undefined);
        }

        return undefined;
      }))).then(() => JSON.stringify(dump));
  }

  change(ev: Event): Promise<void> {
    return Promise.resolve().then(() => {
      const target = (ev.target as HTMLInputElement);
      const filesToLoad = target.files;

      if (filesToLoad == null) {
        return;
      }

      switch (filesToLoad.length) {
      case 0:
        return;
      case 1:
        break; // Continue on...
      default:
        throw new Error("internal error: the control cannot " +
                        "be used for multiple files");
      }

      this.processing.start(1);
      // tslint:disable-next-line:no-floating-promises
      return this.confirmService.confirm(
        `This upload will wipe the data currently in your database. \
Do you really want to do this?`)
        .then((confirmed) => {
          if (!confirmed) {
            return;
          }

          return readFile(filesToLoad[0])
            .then((data) => this.load(data))
            .then(() => {
              this.processing.increment();
            })
            .catch((err) => {
              bootbox.alert(`Cannot load this data. ${err.message}`);
            });
        }).then(() => {
          this.processing.stop();
          target.value = "";
        }).catch(() => {
          this.processing.stop();
          target.value = "";
        });
    });
  }

  /**
   * Load a dump into the database. **THIS WILL WIPE THE DATABASE.**
   *
   * @param data A data dump.
   */
  load(data: string): Promise<void> {
    return Promise.resolve().then(() => {
      const dump = JSON.parse(data);
      if (dump.interchangeVersion !== 1) {
        throw new Error(`incorrect version number: ${dump.interchangeVersion}`);
      }

      const tableDump = dump.tables;
      return Promise.all(db.tables.map(
        (table) => table.clear()
          .then(() => {
            const records = tableDump[table.name];
            if (records === undefined) {
              return;
            }

            // The chunks table is special. We have to recreate a File object
            // from the serialized data.
            if (table.name === "chunks") {
              for (const record of records) {
                record.file = new File([record.file], "");
              }
            }

            return table.bulkAdd(records);
          })))
        .then(() => undefined);
    });
  }

  clear(): Promise<void> {
    return this.confirmService
      .confirm("Do you really want to clear the database?")
      .then((confirmed): void | Promise<void> => {
        if (!confirmed) {
          return;
        }

        return Promise.all(db.tables.map((table) => table.clear()))
          .then(() => undefined);
      });
  }
}
