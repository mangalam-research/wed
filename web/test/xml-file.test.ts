import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { XMLFile } from "../dashboard/xml-file";

describe("XMLFile", () => {
  const one = new XMLFile("a", "content");

  it("has recordType which is 'XMLFile'",
     () => expect(one.recordType).to.equal("XMLFile"));

  it("starts with saved set to 'never'",
     () => expect(one.saved).to.equal("never"));
});
