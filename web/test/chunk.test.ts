import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { Chunk } from "../dashboard/chunk";

describe("Chunk", () => {
  let one: Chunk;
  let same: Chunk;
  let different: Chunk;

  before(() =>
         Promise.all([
           Chunk.makeChunk(new File(["content"], "name")),
           Chunk.makeChunk(new File(["content"], "foo")),
           Chunk.makeChunk(new File(["different"], "name")),
         ])
         .then(([first, second, third]) => {
           one = first;
           same = second;
           different = third;
         }));

  it("has recordType which is 'Chunk'",
     () => expect(one.recordType).to.equal("Chunk"));

  it("has a defined id",
     () => expect(one).to.have.property("id").not.be.undefined);

  it("has the right content",
     () => expect(one.getData()).to.eventually.equal("content"));

  it("two chunks have the same id for the same content",
     () => expect(one.id).to.equal(same.id));

  it("two chunks have different ids for different content",
     () => expect(one.id).to.not.equal(different.id));

  it("can be created from a string", () =>
     Chunk.makeChunk("string")
     .then((chunk) => expect(chunk.getData()).to.eventually.equal("string")));
});
