/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/domutil", "wed/convert"],
function (mocha, chai, $, domutil, convert) {
'use strict';

var assert = chai.assert;

var root = window.parent.document.getElementById("domroot");
var test_para = window.parent.document.getElementById("test-para");

// Utility function for XML nodes.
function empty(node) {
    while (node.firstChild)
        node.removeChild(node.firstChild);
}

describe("domutil", function () {
    describe("nextCaretPosition", function () {
        var caret;

        function testPair(no_text_expected, text_expected, container) {
            if (text_expected === undefined)
                text_expected = no_text_expected;

            // The isNotNull checks are to ensure we don't majorly
            // screw up in setting up a test case.
            it("no_text === true", function () {
                if (no_text_expected !== null)
                    assert.isNotNull(no_text_expected[0]);

                var result = domutil.nextCaretPosition(caret, container,
                                                       true);
                if (no_text_expected === null)
                    assert.isNull(result);
                else {
                    assert.equal(result[0], no_text_expected[0], "node");
                    assert.equal(result[1], no_text_expected[1], "offset");
                }
            });
            it("no_text === false", function () {
                if (text_expected !== null)
                    assert.isNotNull(text_expected[0]);

                var result = domutil.nextCaretPosition(caret, container,
                                                       false);
                if (text_expected === null)
                    assert.isNull(result);
                else {
                    assert.equal(result[0], text_expected[0], "node");
                    assert.equal(result[1], text_expected[1], "offset");
                }

            });
        }

        describe("in text", function () {
            var data = document.createElement("span");
            data.textContent = "test";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                caret = [data.firstChild, 2];
            });
            testPair([data, 0], [data.firstChild, 3]);
        });

        describe("move into child from text", function () {
            var data = document.createElement("span");
            data.innerHTML = "test <b>test</b>";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // This puts the caret at the end of the first
                // text node in <span>.
                caret = [data.firstChild, undefined];
                caret[1] = caret[0].nodeValue.length;
            });
            testPair([data.lastElementChild, 0],
                     [data.lastElementChild.firstChild, 0]);
        });

        describe("move to parent", function () {
            var data = document.createElement("span");
            data.innerHTML = "test <b>test</b><b>test2</b>";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // This puts the caret at the end of the first b
                // element.
                caret = [data.firstElementChild.firstChild, undefined];
                caret[1] = caret[0].nodeValue.length;
            });
            // This position is between the two b elements.
            testPair([data, 2]);
        });

        describe("enter empty elements", function () {
            var data = document.createElement("span");
            data.innerHTML = "<i>a</i><i></i><i>b</i>";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // Just after the first <i>.
                caret = [data, 1];
            });
            testPair([data.getElementsByTagName("i")[1], 0]);
        });

        describe("white-space: normal", function () {
            // The case is designed so that it skips over the white space.
            var data = document.createElement("span");
            data.innerHTML = "<s>test    </s><s>test  </s>";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // This is just after the "test" string in the
                // first s element.
                caret = [data.firstElementChild.firstChild, 4];
            });
            // Ends between the two s elements.
            testPair([data, 1]);
        });

        describe("white-space: normal, not at end of parent node",
                 function () {
            // The case is designed so that it does not
            // skip over the whitespace.
            var data = document.createElement("span");
            data.innerHTML = "test <s>test</s>";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // This is just after the "test" string in the top
                // element, before the space.
                caret = [data.firstChild, 4];
            });
            // Ends after the space
            testPair([data, 0], [data.firstChild, 5]);
        });

        describe("white-space: pre", function () {
            // The case is designed so that it does not skip over
            // the whitespace.
            var data = document.createElement("span");
            data.innerHTML = "<s>test    </s>" +
                "<s style='white-space: pre'>test  </s>";
            var s = data.getElementsByTagName("s")[1];

            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                caret = [s.firstChild, 4];
            });

            testPair([s, 0], [s.firstChild, 5]);
        });

        describe("does not move out of text container", function () {
            var data = document.createElement("span");
            data.innerHTML = "test";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                caret = [data.firstChild, 4];
            });
            testPair(null, null, data.firstChild);
        });

        describe("does not move out of element container", function () {
            var data = document.createElement("span");
            data.innerHTML = "test";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                caret = [data, 1];
            });
            testPair(null, null, data);
        });

        describe("can't find a node", function () {
            before(function () {
                caret = [document.body.parentNode, 30000];
            });
            testPair(null, null);
        });
    });

    describe("prevCaretPosition", function () {
        var caret;

        function testPair(no_text_expected,
                          text_expected, container) {
            if (text_expected === undefined)
                text_expected = no_text_expected;

            // The isNotNull checks are to ensure we don't majorly
            // screw up in setting up a test case.
            it("no_text === true", function () {
                if (no_text_expected !== null)
                    assert.isNotNull(no_text_expected[0]);

                var result = domutil.prevCaretPosition(caret, container, true);
                if (no_text_expected === null)
                    assert.isNull(result);
                else {
                    assert.equal(result[0], no_text_expected[0], "node");
                    assert.equal(result[1], no_text_expected[1], "offset");
                }
            });

            it("no_text === false", function () {
                if (text_expected !== null)
                    assert.isNotNull(text_expected[0]);

                var result = domutil.prevCaretPosition(caret, container, false);
                if (text_expected === null)
                    assert.isNull(result);
                else {
                    assert.equal(result[0], text_expected[0], "node");
                    assert.equal(result[1], text_expected[1], "offset");
                }
            });
        }

        describe("in text", function () {
            var data = document.createElement("span");
            data.textContent = "test";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                caret = [data.firstChild, 2];
            });
            testPair([data, 0], [data.firstChild, 1]);
        });

        describe("move into child", function () {
            var data = document.createElement("span");
            data.innerHTML = "<b>test</b> test";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // This puts the caret at the start of the
                // last text node.
                caret = [data.lastChild, 0];
            });
            testPair([data.lastElementChild, 0],
                     [data.lastElementChild.firstChild, 4]);
        });

        describe("move to parent", function () {
            var data = document.createElement("span");
            data.innerHTML = "test <b>test</b>";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // This puts the caret at the start of the text
                // node in <b>
                caret = [data.lastElementChild.firstChild, 0];
            });
            testPair([data, 1]);
        });

        describe("enter empty elements", function () {
            var data = document.createElement("span");
            data.innerHTML = "<i>a</i><i></i><i>b</i>";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // This puts the caret after the 2nd <i>.
                caret = [data, 2];
            });
            testPair([data.getElementsByTagName("i")[1], 0]);
        });

        describe("white-space: normal", function () {
            // The case is designed so that it skips over the
            // whitespace
            var data = document.createElement("span");
            data.innerHTML = "<s>test</s><s>   test</s>";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // Place the caret just after the whitespace
                // in the 2nd <s> node.
                caret = [data.lastElementChild.firstChild, 3];
            });
            testPair([data, 1]);
        });

        describe("white-space: normal, not at start of parent node",
                 function () {
            // The case is designed so that it does not skip over
            // the whitespace
            var data = document.createElement("span");
            data.innerHTML = "<s>test</s>   test";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // Place the caret just after the whitespace
                // in the top node
                caret = [data.childNodes[1], 3];
            });
            testPair([data, 1], [data.childNodes[1], 2]);
        });


        describe("white-space: pre", function () {
            // The case is designed so that it does not skip over the
            // whitespace.
            var data = document.createElement("span");
            data.innerHTML = "<s>test</s>" +
                "<s style='white-space: pre'>   test</s>";
            var s = data.lastElementChild;
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                // Place the caret just after the white space
                // in the 2nd <s> node.
                caret = [s.firstChild, 3];
            });
            testPair([s, 0], [s.firstChild, 2]);
        });

        describe("does not move out of text container", function () {
            var data = document.createElement("span");
            data.innerHTML = "test";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                caret = [data.firstChild, 0];
            });
            testPair(null, null, data.firstChild);
        });

        describe("does not move out of element container", function () {
            var data = document.createElement("span");
            data.innerHTML = "test";
            before(function () {
                root.innerHTML = null;
                root.appendChild(data);
                caret = [data, 0];
            });
            testPair(null, null, data);
        });

        describe("can't find a node", function () {
            beforeEach(function () {
                caret = [document.body.parentNode, 0];
            });
            testPair(null, null);
        });
    });

    describe("splitTextNode", function () {
        var source = 'test-files/domutil_test_data/source_converted.xml';
        var root;
        var parser = new window.DOMParser();
        beforeEach(function (done) {
            require(["text!" + source], function(data) {
                root = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        it("fails on non-text node", function () {
            var node = root.getElementsByTagName("title")[0];
            assert.Throw(domutil.splitTextNode.bind(node, 0),
                         Error, "insertIntoText called on non-text");
        });

        it("splits a text node", function () {
            var title = root.getElementsByTagName("title")[0];
            var node = title.firstChild;
            var pair = domutil.splitTextNode(node, 2);
            assert.equal(pair[0].nodeValue, "ab");
            assert.equal(pair[1].nodeValue, "cd");
            assert.equal(title.childNodes.length, 2);
        });

        it("works fine with negative offset", function () {
            var title = root.getElementsByTagName("title")[0];
            var node = title.firstChild;
            var pair = domutil.splitTextNode(node, -1);
            assert.equal(pair[0].nodeValue, "");
            assert.equal(pair[1].nodeValue, "abcd");
            assert.equal(title.childNodes.length, 2);
        });

        it("works fine with offset beyond text length", function () {
            var title = root.getElementsByTagName("title")[0];
            var node = title.firstChild;
            var pair = domutil.splitTextNode(node, node.nodeValue.length);
            assert.equal(pair[0].nodeValue, "abcd");
            assert.equal(pair[1].nodeValue, "");
            assert.equal(title.childNodes.length, 2);
        });
    });

    describe("insertIntoText", function () {
        var source = 'test-files/domutil_test_data/source_converted.xml';
        var root;
        var parser = new window.DOMParser();
        beforeEach(function (done) {
            require(["text!" + source], function(data) {
                root = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        it("fails on non-text node", function () {
            var node = root.getElementsByTagName("title")[0];
            assert.Throw(domutil.insertIntoText.bind(undefined, node, 0, node),
                         Error, "insertIntoText called on non-text");
        });

        it("fails on undefined node to insert", function () {
            var node = root.getElementsByTagName("title")[0].firstChild;
            assert.Throw(
                domutil.insertIntoText.bind(undefined, node, 0, undefined),
                Error, "must pass an actual node to insert");
        });

        it("inserts the new element", function () {
            var title = root.getElementsByTagName("title")[0];
            var node = title.firstChild;
            var el = node.ownerDocument.createElement("span");
            var pair = domutil.insertIntoText(node, 2, el);
            assert.equal(pair[0][0].nodeValue, "ab");
            assert.equal(pair[0][0].nextSibling, el);
            assert.equal(pair[0][1], 2);
            assert.equal(pair[1][0].nodeValue, "cd");
            assert.equal(pair[1][0].previousSibling, el);
            assert.equal(pair[1][1], 0);
            assert.equal(title.childNodes.length, 3);
            assert.equal(title.childNodes[1], el);
        });

        it("works fine with negative offset", function () {
            var title = root.getElementsByTagName("title")[0];
            var node = title.firstChild;
            var el = node.ownerDocument.createElement("span");
            var pair = domutil.insertIntoText(node, -1, el);
            assert.equal(pair[0][0], el.parentNode,
                         "first caret, container");
            assert.equal(pair[0][1], 0, "first caret, offset");
            assert.equal(pair[1][0].nodeValue, "abcd");
            assert.equal(pair[1][0].previousSibling, el);
            assert.equal(pair[1][1], 0);
            assert.equal(title.childNodes.length, 2);
            assert.equal(title.firstChild, el);
        });

        it("works fine with negative offset and fragment", function () {
            var parent = root.getElementsByTagName("title")[0];
            var node = parent.firstChild;
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            frag.appendChild(document.createElement("span")).textContent =
                "blah";
            frag.appendChild(document.createTextNode("last"));
            var pair = domutil.insertIntoText(node, -1, frag);
            assert.equal(pair[0][0], parent);
            assert.equal(pair[0][1], 0);
            assert.equal(pair[1][0].nodeValue, "lastabcd");
            assert.equal(pair[1][1], 4);
            assert.equal(parent.childNodes.length, 3);
            assert.equal(
                parent.innerHTML,
                'first<span xmlns="http://www.w3.org/1999/xhtml">blah</span>' +
                    'lastabcd');
        });

        it("works fine with negative offset and fragment containing " +
           "only text", function () {
            var parent = root.getElementsByTagName("title")[0];
            var node = parent.firstChild;
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            var pair = domutil.insertIntoText(node, -1, frag);
            assert.equal(pair[0][0], parent);
            assert.equal(pair[0][1], 0);
            assert.equal(pair[1][0], parent.firstChild);
            assert.equal(pair[1][1], 5);
            assert.equal(parent.childNodes.length, 1);
            assert.equal(parent.innerHTML, "firstabcd");
        });


        it("works fine with offset beyond text length",
           function () {
            var parent = root.getElementsByTagName("title")[0];
            assert.equal(parent.childNodes.length, 1,
                        "the parent should start with one child");
            var node = parent.firstChild;
            var el = node.ownerDocument.createElement("span");
            var pair = domutil.insertIntoText(node, node.nodeValue.length, el);
            assert.equal(parent.childNodes.length, 2,
                        "the parent should have two children after insertion");
            assert.equal(pair[0][0].nodeValue, "abcd");
            assert.equal(pair[0][0], parent.firstChild);
            assert.equal(pair[0][0].nextSibling, el);
            assert.equal(pair[0][1], 4);
            assert.equal(pair[1][0], parent);
            assert.equal(pair[1][1], 2);
            assert.equal(parent.childNodes.length, 2,
                         "parent.childNodes.length should be 2");
            assert.equal(parent.lastChild, el);
            });

        it("works fine with offset beyond text length and fragment",
           function () {
            var parent = root.getElementsByTagName("title")[0];
            var node = parent.firstChild;
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            frag.appendChild(document.createElement("span")).textContent =
                "blah";
            frag.appendChild(document.createTextNode("last"));
            var pair = domutil.insertIntoText(node, node.nodeValue.length,
                                              frag);
            assert.equal(pair[0][0], parent.firstChild);
            assert.equal(pair[0][0].nodeValue, "abcdfirst");
            assert.equal(pair[0][1], 4);
            assert.equal(pair[1][0], parent);
            assert.equal(pair[1][1], 3);
            assert.equal(parent.childNodes.length, 3);
            assert.equal(
                parent.innerHTML,
                'abcdfirst<span xmlns="http://www.w3.org/1999/xhtml">' +
                    'blah</span>last');
        });

        it("works fine with offset beyond text length and fragment" +
           "containing only text",
           function () {
            var parent = root.getElementsByTagName("title")[0];
            var node = parent.firstChild;
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            var pair = domutil.insertIntoText(node, node.nodeValue.length,
                                              frag);
            assert.equal(pair[0][0], parent.firstChild);
            assert.equal(pair[0][1], 4);
            assert.equal(pair[1][0], parent);
            assert.equal(pair[1][1], parent.childNodes.length);
            assert.equal(parent.childNodes.length, 1);
            assert.equal(parent.innerHTML, "abcdfirst");
        });

        it("cleans up after inserting a text node",
           function () {
            var parent = root.getElementsByTagName("title")[0];
            var node = parent.firstChild;
            var text = document.createTextNode("test");
            var pair = domutil.insertIntoText(node, 2, text);
            assert.equal(pair[0][0].nodeValue, "abtestcd");
            assert.equal(pair[0][1], 2);
            assert.equal(pair[1][0].nodeValue, "abtestcd");
            assert.equal(pair[1][1], 6);
            assert.equal(parent.childNodes.length, 1);
        });

        it("cleans up after inserting a fragment with text",
           function () {
            var parent = root.getElementsByTagName("title")[0];
            var node = parent.firstChild;
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            frag.appendChild(document.createElement("span")).textContent =
                "blah";
            frag.appendChild(document.createTextNode("last"));
            var pair = domutil.insertIntoText(node, 2, frag);
            assert.equal(pair[0][0].nodeValue, "abfirst");
            assert.equal(pair[0][1], 2);
            assert.equal(pair[1][0].nodeValue, "lastcd");
            assert.equal(pair[1][1], 4);
            assert.equal(parent.childNodes.length, 3);
        });

    });

    describe("insertText", function () {
        var source = 'test-files/domutil_test_data/source_converted.xml';
        var root;
        var parser = new window.DOMParser();
        beforeEach(function (done) {
            require(["text!" + source], function(data) {
                root = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        it("modifies a text node", function () {
            var node = root.getElementsByTagName("title")[0].firstChild;
            var pair = domutil.insertText(node, 2, "Q");
            assert.equal(pair[0], node);
            assert.equal(pair[1], node);
            assert.equal(pair[0].nodeValue, "abQcd");
        });

        it("uses the next text node if possible", function () {
            var node = root.getElementsByTagName("title")[0];
            var pair = domutil.insertText(node, 0, "Q");
            assert.equal(pair[0], node.firstChild);
            assert.equal(pair[1], node.firstChild);
            assert.equal(pair[0].nodeValue, "Qabcd");
        });

        it("uses the previous text node if possible", function () {
            var node = root.getElementsByTagName("title")[0];
            var pair = domutil.insertText(node, 1, "Q");
            assert.equal(pair[0], node.firstChild);
            assert.equal(pair[1], node.firstChild);
            assert.equal(pair[0].nodeValue, "abcdQ");
        });

        it("creates a text node if needed", function () {
            var node = root.getElementsByTagName("title")[0];
            empty(node);
            var pair = domutil.insertText(node, 0, "test");
            assert.isUndefined(pair[0]);
            assert.equal(pair[1], node.firstChild);
            assert.equal(pair[1].nodeValue, "test");
        });

        it("does nothing if passed an empty string", function () {
            var node = root.getElementsByTagName("title")[0];
            assert.equal(node.firstChild.nodeValue, "abcd");
            var pair = domutil.insertText(node, 1, "");
            assert.equal(node.firstChild.nodeValue, "abcd");
            assert.isUndefined(pair[0]);
            assert.isUndefined(pair[1]);
        });

        it("inserts in the correct position if it needs to create " +
           "a text node", function () {
            var node = root.getElementsByTagName("title")[0];
            empty(node);
            var b = node.ownerDocument.createElement("b");
            b.textContent = "q";
            node.appendChild(b);
            var pair = domutil.insertText(node, 1, "test");
            assert.isUndefined(pair[0]);
            assert.equal(pair[1], node.lastChild);
            assert.equal(pair[1].nodeValue, "test");
        });
    });

    describe("deleteText", function () {
        var source = 'test-files/domutil_test_data/source_converted.xml';
        var root;
        var parser = new window.DOMParser();
        beforeEach(function (done) {
            require(["text!" + source], function(data) {
                root = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        it("fails on non-text node", function () {
            var node = root.getElementsByTagName("title")[0];
            assert.Throw(domutil.deleteText.bind(node, 0, 0),
                         Error, "deleteText called on non-text");
        });

        it("modifies a text node", function () {
            var node = root.getElementsByTagName("title")[0].firstChild;
            domutil.deleteText(node, 2, 2);
            assert.equal(node.nodeValue, "ab");
        });

        it("deletes an empty text node", function () {
            var node = root.getElementsByTagName("title")[0].firstChild;
            domutil.deleteText(node, 0, 4);
            assert.isNull(node.parentNode);
        });

    });

    describe("firstDescendantOrSelf", function () {
        var source = 'test-files/domutil_test_data/source_converted.xml';
        var root;
        var parser = new window.DOMParser();
        before(function (done) {
            require(["text!" + source], function(data) {
                root = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        it("returns null when passed null", function () {
            assert.isNull(domutil.firstDescendantOrSelf(null));
        });

        it("returns undefined when passed undefined", function () {
            assert.isUndefined(domutil.firstDescendantOrSelf(undefined));
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
            assert.equal(domutil.firstDescendantOrSelf(node),
                         root.getElementsByTagName("title")[0].firstChild);
        });

    });

    describe("correspondingNode", function () {
        var source = 'test-files/domutil_test_data/source_converted.xml';
        var root;
        var parser = new window.DOMParser();
        before(function (done) {
            require(["text!" + source], function(data) {
                root = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        it("returns the corresponding node", function () {
            var clone = root.cloneNode(true);
            var corresp = domutil.correspondingNode(
                root, clone, root.querySelectorAll("quote")[1]);
            assert.equal(corresp, clone.querySelectorAll("quote")[1]);
        });

        it("fails if the node is not in the tree", function () {
            var clone = root.cloneNode(true);
            assert.Throw(domutil.correspondingNode.bind(domutil,
                                                        root,
                                                        clone,
                                                        document.body),
                         Error,
                         "node_in_a is not tree_a or a child of tree_a");
        });
    });

    describe("linkTrees", function () {
        var source = 'test-files/domutil_test_data/source_converted.xml';
        var doc;
        var parser = new window.DOMParser();
        before(function (done) {
            require(["text!" + source], function(data) {
                doc = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        it("sets wed_mirror_node", function () {
            var root = doc.firstChild;
            var cloned = root.cloneNode(true);
            domutil.linkTrees(cloned, root);
            var p = root.getElementsByTagName("p")[0];
            var cloned_p = cloned.getElementsByTagName("p")[0];
            assert.equal($.data(p, "wed_mirror_node"), cloned_p);
            assert.equal($.data(cloned_p, "wed_mirror_node"), p);
        });
    });


    describe("focusNode", function () {
        it("focuses an element", function () {
            var p = test_para;
            assert.notEqual(p, p.ownerDocument.activeElement,
                            "p is not focused");
            domutil.focusNode(p);
            assert.equal(p, p.ownerDocument.activeElement, "p is focused");
        });

        it("focuses text's parent", function () {
            var text = test_para.firstChild;
            assert.equal(text.nodeType, Node.TEXT_NODE,
                         "node type is text");
            assert.notEqual(text, text.ownerDocument.activeElement,
                            "text is not focused");
            domutil.focusNode(text);
            assert.equal(text.parentNode, text.ownerDocument.activeElement,
                         "text's parent is focused");
        });

        it("throws an error on anything else than element or text",
           function () {
            assert.Throw(
                domutil.focusNode.bind(undefined, undefined),
                Error, "tried to focus something other than a text node or " +
                    "an element.");
        });
    });

    describe("genericCutFunction", function () {
        var source = 'test-files/domutil_test_data/source_converted.xml';
        var root;
        var parser = new window.DOMParser();
        beforeEach(function (done) {
            require(["text!" + source], function(data) {
                root = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        function checkNodes (ret, nodes) {
            assert.equal(ret.length, nodes.length, "result length");
            for(var i = 0; i < nodes.length; ++i) {
                assert.equal(ret[i].nodeType, nodes[i].nodeType);
                assert.isTrue(ret[i].nodeType === window.Node.TEXT_NODE ||
                              ret[i].nodeType === window.Node.ELEMENT_NODE,
                              "node type");
                switch(ret.nodeType) {
                case window.Node.TEXT_NODE:
                    assert(ret[i].nodeValue, nodes[i].nodeValue,
                           "text node at " + i);
                    break;
                case window.Node.ELEMENT_NODE:
                    assert(ret[i].outerHTML, nodes[i].outerHTML,
                           "element node at " + i);
                    break;
                }
            }
        }

        var cut;
        before(function() {
            cut = domutil.genericCutFunction.bind({
                deleteText: domutil.deleteText,
                deleteNode: domutil.deleteNode,
                mergeTextNodes: domutil.mergeTextNodes
            });
        });

        it("removes nodes and merges text", function () {
            var p = root.querySelectorAll("body>p")[1];
            var start_caret = [p.firstChild, 4];
            var end_caret = [p.lastChild, 3];
            assert.equal(p.childNodes.length, 5);

            var nodes = Array.prototype.slice.call(
                p.childNodes,
                Array.prototype.indexOf.call(p.childNodes,
                                             start_caret[0].nextSibling),
                Array.prototype.indexOf.call(p.childNodes,
                                             end_caret[0].previousSibling) + 1);
            nodes.unshift(p.ownerDocument.createTextNode("re "));
            nodes.push(p.ownerDocument.createTextNode(" af"));

            var ret = cut(start_caret, end_caret);

            // Check that we're doing what we think we're doing.
            assert.equal(p.childNodes.length, 1);
            assert.equal(p.innerHTML, 'befoter');

            assert.isTrue(ret.length > 0);
            assert.equal(ret[0][0], p.firstChild);
            assert.equal(ret[0][1], 4);
            checkNodes(ret[1], nodes);
        });

        it("returns proper nodes when merging a single node", function () {
            var p = root.querySelectorAll("body>p")[1];
            var start_caret = [p.firstChild, 4];
            var end_caret = [p.firstChild, 6];
            assert.equal(p.childNodes.length, 5);

            var nodes = [p.ownerDocument.createTextNode("re")];
            var ret = cut(start_caret, end_caret);

            // Check that we're doing what we think we're doing.
            assert.equal(p.childNodes.length, 5);
            assert.equal(p.firstChild.nodeValue, 'befo ');

            assert.isTrue(ret.length > 0);
            // Check the caret position.
            assert.equal(ret[0][0], p.firstChild);
            assert.equal(ret[0][1], 4);

            // Check that the nodes are those we expected.
            checkNodes(ret[1], nodes);
        });

        it("empties an element without problem", function () {
            var p = root.querySelectorAll("body>p")[1];
            var start_caret = [p, 0];
            var end_caret = [p, p.childNodes.length];
            assert.equal(p.childNodes.length, 5);

            var nodes = Array.prototype.slice.call(p.childNodes);
            var ret = cut(start_caret, end_caret);

            // Check that we're doing what we think we're doing.
            assert.equal(p.childNodes.length, 0);

            assert.isTrue(ret.length > 0);
            // Check the caret position.
            assert.equal(ret[0][0], p);
            assert.equal(ret[0][1], 0);
            // Check that the nodes are those we expected.
            checkNodes(ret[1], nodes);
        });

        it("accepts a start caret in text and an end caret outside text",
           function () {
            var p = root.querySelectorAll("body>p")[1];
            var start_caret = [p.firstChild, 0];
            var end_caret = [p, p.childNodes.length];
            assert.equal(p.childNodes.length, 5);

            var nodes = Array.prototype.slice.call(p.childNodes);
            var ret = cut(start_caret, end_caret);

            // Check that we're doing what we think we're doing.
            assert.equal(p.childNodes.length, 0);

            assert.isTrue(ret.length > 0);
            // Check the caret position.
            assert.equal(ret[0][0], p);
            assert.equal(ret[0][1], 0);
            // Check that the nodes are those we expected.
            checkNodes(ret[1], nodes);
        });

        it("accepts a start caret outside text and an end caret in text",
           function () {
            var p = root.querySelectorAll("body>p")[1];
            var start_caret = [p, 0];
            var end_caret = [p.lastChild, p.lastChild.nodeValue.length];
            assert.equal(p.childNodes.length, 5);

            var nodes = Array.prototype.slice.call(p.childNodes);
            var ret = cut(start_caret, end_caret);

            // Check that we're doing what we think we're doing.
            assert.equal(p.childNodes.length, 0);

            assert.isTrue(ret.length > 0);
            // Check the caret position.
            assert.equal(ret[0][0], p);
            assert.equal(ret[0][1], 0);
            // Check that the nodes are those we expected.
            checkNodes(ret[1], nodes);
        });
    });

    describe("closest", function () {
        var p, text;
        before(function () {
            root.innerHTML = '<div class="text"><div class="body">' +
                '<div class="p">aaa</div></div></div>';
            p = root.getElementsByClassName("p")[0];
            text = root.getElementsByClassName("text")[0];
        });

        it("returns null when node is null", function () {
            assert.isNull(domutil.closest(null, "foo"));
        });

        it("returns a value when there is a match", function () {
            assert.equal(domutil.closest(p, ".text"), text);
        });

        it("initially moves out of text nodes", function () {
            var text_node = p.firstChild;
            assert.equal(text_node.nodeType, Node.TEXT_NODE);
            assert.equal(domutil.closest(text_node, ".text"), text);
        });

        it("returns null when there is no match", function () {
            assert.isNull(domutil.closest(p, "FOO"));
        });

        it("returns null when it hits nothing before the limit", function () {
            assert.isNull(domutil.closest(p, ".text", p.parentNode));
        });
    });

    describe("closestByClass", function () {
        var p, text;
        before(function () {
            root.innerHTML = '<div class="text"><div class="body">' +
                '<div class="p">aaa</div></div></div>';
            p = root.getElementsByClassName("p")[0];
            text = root.getElementsByClassName("text")[0];
        });

        it("returns null when node is null", function () {
            assert.isNull(domutil.closestByClass(null, "foo"));
        });

        it("returns a value when there is a match", function () {
            assert.equal(domutil.closestByClass(p, "text"), text);
        });

        it("initially moves out of text nodes", function () {
            var text_node = p.firstChild;
            assert.equal(text_node.nodeType, Node.TEXT_NODE);
            assert.equal(domutil.closestByClass(text_node, "text"), text);
        });

        it("returns null when there is no match", function () {
            assert.isNull(domutil.closestByClass(p, "FOO"));
        });

        it("returns null when it hits nothing before the limit", function () {
            assert.isNull(domutil.closestByClass(p, "text", p.parentNode));
        });
    });

    describe("siblingByClass", function () {
        var a, b, first_li;
        before(function() {
            root.innerHTML = '<ul><li>a</li><li class="a"></li><li></li>'+
                '<li class="b"></li><li></li><li class="a"></li></ul>';
            b = root.getElementsByClassName("b");
            a = root.getElementsByClassName("a");
            first_li = root.getElementsByTagName("li")[0];
        });

        it("returns null when node is null", function () {
            assert.isNull(domutil.siblingByClass(null, "foo"));
        });

        it("returns null when the node is not an element", function () {
            var text = first_li.firstChild;
            assert.equal(text.nodeType, Node.TEXT_NODE);
            assert.isNull(domutil.siblingByClass(text, "foo"));
        });

        it("returns null when the node has no parent", function () {
            assert.isNull(domutil.siblingByClass(document.createElement("q"),
                                                 "foo"));
        });

        it("returns null when nothing matches", function () {
            assert.isNull(domutil.siblingByClass(first_li, "foo"));
        });

        it("returns a match when a preceding sibling matches", function () {
            assert.equal(domutil.siblingByClass(b[0], "a"), a[0]);
        });

        it("returns a match when a following sibling matches", function () {
            assert.equal(domutil.siblingByClass(a[0], "b"), b[0]);
        });

    });

    describe("childrenByClass", function () {
        var a, b, first_li, ul;
        before(function () {
            root.innerHTML = '<ul><li>a</li><li class="a"></li><li></li>'+
                '<li class="b"></li><li></li><li class="a"></li></ul>';
            ul = root.getElementsByTagName("ul")[0];
            b = root.getElementsByClassName("b");
            a = root.getElementsByClassName("a");
            first_li = root.getElementsByTagName("li")[0];
        });

        it("returns [] when node is null", function () {
            assert.sameMembers(domutil.childrenByClass(null, "foo"), []);
        });

        it("returns [] when the node is not an element", function () {
            var text = first_li.firstChild;
            assert.equal(text.nodeType, Node.TEXT_NODE);
            assert.sameMembers(domutil.childrenByClass(text, "foo"), []);
        });

        it("returns [] when nothing matches", function () {
            assert.sameMembers(domutil.childrenByClass(ul, "foo"), []);
        });

        it("returns a match", function () {
            assert.sameMembers(domutil.childrenByClass(ul, "a"),
                               Array.prototype.slice.call(a));
        });
    });

    describe("childByClass", function () {
        var a, b, first_li, ul;
        before(function () {
            root.innerHTML = '<ul><li>a</li><li class="a"></li><li></li>'+
                '<li class="b"></li><li></li><li class="a"></li></ul>';
            ul = root.getElementsByTagName("ul")[0];
            b = root.getElementsByClassName("b");
            a = root.getElementsByClassName("a");
            first_li = root.getElementsByTagName("li")[0];
        });

        it("returns null when node is null", function () {
            assert.isNull(domutil.childByClass(null, "foo"));
        });

        it("returns null when the node is not an element", function () {
            var text = first_li.firstChild;
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

    describe("toDataSelector", function () {
        it("raises an error on brackets",
                 function () {
            assert.Throw(domutil.toGUISelector.bind(undefined, "abcde[f]"),
                         Error, "selector is too complex");
        });

        it("raises an error on parens",
                 function () {
            assert.Throw(domutil.toGUISelector.bind(undefined, "abcde:not(f)"),
                         Error, "selector is too complex");
        });

        it("converts a > sequence",
                 function () {
            assert.equal(domutil.toGUISelector("p > term > foreign"),
                         ".p._real > .term._real > .foreign._real");
        });

        it("converts a space sequence with namespaces",
                 function () {
            assert.equal(domutil.toGUISelector("btw:cit tei:q"),
                         ".btw\\:cit._real .tei\\:q._real");
        });
    });

    describe("dataFind/dataFindAll", function () {
        var source = 'test-files/domutil_test_data/dataFind_converted.xml';
        var data_root;
        var gui_root;
        before(function (done) {
            require(["text!" + source], function(data) {
                var parser = new window.DOMParser();
                var data_doc = parser.parseFromString(data, "application/xml");
                data_root = data_doc.firstChild;
                gui_root = convert.toHTMLTree(document, data_root);
                domutil.linkTrees(data_root, gui_root);
                done();
            });
        });

        it("find a node", function () {
            var result = domutil.dataFind(data_root, "btw:sense-emphasis");
            assert.equal(result.tagName, "btw:sense-emphasis");
            assert.isTrue(data_root.contains(result));
        });

        it("find a child node", function () {
            var result = domutil.dataFind(data_root,
                                          "btw:overview>btw:definition");
            assert.equal(result.tagName, "btw:definition");
            assert.isTrue(data_root.contains(result));
        });

        it("find nodes", function () {
            var results = domutil.dataFindAll(data_root,
                                              "btw:sense-emphasis");
            assert.equal(results.length, 4);
            results.forEach(function (x) {
                assert.equal(x.tagName, "btw:sense-emphasis");
                assert.isTrue(data_root.contains(x));
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
