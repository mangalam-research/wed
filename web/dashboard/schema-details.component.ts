import { Location } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";

import { Schema } from "./schema";
import { SchemasService } from "./schemas.service";

@Component({
  // moduleId: module.id,
  selector: "schema-details-component",
  templateUrl: "./schema-details.component.html",
})
export class SchemaDetailsComponent implements OnInit {
  file: Schema;

  constructor(private files: SchemasService,
              private route: ActivatedRoute,
              private location: Location) {}

  ngOnInit(): void {
    this.route.params
      .switchMap((params: Params) => this.files.getRecordById(+params["id"]))
      .subscribe((record) => this.file = record);
  }

  goBack(): void {
    this.location.back();
  }
}
