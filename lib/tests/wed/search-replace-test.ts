/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "wed/caret-manager";
import { DLoc, DLocRange } from "wed/dloc";
import { Editor } from "wed/editor";
import { Context, Direction, SearchReplace } from "wed/gui/search-replace";

import * as globalConfig from "../base-config";

import { EditorSetup } from "../wed-test-util";

const expect = chai.expect;

// tslint:disable:no-any

describe("search-replace", () => {
  let setup: EditorSetup;
  let editor: Editor;
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
  let firstABCAttribute: DLocRange;
  let titleBCD: DLocRange;
  let titleABCD: DLocRange;

  beforeEach(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/search_test_data/source_converted.xml",
      globalConfig.config,
      document);
    ({ editor } = setup);
    return setup.init();
  });

  beforeEach(() => {
    dataRoot = editor.dataRoot;
    caretManager = editor.caretManager;
    docScope = editor.caretManager.docDLocRange;

    const title = dataRoot.querySelector("title")!;
    titleBCD = new DLocRange(
      caretManager.mustFromDataLocation(title.firstChild!, 1),
      caretManager.mustFromDataLocation(title.firstChild!, 4));
    titleABCD = new DLocRange(
      caretManager.mustFromDataLocation(title.firstChild!, 0),
      caretManager.mustFromDataLocation(title.firstChild!, 4));

    ps = Array.from(dataRoot.querySelectorAll("body p"));
    firstBodyP = ps[0];
    firstBodyPLocation = caretManager.mustFromDataLocation(
      DLoc.mustMakeDLoc(dataRoot, firstBodyP, 0));
    caretManager.setCaret(firstBodyPLocation);

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

    const rend = ps[7].getAttributeNode("rend")!;
    firstABCAttribute = new DLocRange(
      caretManager.mustFromDataLocation(rend, 0),
      caretManager.mustFromDataLocation(rend, 3));
  });

  afterEach(() => {
    setup.restore();
    (editor as any) = undefined;
  });

  function makeSr(): SearchReplace {
    return new SearchReplace(editor, (editor as any).scroller);
  }

  function equalRanges(a: DLocRange, b: DLocRange): boolean {
    return a.equals(b);
  }

  function isDocScope(x: DLocRange): boolean {
    return x.equals(docScope);
  }

  function inDocument(x: Node): boolean {
    return document.contains(x);
  }

  describe("SearchReplace", () => {
    it("throws if there is no caret set", () => {
      // Force the caret to be undefined.
      (caretManager as any)._sel = undefined;
      expect(makeSr).to.throw(Error, "search without a caret!");
    });

    it("starts with whole document scope if no selection", () => {
      expect(makeSr()).to.have.nested.property("search.scope")
        .satisfy(isDocScope);
    });

    it("starts with start position === caret if no selection", () => {
      expect(makeSr()).to.have.nested.property("search.start")
        .satisfy((x: DLoc) => x.equals(firstBodyPLocation));
    });

    it("starts with scope === selection", () => {
      caretManager.setRange(pFiveFirstThree.start.node,
                            pFiveFirstThree.start.offset,
                            pFiveFirstThree.end.node,
                            pFiveFirstThree.end.offset);
      expect(makeSr()).to.have.nested.property("search.scope")
        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
    });

    it("starts with start === selection start", () => {
      caretManager.setRange(pFiveFirstThree.start.node,
                            pFiveFirstThree.start.offset,
                            pFiveFirstThree.end.node,
                            pFiveFirstThree.end.offset);
      expect(makeSr()).to.have.nested.property("search.start")
        .satisfy((x: DLoc) => x.equals(pFiveFirstThree.start));
    });

    describe("current", () => {
      it("is initially undefined", () => {
        expect(makeSr()).to.have.property("current").undefined;
      });

      it("holds the hit", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
      });

      it("is null when there's nothing to find", () => {
        const sr = makeSr();
        sr.updatePattern("abcDOES NOT MATCH", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").null;
      });
    });

    describe("canReplace", () => {
      it("is initially false", () => {
        expect(makeSr()).to.have.property("canReplace").false;
      });

      it("is true on a well-formed hit", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
        expect(sr).to.have.property("canReplace").true;
      });

      it("is false when there's no hit", () => {
        const sr = makeSr();
        sr.updatePattern("abcDOES NOT MATCH", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").null;
        expect(sr).to.have.property("canReplace").false;
      });

      it("is false on an ill-formed hit", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.TEXT,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, firstABCText));
        expect(sr).to.have.property("canReplace").false;
      });
    });

    describe("updatePattern", () => {
      it("searches forward", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));

        sr.updatePattern("abcd", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstFour));

        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
      });

      it("searches backwards", () => {
        const sr = makeSr();
        sr.updatePattern("bcd", {
          direction: Direction.BACKWARDS,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, titleBCD));

        sr.updatePattern("abcd", {
          direction: Direction.BACKWARDS,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, titleABCD));
      });

      it("searches in context EVERYWHERE", () => {
        const sr = makeSr();
        const pattern = "hi >";
        sr.updatePattern(pattern, {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to.be.instanceOf(DLocRange);

        sr.updatePattern(pattern, {
          direction: Direction.FORWARD,
          context: Context.TEXT,
        });

        expect(sr).to.have.property("current").null;

        sr.updatePattern(pattern, {
          direction: Direction.FORWARD,
          context: Context.ATTRIBUTE_VALUES,
        });

        expect(sr).to.have.property("current").null;
      });

      it("searches in context TEXT", () => {
        const sr = makeSr();
        const pattern = "abc";
        sr.updatePattern(pattern, {
          direction: Direction.FORWARD,
          context: Context.TEXT,
        });

        expect(sr).to.have.property("current")
          .to.satisfy(equalRanges.bind(undefined, firstABCText));
      });

      it("searches in context ATTRIBUTE_VALUES", () => {
        const sr = makeSr();
        const pattern = "abc";
        sr.updatePattern(pattern, {
          direction: Direction.FORWARD,
          context: Context.ATTRIBUTE_VALUES,
        });

        expect(sr).to.have.property("current")
          .to.satisfy(equalRanges.bind(undefined, firstABCAttribute));
      });

      it("sets a highlight", () => {
        const sr = makeSr();
        expect(document.querySelector("._wed_highlight")).to.be.null;

        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(document.querySelector("._wed_highlight")).to.not.be.null;
      });

      it("changes highlight", () => {
        const sr = makeSr();

        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        const oldHighlights =
          Array.from(document.querySelectorAll("._wed_highlight"));
        expect(oldHighlights).to.have.property("length").greaterThan(0);

        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        for (const h of oldHighlights) {
          expect(h).to.not.satisfy(inDocument);
        }

        expect(document.querySelector("._wed_highlight")).to.not.be.null;
      });
    });

    describe("next", () => {
      it("searches forward", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));

        sr.next({
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pSevenFirstThree));
      });

      it("searches backwards", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));

        sr.next({
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pSevenFirstThree));

        sr.next({
          direction: Direction.BACKWARDS,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
      });

      it("searches in context EVERYWHERE", () => {
        const sr = makeSr();
        const pattern = "hi >";
        sr.updatePattern(pattern, {
          direction: Direction.FORWARD,
          context: Context.TEXT,
        });

        expect(sr).to.have.property("current").null;

        sr.next({
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").instanceOf(DLocRange);
      });

      it("searches in context TEXT", () => {
        const sr = makeSr();
        const pattern = "abc";
        sr.updatePattern(pattern, {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));

        sr.next({
          direction: Direction.BACKWARDS,
          context: Context.TEXT,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, firstABCText));
      });

      it("searches in context ATTRIBUTE_VALUES", () => {
        const sr = makeSr();
        const pattern = "abc";
        sr.updatePattern(pattern, {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").instanceOf(DLocRange);

        sr.next({
          direction: Direction.FORWARD,
          context: Context.ATTRIBUTE_VALUES,
        });

        expect(sr).to.have.property("current")
          .satisfy(equalRanges.bind(undefined, firstABCAttribute));
      });

      it("sets a highlight", () => {
        const sr = makeSr();
        expect(document.querySelector("._wed_highlight")).to.be.null;

        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(document.querySelector("._wed_highlight")).to.not.be.null;
      });

      it("changes highlight", () => {
        const sr = makeSr();

        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        const oldHighlights =
          Array.from(document.querySelectorAll("._wed_highlight"));
        expect(oldHighlights).to.have.property("length").greaterThan(0);

        sr.next({
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        for (const h of oldHighlights) {
          expect(h).to.not.satisfy(inDocument);
        }

        expect(document.querySelector("._wed_highlight")).to.not.be.null;
      });
    });

    describe("replace", () => {
      it("replaces text", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.EVERYWHERE,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
        const pGUI = pFiveFirstThree.start.node.parentNode!;
        const p = editor.toDataNode(pGUI);
        expect(p).to.have.property("textContent").equal("abcdefghij");

        sr.replace("x");
        expect(p).to.have.property("textContent").equal("xdefghij");
      });

      it("replaces attribute values", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.ATTRIBUTE_VALUES,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, firstABCAttribute));
        const valGUI = firstABCAttribute.start.node.parentNode!;
        const val = editor.toDataNode(valGUI);
        expect(val).to.have.property("textContent").equal("abcdabcdabcd");

        sr.replace("x");
        expect(val).to.have.property("textContent").equal("xdabcdabcd");
      });

      it("throws on ill-formed hit", () => {
        const sr = makeSr();
        sr.updatePattern("abc", {
          direction: Direction.FORWARD,
          context: Context.TEXT,
        });

        expect(sr).to.have.property("current").to
          .satisfy(equalRanges.bind(undefined, firstABCText));
        expect(() => {
          sr.replace("x");
        }).to.throw(Error, "tried to replace when it is not possible");
      });
    });
  });
});
