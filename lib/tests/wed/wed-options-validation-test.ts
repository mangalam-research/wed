import { expect } from "chai";

import { WedOptions } from "wed/wed-options";
import { processWedOptions } from "wed/wed-options-validation";

// tslint:disable-next-line:missing-jsdoc
describe("wed-options-validation", () => {
  describe("processOptions", () => {
    it("returns cleaned options when done", () => {
      const options: WedOptions = {
        metadata: {
          name: "Test",
          authors: ["Louis-Dominique Dubeau"],
          description: "TEST MODE. DO NOT USE IN PRODUCTION!",
          license: "MPL 2.0",
          copyright: "Mangalam Research Center for Buddhist Languages",
        },
        label_levels: {
          max: 2,
          initial: 1,
        },
        attributes: {
          handling: "edit",
          autohide: {
            method: "selector",
            elements: [{
              selector: "a",
              attributes: [
                "moo",
              ],
            }],
          },
        },
      };
      const result = processWedOptions(options);
      expect(result).is.not.instanceof(Array);
    });

    it("cleans a missing attributes option", () => {
      const options: WedOptions = {
        metadata: {
          name: "Test",
          authors: ["Louis-Dominique Dubeau"],
          description: "TEST MODE. DO NOT USE IN PRODUCTION!",
          license: "MPL 2.0",
          copyright: "Mangalam Research Center for Buddhist Languages",
        },
        label_levels: {
          max: 2,
          initial: 1,
        },
      };
      const result = processWedOptions(options);
      expect(result).is.not.instanceof(Array);
      expect(result).to.have.nested.property("attributes.handling")
        .equal("hide");
    });

    it("cleans a string attributes option", () => {
      const options: WedOptions = {
        metadata: {
          name: "Test",
          authors: ["Louis-Dominique Dubeau"],
          description: "TEST MODE. DO NOT USE IN PRODUCTION!",
          license: "MPL 2.0",
          copyright: "Mangalam Research Center for Buddhist Languages",
        },
        label_levels: {
          max: 2,
          initial: 1,
        },
        attributes: "edit",
      };
      const result = processWedOptions(options);
      expect(result).is.not.instanceof(Array);
      expect(result).to.have.nested.property("attributes.handling")
        .equal("edit");
    });

    it("reports an error if the options are not in the right format", () => {
      const options: WedOptions = {
        metadata: {
          name: "Test",
          authors: ["Louis-Dominique Dubeau"],
          description: "TEST MODE. DO NOT USE IN PRODUCTION!",
          license: "MPL 2.0",
          copyright: "Mangalam Research Center for Buddhist Languages",
        },
        label_levels: {
          max: 2,
          initial: 1,
        },
        attributes: "moo",
        // tslint:disable-next-line:no-any
      } as any;
      const result = processWedOptions(options);
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.nested.property("[0]").equal(
        ".attributes should be equal to one of the allowed values");
    });

    it("reports an error if the initial label level > the max", () => {
      const options: WedOptions = {
        metadata: {
          name: "Test",
          authors: ["Louis-Dominique Dubeau"],
          description: "TEST MODE. DO NOT USE IN PRODUCTION!",
          license: "MPL 2.0",
          copyright: "Mangalam Research Center for Buddhist Languages",
        },
        label_levels: {
          max: 2,
          initial: 3,
        },
        attributes: "edit",
        // tslint:disable-next-line:no-any
      } as any;
      const result = processWedOptions(options);
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.nested.property("[0]").equal(
        "label_levels.initial must be <= label_levels.max");
    });
  });
});
