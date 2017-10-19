define(["require", "exports", "module", "wed/dloc", "wed/gui/quick-search", "wed/key-constants", "wed/wed", "../../base-config", "../../wed-test-util"], function (require, exports, module, dloc_1, quick_search_1, key_constants_1, wed_1, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var expect = chai.expect;
    describe("quick-search", function () {
        var setup;
        var editor;
        var guiRoot;
        var dataRoot;
        var docScope;
        var caretManager;
        var ps;
        var firstBodyP;
        var firstBodyPLocation;
        var pFiveFirstThree;
        var pFiveFirstFour;
        var pSevenFirstThree;
        var firstABCText;
        var firstABCDText;
        var firstABCAttribute;
        var firstABCDAttribute;
        var secondABCAttribute;
        var titleBCD;
        var titleABCD;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/search_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init();
        });
        beforeEach(function () {
            guiRoot = editor.guiRoot;
            dataRoot = editor.dataRoot;
            caretManager = editor.caretManager;
            docScope = editor.caretManager.docDLocRange;
            var title = dataRoot.querySelector("title");
            titleBCD = new dloc_1.DLocRange(caretManager.mustFromDataLocation(title.firstChild, 1), caretManager.mustFromDataLocation(title.firstChild, 4));
            titleABCD = new dloc_1.DLocRange(caretManager.mustFromDataLocation(title.firstChild, 0), caretManager.mustFromDataLocation(title.firstChild, 4));
            ps = Array.from(dataRoot.querySelectorAll("body p"));
            firstBodyP = ps[0];
            firstBodyPLocation = caretManager.mustFromDataLocation(dloc_1.DLoc.mustMakeDLoc(dataRoot, firstBodyP, 0));
            caretManager.setCaret(firstBodyPLocation);
            // First 3 text characters in the 5th paragraph (at index 4).
            var pFiveStart = dloc_1.DLoc.mustMakeDLoc(dataRoot, ps[4].firstChild, 0);
            pFiveFirstThree = new dloc_1.DLocRange(caretManager.mustFromDataLocation(pFiveStart), caretManager.mustFromDataLocation(pFiveStart.makeWithOffset(3)));
            expect(pFiveFirstThree.mustMakeDOMRange().toString()).to.equal("abc");
            pFiveFirstFour = new dloc_1.DLocRange(caretManager.mustFromDataLocation(pFiveStart), caretManager.mustFromDataLocation(pFiveStart.makeWithOffset(4)));
            expect(pFiveFirstFour.mustMakeDOMRange().toString()).to.equal("abcd");
            var pSevenStart = dloc_1.DLoc.mustMakeDLoc(dataRoot, ps[6].firstChild, 0);
            pSevenFirstThree = new dloc_1.DLocRange(caretManager.mustFromDataLocation(pSevenStart), caretManager.mustFromDataLocation(pSevenStart.makeWithOffset(3)));
            expect(pSevenFirstThree.mustMakeDOMRange().toString()).to.equal("abc");
            // This is the first "abc" found when doing a TEXT search.
            firstABCText = new dloc_1.DLocRange(caretManager.mustFromDataLocation(ps[3].firstChild.firstChild, 0), caretManager.mustFromDataLocation(ps[3].lastChild, 1));
            // This is the first "abcd" found when doing a TEXT search.
            firstABCDText = new dloc_1.DLocRange(caretManager.mustFromDataLocation(ps[3].firstChild.firstChild, 0), caretManager.mustFromDataLocation(ps[3].lastChild, 2));
            var rend = ps[7].getAttributeNode("rend");
            firstABCAttribute = new dloc_1.DLocRange(caretManager.mustFromDataLocation(rend, 0), caretManager.mustFromDataLocation(rend, 3));
            firstABCDAttribute = new dloc_1.DLocRange(caretManager.mustFromDataLocation(rend, 0), caretManager.mustFromDataLocation(rend, 4));
            secondABCAttribute = new dloc_1.DLocRange(caretManager.mustFromDataLocation(rend, 4), caretManager.mustFromDataLocation(rend, 7));
        });
        afterEach(function () {
            // Make sure the minibuffer is off after each test.
            expect(editor).to.have.deep.property("minibuffer.enabled").false;
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        function makeQuickSearch(direction) {
            // tslint:disable-next-line:no-any
            return new quick_search_1.QuickSearch(editor, editor.scroller, direction);
        }
        function checkHighlightRanges(range) {
            var highlights = document.querySelectorAll("._wed_highlight");
            expect(highlights).to.have.property("length").greaterThan(0);
            var highlightRect = highlights[0].getBoundingClientRect();
            var rangeRect = firstABCText.mustMakeDOMRange()
                .nativeRange.getBoundingClientRect();
            // The highlights are built as a series of rectangles. Checking each and
            // every rectangle would be onerous. We check the start and end of the
            // range.
            // Rounding can make the boundaries vary a bit.
            expect(highlightRect).to.have.deep.property("top")
                .closeTo(rangeRect.top, 3);
            expect(highlightRect).to.have.deep.property("left")
                .closeTo(rangeRect.left, 3);
            highlightRect = highlights[highlights.length - 1].getBoundingClientRect();
            expect(highlightRect).to.have.deep.property("bottom")
                .closeTo(rangeRect.bottom, 3);
            expect(highlightRect).to.have.deep.property("right")
                .closeTo(rangeRect.right, 3);
        }
        function checkNoHighlight() {
            expect(document.querySelector("._wed_highlight")).to.be.null;
        }
        describe("QuickSearch", function () {
            beforeEach(function () {
                checkNoHighlight();
            });
            it("can be built", function () {
                makeQuickSearch(quick_search_1.Direction.FORWARD);
                editor.minibuffer.uninstallClient();
            });
            it("prompts forward", function () {
                editor.type(key_constants_1.QUICKSEARCH_FORWARD);
                expect(editor).to.have.deep.property("minibuffer.prompt")
                    .equal("Search forward:");
                editor.type(key_constants_1.ESCAPE, wed_1.WedEventTarget.MINIBUFFER);
            });
            it("prompts backwards", function () {
                editor.type(key_constants_1.QUICKSEARCH_BACKWARDS);
                expect(editor).to.have.deep.property("minibuffer.prompt")
                    .equal("Search backwards:");
                editor.type(key_constants_1.ESCAPE, wed_1.WedEventTarget.MINIBUFFER);
            });
            it("updates the highlight when the user types", function () {
                editor.type(key_constants_1.QUICKSEARCH_FORWARD);
                editor.type("abc", wed_1.WedEventTarget.MINIBUFFER);
                checkHighlightRanges(firstABCText);
                editor.type(key_constants_1.ESCAPE, wed_1.WedEventTarget.MINIBUFFER);
            });
            it("searches forward", function () {
                editor.type(key_constants_1.QUICKSEARCH_FORWARD);
                editor.type("abc", wed_1.WedEventTarget.MINIBUFFER);
                checkHighlightRanges(firstABCText);
                editor.type(key_constants_1.QUICKSEARCH_FORWARD);
                checkHighlightRanges(pFiveFirstThree);
                editor.type(key_constants_1.ESCAPE, wed_1.WedEventTarget.MINIBUFFER);
            });
            it("searches backwards", function () {
                editor.type(key_constants_1.QUICKSEARCH_FORWARD);
                editor.type("abc", wed_1.WedEventTarget.MINIBUFFER);
                checkHighlightRanges(firstABCText);
                editor.type(key_constants_1.QUICKSEARCH_FORWARD);
                checkHighlightRanges(pFiveFirstThree);
                editor.type(key_constants_1.QUICKSEARCH_BACKWARDS);
                checkHighlightRanges(firstABCText);
                editor.type(key_constants_1.ESCAPE, wed_1.WedEventTarget.MINIBUFFER);
            });
            it("removes the highlight when there is no match", function () {
                editor.type(key_constants_1.QUICKSEARCH_FORWARD);
                editor.type("abcNO MATCH", wed_1.WedEventTarget.MINIBUFFER);
                checkNoHighlight();
                editor.type(key_constants_1.ESCAPE, wed_1.WedEventTarget.MINIBUFFER);
            });
            function rollTest(key) {
                editor.type(key);
                editor.type("abc", wed_1.WedEventTarget.MINIBUFFER);
                var count = 0;
                while (document.querySelector("._wed_highlight") !== null) {
                    count++;
                    editor.type(key, wed_1.WedEventTarget.MINIBUFFER);
                }
                expect(count).to.be.greaterThan(0);
                var count2 = 0;
                editor.type(key, wed_1.WedEventTarget.MINIBUFFER);
                while (document.querySelector("._wed_highlight") !== null) {
                    count2++;
                    editor.type(key, wed_1.WedEventTarget.MINIBUFFER);
                }
                expect(count2).to.equal(count);
                editor.type(key_constants_1.ESCAPE, wed_1.WedEventTarget.MINIBUFFER);
            }
            it("rolls over forward", function () {
                editor.caretManager.setCaret(editor.caretManager.minCaret);
                rollTest(key_constants_1.QUICKSEARCH_FORWARD);
            });
            it("rolls over backwards", function () {
                editor.caretManager.setCaret(editor.caretManager.maxCaret);
                rollTest(key_constants_1.QUICKSEARCH_BACKWARDS);
            });
        });
    });
});

//# sourceMappingURL=quick-search-test.js.map
