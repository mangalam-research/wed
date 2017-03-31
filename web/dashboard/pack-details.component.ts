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
  moduleId: module.id,
  selector: "pack-details-component",
  templateUrl: "./pack-details.component.html",
})
export class PackDetailsComponent implements OnInit {
  form?: NgForm;
  @ViewChild("form")
  currentForm?: NgForm;
  formSub: Subscription | undefined;
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
    // tslint:disable-next-line:no-floating-promises
    Promise.all(
      [this.schemasService.getNameIdArray().then(
        (schemas) => this.schemas = schemas),
       this.metadataService.getNameIdArray().then(
         (metadata) => this.metadata = metadata)])
      .then(() => {
        this.route.params
          .switchMap((params: Params) => {
            const idParam = params["id"];
            if (idParam !== undefined) {
              const id = +idParam;
              return this.files.getRecordById(id);
            }
            return Promise.resolve(new Pack(""));
          })
          .subscribe((record) => this.file = record!);
      });
  }

  ngAfterViewChecked(): void {
    this.formChanged();
  }

  formChanged(): void {
    if (this.currentForm === this.form) {
      return;
    }

    if (this.formSub !== undefined) {
      this.formSub.unsubscribe();
    }

    this.form = this.currentForm;
    if (this.form !== undefined) {
      this.formSub = this.form.valueChanges
        .subscribe(() => {
          this.onValueChanged();
        });
    }
  }

  onValueChanged(): void {
    if (this.form === undefined) {
      return;
    }

    updateFormErrors(this.form, this.formErrors, this.validationMessages);
  }

  onSubmit(event: Event): Promise<Pack> {
    event.stopPropagation();
    event.preventDefault();

    const file = this.file.clone();
    return Promise.resolve()
      .then(() => {
        return Promise.all([
          this.schemasService.getRecordById(+file.schema),
          file.metadata != null ? this.metadataService.getRecordById(+file.metadata) : undefined,
        ]);
      })
      .then(([schema, metadata]) => {
        file.schema = schema!.chunk;
        if (metadata !== undefined) {
          file.metadata = metadata.chunk;
        }
        return this.files.updateRecord(file);
      });
  }

  goBack(): void {
    this.location.back();
  }
}
