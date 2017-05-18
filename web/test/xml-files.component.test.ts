import "chai";
import "chai-as-promised";
import "mocha";
import * as sinon from "sinon";

const expect = chai.expect;

import { DebugElement } from "@angular/core";
import { ComponentFixture, ComponentFixtureAutoDetect,
         TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Router } from "@angular/router";

import { db } from "../dashboard/store";

import { ChunksService } from "../dashboard/chunks.service";
import { ClearStoreComponent } from "../dashboard/clear-store.component";
import { ConfirmService } from "../dashboard/confirm.service";
import { PacksService } from "../dashboard/packs.service";
import { ProcessingService } from "../dashboard/processing.service";
import { UploadComponent } from "../dashboard/upload.component";
import { XMLFile } from "../dashboard/xml-file";
import { XMLFilesComponent } from "../dashboard/xml-files.component";
import { XMLFilesService } from "../dashboard/xml-files.service";

import { ComponentTestState, eventTests,
         renderTests } from "./common-component.tests";
import { waitFor, waitForSuccess } from "./util";

// tslint:disable: no-empty
class RouterStub {
  // tslint:disable-next-line:no-any
  navigate(..._args: any[]): any {}
}

class FakeProcessingService {
  start(_total: number): void {}

  increment(): void {}

  stop(): void {}
}
// tslint:enable

describe("XMLFilesComponent", () => {
  let component: XMLFilesComponent;
  let fixture: ComponentFixture<XMLFilesComponent>;
  let de: DebugElement;
  let el: HTMLElement;
  let sandbox: sinon.SinonSandbox;
  let packsService: PacksService;
  let recordsService: XMLFilesService;
  let fakeConfirmer: sinon.SinonStub;
  let fakePrompter: sinon.SinonStub;
  let records: XMLFile[];

  // tslint:disable-next-line:mocha-no-side-effect-code
  const metadata = JSON.stringify({
    generator: "gen1",
    date: "date1",
    version: "ver1",
    namespaces: {
      foo: "foouri",
      bar: "baruri",
    },
  });

  const packAUnserialized = {
    name: "foo",
    interchangeVersion: 1,
    schema: "aaa",
    metadata,
    mode: "generic",
    meta: "tei",
  };

  // tslint:disable-next-line:mocha-no-side-effect-code
  const packA = JSON.stringify(packAUnserialized);

  // tslint:disable-next-line:mocha-no-side-effect-code
  const state: ComponentTestState = Object.create(null);

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    fakeConfirmer = sandbox.stub();
    fakeConfirmer.returns(Promise.resolve(true));
    fakePrompter = sandbox.stub();
    TestBed.configureTestingModule({
      declarations: [ ClearStoreComponent, UploadComponent, XMLFilesComponent ],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: true },
        ChunksService,
        ConfirmService,
        { provide: ProcessingService, useClass: FakeProcessingService },
        XMLFilesService,
        PacksService,
        { provide: "Confirmer", useValue: fakeConfirmer },
        { provide: "Prompter", useValue: fakePrompter },
        { provide: Router, useClass: RouterStub }],
    });

    return TestBed.compileComponents()
      .then(() => {
        packsService = TestBed.get(PacksService);
        recordsService = TestBed.get(XMLFilesService);

        return Promise.all(
          [{name: "a", data: "foo"},
           {name: "b", data: "foo b"}]
            .map((x) => recordsService.makeRecord(x.name, x.data)
                 .then((record) => recordsService.updateRecord(record))))
          .then((newRecords) => records = newRecords);
      })
      .then(() => {
        fixture = TestBed.createComponent(XMLFilesComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement.query(By.css("div"));
        el = de.nativeElement;
        state.component = component;
        state.fixture = fixture;
        state.el = el;
        state.recordsService = recordsService;
        state.sandbox = sandbox;
      })
    // Wait until the component has refreshed.
      .then(() => waitFor(() => component.records != null &&
                          component.records.length !== 0));
  });

  afterEach(() => db.delete().then(() => db.open()));

  function makeNavigationURL(record: XMLFile): string {
    const ls = recordsService.makeIndexedDBURL(record);
    const management = document.location.href;
    return `../kitchen-sink.html?nodemo=1&localstorage=${ls}\
&management=${management}`;
  }

  describe("#download", () => {
    it("updates the download date", () => {
      expect(component.records[0].downloaded).to.equal("never");
      return component.download(component.records[0])
       .then(() => expect(component.records[0].downloaded)
             .to.not.equal("never"));
    });
  });

  describe("#edit", () => {
    let goToStub: sinon.SinonStub;
    beforeEach(() => {
      goToStub = sandbox.stub(component, "goTo");
    });

    it("fails if the file has no pack associated with it", () =>
       expect(component.edit(component.records[0])).to.be.rejectedWith(
         Error,
         /edit launched on file without a pack/)
       .then(() => expect(goToStub.callCount).to.equal(0)));

    it("fails if the the pack is missing", () => {
      const stub = sandbox.stub(packsService, "getRecordById");
      stub.returns(Promise.resolve(undefined));
      component.records[0].pack = -999;
      return expect(component.edit(component.records[0])).to.be.rejectedWith(
        Error,
        /cannot load pack: -999/)
        .then(() => expect(goToStub.callCount).to.equal(0));
    });

    it("navigates if the file is fine", () => {
      const stub = sandbox.stub(packsService, "getRecordById");
      return packsService.makeRecord("", packA)
        .then((pack) => stub.returns(Promise.resolve(pack)))
        .then(() => component.records[0].pack = 1)
        .then(() => component.edit(component.records[0]))
        .then(() => {
          expect(goToStub.callCount).to.equal(1);
          expect(goToStub.firstCall.calledWith(
            makeNavigationURL(component.records[0]))).to.be.ok;
        });
    });
  });

  describe("#newFile", () => {
    it("prompts for a name", () => {
      fakePrompter.returns(Promise.resolve(""));
      return component.newFile()
        .then(() => expect(fakePrompter.callCount).to.equal(1));
    });

    it("is a no-op if the file name is the empty string", () => {
      fakePrompter.returns(Promise.resolve(""));
      const writeStub = sandbox.stub(recordsService, "writeCheck");
      const updateSpy = sandbox.stub(recordsService, "updateRecord");
      return component.newFile()
        .then(() => {
          expect(fakePrompter.callCount).to.equal(1);
          expect(writeStub.callCount).to.equal(0);
          expect(updateSpy.callCount).to.equal(0);
        });
    });

    it("is a no-op if the write check is negative", () => {
      fakePrompter.returns(Promise.resolve(records[0].name));
      const writeStub = sandbox.stub(recordsService, "writeCheck");
      const updateSpy = sandbox.stub(recordsService, "updateRecord");
      writeStub.returns(Promise.resolve({ write: false, record: null }));
      return component.newFile()
        .then(() => {
          expect(writeStub.callCount).to.equal(1);
          expect(updateSpy.callCount).to.equal(0);
        });
    });

    it("saves the file if write check is positive", () => {
      fakePrompter.returns(Promise.resolve(records[0].name));
      const writeStub = sandbox.stub(recordsService, "writeCheck");
      const updateSpy = sandbox.spy(recordsService, "updateRecord");
      writeStub.returns(Promise.resolve({ write: true, record: records[0] }));
      return component.newFile()
        .then(() => {
          expect(writeStub.callCount).to.equal(1);
          expect(updateSpy.callCount).to.equal(1);
          return expect(recordsService.getRecordByName(records[0].name)
                        .then((record) => record!.getData()))
            .to.eventually.equal("");
        });
    });
  });

  describe("#editButtonTitle", () => {
    it("returns a title that reflects whether the record has a pack", () => {
      expect(component.editButtonTitle(records[0]))
        .to.equal("This file needs a pack before editing.");
      records[0].pack = 1;
      expect(component.editButtonTitle(records[0]))
        .to.equal("Edit");
    });
  });

  // tslint:disable-next-line:mocha-no-side-effect-code
  renderTests.make(state);

  describe("renders HTML", () => {
    it("displays record information", () => {
      const trs = el.getElementsByTagName("tr");
      const tr = trs[1]; // Indexed at 1 to skip the header.

      const record = component.records[0];
      const tds = tr.getElementsByTagName("td");
      expect(tds[1].textContent).to.equal(record.name);
      expect(tds[2].textContent).to.equal("never");
      expect(tds[3].textContent).to.not.equal("never");
      expect(tds[3].textContent).to.not.equal("");
      expect(tds[4].textContent).to.equal("never");
    });

    it("records without a pack have their edit button disabled", () => {
      const stub = sandbox.stub(packsService, "getRecordById");
      return packsService.makeRecord("", packA)
        .then((pack) => stub.returns(Promise.resolve(pack)))
        .then(() => component.records[0].pack = 1)
      // Trigger a refresh
        .then(() => component.records = component.records.slice())
        .then(() => {
          fixture.detectChanges();
        })
        .then(() => {
          const trs = el.getElementsByTagName("tr");
          let sawDisabled = 0;
          let sawEnabled = 0;
          let recordIndex = 0;
          for (const tr of Array.from(trs).slice(1)) {
            const editButton = tr.querySelector(".btn.edit-button")!;
            const shouldBeDisabled = component.records[recordIndex].pack ===
              undefined;

            if (shouldBeDisabled) {
              sawDisabled++;
              expect(editButton.getAttribute("disabled")).to.not.be.null;
            }
            else {
              sawEnabled++;
              expect(editButton.getAttribute("disabled")).to.be.null;
            }
            expect(editButton.getAttribute("title"))
              .to.equal(shouldBeDisabled ?
                        "This file needs a pack before editing." :
                        "Edit");
            recordIndex++;
          }

          // Make sure we've covered both cases.
          expect(sawDisabled).to.be.greaterThan(0);
          expect(sawEnabled).to.be.greaterThan(0);
        });
    });

    // tslint:disable-next-line:mocha-no-side-effect-code
    eventTests.make(state);

    describe("handles events:", () => {
      it("navigates to the editor when the edit button is clicked", () => {
        const goToStub = sandbox.stub(component, "goTo");

        const stub = sandbox.stub(packsService, "getRecordById");
        return packsService.makeRecord("", packA)
          .then((pack) => stub.returns(Promise.resolve(pack)))
          .then(() => component.records[0].pack = 1)
        // Trigger a refresh
          .then(() => component.records = component.records.slice())
          .then(() => {
            fixture.detectChanges();
          })
          .then(() => {
            const editButton =
              el.querySelector(".btn.edit-button")! as HTMLAnchorElement;
            expect(editButton.getAttribute("disabled")).to.be.null;
            editButton.click();
          })
          .then(() => waitForSuccess(() =>
                                     expect(goToStub.callCount).to.equal(1)))
          .then(() => {
            expect(goToStub.firstCall.calledWith(
              makeNavigationURL(component.records[0]))).to.be.ok;
          });
      });

    });
  });
});
