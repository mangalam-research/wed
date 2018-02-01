define(["require", "exports", "wed/dloc", "wed/gui/dialog-search-replace", "wed/key-constants", "../../base-config", "../../wed-test-util"], function (require, exports, dloc_1, dialog_search_replace_1, key_constants_1, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var expect = chai.expect;
    describe("dialog-search-replace", function () {
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
            // Make sure there is no dialog after each test.
            expect(document.querySelector(".modal .in")).to.be.null;
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        function makeSearch(direction) {
            // tslint:disable-next-line:no-any
            return new dialog_search_replace_1.DialogSearchReplace(editor, editor.scroller, direction);
        }
        function checkHighlightRanges(range) {
            var highlights = document.querySelectorAll("._wed_highlight");
            expect(highlights).to.have.property("length").greaterThan(0);
            var highlightRect = highlights[0].getBoundingClientRect();
            var rangeRect = range.mustMakeDOMRange().getBoundingClientRect();
            // The highlights are built as a series of rectangles. Checking each and
            // every rectangle would be onerous. We check the start and end of the
            // range.
            // Rounding can make the boundaries vary a bit.
            expect(highlightRect, "correct top").to.have.deep.property("top")
                .closeTo(rangeRect.top, 3);
            expect(highlightRect, "correct left").to.have.deep.property("left")
                .closeTo(rangeRect.left, 3);
            highlightRect = highlights[highlights.length - 1].getBoundingClientRect();
            expect(highlightRect, "correct bottom").to.have.deep.property("bottom")
                .closeTo(rangeRect.bottom, 3);
            expect(highlightRect, "correct right").to.have.deep.property("right")
                .closeTo(rangeRect.right, 3);
        }
        function checkNoHighlight() {
            expect(document.querySelector("._wed_highlight")).to.be.null;
        }
        function closeDialog() {
            var close = document.querySelector(".modal.in .close");
            close.click();
        }
        function typeInSearch(text) {
            var search = document
                .querySelector(".modal.in input[name=search]");
            search.value = text;
            $(search).trigger("input");
        }
        function typeInReplace(text) {
            var field = document
                .querySelector(".modal.in input[name=replace]");
            field.value = text;
            $(field).trigger("input");
        }
        function clearReplace() {
            var field = document
                .querySelector(".modal.in input[name=replace]");
            field.value = "";
            $(field).trigger("input");
        }
        function clickFind() {
            var find = document
                .querySelector(".modal.in [data-bb-handler=find]");
            find.click();
        }
        function clickReplace() {
            var button = document.querySelector(".modal.in [data-bb-handler=replaceFind]");
            button.click();
        }
        function clickReplaceAll() {
            var button = document.querySelector(".modal.in [data-bb-handler=replaceAll]");
            button.click();
        }
        function clickBackwards() {
            var button = document.querySelector(".modal.in [name=direction][value=backwards]");
            button.click();
        }
        function checkReplaceButton(enabled) {
            var button = document.querySelector(".modal.in [data-bb-handler=replaceFind]");
            expect(button).to.have.property("disabled").equal(!enabled);
        }
        function checkReplaceAllButton(enabled) {
            var button = document.querySelector(".modal.in [data-bb-handler=replaceAll]");
            expect(button).to.have.property("disabled").equal(!enabled);
        }
        function clickAttributes() {
            var button = document.querySelector(".modal.in [name=context][value=attributes]");
            button.click();
        }
        describe("DialogSearchReplace", function () {
            beforeEach(function () {
                checkNoHighlight();
            });
            afterEach(function () {
                closeDialog();
            });
            it("can be built", function () {
                makeSearch(dialog_search_replace_1.Direction.FORWARD);
            });
            it("updates the highlight when the user types", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abc");
                checkHighlightRanges(firstABCText);
            });
            it("searches forward", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abc");
                checkHighlightRanges(firstABCText);
                clickFind();
                checkHighlightRanges(pFiveFirstThree);
            });
            it("searches backwards", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abc");
                checkHighlightRanges(firstABCText);
                clickFind();
                checkHighlightRanges(pFiveFirstThree);
                clickBackwards();
                clickFind();
                checkHighlightRanges(firstABCText);
            });
            it("removes the highlight when there is no match", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abcNO MATCH");
                checkNoHighlight();
            });
            function rollTest(key) {
                editor.type(key);
                typeInSearch("abc");
                var count = 0;
                while (document.querySelector("._wed_highlight") !== null) {
                    count++;
                    clickFind();
                }
                expect(count).to.be.greaterThan(0);
                var count2 = 0;
                clickFind();
                while (document.querySelector("._wed_highlight") !== null) {
                    count2++;
                    clickFind();
                }
                expect(count2).to.equal(count);
            }
            it("rolls over forward", function () {
                editor.caretManager.setCaret(editor.caretManager.minCaret);
                rollTest(key_constants_1.SEARCH_FORWARD);
            });
            it("rolls over backwards", function () {
                editor.caretManager.setCaret(editor.caretManager.maxCaret);
                rollTest(key_constants_1.SEARCH_BACKWARDS);
            });
            it("starts with a replace button that is disabled", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                checkReplaceButton(false);
            });
            it("keeps the replace button disabled if the hit is ill-formed", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abc");
                // This is an ill-formed hit.
                checkHighlightRanges(firstABCText);
                checkReplaceButton(false);
                typeInReplace("foo");
                checkReplaceButton(false);
            });
            it("enables the replace button if the replace field is filled", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abc");
                clickFind();
                checkHighlightRanges(pFiveFirstThree);
                checkReplaceButton(false);
                typeInReplace("foo");
                checkReplaceButton(true);
                clearReplace();
                checkReplaceButton(false);
            });
            it("starts with a replace all button that is disabled", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                checkReplaceAllButton(false);
            });
            it("enables replace button even if the hit is ill-formed", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abc");
                // This is an ill-formed hit.
                checkHighlightRanges(firstABCText);
                typeInReplace("foo");
                checkReplaceAllButton(true);
            });
            it("enables the replace all button if the replace field is filled", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abc");
                clickFind();
                checkHighlightRanges(pFiveFirstThree);
                checkReplaceAllButton(false);
                typeInReplace("foo");
                checkReplaceAllButton(true);
                clearReplace();
                checkReplaceAllButton(false);
            });
            it("replaces", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                typeInSearch("abc");
                // This is an ill-formed hit.
                checkHighlightRanges(firstABCText);
                checkReplaceButton(false);
                clickFind();
                checkHighlightRanges(pFiveFirstThree);
                typeInReplace("foo");
                checkReplaceButton(true);
                clickReplace();
                var parent = pFiveFirstThree.start.node.parentNode;
                var dataParent = editor.toDataNode(parent);
                expect(dataParent).to.have.property("textContent").equal("foodefghij");
                checkHighlightRanges(pSevenFirstThree);
            });
            it("replaces all", function () {
                // tslint:disable-next-line:no-invalid-this
                this.timeout(4000);
                editor.caretManager.setCaret(editor.caretManager.minCaret);
                editor.type(key_constants_1.SEARCH_FORWARD);
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
            it("searches attributes", function () {
                editor.type(key_constants_1.SEARCH_FORWARD);
                clickAttributes();
                typeInSearch("abc");
                checkHighlightRanges(firstABCAttribute);
            });
        });
    });
});
//# sourceMappingURL=dialog-search-replace-test.js.map