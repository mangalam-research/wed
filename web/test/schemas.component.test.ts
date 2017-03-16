import "chai";
import "chai-as-promised";
import "mocha";
import * as sinon from "sinon";

import { DebugElement } from "@angular/core";
import { ComponentFixture, ComponentFixtureAutoDetect,
         TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Router } from "@angular/router";

import { db } from "../dashboard/store";

import { ChunksService } from "../dashboard/chunks.service";
import { ClearStoreComponent } from "../dashboard/clear-store.component";
import { ConfirmService } from "../dashboard/confirm.service";
import { ProcessingService } from "../dashboard/processing.service";
import { SchemasComponent } from "../dashboard/schemas.component";
import { SchemasService } from "../dashboard/schemas.service";
import { UploadComponent } from "../dashboard/upload.component";

import { ComponentTestState, eventTests,
         renderTests } from "./common-component.tests";
import { waitFor } from "./util";

// tslint:disable: no-empty
class RouterStub {
  // tslint:disable-next-line:no-any
  navigate(..._args: any[]): any {}
}

describe("SchemasComponent", () => {
  let component: SchemasComponent;
  let fixture: ComponentFixture<SchemasComponent>;
  let de: DebugElement;
  let el: HTMLElement;
  let sandbox: sinon.SinonSandbox;
  let recordsService: SchemasService;
  let fakeConfirmer: sinon.SinonStub;

  // State must exist at the time of test discovery.
  // tslint:disable-next-line:mocha-no-side-effect-code
  const state: ComponentTestState = Object.create(null);

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    fakeConfirmer = sandbox.stub();
    fakeConfirmer.returns(Promise.resolve(true));
    TestBed.configureTestingModule({
      declarations: [ ClearStoreComponent, UploadComponent, SchemasComponent ],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: true },
        ChunksService,
        ConfirmService,
        ProcessingService,
        SchemasService,
        { provide: "Confirmer", useValue: fakeConfirmer },
        { provide: Router, useClass: RouterStub }],
    });

    return TestBed.compileComponents()
      .then(() => {
        recordsService = TestBed.get(SchemasService);

        return Promise.all(
          [{ name: "a", data: "foo" },
           { name: "b", data: "bar" }]
            .map((x) => recordsService.makeRecord(x.name, x.data)
                 .then((record) => recordsService.updateRecord(record))));
      })
      .then(() => {
        fixture = TestBed.createComponent(SchemasComponent);
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

  // tslint:disable-next-line:mocha-no-side-effect-code
  renderTests.make(state);
  // tslint:disable-next-line:mocha-no-side-effect-code
  eventTests.make(state);

});
