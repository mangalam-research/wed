import "chai";
import "chai-as-promised";
import "mocha";
import * as sinon from "sinon";

const expect = chai.expect;

import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ConfirmService } from "../dashboard/confirm.service";
import { Loader } from "../dashboard/db.service";
import { ProcessingService } from "../dashboard/processing.service";
import { UploadComponent } from "../dashboard/upload.component";

// Any is too useful in the suite.
// tslint:disable:no-any

class FakeLoader implements Loader<void> {
  loadFromFile(_file: File, _record?: void | null): Promise<void> {
    return Promise.resolve();
  }

  safeLoadFromFile(_file: File,
                   _confirmerOrIntoRecord?: void): Promise<void> {
    return Promise.resolve();
  }

}

class FakeProcessingService {
  // tslint:disable:no-empty
  start(_total: number): void {}

  increment(): void {}

  stop(): void {}
  // tslint:enable:no-empty
}

describe("UploadComponent", () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let de: DebugElement;
  let el: HTMLInputElement;
  let sandbox: sinon.SinonSandbox;
  let fakeConfirmer: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    fakeConfirmer = sandbox.stub();
    TestBed.configureTestingModule({
      declarations: [ UploadComponent ],
      providers: [
        ConfirmService,
        { provide: ProcessingService, useClass: FakeProcessingService },
        { provide: "Confirmer", useValue: fakeConfirmer },
        { provide: "Loader", useClass: FakeLoader },
      ],
    });

    return TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(UploadComponent);
      component = fixture.componentInstance;
      de = fixture.debugElement.query(By.css("input"));
      el = de.nativeElement;
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  //
  // There are a couple tests that we cannot perform at all here or at least not
  // perform without significant hurdles:
  //
  // - Test that a we catch change events on the input element.
  // - Test that the input element is cleared after upload.
  //
  // These are due to the fact that we cannot programmatically set el.value to
  // any value other than "".
  //

  it("a change event without files is a no-op", () => {
    const spy = sandbox.stub(FakeLoader.prototype, "safeLoadFromFile");
    // tslint:disable-next-line:no-floating-promises
    component.change({
      target: {
        files: [], // Try with an empty array.
      },
    } as any);
    // tslint:disable-next-line:no-floating-promises
    component.change({
      target: {
        files: undefined, // Try with an undefined value.
      },
    } as any);
    expect(fakeConfirmer.notCalled).to.be.true;
    expect(spy.notCalled).to.be.true;
  });

  it("performs a load for each file", () => {
    const spy = sandbox.stub(FakeLoader.prototype, "safeLoadFromFile");
    spy.returns(Promise.resolve());
    return component.change({
      target: {
        files: [new File(["one"], "one"),
                new File(["two"], "two")],
      },
    } as any)
      .then(() => {
        expect(spy.callCount).to.equal(2);
      });
  });

  it("passes the file to load and the confirmer to safeLoadFromFile", () => {
    const spy = sandbox.stub(FakeLoader.prototype, "safeLoadFromFile");
    spy.returns(Promise.resolve());
    // We have to call the confirmer because the code being tested ``.bind``s it
    // and thus we cannot just check what is passed to safeLoadFromFile.
    spy.callsArg(1);
    const files = [new File(["one"], "one"),
                   new File(["two"], "two")];
    return component.change({ target: { files } } as any)
      .then(() => {
        expect(spy).to.have.been.calledTwice;
        expect(spy.firstCall).to.have.been.calledWith(files[0]);
        expect(spy.secondCall).to.have.been.calledWith(files[1]);
        expect(fakeConfirmer).to.have.been.calledTwice;
      });
  });

  it("uses the processing service", () => {
    const stub = sandbox.stub(FakeProcessingService.prototype);
    return component.change({
      target: {
        files: [new File(["one"], "one"),
                new File(["two"], "two")],
      },
    } as any)
      .then(() => {
        const stubAny: any = stub;
        expect(stubAny.start).to.have.been.calledOnce;
        expect(stubAny.start).to.have.been.calledWith(2);
        expect(stubAny.increment).to.have.been.calledTwice;
        expect(stubAny.stop).to.have.been.calledOnce;
      });
  });
});
