import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { ChunksService } from "../dashboard/chunks.service";
import { Schema } from "../dashboard/schema";
import { SchemasService } from "../dashboard/schemas.service";

describe("SchemasService", () => {
  let chunkService: ChunksService;
  let service: SchemasService;
  let file: Schema;

  before(() => {
    chunkService = new ChunksService();
    service = new SchemasService(chunkService);
    return service.makeRecord("foo", "bar")
      .then((newFile) => file = newFile)
      .then(() => service.updateRecord(file));
  });

  after(() => db.delete().then(() => db.open()));

  it("saves a record", () =>
     service.getRecordByName("foo")
     .then((md) => chunkService.getRecordById(md!.chunk))
     .then((chunk) => expect(chunk!.getData()).to.eventually.equal("bar")));

  describe("#getDownloadData", () => {
    it("returns the right data", () =>
       expect(service.getDownloadData(file)).to.eventually.equal("bar"));
  });
});
