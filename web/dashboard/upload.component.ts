/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Component, Inject } from "@angular/core";

import { ConfirmService } from "./confirm.service";
import { Loader } from "./db.service";
import { ProcessingService } from "./processing.service";

@Component({
  moduleId: module.id,
  selector: "upload-component",
  templateUrl: "./upload.component.html",
})
export class UploadComponent {
  constructor(private processing: ProcessingService,
              private readonly confirmService: ConfirmService,
              @Inject("Loader") private db: Loader<{}>) {};

  inputChange(ev: Event): void {
    // tslint:disable-next-line:no-floating-promises
    this.change(ev);
  }

  change(ev: Event): Promise<undefined> {
    return Promise.resolve().then(() => {
      const target = (ev.target as HTMLInputElement);
      const filesToLoad = target.files;
      if (filesToLoad != null && filesToLoad.length > 0) {
        const fileArray = Array.from(filesToLoad);
        this.processing.start(filesToLoad.length);
        // tslint:disable-next-line:prefer-const
        let next: () => Promise<undefined> = () => {
          const file: File = fileArray.shift()!;
          return this.db.safeLoadFromFile(
            file,
            this.confirmService.confirm.bind(this.confirmService))
            .then(() => fileArray.length !== 0 ? next() : undefined)
            .then(() => {
              this.processing.increment();
            });
        };

        return next().then(() => {
          this.processing.stop();
          target.value = "";
        });
      }

      return undefined;
    });
  }
}
