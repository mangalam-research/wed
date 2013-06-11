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

    describe("wed", function () {
        beforeEach(function (done) {
            $wedroot.empty();
            require(["requirejs/text!" + source], function(data) {
                $wedroot.append(data);
                done();
            });
        });
        it("starts with an undefined caret", function () {
            var editor = wed.editor(wedroot);
            assert.equal(editor.getCaret(), undefined, "no caret");
        });
        describe("moveCaretRight", function () {
            it("works even if there is no caret defined", function () {
                var editor = wed.editor(wedroot);
                assert.equal(editor.getCaret(), undefined, "no caret");
                editor.moveCaretRight();
                assert.equal(editor.getCaret(), undefined, "no caret");
            });
            it("moves right into gui elements and placeholders",
               function (done) {
                   var editor = wed.editor(wedroot);
                   editor.addEventListener("initialized", function () {
                       window.setTimeout(function () {
                           var initial = editor.root.childNodes[0];
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretRight();
                           // It is now located inside the text inside
                           // the label which marks the start of the TEI
                           // element.
                           caretCheck(editor,
                                      $(initial).children("._gui").get(0).
                                      childNodes[0],
                                      0, "moved once");
                           editor.moveCaretRight();
                           // It is now inside the placeholder between
                           // the gui element and the first child.
                           caretCheck(editor,
                                      $(initial).children("._placeholder").
                                   get(0).childNodes[0],
                                      0, "moved twice");
                           editor.moveCaretRight();
                           // It is now in the gui element of the 1st
                           // child.
                           caretCheck(editor,
                                      $(initial).find(".teiHeader").
                                      first().children("._gui").
                                      get(0).childNodes[0],
                                      0, "moved 3 times");
                           editor.moveCaretRight();
                           // It is now inside the placeholder between
                           // the gui element and the first child.
                           caretCheck(editor,
                                      $(initial).find(".teiHeader").
                                      first().children("._placeholder").
                                      get(0).childNodes[0],
                                      0, "moved 4 times");

                           done();
                       }, 1000);
                   });
               });
            it("moves right into text",
               function (done) {
                   var editor = wed.editor(wedroot);
                   editor.addEventListener("initialized", function () {
                       window.setTimeout(function () {
                           var initial = $(editor.root).find(".title").
                                   first().get(0);
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretRight();
                           // It is now located inside the text inside
                           // the label which marks the start of the TEI
                           // element.
                           caretCheck(editor,
                                      $(initial).children("._gui").get(0).
                                      childNodes[0],
                                      0, "moved once");
                           editor.moveCaretRight();
                           // It is now inside the text
                           var text_node = $(initial).children("._gui").get(0)
                                   .nextSibling;
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
                           caretCheck(editor,
                                      $(initial).find("._gui").
                                      last().get(0).childNodes[0],
                                      0, "moved 7 times");

                           done();
                       }, 1000);
                   });
               });
        });
        describe("moveCaretLeft", function () {
            it("works even if there is no caret defined", function () {
                var editor = wed.editor(wedroot);
                assert.equal(editor.getCaret(), undefined, "no caret");
                editor.moveCaretLeft();
                assert.equal(editor.getCaret(), undefined, "no caret");
            });
        });

    });
});
