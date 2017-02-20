import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { MetasService } from "../dashboard/metas.service";

describe("MetasService", () => {
  // There is not a lot to gain from trying to test this in more details.
  it("metas provides a list of metas", () => {
    const service = new MetasService();
    const metas = service.metas;
    expect(metas).to.have.length.above(0);
  });
});
