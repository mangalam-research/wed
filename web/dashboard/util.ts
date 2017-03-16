/**
 * @desc Utilities
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { NgForm } from "@angular/forms";
import * as bootbox from "bootbox";

import { readFile } from "./store-util";

// The default behavior for bootbox.confirm is to make the default button be the
// one that says "yes".
export function safeConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    bootbox.confirm({
      message,
      buttons: {
        cancel: {
          label: "No",
          className: "btn-default btn-primary pull-left",
        },
        confirm: {
          label: "Yes",
          className: "btn-danger pull-right",
        },
      },
      callback: resolve,
    });
  });
}

export function triggerDownload(name: string, data: string): void {
  const file = new window.Blob([data], { type: "text/xml" });
  const URL = (window as any).webkitURL || window.URL;
  const downloadUrl = URL.createObjectURL(file);

  // We need this for IE 10, 11. For lesser versions of IE we'll fall into
  // the other branch that won't work but we don't support those old
  // browsers anyway.
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(file, name);
  }
  else {
    // This rigmarole allows the download button to **download** rather than
    // open the link in a new window.
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = downloadUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Checks if the contents of two files are equal. File names are ignored.
 *
 * @param a File to compare.
 *
 * @param b File to compare.
 *
 * @returns Whether they are equal.
 */
export function filesEqual(a: File, b: File): Promise<boolean> {
  return Promise.resolve()
    .then(() => {
      if (a.size !== b.size) {
        return false;
      }

      return Promise.all([readFile(a), readFile(b)])
        .then(([contentA, contentB]) => contentA === contentB);
    });
}

type FormErrors = {[name: string]: string };
type ValidationMessages = {[name: string]: {[name: string]: string}};

export function updateFormErrors(ngForm: NgForm,
                                 formErrors: FormErrors,
                                 validationMessages: ValidationMessages): void {
  const form = ngForm.form;

  /* tslint:disable:forin */
  for (const field in formErrors) {
    // clear previous error message (if any)
    formErrors[field] = "";
    const control = form.get(field);

    if (control && control.dirty && !control.valid) {
      const messages = validationMessages[field];
      for (const key in control.errors) {
        formErrors[field] += messages[key] + " ";
      }
    }
  }
  /* tslint:enable:forin */
}
