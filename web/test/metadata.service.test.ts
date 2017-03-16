import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { ChunksService } from "../dashboard/chunks.service";
import { Metadata } from "../dashboard/metadata";
import { MetadataService } from "../dashboard/metadata.service";

describe("MetadataService", () => {
  let chunkService: ChunksService;
  let service: MetadataService;
  let file: Metadata;

  // tslint:disable-next-line:mocha-no-side-effect-code
  const a = JSON.stringify({a: 1});

  before(() => {
    chunkService = new ChunksService();
    service = new MetadataService(chunkService);
    return service.makeRecord("foo", a)
      .then((newFile) => file = newFile)
      .then(() => service.updateRecord(file));
  });

  after(() => db.delete().then(() => db.open()));

  it("saves a record", () =>
     service.getRecordByName("foo")
     .then((md) => chunkService.getRecordById(md!.chunk))
     .then((chunk) => expect(chunk!.getData()).to.eventually.equal(a)));

  describe("#getDownloadData", () => {
    it("returns the right data", () =>
       expect(service.getDownloadData(file)).to.eventually.equal(a));
  });
});
