define(["mocha/mocha", "chai", "jquery", "wed/wed"],
function (mocha, chai, $, wed) {
    var assert = chai.assert;

    var wedroot = $("#wedframe-invisible").contents().find("#wedroot").get(0);
    var $wedroot = $(wedroot);
    var source = "../../test-files/wed_test_data/source_converted.xml";

    function caretCheck(editor, container, offset, msg) {
        assert.equal(editor._raw_caret[0], container, msg + " (container)");
        assert.equal(editor._raw_caret[1], offset, msg + " (offset)");
    }

    function firstGUI($container) {
        return $container.children("._gui").get(0);
    }

    function lastGUI($container) {
        return $container.children("._gui").last().get(0);
    }

    function firstPH($container) {
        return $container.children("._placeholder").get(0).childNodes[0];
    }

    function lastPH($container) {
        return $container.children("._placeholder").last().
            get(0).childNodes[0];
    }


    describe("wed", function () {
        var editor;
        beforeEach(function (done) {
            $wedroot.empty();
            require(["requirejs/text!" + source], function(data) {
                $wedroot.append(data);
                editor = new wed.Editor();
                editor.addEventListener("initialized", function () {
                    done();
                });
                editor.init(wedroot);
            });
        });

        afterEach(function () {
            if (editor)
                editor.destroy();
            editor = undefined;
        });

        it("starts with an undefined caret", function () {
            assert.equal(editor.getCaret(), undefined, "no caret");
        });

        describe("moveCaretRight", function () {
            it("works even if there is no caret defined", function () {
                assert.equal(editor.getCaret(), undefined, "no caret");
                editor.moveCaretRight();
                assert.equal(editor.getCaret(), undefined, "no caret");
            });

            it("moves right into gui elements and placeholders",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = editor.root.childNodes[0];
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretRight();
                           // It is now located inside the text inside
                           // the label which marks the start of the TEI
                           // element.
                           caretCheck(editor, firstGUI($(initial)),
                                      0, "moved once");
                           editor.moveCaretRight();
                           // It is now inside the placeholder between
                           // the gui element and the first child.
                           caretCheck(editor, firstPH($(initial)),
                                      0, "moved twice");
                           editor.moveCaretRight();
                           // It is now in the gui element of the 1st
                           // child.
                           caretCheck(editor,
                                      firstGUI($(initial).find(".teiHeader").
                                               first()),
                                      0, "moved 3 times");
                           editor.moveCaretRight();
                           // It is now inside the placeholder between
                           // the gui element and the first child.
                           caretCheck(editor,
                                      firstPH($(initial).find(".teiHeader").
                                              first()),
                                      0, "moved 4 times");

                           done();
                       });
               });

            it("moves right into text",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = $(editor.root).find(".title").
                                   first().get(0);
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretRight();
                           // It is now located inside the text inside
                           // the label which marks the start of the TEI
                           // element.
                           caretCheck(editor, firstGUI($(initial)),
                                      0, "moved once");
                           editor.moveCaretRight();
                           // It is now inside the text
                           var text_node = $(initial).children("._gui").
                                   get(0).nextSibling;
                           caretCheck(editor, text_node, 0, "moved twice");
                           editor.moveCaretRight();
                           // move through text
                           caretCheck(editor, text_node, 1, "moved 3 times");
                           editor.moveCaretRight();
                           editor.moveCaretRight();
                           editor.moveCaretRight();
                           // move through text
                           caretCheck(editor, text_node, 4, "moved 6 times");
                           editor.moveCaretRight();
                           // It is now inside the final gui element.
                           caretCheck(editor, lastGUI($(initial)),
                                      0, "moved 7 times");

                           done();
                       });
               });

            it("moves right out of elements",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           // Text node inside title.
                           var initial = $(editor.root).find(".title").
                                   get(0).childNodes[1];
                           editor.setCaret(initial,
                                           initial.nodeValue.length);
                           caretCheck(editor, initial,
                                      initial.nodeValue.length, "initial");
                           editor.moveCaretRight();
                           // It is now inside the final gui element.
                           caretCheck(editor, lastGUI($(initial.parentNode)),
                                      0, "moved once");
                           editor.moveCaretRight();
                           // It is now in the placeholder after .title
                           var container =
                                   lastPH($(initial.parentNode.parentNode));
                           // Make sure we container is actually
                           // inside a placeholder.
                           assert.equal($(container).closest("._placeholder").
                                        length, 1, "inside placeholder");
                           caretCheck(editor, container, 0, "moved twice");
                           editor.moveCaretRight();
                           // It is now in the gui element at end of
                           // the title's parent.
                           container = lastGUI($(editor.root).find(".title").
                                               parent());
                           caretCheck(editor, container, 0, "moved twice");

                           done();

                       });
               });

            it("does not move when at end of document",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = lastGUI($(editor.root).
                                                 children(".TEI"));
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretRight();
                           // Same position
                           caretCheck(editor, initial,
                                      0, "moved once");
                           done();
                       });
               });
        });

        describe("moveCaretLeft", function () {
            it("works even if there is no caret defined", function () {
                assert.equal(editor.getCaret(), undefined, "no caret");
                editor.moveCaretLeft();
                assert.equal(editor.getCaret(), undefined, "no caret");
            });

            it("moves left into gui elements and placeholders",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = editor.root.childNodes[0];
                           var offset = initial.childNodes.length;
                           editor.setCaret(initial, offset);
                           caretCheck(editor, initial, offset, "initial");
                           editor.moveCaretLeft();
                           // It is now located inside the text inside
                           // the label which marks the start of the TEI
                           // element.
                           caretCheck(editor, lastGUI($(initial)),
                                      0, "moved once");
                           editor.moveCaretLeft();
                           // It is now inside the placeholder between
                           // the gui element and the last child.
                           caretCheck(editor, lastPH($(initial)),
                                      0, "moved twice");
                           editor.moveCaretLeft();
                           // It is now in the gui element of the 1st
                           // child.
                           var $last_text = $(initial).find(".text").last();
                           caretCheck(editor, lastGUI($last_text),
                                      0, "moved 3 times");
                           editor.moveCaretLeft();
                           // It is now inside the placeholder between
                           // the gui element and the first child.
                           caretCheck(editor, lastPH($last_text),
                                      0, "moved 4 times");

                           done();
                       });
               });

            it("moves left into text",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = lastGUI($(editor.root).find(".title").
                                                 first());
                           editor.setCaret(initial, 1);
                           caretCheck(editor, initial, 1, "initial");
                           editor.moveCaretLeft();
                           // It is now inside the text
                           var text_node = initial.previousSibling;
                           var offset = text_node.nodeValue.length;
                           caretCheck(editor, text_node, offset, "moved once");
                           editor.moveCaretLeft();
                           // move through text
                           offset--;
                           caretCheck(editor, text_node,
                                      offset, "moved twice");
                           editor.moveCaretLeft();
                           editor.moveCaretLeft();
                           editor.moveCaretLeft();
                           caretCheck(editor, text_node, 0, "moved 5 times");
                           editor.moveCaretLeft();
                           // It is now inside the first gui element.
                           caretCheck(editor, firstGUI($(editor.root).
                                                       find(".title").first()),
                                      0, "moved 6 times");

                           done();
                       });
               });

            it("moves left out of elements",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial =
                                   firstGUI($(editor.root).find(".title"));
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretLeft();
                           // // It is now in the placeholder before .title
                           var container =
                                   firstPH($(editor.root).find(".title").
                                           parent());
                           // Make sure container is actually inside a
                           // placeholder.
                           assert.equal($(container).closest("._placeholder").
                                        length, 1, "inside placeholder");
                           caretCheck(editor, container, 0, "moved twice");
                           editor.moveCaretLeft();
                           // It is now in the gui element at end of
                           // the title's parent.
                           container = firstGUI($(editor.root).find(".title").
                                               parent());
                           caretCheck(editor, container, 0, "moved twice");

                           done();

                       });
               });

            it("does not move when at start of document",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = firstGUI($(editor.root).
                                                  children(".TEI"));
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretLeft();
                           // Same position
                           caretCheck(editor, initial,
                                      0, "moved once");
                           done();
                       });
               });

        });

    });
});
