import "chai";
import "chai-as-promised";
import "mocha";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

chai.use(sinonChai);

const expect = chai.expect;

import { db } from "../dashboard/store";

import { Chunk } from "../dashboard/chunk";
import { XMLFile } from "../dashboard/xml-file";

// We use XMLFile to test ChunkedRecord.
describe("ChunkedRecord", () => {
  let sandbox: sinon.SinonSandbox;
  let chunkOne: Chunk;
  let chunkTwo: Chunk;
  let one: XMLFile;
  let bad: XMLFile;

  before(() => {
    return Promise.all(
      [Chunk.makeChunk(new File(["content"], "a")),
       Chunk.makeChunk(new File(["other"], "b"))])
      .then((chunks) => Promise.all(chunks.map((x) => db.chunks.put(x)))
            .then(() => chunks))
      .then(([newChunk, newChunkTwo]) => {
        chunkOne = newChunk;
        chunkTwo = newChunkTwo;
        one = new XMLFile("a", chunkOne.id);
        bad = new XMLFile("b", "nonexistent");
      });
  });

  after(() => db.delete().then(() => db.open()));

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("#chunk is correct",
     () => expect(one.chunk).to.equal(chunkOne.id));

  it("#data is correct",
     () => expect(one.getData()).to.eventually.equal("content"));

  it("#data raise an error if the chunk is non-existent",
     () => expect(bad.getData()).to.be.rejectedWith(Error, /missing chunk/));

  it("#data caches db accesses", () => {
    const spy = sandbox.spy(db.chunks, "get");
    const newFile = new XMLFile("a", chunkOne.id);
    return newFile.getData()
      .then(() => {
        expect(spy).to.have.been.calledOnce;
        return newFile.getData();
      })
      .then(() => expect(spy).to.have.been.calledOnce);
  });

  it("#data resets its cache when #chunk is set", () => {
    const spy = sandbox.spy(db.chunks, "get");
    const newFile = new XMLFile("a", chunkOne.id);
    return newFile.getData()
      .then(() => {
        expect(spy).to.have.been.calledOnce;
        newFile.chunk = chunkTwo.id;
        return newFile.getData();
      })
      .then(() => expect(spy).to.have.been.calledTwice);
  });

  it("#data does not reset its cache when #chunk is set to same value", () => {
    const spy = sandbox.spy(db.chunks, "get");
    const newFile = new XMLFile("a", chunkOne.id);
    return newFile.getData()
      .then(() => {
        expect(spy).to.have.been.calledOnce;
        newFile.chunk = newFile.chunk;
        return newFile.getData();
      })
      .then(() => expect(spy).to.have.been.calledOnce);
  });
});
