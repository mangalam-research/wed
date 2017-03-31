import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { ConfirmService } from "../dashboard/confirm.service";
import {
  GenericRecordsComponent,
} from "../dashboard/generic-records.component";
import { ProcessingService } from "../dashboard/processing.service";
import { XML_FILES } from "../dashboard/route-paths";
import { XMLFile } from "../dashboard/xml-file";
import { XMLFilesService } from "../dashboard/xml-files.service";

@Component({
  moduleId: module.id,
  selector: "mmwp-transforms-component",
  templateUrl: "../mmwp-transforms.component.html",
  styleUrls: ["../dashboard/generic-records.component.css"],
  providers: [
    { provide: "Loader", useExisting: XMLFilesService },
    { provide: "Clearable", useExisting: XMLFilesService },
  ],
})
export class MMWPTransformsComponent
extends GenericRecordsComponent<XMLFile, XMLFilesService> {
    constructor(router: Router,
                files: XMLFilesService,
                processing: ProcessingService,
                confirmService: ConfirmService) {
    super(router, files, processing, confirmService, XML_FILES);
  }
}
