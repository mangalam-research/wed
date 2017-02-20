import "chai";
import "chai-as-promised";
import "mocha";
import * as sinon from "sinon";

const expect = chai.expect;

// DBService is an abstract class, so we have to test it through
// something. We use XMLFilesService for this job.

import { db } from "../dashboard/store";
import { XMLFile } from "../dashboard/xml-file";
import { XMLFilesService } from "../dashboard/xml-files.service";

describe("DBService", () => {
  let service: XMLFilesService;
  let file: XMLFile;

  before(() => {
    service = new XMLFilesService();
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
    it("returns [] when the table is empty", () => {
      expect(service.getRecords()).to.eventually.deep.equal([]);
    });

    it("returns an array of results", () => {
      return service.updateRecord(file)
        .then(() => expect(service.getRecords())
              .to.eventually.deep.equal([file]));
    });
  });

  describe("#deleteRecord", () => {
    it("deletes a record", () => {
      return service.updateRecord(file)
        .then(() => expect(service.getRecords())
              .to.eventually.deep.equal([file]))
        .then(() => service.deleteRecord(file))
        .then(() => expect(service.getRecords())
              .to.eventually.deep.equal([]));
    });

    it("emits a modification", () => {
      return service.updateRecord(file)
        .then(() => expect(service.getRecords())
              .to.eventually.deep.equal([file]))
        .then(() => {
          const ret = service.change.first().toPromise();
          service.deleteRecord(file);
          return ret;
        });
    });

    it("throws if the record has no id", () => {
      expect(file.id).to.be.undefined;
      return expect(service.deleteRecord(file))
        .to.be.rejectedWith(Error, /missing id/);
    });
  });

  describe("#updateRecord", () => {
    it("adds the record, if it does not yet exist", () => {
      return service.updateRecord(file)
        .then(() => expect(service.getRecords())
              .to.eventually.deep.equal([file]));
    });

    it("changes the record, if it already exists", () => {
      return service.updateRecord(file)
        .then(() => expect(service.getRecordById(file.id!))
              .to.eventually.deep.equal(file))
        .then(() => {
          file.name = "q";
          return service.updateRecord(file);
        })
        .then(() => expect(service.getRecordById(file.id!))
              .to.eventually.deep.equal(file));
    });

    it("emits a modification", () => {
      return Promise.resolve()
        .then(() => {
          const ret = service.change.first().toPromise();
          service.updateRecord(file);
          return ret;
        });
    });

    it("updates the record id, if it was undefined", () => {
      expect(file.id).to.be.undefined;
      return service.updateRecord(file)
        .then(() => expect(file.id).to.not.be.undefined);
    });
  });

  describe("#getRecordById", () => {
    it("gets the specified record", () => {
      return service.updateRecord(file)
        .then(() => expect(service.getRecordById(file.id!))
              .to.eventually.deep.equal(file));
    });

    it("gets undefined if the record does not exist", () => {
      return expect(service.getRecordById(999)).to.eventually.be.undefined;
    });
  });

  describe("#getRecordByName", () => {
    it("gets the specified record", () => {
      return service.updateRecord(file)
        .then(() => expect(service.getRecordByName(file.name))
              .to.eventually.deep.equal(file));
    });

    it("gets undefined if the record does not exist", () => {
      return expect(service.getRecordByName("nonexistent"))
        .to.eventually.be.undefined;
    });
  });

  describe("#loadFromFile", () => {
    it("loads into a new record, when no record is specified", () => {
      function check(record: XMLFile): void {
          expect(record.id).to.not.be.undefined;
          expect(record.name).to.equal("foo");
          expect(record.data).to.equal("something");
      }

      return service.loadFromFile(new File(["something"], "foo"))
        .then((record) => check(record))
        .then(() => service.getRecordByName("foo"))
        .then((record) => check(record));
    });

    it("loads into an existing record", () => {
      function check(record: XMLFile): void {
        expect(record.id).to.not.be.undefined;
        // The name of the File object was ignored.
        expect(record.name).to.equal("foo");
        expect(record.data).to.equal("something");
      }

      return service.updateRecord(file)
        .then(() => service.loadFromFile(new File(["something"], "newfile"),
                                         file))
        .then((record) => check(record))
        .then(() => service.getRecordByName("foo"))
        .then((record) => check(record));
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
               .then(() => expect(service.writeCheck(file.name, stub))
                     .to.eventually.deep.equal({ write: false, record: file }))
               .then(() => expect(stub.calledOnce).to.be.true);
           });

        it("returns { write: true, record: <some record>} if the user accepted",
           () => {
             const stub = sinon.stub();
             stub.returns(Promise.resolve(true));
             return service.updateRecord(file)
               .then(() => expect(service.writeCheck(file.name, stub))
                     .to.eventually.deep.equal({ write: true, record: file }))
               .then(() => expect(stub.calledOnce).to.be.true);
           });
      });
    });

    describe("#safeLoadFromFile", () => {
      it("loads into an existing record", () => {
        function check(record: XMLFile): void {
          expect(record.id).to.not.be.undefined;
          // The name of the File object was ignored.
          expect(record.name).to.equal("foo");
          expect(record.data).to.equal("something");
        }

        return service.updateRecord(file)
          .then(() => service.safeLoadFromFile(new File(["something"], "newfile"),
                                               file))
          .then((record) => check(record))
          .then(() => service.getRecordByName("foo"))
          .then((record) => check(record));
      });

      it("loads into a new record if the file name does not exist", () => {
        function check(record: XMLFile): void {
          expect(record.id).to.not.be.undefined;
          expect(record.name).to.equal("newfile");
          expect(record.data).to.equal("something");
        }

        return service.safeLoadFromFile(new File(["something"], "newfile"),
                                        () => {
                                          throw new Error("stub called");
                                        })
          .then((record) => check(record!))
          .then(() => service.getRecordByName("newfile"))
          .then((record) => check(record));
      });

      it("loads into the an existing record if the user accepts", () => {
        function check(record: XMLFile): void {
          expect(record.id).to.equal(file.id);
          expect(record.name).to.equal(file.name);
          expect(record.data).to.equal("something");
        }

        // Make sure we start with data different from what we're
        // going to set the file to.
        expect(file.data).to.not.be.equal("something");

        let asked = false;
        return service.updateRecord(file)
          .then(() => service.safeLoadFromFile(new File(["something"],
                                                        file.name),
                                        () => {
                                          asked = true;
                                          return Promise.resolve(true);
                                        }))
          .then((record) => check(record!))
          .then(() => service.getRecordByName(file.name))
          .then((record) => check(record))
          .then(() => expect(service.recordCount).to.eventually.equal(1))
          .then(() => expect(asked).to.be.true);
      });

      it("does not load if the user rejects", () => {
        function check(record: XMLFile): void {
          expect(record.id).to.equal(file.id);
          expect(record.name).to.equal(file.name);
          expect(record.data).to.equal("bar");
        }

        // Make sure we start with data different from what we're
        // going to set the file to.
        expect(file.data).to.not.be.equal("something");

        let asked = false;
        return service.updateRecord(file)
          .then(() => service.safeLoadFromFile(new File(["something"],
                                                        file.name),
                                        () => {
                                          asked = true;
                                          return Promise.resolve(false);
                                        }))
          .then((record) => expect(record).to.be.undefined)
          .then(() => service.getRecordByName(file.name))
          .then((record) => check(record))
          .then(() => expect(service.recordCount).to.eventually.equal(1))
          .then(() => expect(asked).to.be.true);
      });
    });
  });

  describe("#clear", () => {
    it("clears the database", () =>
       service.updateRecord(file)
       .then(() => expect(service.recordCount).to.eventually.equal(1))
       .then(() => service.clear())
       .then(() => expect(service.recordCount).to.eventually.equal(0)));

    it("emits a modification", () =>
       service.updateRecord(file).then(() => {
         const ret = service.change.first().toPromise();
         service.clear();
         return ret;
       }));
  });

  describe("#nameIdArray", () => {
    it("provides an empty array when the database is empty", () =>
       expect(service.nameIdArray).to.eventually.deep.equal([]));

    it("provides a filled array when there are records", () => Promise.resolve()
       .then(() => loadRecords(3))
       .then((records) => records.map((record) => ({
         name: record.name,
         id: record.id,
       })))
       .then((expected) => {
         expect(expected).to.have.length.above(0);
         expect(service.nameIdArray).to.eventually.deep.equal(expected);
       }));
  });

  describe("#recordCount", () => {
    it("provides a count of 0 when the database is empty", () =>
       expect(service.recordCount).to.eventually.equal(0));

    it("provides the count of records", () => Promise.resolve()
       .then(() => loadRecords(3))
       .then(() => expect(service.recordCount).to.eventually.deep.equal(3)));
  });
});
