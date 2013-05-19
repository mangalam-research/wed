define(["mocha/mocha", "chai", "jquery", "wed/domutil"], 
function (mocha, chai, $, domutil) {
    var assert = chai.assert;

    describe("domutil", function () {
        describe("nodeAtNextCaretPosition", function () {
            var $root = $("#domroot");
            var caret; 
            before(function () {
                $root.empty();
            });

            after(function () {
                $root.empty();
            });
            
            function testPair(node_of_interest, text_node_of_interest) {
                // The isNotNull checks are to ensure we don't majorly
                // screw up in setting up a test case. For instance if
                // we have $data = $(""), the assert.equal test would
                // likely compare null to null, and would pass.
                it("no_text === true", function () {
                    assert.isNotNull(node_of_interest);

                    assert.equal(domutil.nodeAtNextCaretPosition(caret), 
                                 node_of_interest);
                });
                it("no_text === false", function () {
                    assert.isNotNull(node_of_interest);

                    assert.equal(domutil.nodeAtNextCaretPosition(caret, false),
                                 node_of_interest.childNodes[0]);
                });
            }

            describe("in text", function () {
                var $data = $("<span>test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0).childNodes[0], 2];
                });
                testPair($data.get(0));
            });
            describe("move into child", function () {
                var $data = $("<span>test <b>test</b></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0).childNodes[0], undefined];
                    caret[1] = caret[0].nodeValue.length;
                });
                testPair($data.children("b").get(0));
            });
            describe("move to parent", function () {
                var $data = $("<span>test <b>test</b><b>test2</b></span>"); 
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.children("b").get(0).childNodes[0], undefined];
                    caret[1] = caret[0].nodeValue.length;
                });
                testPair($data.children("b").get(1));
            });
            describe("skip empty elements", function () {
                var $data = $("<span><i>a</i><i></i><i>b</i></span>"); 
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.find("i").get(0).childNodes[0], undefined];
                    caret[1] = caret[0].nodeValue.length;
                });
                testPair($data.children("i").get(2));
            });
            describe("white-space: normal", function () {
                // The case is designed so that it skips over the white space
                var $data = $("<span><s>test    </s><s>test  </s></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.children("s").get(0).childNodes[0], 4];
                });
                testPair($data.children("s").get(1));
            });
            describe("white-space: pre", function () {
                // The case is designed so that it does not skip over
                // the white space.
                var $data = $("<span><s>test    </s>" + 
                              "<s style='white-space: pre'>test  </s></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.children("s").get(1).childNodes[0], 4];
                });
                testPair($data.children("s").get(1));
            });

            describe("can't find a node", function () {
                beforeEach(function () {
                    caret = [$("html").get(0), 30000];
                });
                it("no_text === true", function () {
                    assert.isNull(domutil.nodeAtNextCaretPosition(caret));
                });
                it("no_text === false", function () {
                    assert.isNull(domutil.nodeAtNextCaretPosition(caret, 
                                                                  false)); 
                });
            });
        });

        describe("nodeAtPrevCaretPosition", function () {
            var $root = $("#domroot");
            var caret; 
            before(function () {
                $root.empty();
            });

            after(function () {
                $root.empty();
            });
            
            function testPair(node_of_interest, text_node_of_interest) {
                if (text_node_of_interest === undefined) 
                    text_node_of_interest = node_of_interest.childNodes[node_of_interest.childNodes.length - 1];

                // The isNotNull checks are to ensure we don't majorly
                // screw up in setting up a test case. For instance if
                // we have $data = $(""), the assert.equal test would
                // likely compare null to null, and would pass.
                it("no_text === true", function () {
                    assert.isNotNull(node_of_interest);

                    assert.equal(domutil.nodeAtPrevCaretPosition(caret), 
                                 node_of_interest);
                });
                it("no_text === false", function () {
                    assert.isNotNull(node_of_interest);
                    assert.equal(domutil.nodeAtPrevCaretPosition(caret, false),
                                 text_node_of_interest);
                });
            }

            describe("in text", function () {
                var $data = $("<span>test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.get(0).childNodes[0], 2];
                });
                testPair($data.get(0));
            });
            describe("move into child", function () {
                var $data = $("<span><b>test</b> test</span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    var node = $data.get(0);
                    caret = [node.childNodes[node.childNodes.length - 1], 0];
                });
                testPair($data.children("b").get(0));
            });
            describe("move to parent", function () {
                var $data = $("<span>test <b>test</b></span>"); 
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.children("b").get(0).childNodes[0], 0];
                });
                testPair($data.get(0), $data.get(0).childNodes[0]);
            });
            describe("skip empty elements", function () {
                var $data = $("<span><i>a</i><i></i><i>b</i></span>"); 
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.children("i").get(2).childNodes[0], 0];
                });
                testPair($data.children("i").get(0));
            });
            describe("white-space: normal", function () {
                // The case is designed so that it skips over the white space
                var $data = $("<span><s>test</s><s>   test</s></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.children("s").get(1).childNodes[0], 3];
                });
                testPair($data.children("s").get(0));
            });
            describe("white-space: pre", function () {
                // The case is designed so that it does not skip over
                // the white space.
                var $data = $("<span><s>test</s>" + 
                              "<s style='white-space: pre'>   test</s></span>");
                beforeEach(function () {
                    $root.empty();
                    $root.append($data);
                    caret = [$data.children("s").get(1).childNodes[0], 3];
                });
                testPair($data.children("s").get(1));
            });
            describe("can't find a node", function () {
                beforeEach(function () {
                    caret = [$("html").get(0), 0];
                });
                it("no_text === true", function () {
                    assert.isNull(domutil.nodeAtPrevCaretPosition(caret));
                });
                it("no_text === false", function () {
                    assert.isNull(domutil.nodeAtPrevCaretPosition(caret, 
                                                                  false)); 
                });
            });
        });
    });
});
