define(["require", "exports", "module", "wed/dloc", "wed/search", "../base-config", "../wed-test-util"], function (require, exports, module, dloc_1, search_1, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var expect = chai.expect;
    // tslint:disable:no-any
    describe("search", function () {
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
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/search_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init();
        });
        before(function () {
            guiRoot = editor.guiRoot;
            dataRoot = editor.dataRoot;
            caretManager = editor.caretManager;
            caretManager.setCaret(editor.caretManager.minCaret);
            docScope = editor.caretManager.docDLocRange;
            ps = Array.from(editor.dataRoot.querySelectorAll("body p"));
            firstBodyP = ps[0];
            firstBodyPLocation = caretManager.mustFromDataLocation(dloc_1.DLoc.mustMakeDLoc(dataRoot, firstBodyP, 0));
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
            setup.reset();
        });
        after(function () {
            setup.restore();
            editor = undefined;
        });
        function makeSearch(start, scope) {
            return new search_1.Search(caretManager, guiRoot, start, scope);
        }
        function equalRanges(a, b) {
            return a.equals(b);
        }
        function isDocScope(x) {
            return x.equals(docScope);
        }
        describe("Search", function () {
            it("throws if start is not in scope", function () {
                expect(function () { return makeSearch(caretManager.caret, pFiveFirstFour); })
                    .to.throw(Error, "the scope does not contain the start position");
            });
            it("starts with undefined current", function () {
                var search = makeSearch(caretManager.caret);
                // We have to test not.have.property instead of testing for the presence
                // of a property with the value "undefined";
                expect(search).to.not.have.property("current");
            });
            describe("(private) scope", function () {
                it("is the whole document if no scope is specified", function () {
                    var search = makeSearch(caretManager.caret);
                    expect(search).to.have.property("scope").satisfy(isDocScope);
                });
                it("is always the same object, if the scope has not been changed", function () {
                    var search = makeSearch(caretManager.caret);
                    var scope = search.scope;
                    expect(search).to.have.property("scope").equal(scope);
                });
            });
            describe("(private) setScope", function () {
                it("can set scope to undefined", function () {
                    var search = makeSearch(caretManager.caret, new dloc_1.DLocRange(caretManager.minCaret, caretManager.minCaret));
                    search.setScope(undefined);
                    expect(search).to.have.property("scope").satisfy(isDocScope);
                });
                it("throws on an invalid range", function () {
                    var search = makeSearch(caretManager.caret);
                    var invalid = dloc_1.DLoc.mustMakeDLoc(guiRoot, guiRoot, guiRoot.childNodes.length);
                    // We cheat and make the value invalid manually. Otherwise, we'd have to
                    // modify the gui tree....
                    invalid.offset++;
                    expect(invalid.isValid()).to.be.false;
                    expect(function () {
                        return search.setScope(new dloc_1.DLocRange(caretManager.minCaret, invalid));
                    })
                        .to.throw(Error, "passed an invalid range");
                });
                it("throws on a range outside of root", function () {
                    var search = makeSearch(caretManager.caret);
                    var outside = dloc_1.DLoc.mustMakeDLoc(editor.dataRoot, editor.dataRoot, 0);
                    expect(function () { return search.setScope(new dloc_1.DLocRange(outside, outside)); })
                        .to.throw(Error, "the range does not use the search's root");
                });
                it("reverses the range, if needed", function () {
                    var search = makeSearch(caretManager.caret);
                    // We pass a reversed docScope...
                    search.setScope(new dloc_1.DLocRange(caretManager.maxCaret, caretManager.minCaret));
                    // ... so once reversed, it should be equal to docScope.
                    expect(search).to.have.property("scope").satisfy(isDocScope);
                });
            });
            // tslint:disable-next-line:max-func-body-length
            function makeSeries(context) {
                describe("(context " + search_1.Context[context] + ")", function () {
                    function makeContextSearch(start, scope) {
                        var s = makeSearch(start, scope);
                        s.context = context;
                        return s;
                    }
                    function firstABCHit() {
                        return (_a = {},
                            _a[search_1.Context.EVERYWHERE] = pFiveFirstThree,
                            _a[search_1.Context.TEXT] = firstABCText,
                            _a[search_1.Context.ATTRIBUTE_VALUES] = firstABCAttribute,
                            _a)[context];
                        var _a;
                    }
                    function firstABCDHit() {
                        return (_a = {},
                            _a[search_1.Context.EVERYWHERE] = pFiveFirstFour,
                            _a[search_1.Context.TEXT] = firstABCDText,
                            _a[search_1.Context.ATTRIBUTE_VALUES] = firstABCDAttribute,
                            _a)[context];
                        var _a;
                    }
                    describe("updateCurrent", function () {
                        it("finds the first hit", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abc";
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                        });
                        it("is idempotent if pattern has not changed", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abc";
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                        });
                        it("shortens the current hit", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abcd";
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCDHit()));
                            search.pattern = "abc";
                            search.updateCurrent();
                            expect(search, "end").to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                        });
                        it("extends the current hit, when possible", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abc";
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                            search.pattern = "abcd";
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCDHit()));
                        });
                        it("updates current to null if the pattern is empty", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abc";
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                            search.pattern = "";
                            search.updateCurrent();
                            expect(search).to.have.property("current").null;
                        });
                        it("updates current to null if the pattern does not match", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abc";
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                            search.pattern = "abcDOES NOT MATCH";
                            search.updateCurrent();
                            expect(search).to.have.property("current").null;
                        });
                        if (context === search_1.Context.EVERYWHERE) {
                            it("finds into GUI elements", function () {
                                var start = firstBodyPLocation;
                                var pattern = "hi >";
                                {
                                    var search = makeContextSearch(start);
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    // We are not particularly interested in the specific location.
                                    expect(search).to.have.property("current")
                                        .to.be.instanceof(dloc_1.DLocRange);
                                }
                                // Make sure we don't have it in text. We create a 2nd search so
                                // that we start from the same place, with the same conditions
                                // (except context).
                                {
                                    var search = makeContextSearch(start);
                                    search.context = search_1.Context.TEXT;
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    expect(search).to.have.property("current").null;
                                }
                                // Make sure we don't have it in attributes. We create a 3rd
                                // search so that we start from the same place, with the same
                                // conditions (except context).
                                {
                                    var search = makeContextSearch(start);
                                    search.context = search_1.Context.ATTRIBUTE_VALUES;
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    expect(search).to.have.property("current").null;
                                }
                            });
                        }
                        else {
                            it("does not find into GUI elements", function () {
                                var start = firstBodyPLocation;
                                var pattern = "hi >";
                                {
                                    var search = makeContextSearch(start);
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    expect(search).to.have.property("current").null;
                                }
                                // Make sure we have it somewhere. We create a 2nd search so
                                // that we start from the same place, with the same conditions
                                // (except context).
                                {
                                    var search = makeContextSearch(start);
                                    search.context = search_1.Context.EVERYWHERE;
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    // We are not particularly interested in the specific location.
                                    expect(search).to.have.property("current")
                                        .to.be.instanceof(dloc_1.DLocRange);
                                }
                            });
                        }
                        if (context === search_1.Context.EVERYWHERE ||
                            context === search_1.Context.ATTRIBUTE_VALUES) {
                            it("finds into attributes", function () {
                                var start = firstBodyPLocation;
                                var pattern = "foo";
                                {
                                    var search = makeContextSearch(start);
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    // We are not particularly interested in the specific location.
                                    expect(search).to.have.property("current")
                                        .to.be.instanceof(dloc_1.DLocRange);
                                }
                                // Make sure we don't have it in text. We create a 2nd search so
                                // that we start from the same place, with the same conditions
                                // (except context).
                                {
                                    var search = makeContextSearch(start);
                                    search.context = search_1.Context.TEXT;
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    expect(search).to.have.property("current").null;
                                }
                                // Make sure we have it in attributes. We create a 3rd search so
                                // that we start from the same place, with the same conditions
                                // (except context).
                                {
                                    var search = makeContextSearch(start);
                                    search.context = search_1.Context.ATTRIBUTE_VALUES;
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    // We are not particularly interested in the specific location.
                                    expect(search).to.have.property("current")
                                        .to.be.instanceof(dloc_1.DLocRange);
                                }
                            });
                        }
                        else {
                            it("does not find into attributes", function () {
                                var start = firstBodyPLocation;
                                var pattern = "foo";
                                {
                                    var search = makeContextSearch(start);
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    expect(search).to.have.property("current").null;
                                }
                                // Make sure we have it in attributes. We create a 2nd search so
                                // that we start from the same place, with the same conditions
                                // (except context).
                                {
                                    var search = makeContextSearch(start);
                                    search.context = search_1.Context.ATTRIBUTE_VALUES;
                                    search.pattern = pattern;
                                    search.updateCurrent();
                                    // We are not particularly interested in the specific location.
                                    expect(search).to.have.property("current")
                                        .to.be.instanceof(dloc_1.DLocRange);
                                }
                            });
                        }
                        it("respects the scope", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abc";
                            search.updateCurrent();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                            // We restrict the scope to a range that contains "abc". Searching
                            // for abcd won't find anything, although the text exists outside
                            // the scope.
                            var restricted = makeContextSearch(pFiveFirstThree.start, pFiveFirstThree);
                            restricted.pattern = "abcd";
                            restricted.updateCurrent();
                            expect(restricted).to.have.property("current").null;
                        });
                    });
                    describe("next", function () {
                        it("finds the first hit", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abc";
                            search.next();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                        });
                        it("moves to the next hit when called multiple times", function () {
                            var search = makeContextSearch(firstBodyPLocation);
                            search.pattern = "abc";
                            search.next();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, firstABCHit()));
                            search.next();
                            var nextExpected = (_a = {},
                                _a[search_1.Context.EVERYWHERE] = pSevenFirstThree,
                                _a[search_1.Context.TEXT] = pFiveFirstThree,
                                _a[search_1.Context.ATTRIBUTE_VALUES] = secondABCAttribute,
                                _a)[context];
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, nextExpected));
                            var _a;
                        });
                        it("changes current to null if nothing can be found anymore", function () {
                            // This test also tests that next respects the scope.
                            var start;
                            var scope;
                            var expectedFirst;
                            if (context !== search_1.Context.ATTRIBUTE_VALUES) {
                                start = pFiveFirstThree.start;
                                scope = pFiveFirstThree;
                                expectedFirst = pFiveFirstThree;
                            }
                            else {
                                start = firstABCAttribute.start;
                                scope = firstABCAttribute;
                                expectedFirst = firstABCAttribute;
                            }
                            var search = makeContextSearch(start, scope);
                            search.pattern = "abc";
                            search.next();
                            expect(search).to.have.property("current")
                                .satisfy(equalRanges.bind(undefined, expectedFirst));
                            search.next();
                            expect(search).to.have.property("current").be.null;
                        });
                        it("rolls over, short range", function () {
                            // This test also tests that next respects the scope.
                            var start;
                            var scope;
                            var expectedFirst;
                            if (context !== search_1.Context.ATTRIBUTE_VALUES) {
                                start = pFiveFirstThree.start;
                                scope = pFiveFirstThree;
                                expectedFirst = pFiveFirstThree;
                            }
                            else {
                                start = firstABCAttribute.start;
                                scope = firstABCAttribute;
                                expectedFirst = firstABCAttribute;
                            }
                            var search = makeContextSearch(start, scope);
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
                        it("rolls over, whole document", function () {
                            // What we're doing here is record all hits until we get null.
                            // Then we roll over and record all hits again. The two sets of
                            // hits should be equal.
                            var search = makeContextSearch(docScope.start);
                            search.pattern = "abc";
                            var current;
                            var found = [];
                            do {
                                search.next();
                                current = search.current;
                                if (current != null) {
                                    found.push(current);
                                }
                            } while (current !== null);
                            var found2nd = [];
                            do {
                                search.next();
                                current = search.current;
                                if (current != null) {
                                    found2nd.push(current);
                                }
                            } while (current !== null);
                            expect(found2nd).to.be.lengthOf(found.length);
                            var _loop_1 = function (ix) {
                                expect(found[ix]).to
                                    .satisfy(function (x) { return x.equals(found2nd[ix]); });
                            };
                            for (var ix = 0; ix < found.length; ++ix) {
                                _loop_1(ix);
                            }
                        });
                    });
                });
            }
            // tslint:disable-next-line:mocha-no-side-effect-code
            makeSeries(search_1.Context.EVERYWHERE);
            // tslint:disable-next-line:mocha-no-side-effect-code
            makeSeries(search_1.Context.TEXT);
            // tslint:disable-next-line:mocha-no-side-effect-code
            makeSeries(search_1.Context.ATTRIBUTE_VALUES);
        });
    });
});

//# sourceMappingURL=search-test.js.map
