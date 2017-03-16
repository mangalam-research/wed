import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { Chunk } from "../dashboard/chunk";
import { Metadata } from "../dashboard/metadata";

describe("Metadata", () => {
  // tslint:disable-next-line:mocha-no-side-effect-code
  const content = JSON.stringify({
    generator: "gen1",
    date: "date1",
    version: "ver1",
    namespaces: {
      foo: "foouri",
      bar: "baruri",
    },
  });

  // tslint:disable-next-line:mocha-no-side-effect-code
  const different = JSON.stringify({
    generator: "gen2",
    date: "date2",
    version: "ver2",
    namespaces: {
      foo: "foouri",
      bar: "baruri",
    },
  });

  let contentChunk: Chunk;
  let differentChunk: Chunk;

  let metadata1: Metadata;

  before(() => {
    return Promise.all(
      [Chunk.makeChunk(new File([content], "a")),
       Chunk.makeChunk(new File([different], "b"))])
      .then((chunks) => Promise.all(chunks.map((x) => db.chunks.put(x)))
            .then(() => chunks))
      .then(([a, b]) => {
        contentChunk = a;
        differentChunk = b;
        metadata1 = new Metadata("a", contentChunk);
      });
  });

  after(() => db.delete().then(() => db.open()));

  it("instances have a Metadata type",
     () => expect(metadata1.recordType).to.equal("Metadata"));

  it("to have a generator value which is extracted from the data",
     () => expect(metadata1.getGenerator()).to.eventually.equal("gen1"));

  it("to have a creationDate which is extracted from the data",
     () => expect(metadata1.getCreationDate()).to.eventually.equal("date1"));

  it("to have a version which is extracted from the data",
     () => expect(metadata1.getVersion()).to.eventually.equal("ver1"));

  it("to have namespaces extracted from the data",
     () => expect(metadata1.getNamespaces()).to.eventually.deep.equal({
       foo: "foouri",
       bar: "baruri",
     }));

  it("to have prefixNamespacePairs extracted from the data",
     () => expect(metadata1.getPrefixNamespacePairs())
     .to.eventually.deep.equal([
       {
         prefix: "foo",
         uri: "foouri",
       },
       {
         prefix: "bar",
         uri: "baruri",
       },
     ]));

  it("setting the chunk changes the data", () => {
    metadata1.chunk = differentChunk.id;
    return expect(metadata1.getGenerator()).to.eventually.equal("gen2");
  });
});
