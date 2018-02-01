/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { toGUISelector } from "wed/domutil";
import { GUISelector } from "wed/gui-selector";

const expect = chai.expect;

describe("GUISelector", () => {
  describe("#makeVerbatim", () => {
    it("makes a selector verbatim", () => {
      const v = GUISelector.makeVerbatim("foo");
      expect(v).to.have.property("value").equal("foo");
    });

    it("caches values", () => {
      const v = GUISelector.makeVerbatim("foo");
      expect(v).to.equal(GUISelector.makeVerbatim("foo"));
    });
  });

  describe("#fromDataSelector", () => {
    it("makes a selector", () => {
      const selector = "btw:foo";
      const namespaces = {
        btw: "something",
      };

      const v = GUISelector.fromDataSelector(selector, namespaces);
      expect(v).to.have.property("value")
        .equal(toGUISelector(selector, namespaces));
    });

    it("caches values", () => {
      const namespaces = {
        "": "something",
      };
      const v = GUISelector.fromDataSelector("foo", namespaces);
      expect(v).to.equal(GUISelector.fromDataSelector("foo", namespaces));
    });
  });
});
