import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { Metadata } from "../dashboard/metadata";
import { MetadataService } from "../dashboard/metadata.service";

describe("MetadataService", () => {
  let service: MetadataService;
  let file: Metadata;

  const a = JSON.stringify({a: 1});
  const b = JSON.stringify({b: 2});

  before(() => {
    service = new MetadataService();
    return service.makeRecord("foo", a)
      .then((newFile) => file = newFile)
      .then(() => service.updateRecord(file));
  });

  after(() => db.delete().then(() => db.open()));

  // We use a selection of crucial data points rather than do a deep equal
  // because deep equal will iterate over properties that trigger a parsing of
  // the JSON and parsing the JSON is not what we want to test here. It is
  // useful to be able to use {a: 1} as mock data.
  //
  // Ideally we'd stub Metadata to avoid a JSON parsing, but it seems that Sinon
  // won't be able to do that reliably until version 2, which is not yet
  // released.
  function equalFiles(first: Metadata, second: Metadata): void {
    expect(first.id).to.equal(second.id);
    expect(first.name).to.equal(second.name);
    expect(first.data).to.equal(second.data);
  }

  describe("getByData", () => {
    it("returns a record", () => {
      return service.getByData(a).then((record) => equalFiles(record, file));
    });

    it("returns undefined, when the record does not exist", () => {
      return expect(service.getByData(b)).to.eventually.be.undefined;
    });
  });

  describe("getOrCreateByData", () => {
    let originalCount: number;

    beforeEach(() => service.recordCount.then((count) => originalCount = count));

    it("does not create a record, if the data is already there",
       () => service.getOrCreateByData("pack", a)
       .then((record) => equalFiles(record, file))
       .then(() => expect(service.recordCount)
             .to.eventually.equal(originalCount)));

    it("does creates a record, if the data is not there",
       () => service.getOrCreateByData("pack", b)
       .then((record) => {
         expect(record.name).to.equal("@@pack");
         expect(record.id).to.not.be.undefined;
         expect(record.data).to.equal(b);
       })
       .then(() => expect(service.recordCount)
             .to.eventually.equal(originalCount + 1)));
  });
});
