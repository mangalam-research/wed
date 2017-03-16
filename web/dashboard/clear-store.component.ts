"use strict";

import { Component, Inject } from "@angular/core";

import { ConfirmService } from "./confirm.service";
import { Clearable } from "./db.service";

@Component({
  moduleId: module.id,
  selector: "clear-store-component",
  template: `\
<button (click)="clearClicked()" class="form-control pull-right" \
name="clear-all">\
Clear these files from storage\
</button>&nbsp;\
`,
})
export class ClearStoreComponent {
  constructor(@Inject("Clearable") private readonly db: Clearable,
              private readonly confirmService: ConfirmService) {}

  clearClicked(): void {
    this.clear();
  }

  clear(): Promise<void> {
    return this.confirmService.confirm(
      "Are you sure you want to clear from local storage all the " +
        "files associated with wed?")
      .then((result: boolean) => {
        if (!result) {
          return;
        }

        return this.db.clear();
      });
  }
}
