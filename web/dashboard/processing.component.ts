import { Component, ElementRef, ViewChild } from "@angular/core";
import "bootstrap";
import * as $ from "jquery";

import { ProcessingService } from "./processing.service";

@Component({
  moduleId: module.id,
  selector: "processing-component",
  templateUrl: "./processing.component.html",
})
export class ProcessingComponent {
  @ViewChild("modal")
  private modalRef: ElementRef;
  private $modal: JQuery;
  private progress: HTMLElement;

  constructor(private service: ProcessingService) {}

  ngAfterViewInit(): void {
    const element = this.modalRef.nativeElement;
    this.$modal = $(element);
    this.progress = element.getElementsByClassName("bar")[0] as HTMLElement;
    this.service.state.subscribe(({ total, count }) => {
      if (total === 0) {
        this.$modal.modal("hide");
      }
      else {
        const percent = count / total * 100;
        this.progress.style.width = "" + percent + "%";
        this.$modal.modal("show");
      }
    });
  }
}
