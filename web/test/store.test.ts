import "chai";
// tslint:disable-next-line:import-name
import Dexie from "dexie";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

// Any is too useful in this test suite.
// tslint:disable:no-any

describe("store", () => {
  after(() => db.delete().then(() => db.open()));

  it("creates a database", () => {
    return db.open().then(() => {
      const test = new Dexie("wed");
      return test.open();
    });
  });

  it("does not store properties starting with __", () => {
    return db.xmlfiles.put({ id: 1, name: "named", __foo: "foo value" } as any)
      .then(() => db.xmlfiles.get(1))
      .then((read: any) => {
        expect(read).to.have.property("name").equal("named");
        expect(read).to.not.have.property("__foo");
      });
  });

  it("does not update properties starting with __", () => {
    return db.xmlfiles.put({ id: 2, name: "named 2" } as any)
      .then(() => db.xmlfiles.get(2))
      .then((read: any) => {
        expect(read).to.have.property("name").equal("named 2");
        read.__foo = "foo value";
        return db.xmlfiles.put(read);
      })
      .then(() =>  db.xmlfiles.get(2))
      .then((read: any) => {
        expect(read).to.have.property("name").equal("named 2");
        expect(read).to.not.have.property("__foo");
      });
  });

  describe("#makeIndexedDBURL", () => {
    it("creates a URL without property name", () => {
      expect(db.makeIndexedDBURL(db.xmlfiles, {id: 1})).to.equal(
        "indexeddb://v1/wed/xmlfiles/number/1");
    });

    it("creates a URL with property name", () => {
      expect(db.makeIndexedDBURL(db.xmlfiles, {id: 2}, "foo")).to.equal(
        "indexeddb://v1/wed/xmlfiles/number/2/foo");
    });

    it("creates a URL with a string key", () => {
      expect(db.makeIndexedDBURL(db.xmlfiles, {id: "2"}, "foo")).to.equal(
        "indexeddb://v1/wed/xmlfiles/string/2/foo");
    });

    it("fails on weird property types", () => {
      expect(() => db.makeIndexedDBURL(db.xmlfiles, {id: {}}, "foo")).to
        .throw(Error, /cannot use primary key of type: object/);
    });
  });
});
