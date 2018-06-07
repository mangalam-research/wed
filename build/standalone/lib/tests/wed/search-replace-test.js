var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "wed/dloc", "wed/gui/search-replace", "../base-config", "../wed-test-util"], function (require, exports, dloc_1, search_replace_1, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    globalConfig = __importStar(globalConfig);
    var expect = chai.expect;
    // tslint:disable:no-any
    describe("search-replace", function () {
        var setup;
        var editor;
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
        var firstABCAttribute;
        var titleBCD;
        var titleABCD;
        beforeEach(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/search_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init();
        });
        beforeEach(function () {
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
            var rend = ps[7].getAttributeNode("rend");
            firstABCAttribute = new dloc_1.DLocRange(caretManager.mustFromDataLocation(rend, 0), caretManager.mustFromDataLocation(rend, 3));
        });
        afterEach(function () {
            setup.restore();
            editor = undefined;
        });
        function makeSr() {
            return new search_replace_1.SearchReplace(editor, editor.scroller);
        }
        function equalRanges(a, b) {
            return a.equals(b);
        }
        function isDocScope(x) {
            return x.equals(docScope);
        }
        function inDocument(x) {
            return document.contains(x);
        }
        describe("SearchReplace", function () {
            it("throws if there is no caret set", function () {
                // Force the caret to be undefined.
                caretManager._sel = undefined;
                expect(makeSr).to.throw(Error, "search without a caret!");
            });
            it("starts with whole document scope if no selection", function () {
                expect(makeSr()).to.have.nested.property("search.scope")
                    .satisfy(isDocScope);
            });
            it("starts with start position === caret if no selection", function () {
                expect(makeSr()).to.have.nested.property("search.start")
                    .satisfy(function (x) { return x.equals(firstBodyPLocation); });
            });
            it("starts with scope === selection", function () {
                caretManager.setRange(pFiveFirstThree.start.node, pFiveFirstThree.start.offset, pFiveFirstThree.end.node, pFiveFirstThree.end.offset);
                expect(makeSr()).to.have.nested.property("search.scope")
                    .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
            });
            it("starts with start === selection start", function () {
                caretManager.setRange(pFiveFirstThree.start.node, pFiveFirstThree.start.offset, pFiveFirstThree.end.node, pFiveFirstThree.end.offset);
                expect(makeSr()).to.have.nested.property("search.start")
                    .satisfy(function (x) { return x.equals(pFiveFirstThree.start); });
            });
            describe("current", function () {
                it("is initially undefined", function () {
                    expect(makeSr()).to.have.property("current").undefined;
                });
                it("holds the hit", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                });
                it("is null when there's nothing to find", function () {
                    var sr = makeSr();
                    sr.updatePattern("abcDOES NOT MATCH", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").null;
                });
            });
            describe("canReplace", function () {
                it("is initially false", function () {
                    expect(makeSr()).to.have.property("canReplace").false;
                });
                it("is true on a well-formed hit", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                    expect(sr).to.have.property("canReplace").true;
                });
                it("is false when there's no hit", function () {
                    var sr = makeSr();
                    sr.updatePattern("abcDOES NOT MATCH", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").null;
                    expect(sr).to.have.property("canReplace").false;
                });
                it("is false on an ill-formed hit", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.TEXT,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, firstABCText));
                    expect(sr).to.have.property("canReplace").false;
                });
            });
            describe("updatePattern", function () {
                it("searches forward", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                    sr.updatePattern("abcd", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstFour));
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                });
                it("searches backwards", function () {
                    var sr = makeSr();
                    sr.updatePattern("bcd", {
                        direction: search_replace_1.Direction.BACKWARDS,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, titleBCD));
                    sr.updatePattern("abcd", {
                        direction: search_replace_1.Direction.BACKWARDS,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, titleABCD));
                });
                it("searches in context EVERYWHERE", function () {
                    var sr = makeSr();
                    var pattern = "hi >";
                    sr.updatePattern(pattern, {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to.be.instanceOf(dloc_1.DLocRange);
                    sr.updatePattern(pattern, {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.TEXT,
                    });
                    expect(sr).to.have.property("current").null;
                    sr.updatePattern(pattern, {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.ATTRIBUTE_VALUES,
                    });
                    expect(sr).to.have.property("current").null;
                });
                it("searches in context TEXT", function () {
                    var sr = makeSr();
                    var pattern = "abc";
                    sr.updatePattern(pattern, {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.TEXT,
                    });
                    expect(sr).to.have.property("current")
                        .to.satisfy(equalRanges.bind(undefined, firstABCText));
                });
                it("searches in context ATTRIBUTE_VALUES", function () {
                    var sr = makeSr();
                    var pattern = "abc";
                    sr.updatePattern(pattern, {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.ATTRIBUTE_VALUES,
                    });
                    expect(sr).to.have.property("current")
                        .to.satisfy(equalRanges.bind(undefined, firstABCAttribute));
                });
                it("sets a highlight", function () {
                    var sr = makeSr();
                    expect(document.querySelector("._wed_highlight")).to.be.null;
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(document.querySelector("._wed_highlight")).to.not.be.null;
                });
                it("changes highlight", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    var oldHighlights = Array.from(document.querySelectorAll("._wed_highlight"));
                    expect(oldHighlights).to.have.property("length").greaterThan(0);
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    for (var _i = 0, oldHighlights_1 = oldHighlights; _i < oldHighlights_1.length; _i++) {
                        var h = oldHighlights_1[_i];
                        expect(h).to.not.satisfy(inDocument);
                    }
                    expect(document.querySelector("._wed_highlight")).to.not.be.null;
                });
            });
            describe("next", function () {
                it("searches forward", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                    sr.next({
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pSevenFirstThree));
                });
                it("searches backwards", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                    sr.next({
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pSevenFirstThree));
                    sr.next({
                        direction: search_replace_1.Direction.BACKWARDS,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                });
                it("searches in context EVERYWHERE", function () {
                    var sr = makeSr();
                    var pattern = "hi >";
                    sr.updatePattern(pattern, {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.TEXT,
                    });
                    expect(sr).to.have.property("current").null;
                    sr.next({
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").instanceOf(dloc_1.DLocRange);
                });
                it("searches in context TEXT", function () {
                    var sr = makeSr();
                    var pattern = "abc";
                    sr.updatePattern(pattern, {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                    sr.next({
                        direction: search_replace_1.Direction.BACKWARDS,
                        context: search_replace_1.Context.TEXT,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, firstABCText));
                });
                it("searches in context ATTRIBUTE_VALUES", function () {
                    var sr = makeSr();
                    var pattern = "abc";
                    sr.updatePattern(pattern, {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").instanceOf(dloc_1.DLocRange);
                    sr.next({
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.ATTRIBUTE_VALUES,
                    });
                    expect(sr).to.have.property("current")
                        .satisfy(equalRanges.bind(undefined, firstABCAttribute));
                });
                it("sets a highlight", function () {
                    var sr = makeSr();
                    expect(document.querySelector("._wed_highlight")).to.be.null;
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(document.querySelector("._wed_highlight")).to.not.be.null;
                });
                it("changes highlight", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    var oldHighlights = Array.from(document.querySelectorAll("._wed_highlight"));
                    expect(oldHighlights).to.have.property("length").greaterThan(0);
                    sr.next({
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    for (var _i = 0, oldHighlights_2 = oldHighlights; _i < oldHighlights_2.length; _i++) {
                        var h = oldHighlights_2[_i];
                        expect(h).to.not.satisfy(inDocument);
                    }
                    expect(document.querySelector("._wed_highlight")).to.not.be.null;
                });
            });
            describe("replace", function () {
                it("replaces text", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.EVERYWHERE,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, pFiveFirstThree));
                    var pGUI = pFiveFirstThree.start.node.parentNode;
                    var p = editor.toDataNode(pGUI);
                    expect(p).to.have.property("textContent").equal("abcdefghij");
                    sr.replace("x");
                    expect(p).to.have.property("textContent").equal("xdefghij");
                });
                it("replaces attribute values", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.ATTRIBUTE_VALUES,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, firstABCAttribute));
                    var valGUI = firstABCAttribute.start.node.parentNode;
                    var val = editor.toDataNode(valGUI);
                    expect(val).to.have.property("textContent").equal("abcdabcdabcd");
                    sr.replace("x");
                    expect(val).to.have.property("textContent").equal("xdabcdabcd");
                });
                it("throws on ill-formed hit", function () {
                    var sr = makeSr();
                    sr.updatePattern("abc", {
                        direction: search_replace_1.Direction.FORWARD,
                        context: search_replace_1.Context.TEXT,
                    });
                    expect(sr).to.have.property("current").to
                        .satisfy(equalRanges.bind(undefined, firstABCText));
                    expect(function () {
                        sr.replace("x");
                    }).to.throw(Error, "tried to replace when it is not possible");
                });
            });
        });
    });
});
//# sourceMappingURL=search-replace-test.js.map