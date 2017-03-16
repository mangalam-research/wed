import "chai";
import "chai-as-promised";
import "mocha";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

chai.use(sinonChai);

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
import { waitFor, waitForSuccess } from "./util";

//
// We use any a lot in this code. There's little benefit with doing away with
// it.
//
// tslint:disable:no-any

// tslint:disable:no-empty
class RouterStub {
  navigate(..._args: any[]): any {}
}

class FakeProcessingService {
  start(_total: number): void {}

  increment(): void {}

  stop(): void {}
}
// tslint:enable:no-empty

describe("GenericRecordsComponent", () => {
  // Since it is a generic, we test it through XMLFilesComponent.
  let component: XMLFilesComponent;
  let fixture: ComponentFixture<XMLFilesComponent>;
  let de: DebugElement;
  let el: HTMLElement;
  let sandbox: sinon.SinonSandbox;
  let recordsService: XMLFilesService;
  let fakeConfirmer: sinon.SinonStub;
  let records: XMLFile[];

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    fakeConfirmer = sandbox.stub();
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
        { provide: Router, useClass: RouterStub }],
    });

    return TestBed.compileComponents()
      .then(() => {
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
      })
    // Wait until the component has refreshed.
      .then(() => waitFor(() => component.records != null &&
                          component.records.length !== 0));
  });

  afterEach(() => db.delete().then(() => db.open()));

  describe("#del", () => {
    it("asks for a confirmation", () => {
      fakeConfirmer.returns(Promise.resolve(true));
      return component.del(records[0])
        .then(() => expect(fakeConfirmer.callCount).to.equal(1));
    });

    it("deletes if the user confirmed", () => {
      fakeConfirmer.returns(Promise.resolve(true));
      return component.del(records[0])
        .then(() => waitForSuccess(
          () => expect(component.records).to.have.length(1)));
    });

    it("does not delete if the user answered negatively", () => {
      fakeConfirmer.returns(Promise.resolve(false));
      return component.del(records[0])
        .then(() => expect(component.records).to.have.length(2));
    });
  });

  describe("#download", () => {
    it("triggers a download with the right data", () => {
      const stub = sandbox.stub(component, "triggerDownload");
      return component.download(records[0])
        .then(() => expect(stub).to.have.been.calledWith("a", "foo"));
    });
  });

  // #triggerDownload cannot be tested here.

  describe("#upload", () => {
    it("is a no-op if there are no files", () => {
      const stub = sandbox.stub(recordsService, "safeLoadFromFile");
      return component.upload(records[0], {
        target: {
          files: undefined,
        },
      } as any)
        .then(() => expect(stub).to.have.not.been.called)
        .then(() => component.upload(records[0], {
          target: {
            files: [],
          },
        } as any))
        .then(() => expect(stub).to.have.not.been.called);
    });

    it("throws if there are more than one file", () => {
      expect(component.upload(records[0], {
        target: {
          files: [new File(["one"], "one"),
                  new File(["two"], "two")],
        },
      } as any)).to.be.rejectedWith(
        Error,
        /internal error: the upload control cannot be used for multiple files/);

    });

    it("replaces the record", () =>
       component.upload(records[0], {
         target: {
           files: [new File(["new data"], "new file")],
         },
       } as any)
       .then(() => recordsService.getRecordById(records[0].id!))
       .then((record) => expect(record!.getData())
             .to.eventually.equal("new data")));

    it("uses the processing service", () => {
      const stub = sandbox.stub(FakeProcessingService.prototype);
      return component.upload(records[0], {
        target: {
          files: [new File(["new data"], "new file")],
        },
       } as any)
        .then(() => {
          expect((stub as any).start).to.have.been.calledOnce;
          expect((stub as any).start).to.have.been.calledWith(1);
          expect((stub as any).increment).to.have.been.calledOnce;
          expect((stub as any).stop).to.have.been.calledOnce;
        });
    });
  });

  describe("#showDetails", () => {
    it("changes the route to the record", () => {
      const stub = sandbox.stub(RouterStub.prototype);
      component.showDetails(records[0]);
      expect((stub as any).navigate.firstCall)
        .to.have.been.calledWith([(component as any).detailRoutePrefix,
                                  records[0].id]);
    });
  });
});
