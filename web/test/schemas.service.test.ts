import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { Schema } from "../dashboard/schema";
import { SchemasService } from "../dashboard/schemas.service";

describe("SchemasService", () => {
  let service: SchemasService;
  let file: Schema;

  before(() => {
    service = new SchemasService();
    return service.makeRecord("foo", "bar")
      .then((newFile) => file = newFile)
      .then(() => service.updateRecord(file));
  });

  after(() => db.delete().then(() => db.open()));

  describe("getByData", () => {
    it("returns a record", () => {
      return expect(service.getByData("bar")).to.eventually.deep.equal(file);
    });

    it("returns undefined, when the record does not exist", () => {
      return expect(service.getByData("none")).to.eventually.be.undefined;
    });
  });

  describe("getOrCreateByData", () => {
    let originalCount: number;

    beforeEach(() => service.recordCount.then((count) => originalCount = count));

    it("does not create a record, if the data is already there",
       () => expect(service.getOrCreateByData("pack", "bar"))
       .to.eventually.deep.equal(file)
       .then(() => expect(service.recordCount)
             .to.eventually.equal(originalCount)));

    it("does creates a record, if the data is not there",
       () => service.getOrCreateByData("pack", "none")
       .then((record) => {
         expect(record.name).to.equal("@@pack");
         expect(record.id).to.not.be.undefined;
         expect(record.data).to.equal("none");
       })
       .then(() => expect(service.recordCount)
             .to.eventually.equal(originalCount + 1)));
  });
});
