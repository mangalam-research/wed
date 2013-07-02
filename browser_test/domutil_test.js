define(["mocha/mocha", "chai", "jquery", "wed/domutil"],
function (mocha, chai, $, domutil) {
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
                        assert.equal(result[0], no_text_expected[0],
                                     "node");
                        assert.equal(result[1], no_text_expected[1],
                                     "offset");
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
                        assert.equal(result[0], text_expected[0],
                                     "node");
                        assert.equal(result[1], text_expected[1],
                                     "offset");
                    }

                });
            }

            describe("in text", function () {
                var $data = $("<span>test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0).childNodes[0], 2];
                });
                testPair([$data.get(0), 0],
                         [$data.get(0).childNodes[0], 3]);
            });

            describe("move into child from text", function () {
                var $data = $("<span>test <b>test</b></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    // This puts the caret at the end of the first
                    // text node in <span>.
                    caret = [$data.get(0).childNodes[0], undefined];
                    caret[1] = caret[0].nodeValue.length;
                });
                testPair([$data.children("b").get(0), 0],
                         [$data.children("b").get(0).childNodes[0],
                          0]);
            });

            describe("move to parent", function () {
                var $data =
                    $("<span>test <b>test</b><b>test2</b></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    // This puts the caret at the end of the first b
                    // element.
                    caret = [$data.children("b").get(0).childNodes[0],
                             undefined];
                    caret[1] = caret[0].nodeValue.length;
                });
                // This position is between the two b elements.
                testPair([$data.get(0), 2]);
            });

            describe("enter empty elements", function () {
                var $data =
                    $("<span><i>a</i><i></i><i>b</i></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    // Just after the first <i>.
                    caret = [$data.get(0), 1];
                });
                testPair([$data.children("i").get(1), 0]);
            });

            describe("white-space: normal", function () {
                // The case is designed so that it skips over
                // the white space
                var $data = $("<span><s>test    </s><s>test  </s></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    // This is just after the "test" string in the
                    // first s element.
                    caret =
                        [$data.children("s").get(0).childNodes[0], 4];
                });
                // Ends between the two s elements.
                testPair([$data.get(0), 1]);
            });

            describe("white-space: pre", function () {
                // The case is designed so that it does not skip over
                // the white space.
                var $data =
                    $("<span><s>test    </s>" +
                      "<s style='white-space: pre'>test  </s>" +
                      "</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret =
                        [$data.children("s").get(1).childNodes[0], 4];
                });
                testPair([$data.children("s").get(1), 0],
                         [$data.children("s").get(1).childNodes[0],
                          5]);
            });

            describe("does not move out of text container", function () {
                var $data = $("<span>test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0).childNodes[0], 4];
                });
                testPair(null, null, $data.get(0).childNodes[0]);
            });

            describe("does not move out of element container", function () {
                var $data = $("<span>test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0), 1];
                });
                testPair(null, null, $data.get(0));
            });

            describe("can't find a node", function () {
                beforeEach(function () {
                    caret = [$("html").get(0), 30000];
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

                    var result = domutil.prevCaretPosition(caret, container,
                                                           true);
                    if (no_text_expected === null)
                        assert.isNull(result);
                    else {
                        assert.equal(result[0], no_text_expected[0],
                                     "node");
                        assert.equal(result[1], no_text_expected[1],
                                     "offset");
                    }
                });
                it("no_text === false", function () {
                    if (text_expected !== null)
                        assert.isNotNull(text_expected[0]);

                    var result = domutil.prevCaretPosition(caret, container,
                                                           false);
                    if (text_expected === null)
                        assert.isNull(result);
                    else {
                        assert.equal(result[0], text_expected[0],
                                     "node");
                        assert.equal(result[1], text_expected[1],
                                     "offset");
                    }
                });
            }

            describe("in text", function () {
                var $data = $("<span>test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0).childNodes[0], 2];
                });
                testPair([$data.get(0), 0],
                         [$data.get(0).childNodes[0], 1]);
            });
            describe("move into child", function () {
                var $data = $("<span><b>test</b> test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    var node = $data.get(0);
                    // This puts the caret at the start of the
                    // last text node.
                    caret = [node.childNodes[
                        node.childNodes.length - 1], 0];
                });
                testPair([$data.children("b").get(0), 0],
                         [$data.children("b").get(0).childNodes[0], 4]);
            });
            describe("move to parent", function () {
                var $data = $("<span>test <b>test</b></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    // This puts the caret at the start of the text
                    // node in <b>
                    caret = [$data.children("b").get(0).childNodes[0],
                             0];
                });
                testPair([$data.get(0), 1]);
            });
            describe("enter empty elements", function () {
                var $data = $("<span><i>a</i><i></i><i>b</i></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    // This puts the caret after the 2nd <i>.
                    caret = [$data.get(0), 2];
                });
                testPair([$data.children("i").get(1), 0]);
            });
            describe("white-space: normal", function () {
                // The case is designed so that it skips over the
                // white space
                var $data =
                    $("<span><s>test</s><s>   test</s></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    // Place the caret just after the white space
                    // in the 2nd <s> node.
                    caret = [$data.children("s").get(1).childNodes[0],
                             3];
                });
                testPair([$data.get(0), 1]);
            });
            describe("white-space: pre", function () {
                // The case is designed so that it does not skip over
                // the white space.
                var $data =
                    $("<span><s>test</s>" +
                      "<s style='white-space: pre'>   test</s>"+
                      "</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    // Place the caret just after the white space
                    // in the 2nd <s> node.
                    caret = [$data.children("s").get(1).childNodes[0],
                             3];
                });
                testPair([$data.children("s").get(1), 0],
                         [$data.children("s").get(1).childNodes[0],
                          2]);
            });

            describe("does not move out of text container", function () {
                var $data = $("<span>test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0).childNodes[0], 0];
                });
                testPair(null, null, $data.get(0).childNodes[0]);
            });

            describe("does not move out of element container", function () {
                var $data = $("<span>test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0), 0];
                });
                testPair(null, null, $data.get(0));
            });

            describe("can't find a node", function () {
                beforeEach(function () {
                    caret = [$("html").get(0), 0];
                });
                testPair(null, null);
            });
        });

        describe("splitTextNode", function () {
            var source =
                    '../../test-files/domutil_test_data/source_converted.xml';
            var $root = $("#domroot");
            var root = $root.get(0);
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
                var node = $root.find(".title").get(0);
                assert.Throw(
                    domutil.splitTextNode.bind(node, 0),
                    Error, "insertIntoText called on non-text");
            });

            it("splits a text node", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                var pair = domutil.splitTextNode(node, 2);
                assert.equal(pair[0].nodeValue, "ab");
                assert.equal(pair[1].nodeValue, "cd");
                assert.equal($root.find(".title").get(0).childNodes.length, 2);
            });

            it("works fine with negative offset", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                var pair = domutil.splitTextNode(node, -1);
                assert.equal(pair[0].nodeValue, "");
                assert.equal(pair[1].nodeValue, "abcd");
                assert.equal($root.find(".title").get(0).childNodes.length, 2);
            });

            it("works fine with offset beyond text length", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                var pair = domutil.splitTextNode(node, node.nodeValue.length);
                assert.equal(pair[0].nodeValue, "abcd");
                assert.equal(pair[1].nodeValue, "");
                assert.equal($root.find(".title").get(0).childNodes.length, 2);
            });
        });

        describe("insertIntoText", function () {
            var source =
                    '../../test-files/domutil_test_data/source_converted.xml';
            var $root = $("#domroot");
            var root = $root.get(0);
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
                var node = $root.find(".title").get(0);
                assert.Throw(
                    domutil.insertIntoText.bind(node, 0),
                    Error, "insertIntoText called on non-text");
            });

            it("splits a text node", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                var pair = domutil.insertIntoText(node, 2);
                assert.equal(pair[0].nodeValue, "ab");
                assert.equal(pair[1].nodeValue, "cd");
                assert.equal($root.find(".title").get(0).childNodes.length, 2);
            });

            it("inserts the new element", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                var $el = $("<span>");
                var pair = domutil.insertIntoText(node, 2, $el.get(0));
                assert.equal(pair[0].nodeValue, "ab");
                assert.equal(pair[1].nodeValue, "cd");
                assert.equal($root.find(".title").get(0).childNodes.length, 3);
                assert.equal($root.find(".title").get(0).childNodes[1],
                             $el.get(0));
            });

            it("works fine with negative offset", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                var pair = domutil.insertIntoText(node, -1);
                assert.equal(pair[0].nodeValue, "");
                assert.equal(pair[1].nodeValue, "abcd");
                assert.equal($root.find(".title").get(0).childNodes.length, 2);
            });
            it("works fine with offset beyond text length", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                var pair = domutil.insertIntoText(node, node.nodeValue.length);
                assert.equal(pair[0].nodeValue, "abcd");
                assert.equal(pair[1].nodeValue, "");
                assert.equal($root.find(".title").get(0).childNodes.length, 2);
            });
        });

        describe("insertText", function () {
            var source =
                    '../../test-files/domutil_test_data/source_converted.xml';
            var $root = $("#domroot");
            var root = $root.get(0);
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
                var node = $root.find(".title").get(0).childNodes[0];
                var pair = domutil.insertText(node, 2, "Q");
                assert.equal(pair[0], node);
                assert.equal(pair[1], node);
                assert.equal(pair[0].nodeValue, "abQcd");
            });

            it("uses the next text node if possible", function () {
                var node = $root.find(".title").get(0);
                var pair = domutil.insertText(node, 0, "Q");
                assert.equal(pair[0], node.childNodes[0]);
                assert.equal(pair[1], node.childNodes[0]);
                assert.equal(pair[0].nodeValue, "Qabcd");
            });

            it("uses the previous text node if possible", function () {
                var node = $root.find(".title").get(0);
                var pair = domutil.insertText(node, 1, "Q");
                assert.equal(pair[0], node.childNodes[0]);
                assert.equal(pair[1], node.childNodes[0]);
                assert.equal(pair[0].nodeValue, "abcdQ");
            });

            it("creates a text node if needed", function () {
                var node = $root.find(".title").get(0);
                $(node).empty();
                var pair = domutil.insertText(node, 0, "test");
                assert.equal(pair[0], node);
                assert.equal(pair[1], node.childNodes[0]);
                assert.equal(pair[1].nodeValue, "test");
            });
        });

        describe("deleteText", function () {
            var source =
                    '../../test-files/domutil_test_data/source_converted.xml';
            var $root = $("#domroot");
            var root = $root.get(0);
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
                var node = $root.find(".title").get(0);
                assert.Throw(
                    domutil.deleteText.bind(node, 0, 0),
                    Error, "deleteText called on non-text");
            });

            it("modifies a text node", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                domutil.deleteText(node, 2, 2);
                assert.equal(node.nodeValue, "ab");
            });

            it("deletes an empty text node", function () {
                var node = $root.find(".title").get(0).childNodes[0];
                domutil.deleteText(node, 0, 4);
                assert.isNull(node.parentNode);
            });

        });



        describe("nodeToPath", function () {
            var source =
                    '../../test-files/domutil_test_data/source_converted.xml';
            var $root = $("#domroot");
            var root = $root.get(0);
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
                var node = $root.find(".title").get(0).childNodes[0];
                assert.equal(
                    domutil.nodeToPath(root, node),
                    "._real.TEI[0]/._real.teiHeader[0]/._real.fileDesc[0]/" +
                        "._real.titleStmt[0]/._real.title[0]/##text[0]");
            });

            it("returns a correct path on later text node", function () {
                var node = $root.find(".body>.p").last().get(0).childNodes[2];
                assert.equal(
                    domutil.nodeToPath(root, node),
                    "._real.TEI[0]/._real.text[0]/._real.body[0]/" +
                        "._real.p[1]/##text[1]");
            });

            it("returns a correct path on phantom_wrap nodes", function () {

                $root.find(".p").wrap("<div class='_phantom_wrap'>");
                var node = $root.find(".p").last().get(0);
                assert.equal(
                    domutil.nodeToPath(root, node),
                    "._real.TEI[0]/._real.text[0]/._real.body[0]/" +
                        "._phantom_wrap[1]/._real.p[0]");
            });


            it("normalizes so that it returns the same value if " +
               "unimportant changes occurred", function () {
                   var node = $root.find(".body>.p").last().get(0).
                           childNodes[2];
                   var path = "._real.TEI[0]/._real.text[0]/._real.body[0]/" +
                           "._real.p[1]/##text[1]";
                   assert.equal(domutil.nodeToPath(root, node), path);
                   // Split a text node. This is an unimportant change.
                   domutil.splitTextNode(node.parentNode.childNodes[0], 1);
                   assert.equal(domutil.nodeToPath(root, node), path);
               });

            it("fails on a node which is not a descendant of its root",
               function () {
                   var node = $("link").last().get(0);
                   assert.Throw(domutil.nodeToPath.bind(undefined, root, node),
                                Error,
                                "node is not a descendant of root");
               });

            it("fails on invalid root",
               function () {
                   var node = $("link").last().get(0);
                   assert.Throw(domutil.nodeToPath.bind(undefined, null, node),
                                Error,
                                "invalid root parameter");

                   assert.Throw(domutil.nodeToPath.bind(undefined, undefined,
                                                        node),
                                Error,
                                "invalid root parameter");

               });

            it("fails on invalid node",
               function () {
                   assert.Throw(domutil.nodeToPath.bind(undefined, root, null),
                                Error,
                                "invalid node parameter");

                   assert.Throw(domutil.nodeToPath.bind(undefined, root,
                                                        undefined),
                                Error,
                                "invalid node parameter");

               });

        });

        describe("pathToNode", function () {
            var source =
                    '../../test-files/domutil_test_data/source_converted.xml';
            var $root = $("#domroot");
            var root = $root.get(0);
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
                var node = $root.find(".title").get(0).childNodes[0];
                assert.equal(
                    domutil.pathToNode(
                        root,
                        "._real.TEI[0]/._real.teiHeader[0]/"+
                            "._real.fileDesc[0]/" +
                            "._real.titleStmt[0]/._real.title[0]/##text[0]"),
                    node);
            });

            it("returns a correct node on a later text path", function () {
                var node = $root.find(".body>.p").last().get(0).childNodes[2];
                assert.equal(
                    domutil.pathToNode(
                        root,
                        "._real.TEI[0]/._real.text[0]/._real.body[0]/" +
                            "._real.p[1]/##text[1]"),
                    node);
            });

            it("returns a correct node when path contains _phantom_wrap",
               function () {
                   $root.find(".p").wrap("<div class='_phantom_wrap'>");
                   var node = $root.find(".p").last().get(0);
                   assert.equal(
                       domutil.pathToNode(
                           root,
                           "._real.TEI[0]/._real.text[0]/._real.body[0]/" +
                               "._phantom_wrap[1]/._real.p[0]"),
                       node);
               });


            it("normalizes so that it returns the same value if " +
               "unimportant changes occurred", function () {
                   var node = $root.find(".body>.p").last().get(0).
                           childNodes[2];
                   var path = "._real.TEI[0]/._real.text[0]/._real.body[0]/" +
                           "._real.p[1]/##text[1]";
                   assert.equal(domutil.pathToNode(root, path), node);
                   // Split a text node. This is an unimportant change.
                   domutil.splitTextNode(node.parentNode.childNodes[0], 1);
                   assert.equal(domutil.pathToNode(root, path), node);
               });
        });

        describe("linkTrees", function () {
            var source =
                    '../../test-files/domutil_test_data/source_converted.xml';
            var $root = $("#domroot");
            var root = $root.get(0);
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
                domutil.linkTrees($cloned.get(0), $root.get(0));
                var p = $root.find(".p").get(0);
                var cloned_p = $cloned.find(".p").get(0);
                assert.equal($(p).data("wed_mirror_node"), cloned_p);
            });
        });

    });
});
