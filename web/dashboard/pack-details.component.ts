import { Location } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Params } from "@angular/router";
import { Subscription } from "rxjs";

import { MetadataService,
         NameIdArray as MetadataInfoArray } from "./metadata.service";
import { MetasService } from "./metas.service";
import { ModesService } from "./modes.service";
import { Pack } from "./pack";
import { PacksService } from "./packs.service";
import { NameIdArray as SchemaInfoArray,
         SchemasService } from "./schemas.service";
import { updateFormErrors } from "./util";

@Component({
  // moduleId: module.id,
  selector: "pack-details-component",
  templateUrl: "./pack-details.component.html",
})
export class PackDetailsComponent implements OnInit {
  form?: NgForm;
  @ViewChild("form")
  currentForm: NgForm;
  formSub: Subscription;
  readonly formErrors: {[name: string]: string } = {
    name: "",
  };
  readonly validationMessages: {[name: string]: {[name: string]: string}}= {
    name: {
      required: "Name is required.",
    },
    mode: {
      required: "Mode is required.",
    },
    schema: {
      required: "Schema is required.",
    },
    meta: {
      required: "Meta is required.",
    },
    Metadata: {
      required: "Metadata is required.",
    },
  };

  file: Pack;
  modes: string[];
  schemas: SchemaInfoArray;
  metas: string[];
  metadata: MetadataInfoArray;

  constructor(private readonly files: PacksService,
              private readonly modesService: ModesService,
              private readonly schemasService: SchemasService,
              private readonly metasService: MetasService,
              private readonly metadataService: MetadataService,
              private readonly route: ActivatedRoute,
              private readonly location: Location) {}

  ngOnInit(): void {
    this.modes = this.modesService.modes;
    this.metas = this.metasService.metas;
    Promise.all(
      [this.schemasService.nameIdArray.then(
        (schemas) => this.schemas = schemas),
       this.metadataService.nameIdArray.then(
         (metadata) => this.metadata = metadata)])
      .then(() => {
        this.route.params
          .switchMap((params: Params) => {
            const id = +params["id"];
            return id ? this.files.getRecordById(id) :
              Promise.resolve(new Pack(""));
          })
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
