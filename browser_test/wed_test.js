define(["mocha/mocha", "chai", "jquery", "wed/wed", "rangy"],
function (mocha, chai, $, wed, rangy) {
    var options = {
        schema: 'test/tei-simplified-rng.js',
        mode: {
            path: 'wed/modes/generic/generic',
            options: {
                meta: 'wed/modes/generic/metas/tei_meta',
                // This option is for testing only, not to be used as
                // part of normal operations. It may change at any
                // time, without warning, and without documentation.
                __test: {
                    no_element_decoration: ["term"]
                }
            }
        }
    };
    var assert = chai.assert;

    var wedroot = $("#wedframe-invisible").contents().find("#wedroot").get(0);
    var $wedroot = $(wedroot);
    var source = "../../test-files/wed_test_data/source_converted.xml";

    function caretCheck(editor, container, offset, msg) {
        assert.equal(editor._raw_caret[0], container, msg + " (container)");
        assert.equal(editor._raw_caret[1], offset, msg + " (offset)");
    }

    function dataCaretCheck(editor, container, offset, msg) {
        var data_caret = editor.getDataCaret();
        assert.equal(data_caret[0], container, msg + " (container)");
        assert.equal(data_caret[1], offset, msg + " (offset)");
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
                editor.init(wedroot, options);
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

        it("clicking moves the caret", function (done) {
            editor.whenCondition(
                "first-validation-complete",
                function () {
                // Text node inside title.
                var initial = $(editor.gui_root).find(".title").
                    get(0).childNodes[1];
                editor.setCaret(initial,
                                initial.nodeValue.length);
                editor.moveCaretRight();
                // It is now inside the final gui element.
                caretCheck(editor, lastGUI($(initial.parentNode)),
                           0, "initial caret position");

                // We used to check for the existence of a fake
                // caret. However, not all browsers require the
                // fake caret to exist in this context. (Chrome
                // does, Firefox does not. Subject to change with
                // new versions.) There's no point in check
                // it. However, the fake caret should definitely
                // be off by the time we finish the test.
                //
                // Fake caret must exist
                // assert.equal(editor._$fake_caret.parent().length,
                // 1, "fake caret existence");

                // We have to set the selection manually and
                // generate a click event because just generating
                // the event won't move the caret.
                var r = rangy.createRange();
                r.setStart(initial, 0);
                rangy.getSelection(editor.my_window).setSingleRange(r);
                var ev = $.Event("mouseup", { target: initial });
                $(initial.parentNode).trigger(ev);

                // We need to do this because setting the caret
                // through a click is not instantaneous. wed
                // internally sets a timeout of 0 length to deal with
                // browser incompatibilities. We need to do the same
                // so that wed's timeout runs before we query the
                // value.
                editor.my_window.setTimeout(function () {
                    // In text, no fake caret
                    assert.equal(editor._$fake_caret.parent().length, 0);
                    caretCheck(editor, initial, 0, "final caret position");

                    done();
                }, 1);
            });
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
                           var initial = editor.gui_root.childNodes[0];
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretRight();
                           // It is now located inside the text inside
                           // the label which marks the start of the TEI
                           // element.
                           caretCheck(editor, firstGUI($(initial)),
                                      0, "moved once");
                           editor.moveCaretRight();
                           // It is now in the gui element of the 1st
                           // child.
                           caretCheck(editor,
                                      firstGUI($(initial).find(".teiHeader").
                                               first()),
                                      0, "moved twice");
                           done();
                       });
               });

            it("moves right into text",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = $(editor.gui_root).find(".title").
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

            it("moves right from text to text", function (done) {
                editor.whenCondition(
                    "first-validation-complete",
                    function () {
                        var term = $(editor.gui_root).find(".body>.p>.term").
                                first().get(0);
                        var initial = term.previousSibling;
                        // Make sure we are on the right element.
                        assert.equal(initial.nodeType, Node.TEXT_NODE);
                        assert.equal(initial.nodeValue, "Blah blah ");

                        editor.setCaret(initial, initial.nodeValue.length - 1);
                        caretCheck(editor, initial,
                                   initial.nodeValue.length - 1, "initial");

                        editor.moveCaretRight();
                        caretCheck(editor, initial, initial.nodeValue.length,
                                   "moved once");

                        // It will skip position 0 because a caret at
                        // (initial, initial.nodeValue.length) is at
                        // the same place as a caret at
                        // (term.childNodes[0], 0).
                        editor.moveCaretRight();
                        caretCheck(editor, term.childNodes[0], 1,
                                   "moved twice");
                        done();
                    });
            });

            it("moves right out of elements",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           // Text node inside title.
                           var initial = $(editor.gui_root).find(".title").
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
                           // It is now in the gui element at end of
                           // the title's parent.
                           var container = lastGUI($(editor.gui_root).find(".title").
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
                           var initial = lastGUI($(editor.gui_root).
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
                           var initial = editor.gui_root.childNodes[0];
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
                           // It is now in the gui element of the 1st
                           // child.
                           var $last_text = $(initial).find(".text").last();
                           caretCheck(editor, lastGUI($last_text),
                                      0, "moved twice");

                           done();
                       });
               });

            it("moves left into text",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = lastGUI($(editor.gui_root).find(".title").
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
                           caretCheck(editor, firstGUI($(editor.gui_root).
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
                                   firstGUI($(editor.gui_root).find(".title"));
                           editor.setCaret(initial, 0);
                           caretCheck(editor, initial, 0, "initial");
                           editor.moveCaretLeft();
                           // It is now in the gui element at end of
                           // the title's parent.
                           var container =
                                   firstGUI($(editor.gui_root).find(".title").
                                            parent());
                           caretCheck(editor, container, 0, "moved twice");

                           done();

                       });
               });

            it("moves left from text to text", function (done) {
                editor.whenCondition(
                    "first-validation-complete",
                    function () {
                        var term = $(editor.gui_root).find(".body>.p>.term").
                                first().get(0);
                        var initial = term.nextSibling;
                        // Make sure we are on the right element.
                        assert.equal(initial.nodeType, Node.TEXT_NODE);
                        assert.equal(initial.nodeValue, " blah.");

                        editor.setCaret(initial, 1);
                        caretCheck(editor, initial, 1, "initial");

                        editor.moveCaretLeft();
                        caretCheck(editor, term.childNodes[0],
                                   term.childNodes[0].nodeValue.length,
                                   "moved once");
                        done();
                    });
            });

            it("does not move when at start of document",
               function (done) {
                   editor.whenCondition(
                       "first-validation-complete",
                       function () {
                           var initial = firstGUI($(editor.gui_root).
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

        it("handles pasting simple text", function () {
            var initial = editor.$data_root.find(".body>.p").get(0).
                childNodes[0];
            editor.setDataCaret(initial, 0);
            var initial_value = initial.nodeValue;

            // Synthetic event
            var event = new $.Event("paste");
            // Provide a skeleton of clipboard data
            event.originalEvent = {
                clipboardData: {
                    types: ["text/plain"],
                    getData: function (type) {
                        return "abcdef";
                    }
                }
            };
            editor.$gui_root.trigger(event);
            editor._syncDisplay();
            assert.equal(initial.nodeValue, "abcdef" + initial_value);
            var final_caret = editor.getDataCaret();
            dataCaretCheck(editor, initial, 6, "final position");
        });

        it("handles pasting structured text", function () {
            var $p = editor.$data_root.find(".body>.p").first();
            var initial = $p.get(0).childNodes[0];
            editor.setDataCaret(initial, 0);
            var initial_value = $p.get(0).innerHTML;

            // Synthetic event
            var event = new $.Event("paste");
            // Provide a skeleton of clipboard data
            event.originalEvent = {
                clipboardData: {
                    types: ["text/html", "text/plain"],
                    getData: function (type) {
                        return $p.get(0).innerHTML;
                    }
                }
            };
            editor.$gui_root.trigger(event);
            editor._syncDisplay();
            assert.equal($p.get(0).innerHTML, initial_value + initial_value);
            dataCaretCheck(editor, $p.get(0).childNodes[2], 6,
                           "final position");
        });

        it("handles pasting structured text: invalid, decline pasting as text",
           function (done) {
            var $p = editor.$data_root.find(".body>.p").first();
            var initial = $p.get(0).childNodes[0];
            editor.setDataCaret(initial, 0);
            var initial_value = $p.get(0).innerHTML;

            // Synthetic event
            var event = new $.Event("paste");
            // Provide a skeleton of clipboard data
            event.originalEvent = {
                clipboardData: {
                    types: ["text/html", "text/plain"],
                    getData: function (type) {
                        return $p.get(0).outerHTML;
                    }
                }
            };
            editor._paste_modal.getTopLevel().on("hidden.bs.modal",
                                                 function () {
                editor._syncDisplay();
                assert.equal($p.get(0).innerHTML, initial_value);
                dataCaretCheck(editor, initial, 0, "final position");
                done();
            });
            editor.$gui_root.trigger(event);
            // This clicks "No".
            editor._paste_modal._$footer.find(".btn").get(1).click();
        });

        it("handles pasting structured text: invalid, accept pasting as text",
           function (done) {
            var $p = editor.$data_root.find(".body>.p").first();
            var initial = $p.get(0).childNodes[0];
            editor.setDataCaret(initial, 0);
            var initial_value = $p.get(0).innerHTML;
            var initial_outer = $p.get(0).outerHTML;
            var $x = $("<div>").append(document.createTextNode(initial_outer));
            var initial_outer_from_text_to_html = $x.get(0).innerHTML;

            // Synthetic event
            var event = new $.Event("paste");
            // Provide a skeleton of clipboard data
            event.originalEvent = {
                clipboardData: {
                    types: ["text/html", "text/plain"],
                    getData: function (type) {
                        return initial_outer;
                    }
                }
            };
            editor._paste_modal.getTopLevel().on("hidden.bs.modal",
                                                 function () {
                editor._syncDisplay();
                assert.equal($p.get(0).innerHTML,
                             initial_outer_from_text_to_html + initial_value);
                dataCaretCheck(editor, $p.get(0).childNodes[0],
                               initial_outer.length,
                               "final position");
                done();
            });
            editor.$gui_root.trigger(event);
            // This clicks "Yes".
            editor._paste_modal._$footer.find(".btn-primary").get(0).
                click();
        });




    });
});
