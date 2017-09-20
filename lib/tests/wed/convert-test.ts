/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as browsers from "wed/browsers";
import * as convert from "wed/convert";

import { DataProvider } from "../util";

const assert = chai.assert;

describe("convert", () => {
  let parser: DOMParser;
  let provider: DataProvider;

  before(() => {
    parser = new DOMParser();
    provider =
      new DataProvider("/base/build/standalone/lib/tests/convert_test_data/");
  });

  function makeTest(name: string, differsOnIE: boolean = false): void {
    const convertedName = name.replace(/ /g, "-");
    const sourcePath = `${convertedName}.xml`;

    // If the test differs on IE and we are on IE, then add -ie to the basename.
    const ie = differsOnIE && browsers.MSIE;
    const expectedPath = `${convertedName + (ie ? "-ie" : "")}.html`;

    describe("", () => {
      let source: string;
      let expected: string;
      before(() => Promise.all([
        provider.getText(sourcePath).then((data) => {
          source = data;
        }),
        provider.getText(expectedPath).then((data) => {
          expected = data;
        })]));

      it(name, () => {
        const root = parser.parseFromString(source, "application/xml")
          .documentElement;
        const html = convert.toHTMLTree(window.document, root) as HTMLElement;
        // The reason this does not produce a diff seems to be that Mocha's HTML
        // reporter does not support diffs.
        assert.equal(`${html.outerHTML}\n`, expected);
      });
    });
  }

  // tslint:disable:mocha-no-side-effect-code
  makeTest("should convert xml to html");
  makeTest("should encode name prefixes", true);
  makeTest("should encode dashes in attribute names");
  makeTest("should encode namespace changes", true);
  // tslint:enable:mocha-no-side-effect-code
});
