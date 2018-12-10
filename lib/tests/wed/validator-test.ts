/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Event, EventSet, Grammar, Name, readTreeFromJSON,
         ValidationError } from "salve";
import { ErrorData } from "salve-dom";

import { DLoc, DLocRoot } from "wed/dloc";
import * as validator from "wed/validator";

import { DataProvider } from "../util";

const assert = chai.assert;

function sameEvents(evs: EventSet, expected: Event[]): void {
  assert.sameMembers(
    Array.from(evs).map((x) => x.toString()),
    expected.map((x) => x.toString()));
}

describe("validator", () => {
  let emptyTree: HTMLElement;
  let emptyDataRoot: DLocRoot;
  let grammar: Grammar;
  let genericTree: Document;

  before(() => {
    const frag = document.createDocumentFragment();
    emptyTree = document.createElement("div");
    frag.appendChild(emptyTree);
    emptyDataRoot = new DLocRoot(frag as Document);

    const provider = new DataProvider("/base/build/");
    return Promise.all([
      provider.getText("schemas/simplified-rng.js").then((schema) => {
        grammar = readTreeFromJSON(schema);
      }),
      provider.getDoc(
        "standalone/lib/tests/validator_test_data/to_parse_converted.xml")
        .then((doc) => {
          genericTree = doc;
        }),
    ]);
  });

  describe("possibleAt", () => {
    it("with DLoc", () => {
      const p = new validator.Validator(grammar, emptyTree, []);
      const evs = p.possibleAt(DLoc.mustMakeDLoc(emptyDataRoot, emptyTree, 0));
      sameEvents(evs, [new Event("enterStartTag", new Name("", "", "html"))]);
    });
  });

  // We test speculativelyValidateFragment through speculativelyValidate
  describe("speculativelyValidate", () => {
    it("with DLoc", () => {
      const tree = genericTree.cloneNode(true) as Document;
      const dataRoot = new DLocRoot(tree);
      const p = new validator.Validator(grammar, tree, []);
      const body = tree.getElementsByTagName("body")[0];
      const container = body.parentNode!;
      const index = Array.prototype.indexOf.call(container.childNodes, body);
      const ret = p.speculativelyValidate(
        DLoc.mustMakeDLoc(dataRoot, container, index), body);
      assert.isFalse(ret);
    });
  });

  // speculativelyValidateFragment is largely tested through
  // speculativelyValidate above.
  describe("speculativelyValidateFragment", () => {
    it("throws an error if toParse is not an element", () => {
      const tree = genericTree.cloneNode(true) as Document;
      const dataRoot = new DLocRoot(tree);
      const p = new validator.Validator(grammar, tree, []);
      // tslint:disable-next-line:no-any
      (p as any)._maxTimespan = 0; // Work forever.
      const body = tree.getElementsByTagName("body")[0];
      const container = body.parentNode!;
      const index = Array.prototype.indexOf.call(container.childNodes, body);
      assert.throws(p.speculativelyValidateFragment.bind(
        p, DLoc.makeDLoc(dataRoot, container, index),
        document.createTextNode("blah")), Error, "toParse is not an element");
    });
  });

  describe("with a mode validator", () => {
    let p: validator.Validator;
    let tree: Document;
    let validationError: ValidationError;

    before(() => {
      validationError = new ValidationError("Test");
      tree = genericTree.cloneNode(true) as Document;
    });

    beforeEach(() => {
      // tslint:disable-next-line:completed-docs
      class Validator {
        validateDocument(): ErrorData[] {
          return [{
            error: validationError,
            node: tree,
            index: 0,
          }];
        }
      }

      p = new validator.Validator(grammar, tree, [new Validator()]);
      // tslint:disable-next-line:no-any
      (p as any)._maxTimespan = 0; // Work forever.
    });

    function onCompletion(cb: () => void): void {
      p.events.addEventListener("state-update", (state) => {
        if (!(state.state === validator.VALID ||
              state.state === validator.INVALID)) {
          return;
        }
        cb();
      });
    }

    it("records additional errors", (done) => {
      onCompletion(() => {
        assert.deepEqual(p.errors, [{ error: validationError, node: tree,
                                      index: 0 }]);
        done();
      });
      p.start();
    });

    it("emits additional error events", (done) => {
      let seen = 0;
      p.events.addEventListener("error", (error) => {
        assert.deepEqual(error, { error: validationError, node: tree,
                                  index: 0 });
        seen++;
      });
      onCompletion(() => {
        assert.equal(seen, 1);
        done();
      });
      p.start();
    });
  });
});

//  LocalWords:  enterStartTag html jQuery Dubeau MPL Mangalam config
//  LocalWords:  RequireJS requirejs subdirectory validator jquery js
//  LocalWords:  chai baseUrl rng
