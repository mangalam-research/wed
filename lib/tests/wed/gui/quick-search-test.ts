/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "wed/caret-manager";
import { DLoc, DLocRange } from "wed/dloc";
import { Editor, WedEventTarget } from "wed/editor";
import { Direction, QuickSearch } from "wed/gui/quick-search";
import { Key } from "wed/key";
import { ESCAPE, QUICKSEARCH_BACKWARDS,
         QUICKSEARCH_FORWARD } from "wed/key-constants";

import * as globalConfig from "../../base-config";

import { EditorSetup } from "../../wed-test-util";

const expect = chai.expect;

describe("quick-search", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let dataRoot: Document;
  let caretManager: CaretManager;

  let ps: Element[];
  let firstBodyP: Element;
  let firstBodyPLocation: DLoc;
  let pFiveFirstThree: DLocRange;
  let pFiveFirstFour: DLocRange;
  let pSevenFirstThree: DLocRange;
  let firstABCText: DLocRange;

  before(() => {
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
  });

  afterEach(() => {
    // Make sure the minibuffer is off after each test.
    expect(editor).to.have.nested.property("minibuffer.enabled").false;
    setup.reset();
  });

  after(() => {
    setup.restore();
    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
  });

  function makeQuickSearch(direction: Direction): QuickSearch {
    // tslint:disable-next-line:no-any
    return new QuickSearch(editor, (editor as any).scroller, direction);
  }

  function checkHighlightRanges(range: DLocRange): void {
    const highlights = document.querySelectorAll("._wed_highlight");
    expect(highlights).to.have.property("length").greaterThan(0);
    let highlightRect = highlights[0].getBoundingClientRect();
    const rangeRect =
      range.mustMakeDOMRange().getBoundingClientRect();

    // The highlights are built as a series of rectangles. Checking each and
    // every rectangle would be onerous. We check the start and end of the
    // range.

    // Rounding can make the boundaries vary a bit.
    expect(highlightRect).to.have.nested.property("top")
      .closeTo(rangeRect.top, 3);
    expect(highlightRect).to.have.nested.property("left")
      .closeTo(rangeRect.left, 3);

    highlightRect = highlights[highlights.length - 1].getBoundingClientRect();
    expect(highlightRect).to.have.nested.property("bottom")
      .closeTo(rangeRect.bottom, 3);
    expect(highlightRect).to.have.nested.property("right")
      .closeTo(rangeRect.right, 3);
  }

  function checkNoHighlight(): void {
      expect(document.querySelector("._wed_highlight")).to.be.null;
  }

  describe("QuickSearch", () => {

    beforeEach(() => {
      checkNoHighlight();
    });

    it("can be built", () => {
      makeQuickSearch(Direction.FORWARD);
      editor.minibuffer.uninstallClient();
    });

    it("prompts forward", () => {
      editor.type(QUICKSEARCH_FORWARD);
      expect(editor).to.have.nested.property("minibuffer.prompt")
        .equal("Search forward:");
      editor.type(ESCAPE, WedEventTarget.MINIBUFFER);
    });

    it("prompts backwards", () => {
      editor.type(QUICKSEARCH_BACKWARDS);
      expect(editor).to.have.nested.property("minibuffer.prompt")
        .equal("Search backwards:");
      editor.type(ESCAPE, WedEventTarget.MINIBUFFER);
    });

    it("updates the highlight when the user types", () => {
      editor.type(QUICKSEARCH_FORWARD);
      editor.type("abc", WedEventTarget.MINIBUFFER);
      checkHighlightRanges(firstABCText);
      editor.type(ESCAPE, WedEventTarget.MINIBUFFER);
    });

    it("searches forward", () => {
      editor.type(QUICKSEARCH_FORWARD);
      editor.type("abc", WedEventTarget.MINIBUFFER);
      checkHighlightRanges(firstABCText);
      editor.type(QUICKSEARCH_FORWARD, WedEventTarget.MINIBUFFER);
      checkHighlightRanges(pFiveFirstThree);
      editor.type(ESCAPE, WedEventTarget.MINIBUFFER);
    });

    it("searches backwards", () => {
      editor.type(QUICKSEARCH_FORWARD);
      editor.type("abc", WedEventTarget.MINIBUFFER);
      checkHighlightRanges(firstABCText);
      editor.type(QUICKSEARCH_FORWARD, WedEventTarget.MINIBUFFER);
      checkHighlightRanges(pFiveFirstThree);
      editor.type(QUICKSEARCH_BACKWARDS, WedEventTarget.MINIBUFFER);
      checkHighlightRanges(firstABCText);
      editor.type(ESCAPE, WedEventTarget.MINIBUFFER);
    });

    it("removes the highlight when there is no match", () => {
      editor.type(QUICKSEARCH_FORWARD);
      editor.type("abcNO MATCH", WedEventTarget.MINIBUFFER);
      checkNoHighlight();
      editor.type(ESCAPE, WedEventTarget.MINIBUFFER);
    });

    function rollTest(key: Key): void {
      editor.type(key);
      editor.type("abc", WedEventTarget.MINIBUFFER);
      let count = 0;
      while (document.querySelector("._wed_highlight") !== null) {
        count++;
        editor.type(key, WedEventTarget.MINIBUFFER);
      }
      expect(count).to.be.greaterThan(0);

      let count2 = 0;
      editor.type(key, WedEventTarget.MINIBUFFER);
      while (document.querySelector("._wed_highlight") !== null) {
        count2++;
        editor.type(key, WedEventTarget.MINIBUFFER);
      }

      expect(count2).to.equal(count);
      editor.type(ESCAPE, WedEventTarget.MINIBUFFER);
    }

    it("rolls over forward", () => {
      editor.caretManager.setCaret(editor.caretManager.minCaret);
      rollTest(QUICKSEARCH_FORWARD);
    });

    it("rolls over backwards", () => {
      editor.caretManager.setCaret(editor.caretManager.maxCaret);
      rollTest(QUICKSEARCH_BACKWARDS);
    });
  });
});
