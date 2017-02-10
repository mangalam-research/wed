import { Location } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Params } from "@angular/router";
import { Subscription } from "rxjs";

import { NameIdArray, PacksService } from "./packs.service";
import { updateFormErrors } from "./util";
import { XMLFile } from "./xml-file";
import { XMLFilesService } from "./xml-files.service";

@Component({
  // moduleId: module.id,
  selector: "xml-file-details-component",
  templateUrl: "./xml-file-details.component.html",
})
export class XMLFileDetailsComponent implements OnInit {
  form?: NgForm;
  @ViewChild("form")
  currentForm: NgForm;
  formSub: Subscription;
  readonly formErrors: {[name: string]: string } = {};
  readonly validationMessages: {[name: string]: {[name: string]: string}}= {
    name: {
      required: "Name is required.",
    },
    pack: {
      required: "Pack is required.",
    },
  };

  file: XMLFile;
  packs: NameIdArray;

  constructor(private files: XMLFilesService,
              private packService: PacksService,
              private route: ActivatedRoute,
              private location: Location) {}

  ngOnInit(): void {
    this.packService.nameIdArray.then(
      (packs) => this.packs = packs).then(() =>  {
        this.route.params
          .switchMap((params: Params) => this.files.getRecordById(+params["id"]))
          .subscribe((record) => this.file = record);
      });
  }

  ngAfterViewChecked(): void {
    this.formChanged();
  }

  formChanged(): void {
    if (this.currentForm === this.form) {
      return;
    }

    if (this.formSub) {
      this.formSub.unsubscribe();
    }

    this.form = this.currentForm;
    if (this.form) {
      this.formSub = this.form.valueChanges
        .subscribe(() => this.onValueChanged());
    }
  }

  onValueChanged(): void {
    if (!this.form) {
      return;
    }

    updateFormErrors(this.form, this.formErrors, this.validationMessages);
  }

  onSubmit(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const file = this.file;
    this.files.updateRecord(file);
  }

  goBack(): void {
    this.location.back();
  }
}
