import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { Chunk } from "../dashboard/chunk";
import { XMLFile } from "../dashboard/xml-file";

describe("XMLFile", () => {
  let chunkOne: Chunk;
  let one: XMLFile;

  before(() => {
    return Promise.all(
      [Chunk.makeChunk(new File(["content"], "a"))])
      .then((chunks) => Promise.all(chunks.map((x) => db.chunks.put(x)))
            .then(() => chunks))
      .then(([newChunk]) => {
        chunkOne = newChunk;
        one = new XMLFile("a", chunkOne.id);
      });
  });

  after(() => db.delete().then(() => db.open()));

  it("#recordType is 'XMLFile'",
     () => expect(one.recordType).to.equal("XMLFile"));

  it("#saved is set to 'never'",
     () => expect(one.saved).to.equal("never"));

  it("#chunk is correct",
     () => expect(one.chunk).to.equal(chunkOne.id));

  it("#data is correct",
     () => expect(one.getData()).to.eventually.equal("content"));
});
