import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { Chunk } from "../dashboard/chunk";
import { Schema } from "../dashboard/schema";

describe("Schema", () => {
  let chunkOne: Chunk;
  let one: Schema;

  before(() => {
    return Promise.all(
      [Chunk.makeChunk(new File(["schema content"], "a"))])
      .then((chunks) => Promise.all(chunks.map((x) => db.chunks.put(x)))
            .then(() => chunks))
      .then(([newChunk]) => {
        chunkOne = newChunk;
        one = new Schema("a", chunkOne.id);
      });
  });

  after(() => db.delete().then(() => db.open()));

  it("#recordType is 'Schema'",
     () => expect(one.recordType).to.equal("Schema"));

  it("#chunk is correct",
     () => expect(one.chunk).to.equal(chunkOne.id));

  it("#data is correct",
     () => expect(one.getData()).to.eventually.equal("schema content"));
});
