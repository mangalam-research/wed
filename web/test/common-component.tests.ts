import { ComponentFixture } from "@angular/core/testing";
import * as sinon from "sinon";

import { DBService } from "../dashboard/db.service";
import {
  GenericRecordsComponent,
} from "../dashboard/generic-records.component";
import { RecordCommon } from "../dashboard/record-common";

import { TestSuite } from "./test-framework";
import { waitForSuccess } from "./util";

const expect = chai.expect;

export type ComponentType =
  GenericRecordsComponent<RecordCommon, DBService<RecordCommon, number>>;

export interface ComponentTestState {
  component: ComponentType;
  el: HTMLElement;
  fixture: ComponentFixture<ComponentType>;
  recordsService: DBService<RecordCommon, number>;
  sandbox: sinon.SinonSandbox;
}

export const renderTests = new TestSuite<ComponentTestState>("renders HTML")
  .record((ctx) => {
    ctx.it("informs the user the table is empty, when it is empty", (tctx) => {
      const { fixture, component, el } = tctx.state;

      expect(component.records).to.have.length.greaterThan(0);
      const trs = el.getElementsByTagName("tr");

      // +1 for the headings.
      const origLength = component.records.length + 1;
      expect(trs).to.have.length(origLength);

      // The special row is missing.
      expect(el.querySelector(".files-table-empty"),
             "special row should be missing").to.be.null;

      component.records = [];
      fixture.detectChanges();
      return waitForSuccess(() => {
        expect(trs).to.have.length(2);
        // The last row is the special row that indicates the table is empty.
        expect(trs[trs.length - 1].classList.contains("files-table-empty"),
               "the special row should be present").to.be.ok;
      });
    });

    ctx.it("displays each record", (tctx) => {
      const { fixture, component, el, recordsService } = tctx.state;
      const trs = el.getElementsByTagName("tr");
      // +1 for the headings.
      const origLength = component.records.length + 1;
      expect(trs).to.have.length(origLength);

      // Let's drop a record and see that the HTML is updated.
      return recordsService.deleteRecord(component.records[1])
        .then(() =>
              waitForSuccess(() => {
                fixture.detectChanges();
                expect(trs).to.have.length(origLength - 1);
              }));
    });

    ctx.it("each record has a data-record-name attribute", (tctx) => {
      const { component, el } = tctx.state;
      const trs = el.getElementsByTagName("tr");
      let recordIndex = 0;
      for (const tr of Array.from(trs).slice(1)) {
        expect(tr.attributes.getNamedItem("data-record-name").value)
          .to.equal(component.records[recordIndex].name);
        recordIndex++;
      }
    });

    ctx.it("the last record is in the ``last`` class", (tctx) => {
      const { el } = tctx.state;
      const trs = el.getElementsByTagName("tr");
      const last = trs[trs.length - 1];
      expect(last.classList.contains("last"),
             "the last record should have the class 'last'").to.be.ok;
    });

  });

export const eventTests = new TestSuite<ComponentTestState>("handles events")
  .record((ctx) => {
    ctx.it("deletes a record when the delete button is clicked", (tctx) => {
      const { component, el, fixture } = tctx.state;
      const origSize = component.records.length;
      const remainingRecord = component.records[1];
      const deleteButton =
        el.querySelector(".btn.delete-button")! as HTMLAnchorElement;
      deleteButton.click();
      fixture.detectChanges();
      return waitForSuccess(() => {
        fixture.detectChanges();
        expect(component.records).to.have.length(origSize - 1);
      })
        .then(() => expect(component.records[0])
              .to.have.property("name", remainingRecord.name));
    });

    ctx.it("downloads when the download button is clicked", (tctx) => {
      const { component, el, fixture, sandbox } = tctx.state;
      const downloadStub = sandbox.stub(component, "triggerDownload");
      const downloadButton =
        el.querySelector(".btn.download-button")! as HTMLAnchorElement;
      downloadButton.click();
      fixture.detectChanges();
      return waitForSuccess(() => expect(downloadStub.callCount).to.equal(1));
    });

    // We cannot test the upload support here. There is no way to fill an
    // input with type="file" with actual files. We can blank such element
    // (el.value = "").

  });
