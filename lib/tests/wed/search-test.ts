/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "wed/caret-manager";
import { DLoc, DLocRange } from "wed/dloc";
import { Editor } from "wed/editor";
import { Context, Search } from "wed/search";

import * as globalConfig from "../base-config";

import { EditorSetup } from "../wed-test-util";

const expect = chai.expect;

// tslint:disable:no-any

describe("search", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let guiRoot: HTMLElement;
  let dataRoot: Document;
  let docScope: DLocRange;
  let caretManager: CaretManager;

  let ps: Element[];
  let firstBodyP: Element;
  let firstBodyPLocation: DLoc;
  let pFiveFirstThree: DLocRange;
  let pFiveFirstFour: DLocRange;
  let pSevenFirstThree: DLocRange;
  let firstABCText: DLocRange;
  let firstABCDText: DLocRange;
  let firstABCAttribute: DLocRange;
  let firstABCDAttribute: DLocRange;
  let secondABCAttribute: DLocRange;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/search_test_data/source_converted.xml",
      globalConfig.config,
      document);
    ({ editor } = setup);
    return setup.init();
  });

  before(() => {
    guiRoot = editor.guiRoot;
    dataRoot = editor.dataRoot;
    caretManager = editor.caretManager;
    docScope = editor.caretManager.docDLocRange;

    ps = Array.from(editor.dataRoot.querySelectorAll("body p"));
    firstBodyP = ps[0];
    firstBodyPLocation = caretManager.mustFromDataLocation(
      DLoc.mustMakeDLoc(dataRoot, firstBodyP, 0));

    // First 3 text characters in the 5th paragraph (at index 4).
    const pFiveStart = DLoc.mustMakeDLoc(dataRoot, ps[4].firstChild, 0);
    pFiveFirstThree = new DLocRange(
      caretManager.mustFromDataLocation(pFiveStart),
      caretManager.mustFromDataLocation(pFiveStart.makeWithOffset(3)));
    expect(pFiveFirstThree.mustMakeDOMRange().toString()).to.equal("abc");

    pFiveFirstFour = new DLocRange(
      caretManager.mustFromDataLocation(pFiveStart),
      caretManager.mustFromDataLocation(pFiveStart.makeWithOffset(4)));
    expect(pFiveFirstFour.mustMakeDOMRange().toString()).to.equal("abcd");

    const pSevenStart = DLoc.mustMakeDLoc(dataRoot, ps[6].firstChild, 0);
    pSevenFirstThree = new DLocRange(
      caretManager.mustFromDataLocation(pSevenStart),
      caretManager.mustFromDataLocation(pSevenStart.makeWithOffset(3)));
    expect(pSevenFirstThree.mustMakeDOMRange().toString()).to.equal("abc");

    // This is the first "abc" found when doing a TEXT search.
    firstABCText = new DLocRange(
      caretManager.mustFromDataLocation(ps[3].firstChild!.firstChild!, 0),
      caretManager.mustFromDataLocation(ps[3].lastChild!, 1));

    // This is the first "abcd" found when doing a TEXT search.
    firstABCDText = new DLocRange(
      caretManager.mustFromDataLocation(ps[3].firstChild!.firstChild!, 0),
      caretManager.mustFromDataLocation(ps[3].lastChild!, 2));

    const rend = ps[7].getAttributeNode("rend")!;
    firstABCAttribute = new DLocRange(
      caretManager.mustFromDataLocation(rend, 0),
      caretManager.mustFromDataLocation(rend, 3));

    firstABCDAttribute = new DLocRange(
      caretManager.mustFromDataLocation(rend, 0),
      caretManager.mustFromDataLocation(rend, 4));

    secondABCAttribute = new DLocRange(
      caretManager.mustFromDataLocation(rend, 4),
      caretManager.mustFromDataLocation(rend, 7));
  });

  beforeEach(() => {
    caretManager.setCaret(editor.caretManager.minCaret);
  });

  afterEach(() => {
    setup.reset();
  });

  after(() => {
    setup.restore();
    (editor as any) = undefined;
  });

  function makeSearch(start: DLoc, scope?: DLocRange): Search {
    return new Search(caretManager, guiRoot, start, scope);
  }

  function equalRanges(a: DLocRange, b: DLocRange): boolean {
    return a.equals(b);
  }

  function isDocScope(x: DLocRange): boolean {
    return x.equals(docScope);
  }

  describe("Search", () => {
    it("throws if start is not in scope", () => {
      expect(() => makeSearch(caretManager.caret!, pFiveFirstFour))
        .to.throw(Error, "the scope does not contain the start position");
    });

    it("starts with undefined current", () => {
      const search = makeSearch(caretManager.caret!);
      // We have to test not.have.property instead of testing for the presence
      // of a property with the value "undefined";
      expect(search).to.not.have.property("current");
    });

    describe("(private) scope", () => {
      it("is the whole document if no scope is specified", () => {
        const search = makeSearch(caretManager.caret!);
        expect(search).to.have.property("scope").satisfy(isDocScope);
      });

      it("is always the same object, if the scope has not been changed", () => {
        const search = makeSearch(caretManager.caret!);
        const scope = (search as any).scope;
        expect(search).to.have.property("scope").equal(scope);
      });
    });

    describe("(private) setScope", () => {
      it("can set scope to undefined", () => {
        const search = makeSearch(caretManager.caret!,
                                  new DLocRange(caretManager.minCaret,
                                                caretManager.minCaret));
        (search as any).setScope(undefined);
        expect(search).to.have.property("scope").satisfy(isDocScope);
      });

      it("throws on an invalid range", () => {
        const search = makeSearch(caretManager.caret!);
        const invalid = DLoc.mustMakeDLoc(guiRoot, guiRoot,
                                          guiRoot.childNodes.length);
        // We cheat and make the value invalid manually. Otherwise, we'd have to
        // modify the gui tree....
        (invalid as any).offset++;
        expect(invalid.isValid()).to.be.false;
        expect(
          () =>
            (search as any).setScope(
              new DLocRange(caretManager.minCaret, invalid)))
          .to.throw(Error, "passed an invalid range");
      });

      it("throws on a range outside of root", () => {
        const search = makeSearch(caretManager.caret!);
        const outside = DLoc.mustMakeDLoc(editor.dataRoot, editor.dataRoot, 0);
        expect(() => (search as any).setScope(new DLocRange(outside, outside)))
          .to.throw(Error, "the range does not use the search's root");
      });

      it("reverses the range, if needed", () => {
        const search = makeSearch(caretManager.caret!);
        // We pass a reversed docScope...
        (search as any).setScope(new DLocRange(caretManager.maxCaret,
                                               caretManager.minCaret));
        // ... so once reversed, it should be equal to docScope.
        expect(search).to.have.property("scope").satisfy(isDocScope);
      });
    });

    // tslint:disable-next-line:max-func-body-length
    function makeSeries(context: Context): void {
      describe(`(context ${Context[context]})`, () => {
        function makeContextSearch(start: DLoc, scope?: DLocRange): Search {
          const s = makeSearch(start, scope);
          s.context = context;
          return s;
        }

        function firstABCHit(): DLocRange {
          return {
            [Context.EVERYWHERE]: pFiveFirstThree,
            [Context.TEXT]: firstABCText,
            [Context.ATTRIBUTE_VALUES]: firstABCAttribute,
          }[context];
        }

        function firstABCDHit(): DLocRange {
          return {
            [Context.EVERYWHERE]: pFiveFirstFour,
            [Context.TEXT]: firstABCDText,
            [Context.ATTRIBUTE_VALUES]: firstABCDAttribute,
          }[context];
        }

        describe("updateCurrent", () => {
          it("finds the first hit", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abc";
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));
          });

          it("is idempotent if pattern has not changed", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abc";
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));
          });

          it("shortens the current hit", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abcd";
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCDHit()));

            search.pattern = "abc";
            search.updateCurrent();
            expect(search, "end").to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));
          });

          it("extends the current hit, when possible", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abc";
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));

            search.pattern = "abcd";
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCDHit()));
          });

          it("updates current to null if the pattern is empty", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abc";
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));

            search.pattern = "";
            search.updateCurrent();
            expect(search).to.have.property("current").null;
          });

          it("updates current to null if the pattern does not match", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abc";
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));

            search.pattern = "abcDOES NOT MATCH";
            search.updateCurrent();
            expect(search).to.have.property("current").null;
          });

          if (context === Context.EVERYWHERE) {
            it("finds into GUI elements", () => {
              const start = firstBodyPLocation;
              const pattern = "hi >";

              {
                const search = makeContextSearch(start);
                search.pattern = pattern;
                search.updateCurrent();
                // We are not particularly interested in the specific location.
                expect(search).to.have.property("current")
                  .to.be.instanceof(DLocRange);
              }

              // Make sure we don't have it in text. We create a 2nd search so
              // that we start from the same place, with the same conditions
              // (except context).
              {
                const search = makeContextSearch(start);
                search.context = Context.TEXT;
                search.pattern = pattern;
                search.updateCurrent();
                expect(search).to.have.property("current").null;
              }

              // Make sure we don't have it in attributes. We create a 3rd
              // search so that we start from the same place, with the same
              // conditions (except context).
              {
                const search = makeContextSearch(start);
                search.context = Context.ATTRIBUTE_VALUES;
                search.pattern = pattern;
                search.updateCurrent();
                expect(search).to.have.property("current").null;
              }
            });
          }
          else {
            it("does not find into GUI elements", () => {
              const start = firstBodyPLocation;
              const pattern = "hi >";

              {
                const search = makeContextSearch(start);
                search.pattern = pattern;
                search.updateCurrent();
                expect(search).to.have.property("current").null;
              }

              // Make sure we have it somewhere. We create a 2nd search so
              // that we start from the same place, with the same conditions
              // (except context).
              {
                const search = makeContextSearch(start);
                search.context = Context.EVERYWHERE;
                search.pattern = pattern;
                search.updateCurrent();
                // We are not particularly interested in the specific location.
                expect(search).to.have.property("current")
                  .to.be.instanceof(DLocRange);
              }
            });
          }

          if (context === Context.EVERYWHERE ||
              context === Context.ATTRIBUTE_VALUES) {
            it("finds into attributes", () => {
              const start = firstBodyPLocation;
              const pattern = "foo";

              {
                const search = makeContextSearch(start);
                search.pattern = pattern;
                search.updateCurrent();
                // We are not particularly interested in the specific location.
                expect(search).to.have.property("current")
                  .to.be.instanceof(DLocRange);
              }

              // Make sure we don't have it in text. We create a 2nd search so
              // that we start from the same place, with the same conditions
              // (except context).
              {
                const search = makeContextSearch(start);
                search.context = Context.TEXT;
                search.pattern = pattern;
                search.updateCurrent();
                expect(search).to.have.property("current").null;
              }

              // Make sure we have it in attributes. We create a 3rd search so
              // that we start from the same place, with the same conditions
              // (except context).
              {
                const search = makeContextSearch(start);
                search.context = Context.ATTRIBUTE_VALUES;
                search.pattern = pattern;
                search.updateCurrent();
                // We are not particularly interested in the specific location.
                expect(search).to.have.property("current")
                  .to.be.instanceof(DLocRange);
              }
            });
          }
          else {
            it("does not find into attributes", () => {
              const start = firstBodyPLocation;
              const pattern = "foo";

              {
                const search = makeContextSearch(start);
                search.pattern = pattern;
                search.updateCurrent();
                expect(search).to.have.property("current").null;
              }

              // Make sure we have it in attributes. We create a 2nd search so
              // that we start from the same place, with the same conditions
              // (except context).
              {
                const search = makeContextSearch(start);
                search.context = Context.ATTRIBUTE_VALUES;
                search.pattern = pattern;
                search.updateCurrent();
                // We are not particularly interested in the specific location.
                expect(search).to.have.property("current")
                  .to.be.instanceof(DLocRange);
              }
            });
          }

          it("respects the scope", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abc";
            search.updateCurrent();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));

            // We restrict the scope to a range that contains "abc". Searching
            // for abcd won't find anything, although the text exists outside
            // the scope.
            const restricted = makeContextSearch(pFiveFirstThree.start,
                                                 pFiveFirstThree);
            restricted.pattern = "abcd";
            restricted.updateCurrent();
            expect(restricted).to.have.property("current").null;
          });
        });

        describe("next", () => {
          it("finds the first hit", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abc";
            search.next();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));
          });

          it("moves to the next hit when called multiple times", () => {
            const search = makeContextSearch(firstBodyPLocation);
            search.pattern = "abc";
            search.next();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, firstABCHit()));

            search.next();
            const nextExpected: DLocRange = {
              [Context.EVERYWHERE]: pSevenFirstThree,
              [Context.TEXT]: pFiveFirstThree,
              [Context.ATTRIBUTE_VALUES]: secondABCAttribute,
            }[context];
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, nextExpected));
          });

          it("changes current to null if nothing can be found anymore", () => {
            // This test also tests that next respects the scope.
            let start: DLoc;
            let scope: DLocRange;
            let expectedFirst: DLocRange;
            if (context !== Context.ATTRIBUTE_VALUES) {
              start = pFiveFirstThree.start;
              scope = pFiveFirstThree;
              expectedFirst = pFiveFirstThree;
            }
            else {
              start = firstABCAttribute.start;
              scope = firstABCAttribute;
              expectedFirst = firstABCAttribute;
            }

            const search = makeContextSearch(start, scope);
            search.pattern = "abc";
            search.next();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, expectedFirst));
            search.next();
            expect(search).to.have.property("current").be.null;
          });

          it("rolls over, short range", () => {
            // This test also tests that next respects the scope.
            let start: DLoc;
            let scope: DLocRange;
            let expectedFirst: DLocRange;
            if (context !== Context.ATTRIBUTE_VALUES) {
              start = pFiveFirstThree.start;
              scope = pFiveFirstThree;
              expectedFirst = pFiveFirstThree;
            }
            else {
              start = firstABCAttribute.start;
              scope = firstABCAttribute;
              expectedFirst = firstABCAttribute;
            }

            const search = makeContextSearch(start, scope);
            search.pattern = "abc";
            search.next();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, expectedFirst));

            search.next();
            expect(search).to.have.property("current").be.null;

            search.next();
            expect(search).to.have.property("current")
              .satisfy(equalRanges.bind(undefined, expectedFirst));
          });

          it("rolls over, whole document", () => {
            // What we're doing here is record all hits until we get null.
            // Then we roll over and record all hits again. The two sets of
            // hits should be equal.
            const search = makeContextSearch(docScope.start);
            search.pattern = "abc";
            let current: DLocRange | undefined | null;
            const found: DLocRange[] = [];
            do {
              search.next();
              current = search.current;
              if (current != null) {
                found.push(current);
              }
            } while (current !== null);

            const found2nd: DLocRange[] = [];
            do {
              search.next();
              current = search.current;
              if (current != null) {
                found2nd.push(current);
              }
            } while (current !== null);

            expect(found2nd).to.be.lengthOf(found.length);
            for (let ix = 0; ix < found.length; ++ix) {
              expect(found[ix]).to
                .satisfy((x: DLocRange) => x.equals(found2nd[ix]));
            }
          });
        });
      });
    }

    // tslint:disable-next-line:mocha-no-side-effect-code
    makeSeries(Context.EVERYWHERE);
    // tslint:disable-next-line:mocha-no-side-effect-code
    makeSeries(Context.TEXT);
    // tslint:disable-next-line:mocha-no-side-effect-code
    makeSeries(Context.ATTRIBUTE_VALUES);
  });
});
