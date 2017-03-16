import { Location } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";

import { Metadata } from "./metadata";
import { MetadataService } from "./metadata.service";

@Component({
  moduleId: module.id,
  selector: "metadata-details-component",
  templateUrl: "./metadata-details.component.html",
})
export class MetadataDetailsComponent implements OnInit {
  file: Metadata;

  constructor(private files: MetadataService,
              private route: ActivatedRoute,
              private location: Location) {}

  ngOnInit(): void {
    this.route.params
      .switchMap((params: Params) => this.files.getRecordById(+params["id"]))
      .subscribe((record) => {
        if (!record) {
          throw new Error("record does not exist");
        }

        this.file = record;
      });
  }

  goBack(): void {
    this.location.back();
  }
}
