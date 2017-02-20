import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { Schema } from "../dashboard/schema";

describe("Schema", () => {
  const schema1 = new Schema("a", "content");
  const schema2 = new Schema("b", "content");
  const schema3 = new Schema("b", "different content");

  it("instances with same content have same sum",
     () => expect(schema1.sum).to.equal(schema2.sum));

  it("instances with different content have different sum",
     () => expect(schema1.sum).to.not.equal(schema3.sum));

  it("instances have a Schema type",
     () => expect(schema1.recordType).to.equal("Schema"));
});
