/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as sinon from "sinon";

import { TypeaheadPopup } from "wed/gui/typeahead-popup";

const assert = chai.assert;

type MatcherCallback = (matches: { value: string }[]) => void;

function substringMatcher(strs: string[]):
(q: string, cb: MatcherCallback) => void {
  return function findMatches(q: string, cb: MatcherCallback): void {
    const re = new RegExp(q, "i");

    const matches: { value: string}[] = [];
    for (const str of strs) {
      if (re.test(str)) {
        matches.push({ value: str });
      }
    }

    cb(matches);
  };
}

const testData: string[] = [];
for (let i = 0; i < 100; ++i) {
  testData.push(`Test ${i}`);
}

describe("TypeaheadPopup", () => {
  let ta: TypeaheadPopup;
  let cb: sinon.SinonSpy;

  beforeEach(() => {
    cb = sinon.spy();
    ta = new TypeaheadPopup(
      window.document, 0, 0, 300, "Placeholder",
      {
        options: {
          autoselect: true,
          hint: true,
          highlight: true,
          minLength: 1,
        },
        datasets: [{
          source: substringMatcher(testData),
        }],
      },
      cb,
    );
  });

  afterEach(() => {
    if (ta !== undefined) {
      ta.dismiss();
    }
  });

  describe("setValue", () => {
    it("sets the value", () => {
      const ttInput =
        document.getElementsByClassName("tt-input")[0] as HTMLInputElement;
      assert.notEqual(ttInput.value, "foo");

      ta.setValue("foo");
      assert.equal(ttInput.value, "foo");
    });
  });

  describe("hideSpinner", () => {
    it("hides the spinner", () => {
      const spinner =
        document.querySelector(".wed-typeahead-popup .spinner") as HTMLElement;
      assert.notEqual(spinner.style.display, "none");

      ta.hideSpinner();
      assert.equal(spinner.style.display, "none");
    });
  });

  describe("dismiss", () => {
    it("calls the callback without a value if no value is given", () => {
      ta.dismiss();
      assert.isTrue(cb.calledWith(undefined));
    });

    it("calls the callback with the value passed", () => {
      ta.dismiss(testData[0]);
      assert.isTrue(cb.calledWith(testData[0]));
    });

    it("calls the callback with the value passed", () => {
      ta.dismiss(testData[0]);
      assert.isTrue(cb.calledWith(testData[0]));
    });

    it("calls the callback only once", () => {
      ta.dismiss();
      ta.dismiss();
      assert.isTrue(cb.calledOnce);
    });
  });
});
