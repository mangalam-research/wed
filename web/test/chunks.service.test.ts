import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { Chunk } from "../dashboard/chunk";
import { ChunksService } from "../dashboard/chunks.service";
import { readFile } from "../dashboard/store-util";

describe("ChunksService", () => {
  let service: ChunksService;
  let file: Chunk;

  function loadRecords(total: number): Promise<Chunk[]> {
    const promises = [];
    for (let i: number = 1; i <= total; ++i) {
      promises.push(Chunk.makeChunk(new File([`content${i}`], `name${i}`))
                    .then(service.updateRecord.bind(service)));
    }
    return Promise.all(promises);
  }

  function assertEqualChunks(a: Chunk, b: Chunk): Promise<void> {
    // Access data on both objects so that they become fit for a deep.equal.
    return Promise.all([a.getData(), b.getData()])
      .then(() => {
        expect(a).to.deep.equal(b);
      });
  }

  function assertEqualLists(a: Chunk[], b: Chunk[]): Promise<void> {
    expect(a.length).to.equal(b.length);
    // Access data in both lists so that they become fit for a deep.equal.
    const promises: Promise<string>[] = [];
    for (let ix = 0; ix < a.length; ++ix) {
      promises.push(a[ix].getData(), b[ix].getData());
    }
    return Promise.all(promises).then(() => {
      expect(a).to.deep.equal(b);
    });
  }

  before(() => {
    service = new ChunksService();
  });

  beforeEach(
    () => Chunk.makeChunk(new File(["foo"], "foo"))
      .then((chunk) => file = chunk));

  afterEach(() => db.delete().then(() => db.open()));

  describe("#getRecords", () => {
    it("returns [] when the table is empty", () =>
       expect(service.getRecords()).to.eventually.deep.equal([]));

    it("returns an array of results", () =>
       service.updateRecord(file)
       .then(() => service.getRecords())
       .then((chunks) => assertEqualLists(chunks, [file])));
  });

  describe("#deleteRecord", () => {
    it("deletes a record", () =>
       service.updateRecord(file)
       .then(() => service.getRecords())
       .then((records) => assertEqualLists(records, [file]))
       .then(() => service.deleteRecord(file))
       .then(() => service.getRecords())
       .then((records) => assertEqualLists(records, [])));
  });

  describe("#updateRecord", () => {
    it("adds the record, if it does not yet exist", () =>
       service.updateRecord(file)
       .then(() => service.getRecords())
       .then((records) => assertEqualLists(records, [file])));

    it("fails, when changing a record", () =>
       service.updateRecord(file)
       .then(() => service.getRecordById(file.id))
       .then((record) => assertEqualChunks(record, file))
       .then(() => {
         // tslint:disable-next-line:no-any
         (file as any).file = new File(["something else"], "a");
         return expect(service.updateRecord(file))
           .to.be.rejectedWith(Error, /trying to update chunk with id/);
       }));

    it("is a no-op on an existing, unchaged record", () =>
       service.updateRecord(file)
       .then(() => service.getRecordById(file.id))
       .then((record) => assertEqualChunks(record, file))
       .then(() => expect(service.updateRecord(file))
             .to.eventually.deep.equal(file)));
});

  describe("#getRecordById", () => {
    it("gets the specified record", () =>
       service.updateRecord(file)
       .then(() => service.getRecordById(file.id))
       .then((record) => assertEqualChunks(record, file)));

    it("gets undefined if the record does not exist", () =>
       expect(service.getRecordById("not"),
              "record should not exist").to.eventually.be.undefined);
  });

  describe("#loadFromFile", () => {
    function check(record: Chunk): Promise<void> {
      expect(record, "record should have an id").
        to.have.property("id").not.be.undefined;
      return expect(readFile(record.file))
      // tslint:disable-next-line:no-any
        .to.eventually.equal("something") as any;
    }

    it("loads into a new record", () =>
       service.loadFromFile(new File(["something"], "foo"))
       .then((record) => check(record)));

    it("loads into an existing record", () => {
      const newFile = new File(["something"], "newfile");
      return service.loadFromFile(newFile)
        .then((record) =>
              Promise.all([
                check(record),
                expect(service.recordCount).to.eventually.equal(1)
                  .then(() => service.loadFromFile(newFile))
                  .then((otherRecord) => {
                    expect(otherRecord.id).to.equal(record.id);
                    return expect(service.recordCount).to.eventually.equal(1);
                  }),
              ]));
    });
  });

  describe("#clear", () => {
    it("clears the database", () =>
       service.updateRecord(file)
       .then(() => expect(service.recordCount).to.eventually.equal(1))
       .then(() => service.clear())
       .then(() => expect(service.recordCount).to.eventually.equal(0)));
  });

  describe("#recordCount", () => {
    it("provides a count of 0 when the database is empty", () =>
       expect(service.recordCount).to.eventually.equal(0));

    it("provides the count of records", () => Promise.resolve()
       .then(() => loadRecords(3))
       .then(() => expect(service.recordCount).to.eventually.deep.equal(3)));
  });
});
