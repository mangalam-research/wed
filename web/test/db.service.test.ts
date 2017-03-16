import "chai";
import "chai-as-promised";
import "mocha";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

chai.use(sinonChai);

const expect = chai.expect;

// DBService is an abstract class, so we have to test it through
// something. We use XMLFilesService for this job.

import { ChunksService } from "../dashboard/chunks.service";
import { db } from "../dashboard/store";
import { XMLFile } from "../dashboard/xml-file";
import { XMLFilesService } from "../dashboard/xml-files.service";

describe("DBService", () => {
  let chunksService: ChunksService;
  let service: XMLFilesService;
  let file: XMLFile;

  before(() => {
    chunksService = new ChunksService();
    service = new XMLFilesService(chunksService);
  });

  beforeEach(() => {
    return service.makeRecord("foo", "bar").then((newFile) => file = newFile);
  });

  afterEach(() => db.delete().then(() => db.open()));

  function loadRecords(total: number): Promise<XMLFile[]> {
    const promises = [];
    for (let i: number = 1; i <= total; ++i) {
      const name = `file${i}`;
      promises.push(service.makeRecord(name, `content${i}`)
                    .then(service.updateRecord.bind(service)));
    }
    return Promise.all(promises);
  }

  describe("#getRecords", () => {
    it("returns [] when the table is empty",
       () => expect(service.getRecords()).to.eventually.deep.equal([]));

    it("returns an array of results", () =>
       service.updateRecord(file)
       .then(() => service.getRecords())
       .then((records) => expect(records).to.deep.equal([file])));
  });

  describe("#deleteRecord", () => {
    it("deletes a record", () =>
       service.updateRecord(file)
       .then(() => service.getRecords())
       .then((records) => expect(records).to.deep.equal([file]))
       .then(() => service.deleteRecord(file))
       .then(() => expect(service.getRecords())
             .to.eventually.deep.equal([])));

    it("emits a modification", () =>
       service.updateRecord(file)
       .then(() => service.getRecords())
       .then((records) => expect(records).to.deep.equal([file]))
       .then(() => {
         const ret = service.change.first().toPromise();
         // It does not matter if the next promise is "lost". We're simulating
         // some other code causing a change.
         service.deleteRecord(file) as {};
         return ret;
        }));

    it("throws if the record has no id", () => {
      expect(file).to.not.have.property("id");
      return expect(service.deleteRecord(file))
        .to.be.rejectedWith(Error, /missing id/);
    });
  });

  describe("#updateRecord", () => {
    it("adds the record, if it does not yet exist", () =>
       service.updateRecord(file)
       .then(() => service.getRecords())
       .then((records) => expect(records).to.deep.equal([file])));

    it("changes the record, if it already exists", () =>
       service.updateRecord(file)
       .then(() => service.getRecordById(file.id!))
       .then((record) => expect(record).to.deep.equal(file))
       .then(() => {
          file.name = "q";
          return service.updateRecord(file);
        })
       .then(() => service.getRecordById(file.id!))
       .then((record) => expect(record).to.deep.equal(file)));

    it("emits a modification", () =>
       Promise.resolve().then(() => {
         const ret = service.change.first().toPromise();
         // It does not matter if the next promise is "lost". We're simulating
         // some other code causing a change.
         service.updateRecord(file) as {};
         return ret;
       }));

    it("updates the record id, if it was undefined", () => {
      expect(file).to.not.have.property("id");
      return service.updateRecord(file)
        .then(() => expect(file).to.have.property("id").not.be.undefined);
    });
  });

  describe("#getRecordById", () => {
    it("gets the specified record", () =>
       service.updateRecord(file)
       .then(() => service.getRecordById(file.id!))
       .then((record) => expect(record).to.deep.equal(file)));

    it("gets undefined if the record does not exist", () =>
       expect(service.getRecordById(999),
              "the record should not exist").to.eventually.be.undefined);
  });

  describe("#getRecordByName", () => {
    it("gets the specified record", () =>
       service.updateRecord(file)
       .then(() => service.getRecordByName(file.name))
       .then((record) => expect(record).to.deep.equal(file)));

    it("gets undefined if the record does not exist", () =>
       expect(service.getRecordByName("nonexistent"),
              "the record should not exist").to.eventually.be.undefined);
  });

  describe("#loadFromFile", () => {
    it("loads into a new record, when no record is specified", () => {
      function check(record: XMLFile): Promise<void> {
        expect(record).to.have.property("id").not.be.undefined;
        expect(record).to.have.property("name").equal("foo");
        // tslint:disable-next-line:no-any
        return expect(record.getData()).to.eventually.equal("something") as any;
      }

      return service.loadFromFile(new File(["something"], "foo"))
        .then((record) => check(record))
        .then(() => service.getRecordByName("foo"))
        .then((record) => check(record!));
    });

    it("loads into an existing record", () => {
      function check(record: XMLFile): Promise<void> {
        expect(record).to.have.property("id").not.be.undefined;
        // The name of the File object was ignored.
        expect(record).to.have.property("name").equal("foo");
        // tslint:disable-next-line:no-any
        return expect(record.getData()).to.eventually.equal("something") as any;
      }

      return service.updateRecord(file)
        .then(() => service.loadFromFile(new File(["something"], "newfile"),
                                         file))
        .then((record) => check(record))
        .then(() => service.getRecordByName("foo"))
        .then((record) => check(record!));
    });
  });

  describe("#writeCheck", () => {
    describe("when there is no conflict", () => {
      it("returns { write: true, record: null }",
         () => expect(service.writeCheck(file.name, () => {
           throw new Error("called");
         })).to.eventually.deep.equal({write: true, record: null}));
    });

    describe("when there is a conflict", () => {
      it("returns { write: false, record: <some record>} if the user declined",
         () => {
           const stub = sinon.stub();
           stub.returns(Promise.resolve(false));
           return service.updateRecord(file)
             .then(() => service.writeCheck(file.name, stub))
             .then((response) => expect(response)
                   .to.deep.equal({ write: false, record: file }))
             .then(() => expect(stub).to.have.been.calledOnce);
         });

      it("returns { write: true, record: <some record>} if the user accepted",
         () => {
           const stub = sinon.stub();
           stub.returns(Promise.resolve(true));
           return service.updateRecord(file)
             .then(() => service.writeCheck(file.name, stub))
             .then((response) => expect(response)
                   .to.deep.equal({ write: true, record: file }))
             .then(() => expect(stub).to.have.been.calledOnce);
         });
    });
  });

  describe("#safeLoadFromFile", () => {
    it("loads into an existing record", () => {
      function check(record: XMLFile): Promise<void> {
        expect(record).to.have.property("id").not.be.undefined;
        // The name of the File object was ignored.
        expect(record).to.have.property("name").equal("foo");
        // tslint:disable-next-line:no-any
        return expect(record.getData()).to.eventually.equal("something") as any;
      }

      return service.updateRecord(file)
        .then(() => service.safeLoadFromFile(new File(["something"], "newfile"),
                                             file))
        .then((record) => check(record))
        .then(() => service.getRecordByName("foo"))
        .then((record) => check(record!));
    });

    it("loads into a new record if the file name does not exist", () => {
      function check(record: XMLFile): Promise<void> {
        expect(record).to.have.property("id").not.be.undefined;
        expect(record).to.have.property("name").equal("newfile");
        // tslint:disable-next-line:no-any
        return expect(record.getData()).to.eventually.equal("something") as any;
      }

      return service.safeLoadFromFile(new File(["something"], "newfile"),
                                      () => {
                                        throw new Error("stub called");
                                      })
        .then((record) => check(record!))
        .then(() => service.getRecordByName("newfile"))
        .then((record) => check(record!));
    });

    it("loads into the an existing record if the user accepts", () => {
      function check(record: XMLFile): Promise<void> {
        expect(record).to.have.property("id").equal(file.id);
        expect(record).to.have.property("name").equal(file.name);
        // tslint:disable-next-line:no-any
        return expect(record.getData()).to.eventually.equal("something") as any;
      }

      let asked = false;
      // Make sure we start with data different from what we're
      // going to set the file to.
      return expect(file.getData()).to.eventually.not.be.equal("something")
        .then(() => service.updateRecord(file))
        .then(() => service.safeLoadFromFile(new File(["something"],
                                                      file.name),
                                             () => {
                                               asked = true;
                                               return Promise.resolve(true);
                                             }))
        .then((record) => check(record!))
        .then(() => service.getRecordByName(file.name))
        .then((record) => check(record!))
        .then(() => expect(service.getRecordCount()).to.eventually.equal(1))
        .then(() => expect(asked, "should have asked").to.be.true);
    });

    it("does not load if the user rejects", () => {
      function check(record: XMLFile): Promise<void> {
        expect(record).to.have.property("id").equal(file.id);
        expect(record).to.have.property("name").equal(file.name);
        // tslint:disable-next-line:no-any
        return expect(record.getData()).to.eventually.equal("bar") as any;
      }

      let asked = false;

      // Make sure we start with data different from what we're
      // going to set the file to.
      return expect(file.getData()).to.eventually.not.be.equal("something")
        .then(() => service.updateRecord(file))
        .then(() => service.safeLoadFromFile(new File(["something"],
                                                      file.name),
                                             () => {
                                               asked = true;
                                               return Promise.resolve(false);
                                             }))
        .then((record) =>
              expect(record, "should not have found a record").to.be.undefined)
        .then(() => service.getRecordByName(file.name))
        .then((record) => check(record!))
        .then(() => expect(service.getRecordCount()).to.eventually.equal(1))
        .then(() => expect(asked, "should have asked").to.be.true);
    });
  });

  describe("#clear", () => {
    it("clears the database", () =>
       service.updateRecord(file)
       .then(() => expect(service.getRecordCount()).to.eventually.equal(1))
       .then(() => service.clear())
       .then(() => expect(service.getRecordCount()).to.eventually.equal(0)));

    it("emits a modification", () =>
       service.updateRecord(file).then(() => {
         const ret = service.change.first().toPromise();
         // It does not matter if the next promise is "lost". We're simulating
         // some other code causing a change.
         service.clear() as {};
         return ret;
       }));
  });

  describe("#getNameIdArray", () => {
    it("provides an empty array when the database is empty", () =>
       expect(service.getNameIdArray()).to.eventually.deep.equal([]));

    it("provides a filled array when there are records", () => Promise.resolve()
       .then(() => loadRecords(3))
       .then((records) => records.map((record) => ({
         name: record.name,
         id: record.id,
       })))
       .then((expected) => {
         expect(expected).to.have.length.above(0);
         expect(service.getNameIdArray()).to.eventually.deep.equal(expected);
       }));
  });

  describe("#getRecordCount()", () => {
    it("provides a count of 0 when the database is empty", () =>
       expect(service.getRecordCount()).to.eventually.equal(0));

    it("provides the count of records", () => Promise.resolve()
       .then(() => loadRecords(3))
       .then(() => expect(service.getRecordCount())
             .to.eventually.deep.equal(3)));
  });
});
