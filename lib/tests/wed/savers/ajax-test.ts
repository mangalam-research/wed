// tslint:disable-next-line:missing-jsdoc
import "chai";
import * as $ from "jquery";
import * as sinon from "sinon";

const expect = chai.expect;

import { DLocRoot } from "wed/dloc";
import { Runtime } from "wed/runtime";
import { Saver } from "wed/savers/ajax";
import { TreeUpdater } from "wed/tree-updater";

describe("ajax", () => {
  let sandbox: sinon.SinonSandbox;
  let rt: Runtime;
  let server: sinon.SinonFakeServer;

  before(() => {
    sandbox = sinon.sandbox.create({ useFakeServer: true });
    // We use any here to cheat a bit.
    // tslint:disable-next-line:no-any
    rt = new Runtime({} as any);
    new DLocRoot(document);
    server = sandbox.server;
    server.respondImmediately = true;
  });

  afterEach(() => {
    sandbox.reset();
  });

  after(() => {
    sandbox.restore();
  });

  it("can be created", () => {
    new Saver(rt, "0.30.0", new TreeUpdater(document), document, {
      url: "/moo",
    });
  });

  describe("#init", () => {
    it("sends a check command with the editor version", async () => {
      const saver = new Saver(rt, "0.30.0", new TreeUpdater(document),
                              document, {
                                url: "/moo",
                              });
      server.respondWith("POST", "/moo",
                         [200, { "Content-Type": "application/json" },
                          JSON.stringify({messages: []})]);
      await saver.init();
      expect(server).to.have.property("requests").have.lengthOf(1);
      expect(server).to.have.deep.property("requests[0].requestBody")
        .equal($.param({ command: "check", version: "0.30.0" }));
    });

    it("sets no If-Match if there is no etag set in the options", async () => {
      const saver = new Saver(rt, "0.30.0", new TreeUpdater(document),
                              document, {
                                url: "/moo",
                              });
      server.respondWith("POST", "/moo",
                         [200, { "Content-Type": "application/json" },
                          JSON.stringify({messages: []})]);
      await saver.init();
      expect(server).to.have.property("requests").have.lengthOf(1);
      expect(server).to.not.have.deep
        .property("requests[0].requestHeaders.If-Match");
    });

    it("sets If-Match if there an etag set in the options", async () => {
      const saver = new Saver(rt, "0.30.0", new TreeUpdater(document),
                              document, {
                                url: "/moo",
                                initial_etag: "abc",
                              });
      server.respondWith("POST", "/moo",
                         [200, { "Content-Type": "application/json" },
                          JSON.stringify({messages: []})]);
      await saver.init();
      expect(server).to.have.property("requests").have.lengthOf(1);
      expect(server).to.have.deep
        .property("requests[0].requestHeaders.If-Match").equal("\"abc\"");
    });
  });
});
