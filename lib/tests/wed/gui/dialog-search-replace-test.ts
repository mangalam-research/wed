/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "wed/caret-manager";
import { DLoc, DLocRange } from "wed/dloc";
import { Editor } from "wed/editor";
import { DialogSearchReplace, Direction } from "wed/gui/dialog-search-replace";
import { Key } from "wed/key";
import { SEARCH_BACKWARDS, SEARCH_FORWARD } from "wed/key-constants";

import * as globalConfig from "../../base-config";

import { EditorSetup } from "../../wed-test-util";

const expect = chai.expect;

describe("dialog-search-replace", () => {
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
  let firstABCDText: DLocRange;
  let firstABCAttribute: DLocRange;

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

    // This is the first "abcd" found when doing a TEXT search.
    firstABCDText = new DLocRange(
      caretManager.mustFromDataLocation(ps[3].firstChild!.firstChild!, 0),
      caretManager.mustFromDataLocation(ps[3].lastChild!, 2));

    const rend = ps[7].getAttributeNode("rend")!;
    firstABCAttribute = new DLocRange(
      caretManager.mustFromDataLocation(rend, 0),
      caretManager.mustFromDataLocation(rend, 3));
  });

  afterEach(() => {
    // Make sure there is no dialog after each test.
    expect(document.querySelector(".modal .in")).to.be.null;
    setup.reset();
  });

  after(() => {
    setup.restore();
    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
  });

  function makeSearch(direction: Direction): DialogSearchReplace {
    // tslint:disable-next-line:no-any
    return new DialogSearchReplace(editor, (editor as any).scroller, direction);
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
    expect(highlightRect, "correct top").to.have.nested.property("top")
      .closeTo(rangeRect.top, 3);
    expect(highlightRect, "correct left").to.have.nested.property("left")
      .closeTo(rangeRect.left, 3);

    highlightRect = highlights[highlights.length - 1].getBoundingClientRect();
    expect(highlightRect, "correct bottom").to.have.nested.property("bottom")
      .closeTo(rangeRect.bottom, 3);
    expect(highlightRect, "correct right").to.have.nested.property("right")
      .closeTo(rangeRect.right, 3);
  }

  function checkNoHighlight(): void {
      expect(document.querySelector("._wed_highlight")).to.be.null;
  }

  function closeDialog(): void {
    const close = document.querySelector(".modal.in .close") as HTMLElement;
    close.click();
  }

  function typeInSearch(text: string): void {
    const search = document
      .querySelector(".modal.in input[name=search]") as HTMLInputElement;
    search.value = text;
    $(search).trigger("input");
  }

  function typeInReplace(text: string): void {
    const field = document
      .querySelector(".modal.in input[name=replace]") as HTMLInputElement;
    field.value = text;
    $(field).trigger("input");
  }

  function clearReplace(): void {
    const field = document
      .querySelector(".modal.in input[name=replace]") as HTMLInputElement;
    field.value = "";
    $(field).trigger("input");
  }

  function clickFind(): void {
    const find = document
      .querySelector(".modal.in [data-bb-handler=find]") as HTMLButtonElement;
    find.click();
  }

  function clickReplace(): void {
    const button =
      (document.querySelector(".modal.in [data-bb-handler=replaceFind]") as
       HTMLButtonElement);
    button.click();
  }

  function clickReplaceAll(): void {
    const button =
      (document.querySelector(".modal.in [data-bb-handler=replaceAll]") as
       HTMLButtonElement);
    button.click();
  }

  function clickBackwards(): void {
    const button =
      (document.querySelector(".modal.in [name=direction][value=backwards]") as
       HTMLButtonElement);
    button.click();
  }

  function checkReplaceButton(enabled: boolean): void {
    const button =
      (document.querySelector(".modal.in [data-bb-handler=replaceFind]") as
       HTMLButtonElement);
    expect(button).to.have.property("disabled").equal(!enabled);
  }

  function checkReplaceAllButton(enabled: boolean): void {
    const button =
      (document.querySelector(".modal.in [data-bb-handler=replaceAll]") as
       HTMLButtonElement);
    expect(button).to.have.property("disabled").equal(!enabled);
  }

  function clickAttributes(): void {
    const button =
      (document.querySelector(".modal.in [name=context][value=attributes]") as
       HTMLButtonElement);
    button.click();
  }

  describe("DialogSearchReplace", () => {

    beforeEach(() => {
      checkNoHighlight();
    });

    afterEach(() => {
      closeDialog();
    });

    it("can be built", () => {
      makeSearch(Direction.FORWARD);
    });

    it("updates the highlight when the user types", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abc");
      checkHighlightRanges(firstABCText);
    });

    it("searches forward", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abc");
      checkHighlightRanges(firstABCText);
      clickFind();
      checkHighlightRanges(pFiveFirstThree);
    });

    it("searches backwards", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abc");
      checkHighlightRanges(firstABCText);
      clickFind();
      checkHighlightRanges(pFiveFirstThree);
      clickBackwards();
      clickFind();
      checkHighlightRanges(firstABCText);
    });

    it("removes the highlight when there is no match", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abcNO MATCH");
      checkNoHighlight();
    });

    function rollTest(key: Key): void {
      editor.type(key);
      typeInSearch("abc");
      let count = 0;
      while (document.querySelector("._wed_highlight") !== null) {
        count++;
        clickFind();
      }
      expect(count).to.be.greaterThan(0);

      let count2 = 0;
      clickFind();
      while (document.querySelector("._wed_highlight") !== null) {
        count2++;
        clickFind();
      }

      expect(count2).to.equal(count);
    }

    it("rolls over forward", () => {
      editor.caretManager.setCaret(editor.caretManager.minCaret);
      rollTest(SEARCH_FORWARD);
    });

    it("rolls over backwards", () => {
      editor.caretManager.setCaret(editor.caretManager.maxCaret);
      rollTest(SEARCH_BACKWARDS);
    });

    it("starts with a replace button that is disabled", () => {
      editor.type(SEARCH_FORWARD);
      checkReplaceButton(false);
    });

    it("keeps the replace button disabled if the hit is ill-formed", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abc");

      // This is an ill-formed hit.
      checkHighlightRanges(firstABCText);
      checkReplaceButton(false);

      typeInReplace("foo");
      checkReplaceButton(false);
    });

    it("enables the replace button if the replace field is filled", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abc");

      clickFind();
      checkHighlightRanges(pFiveFirstThree);
      checkReplaceButton(false);

      typeInReplace("foo");
      checkReplaceButton(true);

      clearReplace();
      checkReplaceButton(false);
    });

    it("starts with a replace all button that is disabled", () => {
      editor.type(SEARCH_FORWARD);
      checkReplaceAllButton(false);
    });

    it("enables replace button even if the hit is ill-formed", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abc");

      // This is an ill-formed hit.
      checkHighlightRanges(firstABCText);
      typeInReplace("foo");
      checkReplaceAllButton(true);
    });

    it("enables the replace all button if the replace field is filled", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abc");

      clickFind();
      checkHighlightRanges(pFiveFirstThree);
      checkReplaceAllButton(false);

      typeInReplace("foo");
      checkReplaceAllButton(true);

      clearReplace();
      checkReplaceAllButton(false);
    });

    it("replaces", () => {
      editor.type(SEARCH_FORWARD);
      typeInSearch("abc");

      // This is an ill-formed hit.
      checkHighlightRanges(firstABCText);
      checkReplaceButton(false);

      clickFind();
      checkHighlightRanges(pFiveFirstThree);

      typeInReplace("foo");
      checkReplaceButton(true);
      clickReplace();

      const parent = pFiveFirstThree.start.node.parentNode!;
      const dataParent = editor.toDataNode(parent);
      expect(dataParent).to.have.property("textContent").equal("foodefghij");

      checkHighlightRanges(pSevenFirstThree);
    });

    it("replaces all", function (): void {
      // tslint:disable-next-line:no-invalid-this
      this.timeout(4000);
      editor.caretManager.setCaret(editor.caretManager.minCaret);
      editor.type(SEARCH_FORWARD);
      typeInSearch("abcd");
      typeInReplace("fnarble");

      clickReplaceAll();

      clickFind();
      // This is a hit that cannot be replaced because it is malformed.
      checkHighlightRanges(firstABCDText);

      clickFind();
      // Everything else was replaced, so we have no more hits.
      checkNoHighlight();
    });

    it("searches attributes", () => {
      editor.type(SEARCH_FORWARD);

      clickAttributes();
      typeInSearch("abc");
      checkHighlightRanges(firstABCAttribute);
    });
  });
});
