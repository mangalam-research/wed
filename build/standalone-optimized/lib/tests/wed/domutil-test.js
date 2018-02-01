define(["require", "exports", "jquery", "wed/convert", "wed/domutil", "../util"], function (require, exports, $, convert, domutil, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    // Utility  XML nodes.
    function empty(el) {
        // tslint:disable-next-line:no-inner-html
        el.innerHTML = "";
    }
    function defined(x) {
        assert.isDefined(x);
        // The assertion above already excludes null and undefined, but TypeScript
        // does not know this.
        return x;
    }
    var commonMap = {
        // tslint:disable-next-line:no-http-string
        btw: "http://mangalamresearch.org/ns/btw-storage",
        // tslint:disable-next-line:no-http-string
        tei: "http://www.tei-c.org/ns/1.0",
    };
    describe("domutil", function () {
        var provider;
        var domroot;
        var testPara;
        var sourceDoc;
        before(function () {
            provider =
                new util_1.DataProvider("/base/build/standalone/lib/tests/domutil_test_data/");
            return provider.getText("source_converted.xml").then(function (data) {
                var parser = new DOMParser();
                sourceDoc = parser.parseFromString(data, "application/xml");
            });
        });
        before(function () {
            domroot = document.createElement("div");
            testPara = document.createElement("p");
            testPara.setAttribute("contenteditable", "true");
            testPara.textContent = "Test para which has to be visible.";
            document.body.appendChild(domroot);
            document.body.appendChild(testPara);
        });
        after(function () {
            document.body.removeChild(domroot);
            document.body.removeChild(testPara);
        });
        function makeTestFactory(method) {
            return function makeTest(name, callback) {
                var caret;
                var noTextExpected;
                var textExpected;
                var container;
                describe(name, function () {
                    before(function () {
                        var data = document.createElement("span");
                        _a = callback(data), caret = _a[0], noTextExpected = _a[1], textExpected = _a[2], container = _a[3];
                        empty(domroot);
                        domroot.appendChild(data);
                        if (textExpected === undefined) {
                            textExpected = noTextExpected;
                        }
                        // The isNotNull checks are to ensure we don't majorly screw up in
                        // setting up a test case.
                        if (noTextExpected !== null) {
                            assert.isNotNull(noTextExpected[0]);
                        }
                        if (textExpected !== null) {
                            assert.isNotNull(textExpected[0]);
                        }
                        var _a;
                    });
                    it("no_text === true", function () {
                        var result = method(caret, container, true);
                        assert.deepEqual(result, noTextExpected);
                    });
                    it("no_text === false", function () {
                        var result = method(caret, container, false);
                        assert.deepEqual(result, textExpected);
                    });
                });
            };
        }
        // tslint:disable:mocha-no-side-effect-code no-inner-html
        describe("nextCaretPosition", function () {
            var makeTest = makeTestFactory(domutil.nextCaretPosition);
            makeTest("in text", function (data) {
                data.textContent = "test";
                return [[data.firstChild, 2], [data, 0], [data.firstChild, 3], domroot];
            });
            makeTest("move into child from text", function (data) {
                data.innerHTML = "test <b>test</b>";
                var child = data.firstChild;
                return [
                    // This puts the caret at the end of the first text node in <span>.
                    [child, child.nodeValue.length],
                    [data.lastElementChild, 0],
                    [data.lastElementChild.firstChild, 0],
                    domroot,
                ];
            });
            makeTest("move to parent", function (data) {
                data.innerHTML = "test <b>test</b><b>test2</b>";
                var child = data.firstElementChild.firstChild;
                return [
                    // This puts the caret at the end of the first b element.
                    [child, child.nodeValue.length],
                    // This position is between the two b elements.
                    [data, 2],
                    undefined,
                    domroot,
                ];
            });
            makeTest("enter empty elements", function (data) {
                data.innerHTML = "<i>a</i><i></i><i>b</i>";
                return [
                    // Just after the first <i>.
                    [data, 1],
                    [data.getElementsByTagName("i")[1], 0],
                    undefined,
                    domroot,
                ];
            });
            // The case is designed so that it skips over the white space.
            makeTest("white-space: normal", function (data) {
                data.innerHTML = "<s>test    </s><s>test  </s>";
                return [
                    // This is just after the "test" string in the first s element.
                    [data.firstElementChild.firstChild, 4],
                    // Ends between the two s elements.
                    [data, 1],
                    undefined,
                    domroot,
                ];
            });
            // The case is designed so that it does not skip over the whitespace.
            makeTest("white-space: normal, not at end of parent node", function (data) {
                data.innerHTML = "test <s>test</s>";
                return [
                    // This is just after the "test" string in the top element, before the
                    // space.
                    [data.firstChild, 4],
                    // Ends after the space
                    [data, 0],
                    [data.firstChild, 5],
                    domroot
                ];
            });
            // The case is designed so that it does not skip over the whitespace.
            makeTest("white-space: pre", function (data) {
                data.innerHTML = "<s>test    </s><s style='white-space: pre'>test  </s>";
                var s = data.getElementsByTagName("s")[1];
                return [[s.firstChild, 4], [s, 0], [s.firstChild, 5], domroot];
            });
            makeTest("does not move out of text container", function (data) {
                data.innerHTML = "test";
                return [[data.firstChild, 4], null, null, data.firstChild];
            });
            makeTest("does not move out of element container", function (data) {
                data.innerHTML = "test";
                return [[data, 1], null, null, data];
            });
            makeTest("can't find a node", function () {
                return [[document.body.parentNode, 30000], null, null, document];
            });
        });
        describe("prevCaretPosition", function () {
            var makeTest = makeTestFactory(domutil.prevCaretPosition);
            makeTest("in text", function (data) {
                data.textContent = "test";
                return [[data.firstChild, 2], [data, 0], [data.firstChild, 1],
                    domroot];
            });
            makeTest("move into child", function (data) {
                data.innerHTML = "<b>test</b> test";
                return [
                    // This puts the caret at the start of the last text node.
                    [data.lastChild, 0],
                    [data.lastElementChild, 0],
                    [data.lastElementChild.firstChild, 4],
                    domroot,
                ];
            });
            makeTest("move into child", function (data) {
                data.innerHTML = "test <b>test</b>";
                return [
                    // This puts the caret at the start of the text node in <b>
                    [data.lastElementChild.firstChild, 0],
                    [data, 1],
                    undefined,
                    domroot,
                ];
            });
            makeTest("enter empty elements", function (data) {
                data.innerHTML = "<i>a</i><i></i><i>b</i>";
                return [
                    // This puts the caret after the 2nd <i>.
                    [data, 2],
                    [data.getElementsByTagName("i")[1], 0],
                    undefined,
                    domroot,
                ];
            });
            makeTest("white-space: normal", function (data) {
                // The case is designed so that it skips over the whitespace
                data.innerHTML = "<s>test</s><s>   test</s>";
                return [
                    // Place the caret just after the whitespace in the 2nd <s> node.
                    [data.lastElementChild.firstChild, 3],
                    [data, 1], undefined,
                    domroot,
                ];
            });
            makeTest("white-space: normal, not at start of parent node", function (data) {
                // The case is designed so that it does not skip over the whitespace
                data.innerHTML = "<s>test</s>   test";
                return [
                    // Place the caret just after the whitespace in the top node
                    [data.childNodes[1], 3],
                    [data, 1], [data.childNodes[1], 2],
                    domroot,
                ];
            });
            makeTest("white-space: pre", function (data) {
                // The case is designed so that it does not skip over the whitespace.
                data.innerHTML = "<s>test</s><s style='white-space: pre'>   test</s>";
                var s = data.lastElementChild;
                return [
                    // Place the caret just after the white space in the 2nd <s> node.
                    [s.firstChild, 3],
                    [s, 0], [s.firstChild, 2],
                    domroot,
                ];
            });
            makeTest("does not move out of text container", function (data) {
                data.innerHTML = "test";
                return [
                    [data.firstChild, 0],
                    null, null,
                    data.firstChild,
                ];
            });
            makeTest("does not move out of element container", function (data) {
                data.innerHTML = "test";
                return [
                    [data, 0],
                    null, null,
                    data,
                ];
            });
            makeTest("can't find a node", function () {
                return [[document.body.parentNode.parentNode, 0], null, null,
                    document];
            });
        });
        describe("splitTextNode", function () {
            var root;
            var title;
            var child;
            beforeEach(function () {
                root = sourceDoc.cloneNode(true);
                title = root.getElementsByTagName("title")[0];
                child = title.firstChild;
            });
            it("fails on non-text node", function () {
                assert.throws(domutil.splitTextNode.bind(title, 0), Error, "insertIntoText called on non-text");
            });
            it("splits a text node", function () {
                var _a = domutil.splitTextNode(child, 2), first = _a[0], second = _a[1];
                assert.equal(first.nodeValue, "ab");
                assert.equal(second.nodeValue, "cd");
                assert.equal(title.childNodes.length, 2);
            });
            it("works fine with negative offset", function () {
                var _a = domutil.splitTextNode(child, -1), first = _a[0], second = _a[1];
                assert.equal(first.nodeValue, "");
                assert.equal(second.nodeValue, "abcd");
                assert.equal(title.childNodes.length, 2);
            });
            it("works fine with offset beyond text length", function () {
                var _a = domutil.splitTextNode(child, child.nodeValue.length), first = _a[0], second = _a[1];
                assert.equal(first.nodeValue, "abcd");
                assert.equal(second.nodeValue, "");
                assert.equal(title.childNodes.length, 2);
            });
        });
        describe("insertIntoText", function () {
            var root;
            var title;
            var child;
            beforeEach(function () {
                root = sourceDoc.cloneNode(true);
                title = root.getElementsByTagName("title")[0];
                child = title.firstChild;
            });
            it("fails on non-text node", function () {
                assert.throws(domutil.insertIntoText.bind(undefined, title, 0, title), Error, "insertIntoText called on non-text");
            });
            it("fails on undefined node to insert", function () {
                assert.throws(domutil.insertIntoText.bind(undefined, child, 0, undefined), Error, "must pass an actual node to insert");
            });
            it("inserts the new element", function () {
                var el = child.ownerDocument.createElement("span");
                var _a = domutil.insertIntoText(child, 2, el), first = _a[0], second = _a[1];
                assert.equal(first[0].nodeValue, "ab");
                assert.equal(first[0].nextSibling, el);
                assert.equal(first[1], 2);
                assert.equal(second[0].nodeValue, "cd");
                assert.equal(second[0].previousSibling, el);
                assert.equal(second[1], 0);
                assert.equal(title.childNodes.length, 3);
                assert.equal(title.childNodes[1], el);
            });
            it("works fine with negative offset", function () {
                var el = child.ownerDocument.createElement("span");
                var _a = domutil.insertIntoText(child, -1, el), first = _a[0], second = _a[1];
                assert.deepEqual(first, [el.parentNode, 0], "first caret");
                assert.equal(second[0].nodeValue, "abcd");
                assert.equal(second[0].previousSibling, el);
                assert.equal(second[1], 0);
                assert.equal(title.childNodes.length, 2);
                assert.equal(title.firstChild, el);
            });
            it("works fine with negative offset and fragment", function () {
                var frag = document.createDocumentFragment();
                frag.appendChild(document.createTextNode("first"));
                frag.appendChild(document.createElement("span")).textContent = "blah";
                frag.appendChild(document.createTextNode("last"));
                var _a = domutil.insertIntoText(child, -1, frag), first = _a[0], second = _a[1];
                assert.deepEqual(first, [title, 0]);
                assert.equal(second[0].nodeValue, "lastabcd");
                assert.equal(second[1], 4);
                assert.equal(title.childNodes.length, 3);
                assert.equal(title.innerHTML, "first<span xmlns=\"http://www.w3.org/1999/xhtml\">blah</span>lastabcd");
            });
            it("works fine with negative offset and fragment containing only text", function () {
                var frag = document.createDocumentFragment();
                frag.appendChild(document.createTextNode("first"));
                var _a = domutil.insertIntoText(child, -1, frag), first = _a[0], second = _a[1];
                assert.deepEqual(first, [title, 0]);
                assert.deepEqual(second, [title.firstChild, 5]);
                assert.equal(title.childNodes.length, 1);
                assert.equal(title.innerHTML, "firstabcd");
            });
            it("works fine with offset beyond text length", function () {
                assert.equal(title.childNodes.length, 1, "the parent should start with one child");
                var el = child.ownerDocument.createElement("span");
                var _a = domutil.insertIntoText(child, child.nodeValue.length, el), first = _a[0], second = _a[1];
                assert.equal(title.childNodes.length, 2, "the parent should have two children after insertion");
                assert.equal(first[0].nodeValue, "abcd");
                assert.equal(first[0].nextSibling, el);
                assert.deepEqual(first, [title.firstChild, 4]);
                assert.deepEqual(second, [title, 2]);
                assert.equal(title.childNodes.length, 2, "title.childNodes.length should be 2");
                assert.equal(title.lastChild, el);
            });
            it("works fine with offset beyond text length and fragment", function () {
                var frag = document.createDocumentFragment();
                frag.appendChild(document.createTextNode("first"));
                frag.appendChild(document.createElement("span")).textContent = "blah";
                frag.appendChild(document.createTextNode("last"));
                var _a = domutil.insertIntoText(child, child.nodeValue.length, frag), first = _a[0], second = _a[1];
                assert.equal(first[0].nodeValue, "abcdfirst");
                assert.deepEqual(first, [title.firstChild, 4]);
                assert.deepEqual(second, [title, 3]);
                assert.equal(title.childNodes.length, 3);
                assert.equal(title.innerHTML, "abcdfirst<span xmlns=\"http://www.w3.org/1999/xhtml\">blah</span>last");
            });
            it("works fine with offset beyond text length and fragment containing " +
                "only text", function () {
                var frag = document.createDocumentFragment();
                frag.appendChild(document.createTextNode("first"));
                var _a = domutil.insertIntoText(child, child.nodeValue.length, frag), first = _a[0], second = _a[1];
                assert.deepEqual(first, [title.firstChild, 4]);
                assert.deepEqual(second, [title, title.childNodes.length]);
                assert.equal(title.childNodes.length, 1);
                assert.equal(title.innerHTML, "abcdfirst");
            });
            it("cleans up after inserting a text node", function () {
                var text = document.createTextNode("test");
                var _a = domutil.insertIntoText(child, 2, text), first = _a[0], second = _a[1];
                assert.equal(first[0].nodeValue, "abtestcd");
                assert.equal(first[1], 2);
                assert.equal(second[0].nodeValue, "abtestcd");
                assert.equal(second[1], 6);
                assert.equal(title.childNodes.length, 1);
            });
            it("cleans up after inserting a fragment with text", function () {
                var frag = document.createDocumentFragment();
                frag.appendChild(document.createTextNode("first"));
                frag.appendChild(document.createElement("span")).textContent = "blah";
                frag.appendChild(document.createTextNode("last"));
                var _a = domutil.insertIntoText(child, 2, frag), first = _a[0], second = _a[1];
                assert.equal(first[0].nodeValue, "abfirst");
                assert.equal(first[1], 2);
                assert.equal(second[0].nodeValue, "lastcd");
                assert.equal(second[1], 4);
                assert.equal(title.childNodes.length, 3);
            });
        });
        describe("insertText", function () {
            var root;
            var title;
            beforeEach(function () {
                root = sourceDoc.cloneNode(true);
                title = root.getElementsByTagName("title")[0];
            });
            function makeSeries(seriesTitle, caretAtEnd, adapter) {
                describe(seriesTitle, function () {
                    it("modifies a text node", function () {
                        var node = title.firstChild;
                        var _a = adapter(node, 2, "Q"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        assert.equal(textNode, node);
                        assert.isFalse(isNew);
                        assert.equal(textNode.nodeValue, "abQcd");
                        assert.equal(caret[0], textNode);
                        assert.equal(caret[1], caretAtEnd ? 3 : 2);
                    });
                    it("uses the next text node if possible", function () {
                        var _a = adapter(title, 0, "Q"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        assert.equal(textNode, title.firstChild);
                        assert.isFalse(isNew);
                        assert.equal(textNode.nodeValue, "Qabcd");
                        assert.equal(caret[0], textNode);
                        assert.equal(caret[1], caretAtEnd ? 1 : 0);
                    });
                    it("uses the previous text node if possible", function () {
                        var _a = adapter(title, 1, "Q"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        assert.equal(textNode, title.firstChild);
                        assert.isFalse(isNew);
                        assert.equal(textNode.nodeValue, "abcdQ");
                        assert.equal(caret[0], textNode);
                        assert.equal(caret[1], caretAtEnd ? 5 : 4);
                    });
                    it("creates a text node if needed", function () {
                        empty(title);
                        var _a = adapter(title, 0, "test"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        assert.equal(textNode, title.firstChild);
                        assert.equal(textNode.nodeValue, "test");
                        assert.isTrue(isNew);
                        assert.equal(caret[0], textNode);
                        assert.equal(caret[1], caretAtEnd ? 4 : 0);
                    });
                    it("does nothing if passed an empty string", function () {
                        assert.equal(title.firstChild.nodeValue, "abcd");
                        var _a = adapter(title, 1, ""), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        assert.equal(title.firstChild.nodeValue, "abcd");
                        assert.isUndefined(textNode);
                        assert.isFalse(isNew);
                        assert.equal(caret[0], title);
                        assert.equal(caret[1], 1);
                    });
                    it("inserts in correct position if needs to create text node", function () {
                        empty(title);
                        var b = title.ownerDocument.createElement("b");
                        b.textContent = "q";
                        title.appendChild(b);
                        var _a = adapter(title, 1, "test"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        assert.equal(textNode, title.lastChild);
                        assert.equal(textNode.nodeValue, "test");
                        assert.isTrue(isNew);
                        assert.equal(caret[0], textNode);
                        assert.equal(caret[1], caretAtEnd ? 4 : 0);
                    });
                });
            }
            makeSeries("(caretAtEnd unspecified)", true, function (node, offset, text) {
                return domutil.insertText(node, offset, text);
            });
            makeSeries("(caretAtEnd true)", true, function (node, offset, text) {
                return domutil.insertText(node, offset, text, true);
            });
            makeSeries("(caretAtEnd false)", false, function (node, offset, text) {
                return domutil.insertText(node, offset, text, false);
            });
        });
        describe("deleteText", function () {
            var root;
            var title;
            var child;
            beforeEach(function () {
                root = sourceDoc.cloneNode(true);
                title = root.getElementsByTagName("title")[0];
                child = title.firstChild;
            });
            it("fails on non-text node", function () {
                assert.throws(domutil.deleteText.bind(title, 0, 0), Error, "deleteText called on non-text");
            });
            it("modifies a text node", function () {
                domutil.deleteText(child, 2, 2);
                assert.equal(child.nodeValue, "ab");
            });
            it("deletes an empty text node", function () {
                domutil.deleteText(child, 0, 4);
                assert.isNull(child.parentNode);
            });
        });
        describe("firstDescendantOrSelf", function () {
            var root;
            beforeEach(function () {
                root = sourceDoc.cloneNode(true);
            });
            it("returns null when passed null", function () {
                assert.isNull(domutil.firstDescendantOrSelf(null));
            });
            it("returns null when passed undefined", function () {
                assert.isNull(domutil.firstDescendantOrSelf(undefined));
            });
            it("returns the node when it has no descendants", function () {
                var node = root.getElementsByTagName("title")[0].firstChild;
                assert.isNotNull(node); // make sure we got something
                assert.isDefined(node); // make sure we got something
                assert.equal(domutil.firstDescendantOrSelf(node), node);
            });
            it("returns the first descendant", function () {
                var node = root;
                assert.isNotNull(node); // make sure we got something
                assert.isDefined(node); // make sure we got something
                assert.equal(domutil.firstDescendantOrSelf(node), root.getElementsByTagName("title")[0].firstChild);
            });
        });
        describe("lastDescendantOrSelf", function () {
            var root;
            beforeEach(function () {
                root = sourceDoc.cloneNode(true);
            });
            it("returns null when passed null", function () {
                assert.isNull(domutil.lastDescendantOrSelf(null));
            });
            it("returns null when passed undefined", function () {
                assert.isNull(domutil.lastDescendantOrSelf(undefined));
            });
            it("returns the node when it has no descendants", function () {
                var node = root.getElementsByTagName("title")[0].firstChild;
                assert.isNotNull(node); // make sure we got something
                assert.isDefined(node); // make sure we got something
                assert.equal(domutil.lastDescendantOrSelf(node), node);
            });
            it("returns the last descendant", function () {
                var node = root;
                assert.isNotNull(node); // make sure we got something
                assert.isDefined(node); // make sure we got something
                assert.equal(domutil.lastDescendantOrSelf(node), root.getElementsByTagName("p")[5].lastChild);
            });
        });
        describe("correspondingNode", function () {
            var root;
            beforeEach(function () {
                root = sourceDoc.cloneNode(true);
            });
            it("returns the corresponding node", function () {
                var clone = root.cloneNode(true);
                var corresp = domutil.correspondingNode(root, clone, root.querySelectorAll("quote")[1]);
                assert.equal(corresp, clone.querySelectorAll("quote")[1]);
            });
            it("fails if the node is not in the tree", function () {
                var clone = root.cloneNode(true);
                assert.throws(domutil.correspondingNode.bind(domutil, root, clone, document.body), Error, "nodeInA is not treeA or a child of treeA");
            });
        });
        describe("linkTrees", function () {
            var doc;
            beforeEach(function () {
                doc = sourceDoc.cloneNode(true);
            });
            it("sets wed_mirror_node", function () {
                var root = doc.firstChild;
                var cloned = root.cloneNode(true);
                domutil.linkTrees(cloned, root);
                var p = root.getElementsByTagName("p")[0];
                var clonedP = cloned.getElementsByTagName("p")[0];
                assert.equal($.data(p, "wed_mirror_node"), clonedP);
                assert.equal($.data(clonedP, "wed_mirror_node"), p);
            });
        });
        describe("focusNode", function () {
            it("focuses an element", function () {
                var p = testPara;
                assert.notEqual(p, p.ownerDocument.activeElement, "p is not focused");
                domutil.focusNode(p);
                assert.equal(p, p.ownerDocument.activeElement, "p is focused");
            });
            it("focuses text's parent", function () {
                var text = testPara.firstChild;
                assert.equal(text.nodeType, Node.TEXT_NODE, "node type is text");
                assert.notEqual(text, text.ownerDocument.activeElement, "text is not focused");
                domutil.focusNode(text);
                assert.equal(text.parentNode, text.ownerDocument.activeElement, "text's parent is focused");
            });
            it("throws an error on anything else than element or text", function () {
                assert.throws(domutil.focusNode.bind(undefined, undefined), Error, "tried to focus something other than a text node or " +
                    "an element.");
            });
        });
        describe("genericCutFunction", function () {
            var root;
            var p;
            beforeEach(function () {
                root = sourceDoc.cloneNode(true);
                p = root.querySelectorAll("body>p")[1];
            });
            function checkNodes(ret, nodes) {
                assert.equal(ret.length, nodes.length, "result length");
                for (var i = 0; i < nodes.length; ++i) {
                    assert.equal(ret[i].nodeType, nodes[i].nodeType);
                    assert.isTrue(ret[i].nodeType === Node.TEXT_NODE ||
                        ret[i].nodeType === Node.ELEMENT_NODE, "node type");
                    switch (ret[i].nodeType) {
                        case Node.TEXT_NODE:
                            assert.equal(ret[i].nodeValue, nodes[i].nodeValue, "text node at " + i);
                            break;
                        case Node.ELEMENT_NODE:
                            assert.equal(ret[i].outerHTML, nodes[i].outerHTML, "element node at " + i);
                            break;
                        default:
                            break;
                    }
                }
            }
            var cut;
            before(function () {
                cut = domutil.genericCutFunction.bind({
                    deleteText: domutil.deleteText,
                    deleteNode: domutil.deleteNode,
                    mergeTextNodes: domutil.mergeTextNodes,
                });
            });
            it("removes nodes and merges text", function () {
                var start = [p.firstChild, 4];
                var end = [p.lastChild, 3];
                assert.equal(p.childNodes.length, 5);
                var nodes = Array.prototype.slice.call(p.childNodes, domutil.indexOf(p.childNodes, start[0].nextSibling), domutil.indexOf(p.childNodes, end[0].previousSibling) + 1);
                nodes.unshift(p.ownerDocument.createTextNode("re "));
                nodes.push(p.ownerDocument.createTextNode(" af"));
                var _a = cut(start, end), final = _a[0], cutContent = _a[1];
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 1);
                assert.equal(p.innerHTML, "befoter");
                // Check the caret position.
                assert.deepEqual(final, [p.firstChild, 4]);
                // Check that the nodes are those we expected.
                checkNodes(cutContent, nodes);
            });
            it("returns proper nodes when merging a single node", function () {
                var start = [p.firstChild, 4];
                var end = [p.firstChild, 6];
                assert.equal(p.childNodes.length, 5);
                var nodes = [p.ownerDocument.createTextNode("re")];
                var _a = cut(start, end), final = _a[0], cutContent = _a[1];
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 5);
                assert.equal(p.firstChild.nodeValue, "befo ");
                // Check the caret position.
                assert.deepEqual(final, [p.firstChild, 4]);
                // Check that the nodes are those we expected.
                checkNodes(cutContent, nodes);
            });
            it("empties an element without problem", function () {
                var start = [p, 0];
                var end = [p, p.childNodes.length];
                assert.equal(p.childNodes.length, 5);
                var nodes = Array.prototype.slice.call(p.childNodes);
                var _a = cut(start, end), final = _a[0], cutContent = _a[1];
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 0);
                // Check the caret position.
                assert.deepEqual(final, [p, 0]);
                // Check that the nodes are those we expected.
                checkNodes(cutContent, nodes);
            });
            it("accepts a start caret in text and an end caret outside text", function () {
                var start = [p.firstChild, 0];
                var end = [p, p.childNodes.length];
                assert.equal(p.childNodes.length, 5);
                var nodes = Array.prototype.slice.call(p.cloneNode(true).childNodes);
                var _a = cut(start, end), final = _a[0], cutContent = _a[1];
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 0);
                // Check the caret position.
                assert.deepEqual(final, [p, 0]);
                // Check that the nodes are those we expected.
                checkNodes(cutContent, nodes);
            });
            it("accepts a start caret outside text and an end caret in text", function () {
                var start = [p, 0];
                var end = [p.lastChild, p.lastChild.nodeValue.length];
                assert.equal(p.childNodes.length, 5);
                var nodes = Array.prototype.slice.call(p.cloneNode(true).childNodes);
                var _a = cut(start, end), final = _a[0], cutContent = _a[1];
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 0);
                // Check the caret position.
                assert.deepEqual(final, [p, 0]);
                // Check that the nodes are those we expected.
                checkNodes(cutContent, nodes);
            });
        });
        describe("closest", function () {
            var p;
            var text;
            before(function () {
                domroot.innerHTML = "<div class=\"text\"><div class=\"body\"><div class=\"p\">aaa</div></div></div>";
                p = domroot.getElementsByClassName("p")[0];
                text = domroot.getElementsByClassName("text")[0];
            });
            it("returns null when node is null", function () {
                assert.isNull(domutil.closest(null, "foo"));
            });
            it("returns a value when there is a match", function () {
                assert.equal(domutil.closest(p, ".text"), text);
            });
            it("initially moves out of text nodes", function () {
                var textNode = p.firstChild;
                assert.equal(textNode.nodeType, Node.TEXT_NODE);
                assert.equal(domutil.closest(textNode, ".text"), text);
            });
            it("returns null when there is no match", function () {
                assert.isNull(domutil.closest(p, "FOO"));
            });
            it("returns null when it hits nothing before the limit", function () {
                assert.isNull(domutil.closest(p, ".text", p.parentNode));
            });
        });
        describe("closestByClass", function () {
            var p;
            var text;
            before(function () {
                domroot.innerHTML = "<div class=\"text\"><div class=\"body\"><div class=\"p\">aaa</div></div></div>";
                p = domroot.getElementsByClassName("p")[0];
                text = domroot.getElementsByClassName("text")[0];
            });
            it("returns null when node is null", function () {
                assert.isNull(domutil.closestByClass(null, "foo"));
            });
            it("returns a value when there is a match", function () {
                assert.equal(domutil.closestByClass(p, "text"), text);
            });
            it("initially moves out of text nodes", function () {
                var textNode = p.firstChild;
                assert.equal(textNode.nodeType, Node.TEXT_NODE);
                assert.equal(domutil.closestByClass(textNode, "text"), text);
            });
            it("returns null when there is no match", function () {
                assert.isNull(domutil.closestByClass(p, "FOO"));
            });
            it("returns null when it hits nothing before the limit", function () {
                assert.isNull(domutil.closestByClass(p, "text", p.parentNode));
            });
        });
        describe("siblingByClass", function () {
            var a;
            var b;
            var firstLi;
            before(function () {
                domroot.innerHTML = "<ul><li>a</li><li class=\"a\"></li><li></li><li class=\"b\"></li><li></li><li class=\"a\"></li></ul>";
                b = domroot.getElementsByClassName("b");
                a = domroot.getElementsByClassName("a");
                firstLi = domroot.getElementsByTagName("li")[0];
            });
            it("returns null when node is null", function () {
                assert.isNull(domutil.siblingByClass(null, "foo"));
            });
            it("returns null when the node is not an element", function () {
                var text = firstLi.firstChild;
                assert.equal(text.nodeType, Node.TEXT_NODE);
                assert.isNull(domutil.siblingByClass(text, "foo"));
            });
            it("returns null when the node has no parent", function () {
                assert.isNull(domutil.siblingByClass(document.createElement("q"), "foo"));
            });
            it("returns null when nothing matches", function () {
                assert.isNull(domutil.siblingByClass(firstLi, "foo"));
            });
            it("returns a match when a preceding sibling matches", function () {
                assert.equal(domutil.siblingByClass(b[0], "a"), a[0]);
            });
            it("returns a match when a following sibling matches", function () {
                assert.equal(domutil.siblingByClass(a[0], "b"), b[0]);
            });
        });
        describe("childrenByClass", function () {
            var a;
            var firstLi;
            var ul;
            before(function () {
                domroot.innerHTML = "<ul><li>a</li><li class=\"a\"></li><li></li>\n<li class=\"b\"></li><li></li><li class=\"a\"></li></ul>";
                ul = domroot.getElementsByTagName("ul")[0];
                a = domroot.getElementsByClassName("a");
                firstLi = domroot.getElementsByTagName("li")[0];
            });
            it("returns [] when node is null", function () {
                assert.sameMembers(domutil.childrenByClass(null, "foo"), []);
            });
            it("returns [] when the node is not an element", function () {
                var text = firstLi.firstChild;
                assert.equal(text.nodeType, Node.TEXT_NODE);
                assert.sameMembers(domutil.childrenByClass(text, "foo"), []);
            });
            it("returns [] when nothing matches", function () {
                assert.sameMembers(domutil.childrenByClass(ul, "foo"), []);
            });
            it("returns a match", function () {
                assert.sameMembers(domutil.childrenByClass(ul, "a"), Array.prototype.slice.call(a));
            });
        });
        describe("childByClass", function () {
            var a;
            var firstLi;
            var ul;
            before(function () {
                domroot.innerHTML = "<ul><li>a</li><li class=\"a\"></li><li></li><li class=\"b\"></li><li></li><li class=\"a\"></li></ul>";
                ul = domroot.getElementsByTagName("ul")[0];
                a = domroot.getElementsByClassName("a");
                firstLi = domroot.getElementsByTagName("li")[0];
            });
            it("returns null when node is null", function () {
                assert.isNull(domutil.childByClass(null, "foo"));
            });
            it("returns null when the node is not an element", function () {
                var text = firstLi.firstChild;
                assert.equal(text.nodeType, Node.TEXT_NODE);
                assert.isNull(domutil.childByClass(text, "foo"));
            });
            it("returns null when nothing matches", function () {
                assert.isNull(domutil.childByClass(ul, "foo"));
            });
            it("returns the first match when something matches", function () {
                assert.equal(domutil.childByClass(ul, "a"), a[0]);
            });
        });
        describe("toGUISelector", function () {
            it("raises an error on brackets", function () {
                assert.throws(domutil.toGUISelector.bind(undefined, "abcde[f]", {}), Error, "selector is too complex");
            });
            it("raises an error on parens", function () {
                assert.throws(domutil.toGUISelector.bind(undefined, "abcde:not(f)", {}), Error, "selector is too complex");
            });
            it("converts a > sequence", function () {
                assert.equal(domutil.toGUISelector("p > term > foreign", { "": "" }), "._local_p._xmlns_._real > ._local_term._xmlns_._real \
> ._local_foreign._xmlns_._real");
            });
            it("converts a space sequence with namespaces", function () {
                assert.equal(domutil.toGUISelector("btw:cit tei:q", commonMap), "._local_cit.\
_xmlns_http\\:\\/\\/mangalamresearch\\.org\\/ns\\/btw-storage._real \
._local_q._xmlns_http\\:\\/\\/www\\.tei-c\\.org\\/ns\\/1\\.0._real");
            });
        });
        describe("dataFind/dataFindAll", function () {
            var dataRoot;
            before(function () { return provider.getText("dataFind_converted.xml").then(function (data) {
                var parser = new DOMParser();
                var dataDoc = parser.parseFromString(data, "application/xml");
                dataRoot = dataDoc.firstChild;
                var guiRoot = convert.toHTMLTree(document, dataRoot);
                domutil.linkTrees(dataRoot, guiRoot);
            }); });
            it("find a node", function () {
                var result = domutil.dataFind(dataRoot, "btw:sense-emphasis", commonMap);
                assert.equal(result.tagName, "btw:sense-emphasis");
                assert.isTrue(dataRoot.contains(result));
            });
            it("find a child node", function () {
                var result = domutil.dataFind(dataRoot, "btw:overview>btw:definition", commonMap);
                assert.equal(result.tagName, "btw:definition");
                assert.isTrue(dataRoot.contains(result));
            });
            it("find nodes", function () {
                var results = domutil.dataFindAll(dataRoot, "btw:sense-emphasis", commonMap);
                assert.equal(results.length, 4);
                results.forEach(function (x) {
                    assert.equal(x.tagName, "btw:sense-emphasis");
                    assert.isTrue(dataRoot.contains(x));
                });
            });
        });
        describe("contains", function () {
            var ul;
            var li;
            before(function () {
                domroot.innerHTML = "<ul><li class=\"a\"></li></ul>";
                ul = domroot.getElementsByTagName("ul")[0];
                li = domroot.getElementsByTagName("li")[0];
            });
            it("handles elements", function () {
                assert.isTrue(domutil.contains(ul, li));
                assert.isFalse(domutil.contains(li, ul));
            });
            it("handles attributes", function () {
                var classAttr = li.attributes.getNamedItem("class");
                assert.isTrue(domutil.contains(li, classAttr));
                // Transitively: the attribute is contained by li, which is contained by
                // ul
                assert.isTrue(domutil.contains(ul, classAttr));
                assert.isFalse(domutil.contains(classAttr, ul));
            });
        });
        describe("comparePositions", function () {
            var p;
            before(function () {
                p = defined(sourceDoc.querySelector("body p"));
                assert.equal(p.nodeType, Node.ELEMENT_NODE);
            });
            it("returns 0 if the two locations are equal", function () {
                assert.equal(domutil.comparePositions(p, 0, p, 0), 0);
            });
            it("returns -1 if the 1st location is before the 2nd", function () {
                assert.equal(domutil.comparePositions(p, 0, p, 1), -1);
            });
            it("returns 1 if the 1st location is after the 2nd", function () {
                assert.equal(domutil.comparePositions(p, 1, p, 0), 1);
            });
            describe("(siblings)", function () {
                var next;
                before(function () {
                    next = defined(p.nextSibling);
                });
                it("returns -1 if 1st location precedes 2nd", function () {
                    assert.equal(domutil.comparePositions(p, 0, next, 0), -1);
                });
                it("returns 1 if 1st location follows 2nd", function () {
                    assert.equal(domutil.comparePositions(next, 0, p, 0), 1);
                });
            });
            describe("(parent - child positions)", function () {
                var parent;
                before(function () {
                    parent = defined(p.parentNode);
                    // We want to check that we are looking at the p element we think
                    // we are looking at.
                    assert.equal(parent.childNodes[0], p);
                });
                it("returns -1 if 1st position is a parent position before 2nd", function () {
                    assert.equal(domutil.comparePositions(parent, 0, p, 0), -1);
                });
                it("returns 1 if 1st position is a parent position after 2nd", function () {
                    assert.equal(domutil.comparePositions(parent, 1, p, 0), 1);
                });
                it("returns 1 if 1st position is a child position after 2nd", function () {
                    assert.equal(domutil.comparePositions(p, 0, parent, 0), 1);
                });
                it("returns -1 if 1st position is a child position before 2nd", function () {
                    assert.equal(domutil.comparePositions(p, 0, parent, 1), -1);
                });
            });
        });
    });
});
//  LocalWords:  RequireJS Mangalam MPL Dubeau previousSibling jQuery
//  LocalWords:  nextSibling whitespace linkTrees pathToNode abcdQ cd
//  LocalWords:  nodeToPath firstDescendantOrSelf deleteText Qabcd
//  LocalWords:  abQcd insertText lastcd abfirst abcdfirst abtestcd
//  LocalWords:  firstabcd lastabcd insertIntoText requirejs abcd pre
//  LocalWords:  splitTextNode prevCaretPosition html isNotNull chai
//  LocalWords:  domroot nextCaretPosition domutil jquery
//# sourceMappingURL=domutil-test.js.map