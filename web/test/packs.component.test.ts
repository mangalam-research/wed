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
import { Pack } from "../dashboard/pack";
import { PacksComponent } from "../dashboard/packs.component";
import { PacksService } from "../dashboard/packs.service";
import { ProcessingService } from "../dashboard/processing.service";
import { UploadComponent } from "../dashboard/upload.component";
import { XMLFile } from "../dashboard/xml-file";
import { XMLFilesService } from "../dashboard/xml-files.service";

import { ComponentTestState, eventTests,
         renderTests } from "./common-component.tests";
import { waitFor, waitForSuccess } from "./util";

// tslint:disable: no-empty
class RouterStub {
  // tslint:disable-next-line:no-any
  navigate(..._args: any[]): any {}
}

describe("PacksComponent", () => {
  let component: PacksComponent;
  let fixture: ComponentFixture<PacksComponent>;
  let de: DebugElement;
  let el: HTMLElement;
  let sandbox: sinon.SinonSandbox;
  let packsService: PacksService;
  let fakeConfirmer: sinon.SinonStub;
  let records: Pack[];
  let xmlFilesService: XMLFilesService;

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

  const packBUnserialized = {
    name: "b",
    interchangeVersion: 1,
    schema: "aaa",
    metadata,
    mode: "generic",
    meta: "tei",
  };

  // tslint:disable-next-line:mocha-no-side-effect-code
  const packA = JSON.stringify(packAUnserialized);

  // tslint:disable-next-line:mocha-no-side-effect-code
  const packB = JSON.stringify(packBUnserialized);

  // State must exist at the time of test discovery.
  // tslint:disable-next-line:mocha-no-side-effect-code
  const state: ComponentTestState = Object.create(null);

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    fakeConfirmer = sandbox.stub();
    fakeConfirmer.returns(Promise.resolve(true));
    TestBed.configureTestingModule({
      declarations: [ ClearStoreComponent, UploadComponent, PacksComponent ],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: true },
        ChunksService,
        ConfirmService,
        ProcessingService,
        PacksService,
        XMLFilesService,
        { provide: "Confirmer", useValue: fakeConfirmer },
        { provide: Router, useClass: RouterStub }],
    });

    return TestBed.compileComponents()
      .then(() => {
        packsService = TestBed.get(PacksService);
        xmlFilesService = TestBed.get(XMLFilesService);

        return Promise.all(
          [packA, packB]
            .map((x) => packsService.makeRecord("", x)
                 .then((record) => packsService.updateRecord(record))))
          .then((newRecords) => records = newRecords);
      })
      .then(() => {
        fixture = TestBed.createComponent(PacksComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement.query(By.css("div"));
        el = de.nativeElement;
        state.component = component;
        state.fixture = fixture;
        state.el = el;
        state.recordsService = packsService;
        state.sandbox = sandbox;
      })
    // Wait until the component has refreshed.
      .then(() => waitFor(() => component.records != null &&
                          component.records.length !== 0));
  });

  afterEach(() => db.delete().then(() => db.open()));

  // tslint:disable-next-line:mocha-no-side-effect-code
  renderTests.make(state);
  // tslint:disable-next-line:mocha-no-side-effect-code
  eventTests.make(state);

  describe("#del", () => {
    describe("when the pack is not used", () => {
      it("asks for a generic confirmation", () => {
        fakeConfirmer.returns(Promise.resolve(true));
        return component.del(records[0])
          .then(() => {
            expect(fakeConfirmer).to.have.been.calledOnce;
            expect(fakeConfirmer)
              .to.have.been.calledWith("Do you really want to delete \"foo\"?");
          });
      });
    });

    describe("when the pack is used", () => {
      let xmlFile: XMLFile;
      beforeEach(() => xmlFilesService.makeRecord("xml1", "<div/>")
                 .then((record) => {
                   record.pack = records[0].id;
                   return xmlFilesService.updateRecord(record);
                 }).then((record) => xmlFile = record));

      it("asks for a special confirmation", () => {
        fakeConfirmer.returns(Promise.resolve(true));
        return component.del(records[0])
          .then(() => {
            expect(fakeConfirmer).to.have.been.calledOnce;
            expect(fakeConfirmer)
              .to.have.been.calledWith(`\
This pack is used by some XML files. If you delete it, the pack \
set for the files that use it will be reset and you will have to reassociated \
the files with this pack. Do you really want to delete "foo"?`);
          });
      });

      it("does not delete or modify XML files if denied confirmation", () => {
        fakeConfirmer.returns(Promise.resolve(false));
        return component.del(records[0])
          .then(() => {
            expect(fakeConfirmer).to.have.been.calledOnce;
            // Pack not deleted.
            expect(component.records).to.have.lengthOf(2);
            return expect(xmlFilesService.getRecordByName("xml1"))
              .to.eventually.deep.equal(xmlFile);
          });
      });

      it("deletes pack and modifies XML files if granted confirmation", () => {
        fakeConfirmer.returns(Promise.resolve(true));
        return component.del(records[0])
          .then(() => {
            expect(fakeConfirmer).to.have.been.calledOnce;
          })
        // Pack deleted.
          .then(() =>
                waitForSuccess(() =>
                               expect(component.records).to.have.lengthOf(1)))
        // xml file updated.
          .then(() => expect(xmlFilesService.getRecordByName("xml1"))
                .to.eventually.have.property("pack").be.undefined);
      });
    });
  });
});
