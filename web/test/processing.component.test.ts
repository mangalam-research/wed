import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;
import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ProcessingComponent } from "../dashboard/processing.component";
import { ProcessingService } from "../dashboard/processing.service";

describe("ProcessingComponent", () => {
  let component: ProcessingComponent;
  let service: ProcessingService;
  let fixture: ComponentFixture<ProcessingComponent>;
  let de: DebugElement;
  let el: HTMLElement;
  let progress: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ ProcessingComponent ],
      providers: [ ProcessingService ],
    });

    return TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(ProcessingComponent);
      service = TestBed.get(ProcessingService);
      component = fixture.componentInstance;
      de = fixture.debugElement.query(By.css(".modal"));
      el = de.nativeElement;
      progress = el.getElementsByClassName("bar")[0] as HTMLElement;
    });
  });

  it("starts with an invisible modal", () => {
    expect(el.classList.contains("in")).to.be.false;
  });

  it("shows a modal on processing start", () => {
    service.start(3);
    fixture.detectChanges();
    expect(el.classList.contains("in")).to.be.true;
  });

  it("shows a 0% long bar on processing start", () => {
    service.start(3);
    fixture.detectChanges();
    expect(progress.style.width).to.equal("0%");
  });

  it("shows a bar with proper percentage on increment", () => {
    service.start(2);
    service.increment();
    fixture.detectChanges();
    expect(progress.style.width).to.equal("50%");
  });

  it("hides modal on stop", () => {
    service.start(3);
    fixture.detectChanges();
    expect(el.classList.contains("in")).to.be.true;
    service.stop();
    fixture.detectChanges();
    expect(el.classList.contains("in")).to.be.false;
  });
});
