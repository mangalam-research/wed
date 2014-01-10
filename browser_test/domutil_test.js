/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/domutil"],
function (mocha, chai, $, domutil) {
'use strict';

var assert = chai.assert;

describe("domutil", function () {
    describe("nextCaretPosition", function () {
        var $root = $("#domroot");
        var caret;
        before(function () {
            $root.empty();
        });

        after(function () {
            $root.empty();
        });

        function testPair(no_text_expected, text_expected, container) {
            if (text_expected === undefined)
                text_expected = no_text_expected;

            // The isNotNull checks are to ensure we don't majorly
            // screw up in setting up a test case. For instance if
            // we have $data = $(""), the assert.equal test would
            // likely compare null to null, and would pass.
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
            var $data = $("<span>test</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                caret = [$data[0].childNodes[0], 2];
            });
            testPair([$data[0], 0],
                     [$data[0].childNodes[0], 3]);
        });

        describe("move into child from text", function () {
            var $data = $("<span>test <b>test</b></span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // This puts the caret at the end of the first
                // text node in <span>.
                caret = [$data[0].childNodes[0], undefined];
                caret[1] = caret[0].nodeValue.length;
            });
            testPair([$data.children("b")[0], 0],
                     [$data.children("b")[0].childNodes[0], 0]);
        });

        describe("move to parent", function () {
            var $data = $("<span>test <b>test</b><b>test2</b></span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // This puts the caret at the end of the first b
                // element.
                caret = [$data.children("b")[0].childNodes[0], undefined];
                caret[1] = caret[0].nodeValue.length;
            });
            // This position is between the two b elements.
            testPair([$data[0], 2]);
        });

        describe("enter empty elements", function () {
            var $data = $("<span><i>a</i><i></i><i>b</i></span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // Just after the first <i>.
                caret = [$data[0], 1];
            });
            testPair([$data.children("i")[1], 0]);
        });

        describe("white-space: normal", function () {
            // The case is designed so that it skips over the white space.
            var $data = $("<span><s>test    </s><s>test  </s></span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // This is just after the "test" string in the
                // first s element.
                caret = [$data.children("s")[0].childNodes[0], 4];
            });
            // Ends between the two s elements.
            testPair([$data[0], 1]);
        });

        describe("white-space: normal, not at end of parent node",
                 function () {
            // The case is designed so that it does not
            // skip over the whitespace.
            var $data = $("<span>test <s>test</s></span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // This is just after the "test" string in the top
                // element, before the space.
                caret = [$data[0].childNodes[0], 4];
            });
            // Ends after the space
            testPair([$data[0], 0], [$data[0].childNodes[0], 5]);
        });

        describe("white-space: pre", function () {
            // The case is designed so that it does not skip over
            // the whitespace.
            var $data = $("<span><s>test    </s>" +
                          "<s style='white-space: pre'>test  </s>" +
                          "</span>");

            beforeEach(function () {
                $root.empty();
                $root.append($data);
                caret = [$data.children("s")[1].childNodes[0], 4];
            });

            testPair([$data.children("s")[1], 0],
                     [$data.children("s")[1].childNodes[0], 5]);
        });

        describe("does not move out of text container", function () {
            var $data = $("<span>test</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                caret = [$data[0].childNodes[0], 4];
            });
            testPair(null, null, $data[0].childNodes[0]);
        });

        describe("does not move out of element container", function () {
            var $data = $("<span>test</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                caret = [$data[0], 1];
            });
            testPair(null, null, $data[0]);
        });

        describe("can't find a node", function () {
            beforeEach(function () {
                caret = [$("html")[0], 30000];
            });
            testPair(null, null);
        });
    });

    describe("prevCaretPosition", function () {
        var $root = $("#domroot");
        var caret;
        before(function () {
            $root.empty();
        });

        after(function () {
            $root.empty();
        });

        function testPair(no_text_expected,
                          text_expected, container) {
            if (text_expected === undefined)
                text_expected = no_text_expected;

            // The isNotNull checks are to ensure we don't majorly
            // screw up in setting up a test case. For instance if
            // we have $data = $(""), the assert.equal test would
            // likely compare null to null, and would pass.
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
            var $data = $("<span>test</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                caret = [$data[0].childNodes[0], 2];
            });
            testPair([$data[0], 0], [$data[0].childNodes[0], 1]);
        });

        describe("move into child", function () {
            var $data = $("<span><b>test</b> test</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                var node = $data[0];
                // This puts the caret at the start of the
                // last text node.
                caret = [node.childNodes[node.childNodes.length - 1], 0];
            });
            testPair([$data.children("b")[0], 0],
                     [$data.children("b")[0].childNodes[0], 4]);
        });

        describe("move to parent", function () {
            var $data = $("<span>test <b>test</b></span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // This puts the caret at the start of the text
                // node in <b>
                caret = [$data.children("b")[0].childNodes[0], 0];
            });
            testPair([$data[0], 1]);
        });

        describe("enter empty elements", function () {
            var $data = $("<span><i>a</i><i></i><i>b</i></span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // This puts the caret after the 2nd <i>.
                caret = [$data[0], 2];
            });
            testPair([$data.children("i")[1], 0]);
        });

        describe("white-space: normal", function () {
            // The case is designed so that it skips over the
            // whitespace
            var $data = $("<span><s>test</s><s>   test</s></span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // Place the caret just after the whitespace
                // in the 2nd <s> node.
                caret = [$data.children("s")[1].childNodes[0], 3];
            });
            testPair([$data[0], 1]);
        });

        describe("white-space: normal, not at start of parent node",
                 function () {
            // The case is designed so that it does not skip over
            // the whitespace
            var $data = $("<span><s>test</s>   test</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // Place the caret just after the whitespace
                // in the top node
                caret = [$data[0].childNodes[1], 3];
            });
            testPair([$data[0], 1], [$data[0].childNodes[1], 2]);
        });


        describe("white-space: pre", function () {
            // The case is designed so that it does not skip over the
            // whitespace.
            var $data = $("<span><s>test</s>" +
                          "<s style='white-space: pre'>   test</s>"+
                          "</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                // Place the caret just after the white space
                // in the 2nd <s> node.
                caret = [$data.children("s")[1].childNodes[0], 3];
                });
            testPair([$data.children("s")[1], 0],
                     [$data.children("s")[1].childNodes[0], 2]);
        });

        describe("does not move out of text container", function () {
            var $data = $("<span>test</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                caret = [$data[0].childNodes[0], 0];
            });
            testPair(null, null, $data[0].childNodes[0]);
        });

        describe("does not move out of element container", function () {
            var $data = $("<span>test</span>");
            beforeEach(function () {
                $root.empty();
                $root.append($data);
                caret = [$data[0], 0];
            });
            testPair(null, null, $data[0]);
        });

        describe("can't find a node", function () {
            beforeEach(function () {
                caret = [$("html")[0], 0];
            });
            testPair(null, null);
        });
    });

    describe("splitTextNode", function () {
        var source = '../../test-files/domutil_test_data/source_converted.xml';
        var $root = $("#domroot");
        var root = $root[0];
        beforeEach(function (done) {
            $root.empty();
            require(["requirejs/text!" + source], function(data) {
                $root.html(data);
                done();
            });
        });

        after(function () {
            $root.empty();
        });

        it("fails on non-text node", function () {
            var node = $root.find(".title")[0];
            assert.Throw(domutil.splitTextNode.bind(node, 0),
                         Error, "insertIntoText called on non-text");
        });

        it("splits a text node", function () {
            var node = $root.find(".title")[0].childNodes[0];
            var pair = domutil.splitTextNode(node, 2);
            assert.equal(pair[0].nodeValue, "ab");
            assert.equal(pair[1].nodeValue, "cd");
            assert.equal($root.find(".title")[0].childNodes.length, 2);
        });

        it("works fine with negative offset", function () {
            var node = $root.find(".title")[0].childNodes[0];
            var pair = domutil.splitTextNode(node, -1);
            assert.equal(pair[0].nodeValue, "");
            assert.equal(pair[1].nodeValue, "abcd");
            assert.equal($root.find(".title")[0].childNodes.length, 2);
        });

        it("works fine with offset beyond text length", function () {
            var node = $root.find(".title")[0].childNodes[0];
            var pair = domutil.splitTextNode(node, node.nodeValue.length);
            assert.equal(pair[0].nodeValue, "abcd");
            assert.equal(pair[1].nodeValue, "");
            assert.equal($root.find(".title")[0].childNodes.length, 2);
        });
    });

    describe("insertIntoText", function () {
        var source = '../../test-files/domutil_test_data/source_converted.xml';
        var $root = $("#domroot");
        var root = $root[0];
        beforeEach(function (done) {
            $root.empty();
            require(["requirejs/text!" + source], function(data) {
                $root.html(data);
                done();
            });
        });

        after(function () {
            $root.empty();
        });

        it("fails on non-text node", function () {
            var node = $root.find(".title")[0];
            assert.Throw(domutil.insertIntoText.bind(undefined, node, 0, node),
                         Error, "insertIntoText called on non-text");
        });

        it("fails on undefined node to insert", function () {
            var node = $root.find(".title")[0].childNodes[0];
            assert.Throw(
                domutil.insertIntoText.bind(undefined, node, 0, undefined),
                Error, "must pass an actual node to insert");
        });

        it("inserts the new element", function () {
            var node = $root.find(".title")[0].childNodes[0];
            var $el = $("<span>");
            var pair = domutil.insertIntoText(node, 2, $el[0]);
            assert.equal(pair[0][0].nodeValue, "ab");
            assert.equal(pair[0][0].nextSibling, $el[0]);
            assert.equal(pair[0][1], 2);
            assert.equal(pair[1][0].nodeValue, "cd");
            assert.equal(pair[1][0].previousSibling, $el[0]);
            assert.equal(pair[1][1], 0);
            assert.equal($root.find(".title")[0].childNodes.length, 3);
            assert.equal($root.find(".title")[0].childNodes[1], $el[0]);
        });

        it("works fine with negative offset", function () {
            var node = $root.find(".title")[0].childNodes[0];
            var $el = $("<span>");
            var pair = domutil.insertIntoText(node, -1, $el[0]);
            assert.equal(pair[0][0], $el[0].parentNode,
                         "first caret, container");
            assert.equal(pair[0][1], 0, "first caret, offset");
            assert.equal(pair[1][0].nodeValue, "abcd");
            assert.equal(pair[1][0].previousSibling, $el[0]);
            assert.equal(pair[1][1], 0);
            assert.equal($root.find(".title")[0].childNodes.length, 2);
            assert.equal($root.find(".title")[0].childNodes[0], $el[0]);
        });

        it("works fine with negative offset and fragment", function () {
            var parent = $root.find(".title")[0];
            var node = $root.find(".title")[0].childNodes[0];
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            frag.appendChild($("<span>blah</span>")[0]);
            frag.appendChild(document.createTextNode("last"));
            var pair = domutil.insertIntoText(node, -1, frag);
            assert.equal(pair[0][0], parent);
            assert.equal(pair[0][1], 0);
            assert.equal(pair[1][0].nodeValue, "lastabcd");
            assert.equal(pair[1][1], 4);
            assert.equal($root.find(".title")[0].childNodes.length, 3);
            assert.equal(parent.innerHTML, "first<span>blah</span>lastabcd");
        });

        it("works fine with negative offset and fragment containing " +
           "only text", function () {
            var parent = $root.find(".title")[0];
            var node = parent.childNodes[0];
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            var pair = domutil.insertIntoText(node, -1, frag);
            assert.equal(pair[0][0], parent);
            assert.equal(pair[0][1], 0);
            assert.equal(pair[1][0], parent.childNodes[0]);
            assert.equal(pair[1][1], 5);
            assert.equal($root.find(".title")[0].childNodes.length, 1);
            assert.equal(parent.innerHTML, "firstabcd");
        });


        it("works fine with offset beyond text length",
           function () {
            var parent = $root.find(".title")[0];
            var node = parent.childNodes[0];
            var $el = $("<span>");
            var pair = domutil.insertIntoText(node, node.nodeValue.length,
                                              $el[0]);
            assert.equal(pair[0][0].nodeValue, "abcd");
            assert.equal(pair[0][0], parent.childNodes[0]);
            assert.equal(pair[0][0].nextSibling, $el[0]);
            assert.equal(pair[0][1], 4);
            assert.equal(pair[1][0], parent);
            assert.equal(pair[1][1], 2);
            assert.equal($root.find(".title")[0].childNodes.length, 2);
            assert.equal($root.find(".title")[0].childNodes[1], $el[0]);
            });

        it("works fine with offset beyond text length and fragment",
           function () {
            var parent = $root.find(".title")[0];
            var node = parent.childNodes[0];
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            frag.appendChild($("<span>blah</span>")[0]);
            frag.appendChild(document.createTextNode("last"));
            var pair = domutil.insertIntoText(node, node.nodeValue.length,
                                              frag);
            assert.equal(pair[0][0], parent.childNodes[0]);
            assert.equal(pair[0][0].nodeValue, "abcdfirst");
            assert.equal(pair[0][1], 4);
            assert.equal(pair[1][0], parent);
            assert.equal(pair[1][1], 3);
            assert.equal($root.find(".title")[0].childNodes.length, 3);
            assert.equal(parent.innerHTML, "abcdfirst<span>blah</span>last");
        });

        it("works fine with offset beyond text length and fragment" +
           "containing only text",
           function () {
            var parent = $root.find(".title")[0];
            var node = parent.childNodes[0];
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            var pair = domutil.insertIntoText(node, node.nodeValue.length,
                                              frag);
            assert.equal(pair[0][0], parent.childNodes[0]);
            assert.equal(pair[0][1], 4);
            assert.equal(pair[1][0], parent);
            assert.equal(pair[1][1], parent.childNodes.length);
            assert.equal($root.find(".title")[0].childNodes.length, 1);
            assert.equal(parent.innerHTML, "abcdfirst");
        });

        it("cleans up after inserting a text node",
           function () {
            var node = $root.find(".title")[0].childNodes[0];
            var text = document.createTextNode("test");
            var pair = domutil.insertIntoText(node, 2, text);
            assert.equal(pair[0][0].nodeValue, "abtestcd");
            assert.equal(pair[0][1], 2);
            assert.equal(pair[1][0].nodeValue, "abtestcd");
            assert.equal(pair[1][1], 6);
            assert.equal($root.find(".title")[0].childNodes.length, 1);
        });

        it("cleans up after inserting a fragment with text",
           function () {
            var node = $root.find(".title")[0].childNodes[0];
            var frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode("first"));
            frag.appendChild($("<span>blah</span>")[0]);
            frag.appendChild(document.createTextNode("last"));
            var pair = domutil.insertIntoText(node, 2, frag);
            assert.equal(pair[0][0].nodeValue, "abfirst");
            assert.equal(pair[0][1], 2);
            assert.equal(pair[1][0].nodeValue, "lastcd");
            assert.equal(pair[1][1], 4);
            assert.equal($root.find(".title")[0].childNodes.length, 3);
        });

    });

    describe("insertText", function () {
        var source = '../../test-files/domutil_test_data/source_converted.xml';
        var $root = $("#domroot");
        var root = $root[0];
        beforeEach(function (done) {
            $root.empty();
            require(["requirejs/text!" + source], function(data) {
                $root.html(data);
                done();
            });
        });

        after(function () {
            $root.empty();
        });

        it("modifies a text node", function () {
            var node = $root.find(".title")[0].childNodes[0];
            var pair = domutil.insertText(node, 2, "Q");
            assert.equal(pair[0], node);
            assert.equal(pair[1], node);
            assert.equal(pair[0].nodeValue, "abQcd");
        });

        it("uses the next text node if possible", function () {
            var node = $root.find(".title")[0];
            var pair = domutil.insertText(node, 0, "Q");
            assert.equal(pair[0], node.childNodes[0]);
            assert.equal(pair[1], node.childNodes[0]);
            assert.equal(pair[0].nodeValue, "Qabcd");
        });

        it("uses the previous text node if possible", function () {
            var node = $root.find(".title")[0];
            var pair = domutil.insertText(node, 1, "Q");
            assert.equal(pair[0], node.childNodes[0]);
            assert.equal(pair[1], node.childNodes[0]);
            assert.equal(pair[0].nodeValue, "abcdQ");
        });

        it("creates a text node if needed", function () {
            var node = $root.find(".title")[0];
            $(node).empty();
            var pair = domutil.insertText(node, 0, "test");
            assert.isUndefined(pair[0]);
            assert.equal(pair[1], node.childNodes[0]);
            assert.equal(pair[1].nodeValue, "test");
        });

        it("does nothing if passed an empty string", function () {
            var node = $root.find(".title")[0];
            assert.equal(node.childNodes[0].nodeValue, "abcd");
            var pair = domutil.insertText(node, 1, "");
            assert.equal(node.childNodes[0].nodeValue, "abcd");
            assert.isUndefined(pair[0]);
            assert.isUndefined(pair[1]);
        });

        it("inserts in the correct position if it needs to create " +
           "a text node", function () {
            var node = $root.find(".title")[0];
            $(node).contents().replaceWith("<b>q</b>");
            var pair = domutil.insertText(node, 1, "test");
            assert.isUndefined(pair[0]);
            assert.equal(pair[1], node.childNodes[1]);
            assert.equal(pair[1].nodeValue, "test");
        });
    });

    describe("deleteText", function () {
        var source = '../../test-files/domutil_test_data/source_converted.xml';
        var $root = $("#domroot");
        var root = $root[0];
        beforeEach(function (done) {
            $root.empty();
            require(["requirejs/text!" + source], function(data) {
                $root.html(data);
                done();
            });
        });

        after(function () {
            $root.empty();
        });

        it("fails on non-text node", function () {
            var node = $root.find(".title")[0];
            assert.Throw(domutil.deleteText.bind(node, 0, 0),
                         Error, "deleteText called on non-text");
        });

        it("modifies a text node", function () {
            var node = $root.find(".title")[0].childNodes[0];
            domutil.deleteText(node, 2, 2);
            assert.equal(node.nodeValue, "ab");
        });

        it("deletes an empty text node", function () {
            var node = $root.find(".title")[0].childNodes[0];
            domutil.deleteText(node, 0, 4);
            assert.isNull(node.parentNode);
        });

    });

    describe("firstDescendantOrSelf", function () {
        var source = '../../test-files/domutil_test_data/source_converted.xml';
        var $root = $("#domroot");
        var root = $root[0];
        before(function (done) {
            $root.empty();
            require(["requirejs/text!" + source], function(data) {
                $root.html(data);
                done();
            });
        });

        after(function () {
            $root.empty();
        });

        it("returns null when passed null", function () {
            assert.isNull(domutil.firstDescendantOrSelf(null));
        });

        it("returns undefined when passed undefined", function () {
            assert.isUndefined(domutil.firstDescendantOrSelf(undefined));
        });

        it("returns the node when it has no descendants", function () {
            var node = $root.find(".title")[0].childNodes[0];
            assert.isNotNull(node); // make sure we got something
            assert.isDefined(node); // make sure we got something
            assert.equal(domutil.firstDescendantOrSelf(node), node);
        });

        it("returns the first descendant", function () {
            var node = $root[0];
            assert.isNotNull(node); // make sure we got something
            assert.isDefined(node); // make sure we got something
            assert.equal(domutil.firstDescendantOrSelf(node),
                         $root.find(".title")[0].childNodes[0]);
        });

    });

    describe("nodeToPath", function () {
        var source = '../../test-files/domutil_test_data/source_converted.xml';
        var $root = $("#domroot");
        var root = $root[0];
        beforeEach(function (done) {
            $root.empty();
            require(["requirejs/text!" + source], function(data) {
                $root.html(data);
                done();
            });
        });

        afterEach(function () {
            $root.empty();
        });

        it("returns an empty string on root", function () {
            assert.equal(domutil.nodeToPath(root, root), "");
        });

        it("returns a correct path on text node", function () {
            var node = $root.find(".title")[0].childNodes[0];
            assert.equal(domutil.nodeToPath(root, node), "0/0/0/0/0/0");
        });

        it("returns a correct path on later text node", function () {
            var node = $root.find(".body>.p").get(-1).childNodes[2];
            assert.equal(domutil.nodeToPath(root, node), "0/1/0/1/2");
        });

        it("returns a correct path on phantom_wrap nodes", function () {

            $root.find(".p").wrap("<div class='_phantom_wrap'>");
            var node = $root.find(".p").get(-1);
            assert.equal(domutil.nodeToPath(root, node), "0/1/0/1/0");
        });


        it("fails on a node which is not a descendant of its root",
           function () {
            var node = $("link").get(-1);
            assert.Throw(domutil.nodeToPath.bind(undefined, root, node),
                         Error, "node is not a descendant of root");
        });

        it("fails on invalid root",
           function () {
            var node = $("link").get(-1);
            assert.Throw(domutil.nodeToPath.bind(undefined, null, node),
                         Error, "invalid root parameter");

            assert.Throw(domutil.nodeToPath.bind(undefined, undefined, node),
                         Error, "invalid root parameter");

        });

        it("fails on invalid node",
           function () {
            assert.Throw(domutil.nodeToPath.bind(undefined, root, null),
                         Error, "invalid node parameter");

            assert.Throw(domutil.nodeToPath.bind(undefined, root, undefined),
                         Error, "invalid node parameter");

        });

    });

    describe("pathToNode", function () {
        var source = '../../test-files/domutil_test_data/source_converted.xml';
        var $root = $("#domroot");
        var root = $root[0];
        beforeEach(function (done) {
            $root.empty();
            require(["requirejs/text!" + source], function(data) {
                $root.html(data);
                done();
            });
        });

        afterEach(function () {
            $root.empty();
        });

        it("returns root when passed an empty string", function () {
            assert.equal(domutil.pathToNode(root, ""), root);
        });

        it("returns a correct node on a text path", function () {
            var node = $root.find(".title")[0].childNodes[0];
            assert.equal(domutil.pathToNode(root, "0/0/0/0/0/0"), node);
        });

        it("returns a correct node on a later text path", function () {
            var node = $root.find(".body>.p").get(-1).childNodes[2];
            assert.equal(domutil.pathToNode(root, "0/1/0/1/2"), node);
        });

        it("returns a correct node when path contains _phantom_wrap",
           function () {
            $root.find(".p").wrap("<div class='_phantom_wrap'>");
            var node = $root.find(".p").get(-1);
            assert.equal(domutil.pathToNode(root, "0/1/0/1/0"), node);
        });

        it("accepts more than one digit per path step",
           function () {
            $root.find(".p").wrap("<div class='_phantom_wrap'>");
            var node = $root.find(".p").get(-1);
            // There was a stupid bug in an earlier version of domutil
            // which would make this fail with an exception
            // complaining that the path was malformed due to the
            // presence of "10". The null return value is fine since
            // there is no such element, but at least it should not
            // generate an exception.
            assert.equal(domutil.pathToNode(root, "0/10"), null);
        });
    });

    describe("linkTrees", function () {
        var source = '../../test-files/domutil_test_data/source_converted.xml';
        var $root = $("#domroot");
        var root = $root[0];
        beforeEach(function (done) {
            $root.empty();
            require(["requirejs/text!" + source], function(data) {
                $root.html(data);
                done();
            });
        });

        afterEach(function () {
            $root.empty();
        });

        it("sets wed_mirror_node", function () {
            var $cloned = $root.clone();
            domutil.linkTrees($cloned[0], $root[0]);
            var p = $root.find(".p")[0];
            var cloned_p = $cloned.find(".p")[0];
            assert.equal($(p).data("wed_mirror_node"), cloned_p);
        });
    });


    describe("focusNode", function () {
        it("focuses an element", function () {
            var p = $("#test-para")[0];
            assert.notEqual(p, p.ownerDocument.activeElement,
                            "p is not focused");
            domutil.focusNode(p);
            assert.equal(p, p.ownerDocument.activeElement, "p is focused");
        });

        it("focuses text's parent", function () {
            var text = $("#test-para")[0].firstChild;
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
});

});

//  LocalWords:  RequireJS Mangalam MPL Dubeau previousSibling jQuery
//  LocalWords:  nextSibling whitespace linkTrees pathToNode abcdQ cd
//  LocalWords:  nodeToPath firstDescendantOrSelf deleteText Qabcd
//  LocalWords:  abQcd insertText lastcd abfirst abcdfirst abtestcd
//  LocalWords:  firstabcd lastabcd insertIntoText requirejs abcd pre
//  LocalWords:  splitTextNode prevCaretPosition html isNotNull chai
//  LocalWords:  domroot nextCaretPosition domutil jquery
