import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

// RecordCommon is an abstract class. We'll test it through XMLFile.
import { XMLFile } from "../dashboard/xml-file";

describe("RecordCommon", () => {
  const one = new XMLFile("a", "content");

  it("starts with downloaded set to 'never'",
     () => expect(one.downloaded).to.equal("never"));

  it("starts with uploaded set to a Date",
     () => expect(one.uploaded).to.be.an.instanceof(Date));

  it("starts with a recordVersion set to 1",
     () => expect(one.recordVersion).to.equal(1));

  it("starts with a notes as an empty string",
     () => expect(one.notes).to.equal(""));
});
