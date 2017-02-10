/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Component, Inject } from "@angular/core";

import { Loader } from "./db.service";
import { ProcessingService } from "./processing.service";
import { safeConfirm } from "./util";

@Component({
  // moduleId: module.id,
  selector: "upload-component",
  templateUrl: "./upload.component.html",
})
export class UploadComponent {
  constructor(private processing: ProcessingService,
              @Inject("Loader") private db: Loader) {};

  change(ev: Event): void {
    const target = (ev.target as HTMLInputElement);
    const filesToLoad = target.files;
    if (filesToLoad && filesToLoad.length > 0) {
      const fileArray = Array.from(filesToLoad);
      this.processing.start(filesToLoad.length);
      // tslint:disable-next-line:prefer-const
      let next: () => Promise<undefined> = () => {
        const file: File = fileArray.shift()!;
        return this.db.safeLoadFromFile(file, safeConfirm)
          .then(() => fileArray.length ? next() : undefined);
      };

      next().then(() => {
        this.processing.stop();
        target.value = "";
      });
    }
  }
}
