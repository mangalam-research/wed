import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { ProcessingService } from "../dashboard/processing.service";

describe("ProcessingService", () => {
  let service: ProcessingService;
  before(() => {
    service = new ProcessingService();
  });

  afterEach(() => {
    service.stop();
  });

  describe("#start", () => {
    it("fails when called with 0", () =>
       expect(() => {
         service.start(0);
       }).to.throw(Error, /cannot start processing with a total of 0/));

    it("fails when already started", () => {
      service.start(10);
      expect(() => {
        service.start(10);
      }).to.throw(Error, /there is already something in progress/);
    });

    it("emits a change", () => {
      // elementAt(1): we need to skip the default that is automatically emitted
      // on subscription.
      const ret = service.state.elementAt(1).toPromise();
      service.start(10);
      return expect(ret).to.eventually.deep.equal({ total: 10, count: 0 });
    });
  });

  describe("#stop", () => {
    it("emits a change", () => {
      service.start(10);
      // elementAt(1): we need to skip the default that is automatically emitted
      // on subscription.
      const ret = service.state.elementAt(1).toPromise();
      service.stop();
      return expect(ret).to.eventually.deep.equal({ total: 0, count: 0 });
    });
  });

  describe("#increment", () => {
    it("fails when called and nothing is in progress", () =>
       expect(() => {
         service.increment();
       }).to.throw(Error,
                   /increment called when there is nothing in progress/));

    it("fails when incrementing beyond the total", () => {
      service.start(1);
      service.increment();
      expect(() => {
        service.increment();
      }).to.throw(Error, /incrementing beyond the total/);
    });

    it("emits a change", () => {
      const total = 3;
      service.start(total);
      // elementAt(1): we need to skip the default that is automatically emitted
      // on subscription.
      function test(index: number): Promise<void> {
        const p = service.state.elementAt(1).toPromise();
        service.increment();
        return expect(p).to.eventually.deep.equal({ total, count: index })
          .then(() => {
            if (index < total) {
              return test(index + 1);
            }

            return undefined;
          }) as Promise<void>;
      }

      return test(1);
    });
  });
});
