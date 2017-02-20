import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { ModesService } from "../dashboard/modes.service";

describe("ModesService", () => {
  // There is not a lot to gain from trying to test this in more details.
  it("modes provides a list of modes", () => {
    const service = new ModesService();
    const modes = service.modes;
    expect(modes).to.have.length.above(0);
  });
});
