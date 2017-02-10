"use strict";

import { Component, Inject } from "@angular/core";
import { Clearable } from "./db.service";
import { safeConfirm } from "./util";

@Component({
  // moduleId: module.id,
  selector: "clear-store-component",
  template: `\
<button (click)="clear()" class="form-control pull-right" name="clear-all">\
Clear these files from storage\
</button>&nbsp;\
`,
})
export class ClearStoreComponent {
  constructor(@Inject("Clearable") private db: Clearable) {}

  clear(): void {
    safeConfirm("Are you sure you want to clear from local storage all the " +
                "files associated with wed?")
      .then((result: boolean) => {
        if (!result) {
          return;
        }

        this.db.clear();
      });
  }
}
