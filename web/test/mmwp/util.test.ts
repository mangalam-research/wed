import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { ajax } from "bluejax";
import { constructTree, Grammar, ValidationError } from "salve";
import { ErrorData } from "salve-dom";

import { ModeValidator } from "wed/validator";
// tslint:disable-next-line:no-require-imports
import concordance = require("../../mmwp/internal-schemas/concordance");
import { validate } from "../../mmwp/util";

// tslint:disable-next-line:mocha-no-side-effect-code
const modeError = [{
      error: new ValidationError("foo"),
      node: undefined,
      index: undefined,
}];

class FakeModeValidator implements ModeValidator {
  validateDocument(): ErrorData[] {
    return modeError;
  }
}

describe("util", () => {
  let doc: Document;
  let grammar: Grammar;
  let badDoc: Document;

  before(() => {
    badDoc = new DOMParser().parseFromString("<div/>", "text/xml");
    grammar = constructTree(JSON.parse(JSON.stringify(concordance)));
    return ajax("/base/web/test/mmwp-data/sample-concordance-1.xml")
      .then((newDoc) => doc = newDoc);
  });

  describe("validate", () => {
    it("does not report errors on valid file", () =>
       expect(validate(grammar, doc)).to.eventually.deep.equal([]));

    it("uses the mode validator", () =>
       expect(validate(grammar, doc, new FakeModeValidator()))
       .to.eventually.deep.equal(modeError));

    it("reports errors on an invalid file", () =>
       expect(validate(grammar, badDoc))
       .to.eventually.have.length.greaterThan(0));
  });
});
