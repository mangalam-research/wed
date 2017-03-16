import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { ChunksService } from "../dashboard/chunks.service";
import { XMLFile } from "../dashboard/xml-file";
import { XMLFilesService } from "../dashboard/xml-files.service";

describe("XMLFilesService", () => {
  let service: XMLFilesService;
  let file: XMLFile;

  before(() => {
    service = new XMLFilesService(new ChunksService());
    return service.makeRecord("foo", "bar")
      .then((newFile) => file = newFile)
      .then(() => service.updateRecord(file));
  });

  after(() => db.delete().then(() => db.open()));

  describe("#makeIndexedDBURL", () => {
    it("fails if the file has no id", () =>
       expect(() => service.makeIndexedDBURL(new XMLFile("foo", "bar")))
       .to.throw(Error, /cannot use primary key of type: undefined/));

    it("produces a correct URL, without parameter",
       () => expect(service.makeIndexedDBURL(file)).to.equal(
         "indexeddb://v1/wed/xmlfiles/number/1"));

    it("produces a correct URL, with parameter",
       () => expect(service.makeIndexedDBURL(file, "data")).to.equal(
         "indexeddb://v1/wed/xmlfiles/number/1/data"));
  });

  describe("#getDownloadData", () => {
    it("returns the right data", () =>
       expect(service.getDownloadData(file)).to.eventually.equal("bar"));
  });
});
