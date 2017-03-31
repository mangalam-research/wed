import { Inject, Injectable, Optional } from "@angular/core";
import * as bootbox from "bootbox";

import { safeConfirm } from "./util";

export type Confirmer = (message: string) => Promise<boolean>;
export type Prompter = (message: string) => Promise<string>;

export function bootboxAdapter(message: string): Promise<string> {
  return new Promise((resolve) => {
    bootbox.prompt(message, resolve);
  });
}

@Injectable()
export class ConfirmService {
  private readonly confirmer: Confirmer = safeConfirm;
  private readonly prompter: Prompter = bootboxAdapter;

  // We cannot use TypeScript's support for default parameter values because
  // @Optional passes ``null`` if no value has been specified, but TypeScript's
  // generated code only checks for ``undefined`` when deciding to check whether
  // to use the default value. (IOW, an argument of ``null`` means: don't use
  // the default value. Sigh...
  constructor(@Optional() @Inject("Confirmer") confirmer: Confirmer,
              @Optional() @Inject("Prompter") prompter: Prompter) {
    if (confirmer != null) {
      this.confirmer = confirmer;
    }
    if (prompter != null) {
      this.prompter = prompter;
    }
  }

  confirm(message: string): Promise<boolean> {
    return this.confirmer(message);
  }

  prompt(message: string): Promise<string> {
    return this.prompter(message);
  }
}
