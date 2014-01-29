/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "browser_test/global", "jquery", "wed/wed",
        "wed/domutil", "rangy", "wed/key_constants", "wed/onerror", "wed/log",
        "wed/key"],
       function (mocha, chai, global, $, wed, domutil, rangy, key_constants,
                onerror, log, key) {
'use strict';

var _indexOf = Array.prototype.indexOf;

var options = {
    schema: '../../../schemas/tei-simplified-rng.js',
    mode: {
        path: 'test',
        options: {
            meta: {
                path: 'wed/modes/generic/metas/tei_meta',
                options: {
                    metadata: '../../../../../schemas/tei-metadata.json'
                }
            }
        }
    }
};
var assert = chai.assert;

var wedroot = document.getElementById("wedframe-invisible")
        .contentWindow.document.getElementById("wedroot");
var src_stack = ["../../test-files/wed_test_data/source_converted.xml"];

function caretCheck(editor, container, offset, msg) {
    var caret = editor.getGUICaret(true);
    if (offset !== null) {
        assert.equal(caret.node, container, msg + " (container)");
        assert.equal(caret.offset, offset, msg + " (offset)");
    }
    else {
        // A null offset means we are not interested in the specific
        // offset.  We just want to know that the caret is *inside*
        // container either directly or indirectly.
        assert.isTrue($(caret.node).closest(container).length !== 0,
                      msg + " (container)");
    }
}

function dataCaretCheck(editor, container, offset, msg) {
    var data_caret = editor.getDataCaret();
    assert.equal(data_caret.node, container, msg + " (container)");
    assert.equal(data_caret.offset, offset, msg + " (offset)");
}

function firstGUI(container) {
    return domutil.childByClass(container, "_gui");
}

function lastGUI(container) {
    var children = domutil.childrenByClass(container, "_gui");
    return children[children.length - 1] || null;
}

describe("wed", function () {
    describe("(state-sensitive)", function () {
        // These are tests that required a brand new editor. Since it
        // is costly to create a new editor for each individual test,
        // we don't want to put in this `describe` the tests that
        // don't need such initialization.

        var editor;
        beforeEach(function (done) {
            require(["requirejs/text!" + src_stack[0]], function(data) {
                wedroot.innerHTML = data;
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
            assert.isFalse(onerror.__test.is_terminating(),
                           "test caused an unhandled exception to occur");
            // We don't reload our page so we need to do this.
            onerror.__test.reset();
        });

        it("starts with undefined carets and selection ranges", function () {
            assert.isUndefined(editor.getGUICaret(), "no gui caret");
            assert.isUndefined(editor.getDataCaret(), "no data caret");
            assert.isUndefined(editor.getSelectionRange(),
                               "no gui selection range");
            assert.isUndefined(editor.getDataSelectionRange(),
                               "no data selection range");
        });

        it("has a modification status showing an unmodified document " +
           "when starting", function () {
            assert.isTrue(
                editor._$modification_status.hasClass("label-success"));
        });

        it("has a modification status showing an modified document " +
           "when the document is modified", function () {
            editor.validator._validateUpTo(editor.data_root, -1);
            // Text node inside title.
            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            editor.setGUICaret(initial, 0);
            editor.type(" ");

            assert.isTrue(
                editor._$modification_status.hasClass("label-warning"));
        });

        it("has a modification status showing an unmodified document " +
           "when the document is modified but saved", function (done) {
            editor.validator._validateUpTo(editor.data_root, -1);
            // Text node inside title.
            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            editor.setGUICaret(initial, 0);
            editor.type(" ");

            assert.isTrue(
                editor._$modification_status.hasClass("label-warning"));
            editor.addEventListener("saved", function () {
                assert.isTrue(
                    editor._$modification_status.hasClass("label-success"));
                done();
            });
            editor.type(key_constants.CTRLEQ_S);
        });

        it("has a save status showing an unsaved document " +
           "when starting", function () {
            assert.isTrue(
                editor._$save_status.hasClass("label-default"));
            assert.equal(
                editor._$save_status.children('span').text(), "");

        });

        it("has a save status showing a saved document " +
           "after a save", function (done) {
            assert.isTrue(
                editor._$save_status.hasClass("label-default"));
            assert.equal(
                editor._$save_status.children('span').text(), "");

            editor.addEventListener("saved", function () {
                assert.isTrue(
                    editor._$save_status.hasClass("label-success"));
                assert.equal(
                    editor._$save_status.children('span').text(),
                    "moments ago");
                done();
            });
            editor.type(key_constants.CTRLEQ_S);
        });

        it("has a save status showing a saved document " +
           "after an autosave", function (done) {
            assert.isTrue(
                editor._$save_status.hasClass("label-default"));
            assert.equal(
                editor._$save_status.children('span').text(), "");

            editor.addEventListener("autosaved", function () {
                assert.isTrue(
                    editor._$save_status.hasClass("label-info"));
                assert.equal(
                    editor._$save_status.children('span').text(),
                    "moments ago");
                done();
            });

            editor.validator._validateUpTo(editor.data_root, -1);
            // Text node inside title.
            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            editor.setGUICaret(initial, 0);
            editor.type(" ");
            editor._saver.setAutosaveInterval(50);
        });

        it("typing BACKSPACE without caret does not crash", function () {
            assert.equal(editor.getGUICaret(), undefined, "no caret");
            editor.type(key_constants.BACKSPACE);
        });

        it("typing DELETE without caret does not crash", function () {
            assert.equal(editor.getGUICaret(), undefined, "no caret");
            editor.type(key_constants.DELETE);
        });

        it("typing text works", function () {
            editor.validator._validateUpTo(editor.data_root, -1);
            // Text node inside title.
            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            var parent = initial.parentNode;
            editor.setGUICaret(initial, 0);

            // There was a version of wed which would fail this
            // test. The fake caret would be inserted inside the
            // text node, which would throw off the
            // nodeToPath/pathToNode calculations.

            editor.type(" ");
            assert.equal(initial.nodeValue, " abcd");
            assert.equal(parent.childNodes.length, 3);

            editor.type(" ");
            assert.equal(initial.nodeValue, "  abcd");
            assert.equal(parent.childNodes.length, 3);

            // This is where wed used to fail.
            editor.type(" ");
            assert.equal(initial.nodeValue, "   abcd");
            assert.equal(parent.childNodes.length, 3);
        });

        it("typing text when the caret is adjacent to text works (before text)",
           function () {
            editor.validator._validateUpTo(editor.data_root, -1);
            // Text node inside title.
            var initial = editor.data_root.querySelectorAll(".body>.p")[3];
            var his = domutil.childrenByClass(initial, "hi");
            var hi = his[his.length - 1];

            // We put the caret just after the last <hi>, which means
            // it is just before the last text node.
            editor.setDataCaret(initial,
                                _indexOf.call(initial.childNodes, hi) + 1);

            var initial_length = initial.childNodes.length;

            editor.type(" ");
            assert.equal(initial.lastChild.nodeValue, " c");
            assert.equal(initial.childNodes.length, initial_length);
        });

        it("typing text when the caret is adjacent to text works (after text)",
           function () {
            editor.validator._validateUpTo(editor.data_root, -1);
            // Text node inside title.
            var initial = editor.data_root.querySelectorAll(".body>.p")[3];

            // We put the caret just after the last child, a text node.
            editor.setDataCaret(initial, initial.childNodes.length);

            var initial_length = initial.childNodes.length;

            editor.type(" ");
            assert.equal(initial.lastChild.nodeValue, "c ");
            assert.equal(initial.childNodes.length, initial_length);
        });

        it("typing longer than the length of a text undo works", function () {
            editor.validator._validateUpTo(editor.data_root, -1);
            // Text node inside title.
            var initial = editor.gui_root
                .getElementsByClassName("title")[0].childNodes[1];
            var parent = initial.parentNode;
            editor.setGUICaret(initial, 0);

            var text = new Array(editor._text_undo_max_length + 1).join("a");
            editor.type(text);
            assert.equal(initial.nodeValue, text + "abcd");
            assert.equal(parent.childNodes.length, 3);
        });

        it("typing text after an element works", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            var initial = editor.data_root.querySelectorAll(".body>.p")[1];
            var parent = initial.parentNode;
            editor.setDataCaret(initial, 1);

            editor.type(" ");
            assert.equal(initial.childNodes.length, 2);
        });

        it("typing text in phantom text does nothing", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            var ref = domutil.childByClass(
                editor.gui_root.querySelectorAll(".body>.p")[2], "ref");
            var initial = ref.childNodes[1];

            // Make sure we're looking at the right thing.
            assert.isTrue(initial.classList &&
                          initial.classList.contains("_phantom"),
                          " initial is phantom");
            assert.equal(initial.textContent, "(", "initial's value");
            editor.setGUICaret(initial, 1);

            editor.type(" ");
            assert.equal(initial.textContent, "(", "initial's value after");
        });


        it("typing text moves the caret", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            var parent = initial.parentNode;
            editor.setGUICaret(initial, 0);

            // There was a version of wed which would fail this
            // test. The fake caret would be inserted inside the
            // text node, which would throw off the
            // nodeToPath/pathToNode calculations.

            editor.type("blah");
            assert.equal(initial.nodeValue, "blahabcd");
            assert.equal(parent.childNodes.length, 3);
            caretCheck(editor, initial, 4, "caret after text insertion");
        });

        it("typing text in an attribute inserts text", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var first_gui = firstGUI(ps[7]);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type("blah");

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[7]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, "blahrend_value");
            caretCheck(editor, initial, 4, "caret after text insertion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "blahrend_value");
        });

        it("typing text in an empty attribute inserts text", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var first_gui = firstGUI(ps[9]);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.isTrue(initial.classList.contains("_placeholder"));
            editor.setGUICaret(initial, 0);
            editor.type("blah");

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[9]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, "blah");
            caretCheck(editor, initial, 4, "caret after text insertion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "blah");
        });

        it("typing a double quote in an attribute inserts a double quote",
           function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var first_gui = firstGUI(ps[7]);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type('"');

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[7]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, '"rend_value');
            caretCheck(editor, initial, 1, "caret after text insertion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, '"rend_value');
        });

        it("typing a single quote in an attribute inserts a single quote",
           function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var first_gui = firstGUI(ps[7]);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type("'");

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[7]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, "'rend_value");
            caretCheck(editor, initial, 1, "caret after text insertion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "'rend_value");
        });

        it("typing an open angle bracket in an attribute inserts an open " +
           "angle bracket",
           function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var first_gui = firstGUI(ps[7]);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type("<");

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[7]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, "<rend_value");
            caretCheck(editor, initial, 1, "caret after text insertion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "<rend_value");
        });

        it("typing DELETE in an attribute deletes text", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var first_gui = firstGUI(ps[7]);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type(key_constants.DELETE);

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[7]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, "end_value");
            caretCheck(editor, initial, 0, "caret after deletion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "end_value");
        });

        it("typing DELETE in an attribute when no more can be deleted is a " +
           "noop", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var p = ps[8];
            var first_gui = firstGUI(p);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 0);
            assert.equal(initial.data, "abc");
            editor.type(key_constants.DELETE);
            editor.type(key_constants.DELETE);
            editor.type(key_constants.DELETE);

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(p);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0];
            assert.isTrue(
                initial.firstChild.classList.contains("_placeholder"));
            assert.equal(initial.childNodes.length, 1);
            caretCheck(editor, initial.firstChild, 0, "caret after deletion");


            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "");

            // Overdeleting
            editor.type(key_constants.DELETE);

            first_gui = firstGUI(p);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0];
            assert.isTrue(
                initial.firstChild.classList.contains("_placeholder"));
            assert.equal(initial.childNodes.length, 1);
            caretCheck(editor, initial.firstChild, 0, "caret after deletion");

            // Check that the data is also modified
            data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "");
        });

        it("typing BACKSPACE in an attribute deletes text", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var first_gui = firstGUI(ps[7]);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 4);
            assert.equal(initial.data, "rend_value");
            editor.type(key_constants.BACKSPACE);

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[7]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, "ren_value");
            caretCheck(editor, initial, 3, "caret after deletion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "ren_value");
        });

        it("typing BACKSPACE in an attribute when no more can be deleted is " +
           "a noop", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var p = ps[8];
            var first_gui = firstGUI(p);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 3);
            assert.equal(initial.data, "abc");
            editor.type(key_constants.BACKSPACE);
            editor.type(key_constants.BACKSPACE);
            editor.type(key_constants.BACKSPACE);

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(p);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0];
            assert.isTrue(
                initial.firstChild.classList.contains("_placeholder"));
            assert.equal(initial.childNodes.length, 1);
            caretCheck(editor, initial.firstChild, 0, "caret after deletion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "");

            // Overdeleting
            editor.type(key_constants.BACKSPACE);

            first_gui = firstGUI(p);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0];
            assert.isTrue(
                initial.firstChild.classList.contains("_placeholder"));
            assert.equal(initial.childNodes.length, 1);
            caretCheck(editor, initial.firstChild, 0, "caret after deletion");

            // Check that the data is also modified
            data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "");
        });

        it("undo undoes typed text as a group", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            var parent = initial.parentNode;
            editor.setGUICaret(initial, 0);

            // There was a version of wed which would fail this
            // test. The fake caret would be inserted inside the text
            // node, which would throw off the nodeToPath/pathToNode
            // calculations.

            editor.type("blah");
            assert.equal(initial.nodeValue, "blahabcd", "text after edit");
            assert.equal(parent.childNodes.length, 3);

            editor.undo();
            assert.equal(initial.nodeValue, "abcd", "text after undo");
            assert.equal(parent.childNodes.length, 3);
            caretCheck(editor, initial, 0, "caret after undo");
        });

        it("redo redoes typed text as a group", function () {
            editor.validator._validateUpTo(editor.data_root, -1);
            // Text node inside title.
            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            var parent = initial.parentNode;
            editor.setGUICaret(initial, 0);

            // There was a version of wed which would fail this
            // test. The fake caret would be inserted inside the text
            // node, which would throw off the nodeToPath/pathToNode
            // calculations.

            editor.type("blah");
            assert.equal(initial.nodeValue, "blahabcd", "text after edit");
            assert.equal(parent.childNodes.length, 3);

            editor.undo();
            assert.equal(initial.nodeValue, "abcd", "text after undo");
            assert.equal(parent.childNodes.length, 3);
            caretCheck(editor, initial, 0, "caret after undo");

            editor.redo();
            assert.equal(initial.nodeValue, "blahabcd", "text after undo");
            assert.equal(parent.childNodes.length, 3);
            caretCheck(editor, initial, 4, "caret after redo");
        });

        it("undoing in an attribute works", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var ps = editor.gui_root.querySelectorAll(".body>.p");
            var first_gui = firstGUI(ps[7]);
            var initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            editor.setGUICaret(initial, 4);
            assert.equal(initial.data, "rend_value");
            editor.type("blah");

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[7]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, "rendblah_value");
            caretCheck(editor, initial, 8, "caret after text insertion");

            // Check that the data is also modified
            var data_node = editor.toDataNode(initial);
            assert.equal(data_node.value, "rendblah_value");

            editor.undo();

            // We have to refetch because the decorations have been
            // redone.
            first_gui = firstGUI(ps[7]);
            initial =
                first_gui.getElementsByClassName("_attribute_value")[0]
                .firstChild;
            assert.equal(initial.data, "rend_value");
            caretCheck(editor, initial, 4, "caret after undo");

            // Check that the data change has been undone.
            assert.equal(data_node.value, "rend_value");
        });

        it("clicking a gui element after typing text works", function (done) {
            editor.whenCondition(
                "initialized",
                function () {
                // Text node inside paragraph.
                var initial = editor.data_root.querySelector(".body>.p");
                var parent = initial.parentNode;
                editor.setDataCaret(initial.firstChild, 1);

                editor.type(" ");
                assert.equal(initial.firstChild.nodeValue, "B lah blah ");

                var caret = editor.getGUICaret();
                var last_gui = domutil.closestByClass(caret.node, "p")
                    .lastElementChild;
                assert.isTrue(last_gui.classList.contains("_gui"));
                var last_gui_span = last_gui.firstElementChild;

                // We're simulating how Chrome would handle it. When a
                // mousedown event occurs, Chrome moves the caret *after*
                // the mousedown event is processed.
                var event = new $.Event("mousedown");
                event.target = last_gui_span;
                editor.setSelectionRange(caret.makeRange());

                // This simulates the movement of the caret after the
                // mousedown event is processed. This will be processed
                // after the mousedown handler but before _seekCaret is
                // run.
                window.setTimeout(log.wrap(function () {
                    var range = rangy.createRange(editor.my_window.document);
                    range.setStart(last_gui_span);
                    editor.setSelectionRange(range);
                }), 0);

                // We trigger the event here so that the order specified
                // above is respected.
                $(last_gui_span).trigger(event);

                window.setTimeout(log.wrap(function () {
                    event = new $.Event("click");
                    var offset = $(last_gui_span).offset();
                    event.pageX = offset.left;
                    event.pageY = offset.top;
                    event.target = last_gui_span;
                    $(last_gui_span).trigger(event);
                    done();
                }), 1);
            });
        });

        it("clicking a phantom element after typing text works",
           function (done) {
            editor.whenCondition(
                "initialized",
                function () {
                // We create a special phantom element because the generic
                // mode does not create any.
                var title = editor.gui_root.getElementsByClassName("title")[0];
                var phantom = title.ownerDocument.createElement("span");
                phantom.className = "_phantom";
                phantom.textContent = "phantom";
                title.insertBefore(phantom, null);

                // Text node inside paragraph.
                var initial = editor.data_root.querySelector(".body>.p");
                var parent = initial.parentNode;
                editor.setDataCaret(initial.firstChild, 1);

                editor.type(" ");
                assert.equal(initial.firstChild.nodeValue, "B lah blah ");

                var caret = editor.getGUICaret();

                // We're simulating how Chrome would handle it. When a
                // mousedown event occurs, Chrome moves the caret *after*
                // the mousedown event is processed.
                var event = new $.Event("mousedown");
                event.target = phantom;
                editor.setSelectionRange(caret.makeRange());

                // This simulates the movement of the caret after the
                // mousedown event is process. This will be processed
                // after the mousedown handler but before _seekCaret is
                // run.
                window.setTimeout(log.wrap(function () {
                    var range = rangy.createRange(editor.my_window.document);
                    range.setStart(phantom, 0);
                    editor.setSelectionRange(range);
                }), 0);

                // We trigger the event here so that the order specified
                // above is respected.
                $(phantom).trigger(event);

                window.setTimeout(log.wrap(function () {
                    event = new $.Event("click");
                    event.target = phantom;
                    $(phantom).trigger(event);
                    done();
                }), 1);
            });
        });


        it("an element that becomes empty acquires a placeholder",
           function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var initial = editor.data_root.getElementsByClassName("title")[0];
            var parent = initial.parentNode;

            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.nodeValue, "abcd");
            editor.setDataCaret(initial, 0);
            var caret = editor.getGUICaret();
            assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");

            // Delete all contents.
            editor.data_updater.removeNode(initial.firstChild);

            // We should have a placeholder now, between the two labels.
            assert.equal(caret.node.childNodes.length, 3);
            assert.isTrue(caret.node.childNodes[1].classList.contains(
                "_placeholder"));
        });

        it("an element that goes from empty to not empty is properly " +
           "decorated",
           function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            var initial = editor.gui_root.querySelector(".publicationStmt>.p");
            var initial_data = editor.toDataNode(initial);

            // Make sure we are looking at the right thing.
            assert.equal(initial_data.childNodes.length, 0);
            editor.setDataCaret(initial_data, 0);
            editor.type("a");
            assert.equal(initial_data.childNodes.length, 1);
            // Check the contents of the GUI tree to make sure it has
            // a start, end labels and one text node.
            assert.equal(initial.childNodes.length, 3);
            var cl;
            assert.isTrue((cl = initial.firstChild.classList) &&
                          cl.contains("_p_label") &&
                          cl.contains("__start_label"));
            assert.equal(initial.childNodes[1].nodeType, Node.TEXT_NODE);
            assert.isTrue((cl = initial.lastChild.classList) &&
                          cl.contains("_p_label") &&
                          cl.contains("__end_label"));
        });

        it("unwraps elements", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var initial = editor.data_root.getElementsByClassName("title")[0];

            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.nodeValue, "abcd");
            editor.setDataCaret(initial, 0);
            var caret = editor.getGUICaret();
            assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");

            var trs = editor.mode.getContextualActions(
                ["wrap"], "hi", initial, 0);

            var tr = trs[0];
            var data = {node: undefined, element_name: "hi"};
            editor.setDataCaret(initial.firstChild, 1);
            caret = editor.getGUICaret();
            var range = caret.makeRange();
            range.setEnd(caret.node, caret.offset + 2);
            editor.setSelectionRange(range);

            tr.execute(data);

            var node = domutil.childByClass(initial, "hi");
            trs = editor.mode.getContextualActions(["unwrap"], "hi", node, 0);

            tr = trs[0];
            data = {node: node, element_name: "hi" };
            tr.execute(data);
            assert.equal(initial.childNodes.length, 1, "length after unwrap");
            assert.equal(initial.firstChild.nodeValue, "abcd");
        });

        it("wraps elements in elements (offset 0)", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var initial = editor.data_root.querySelectorAll(".body>.p")[4];

            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.nodeValue, "abcdefghij");

            var trs = editor.mode.getContextualActions(
                ["wrap"], "hi", initial, 0);

            var tr = trs[0];
            var data = {node: undefined, element_name: "hi"};
            editor.setDataCaret(initial.firstChild, 3);
            var caret = editor.getGUICaret();
            editor.setSelectionRange(
                caret.makeRange(caret.make(caret.node,
                                           caret.offset + 2)).range);

            tr.execute(data);

            assert.equal(initial.innerHTML,
                         'abc<div class="hi _real">de</div>fghij');
            assert.equal(initial.childNodes.length, 3,
                         "length after first wrap");

            caret = editor.fromDataLocation(initial.firstChild, 0);
            editor.setSelectionRange(
                caret.makeRange(editor.fromDataLocation(initial.lastChild,
                                                        0)).range);

            tr.execute(data);

            assert.equal(initial.innerHTML,
                         '<div class="hi _real">abc<div class="hi _real">' +
                         'de</div></div>fghij');
            assert.equal(initial.childNodes.length, 2,
                         "length after second wrap");

        });

        it("wraps elements in elements (offset === nodeValue.length)",
           function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var initial = editor.data_root.querySelectorAll(".body>.p")[4];

            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.nodeValue, "abcdefghij");

            var trs = editor.mode.getContextualActions(
                ["wrap"], "hi", initial, 0);

            var tr = trs[0];
            var data = {node: undefined, element_name: "hi"};
            var caret = editor.fromDataLocation(initial.firstChild, 3);
            editor.setSelectionRange(
                caret.makeRange(caret.make(caret.node, caret.offset + 2))
                    .range);

            tr.execute(data);

            assert.equal(initial.innerHTML,
                         'abc<div class="hi _real">de</div>fghij');
            assert.equal(initial.childNodes.length, 3,
                         "length after first wrap");

            // We can't set this to the full length of the node value
            // on Chrome because Chrome will move the range into the
            // <div> that you see above in the innerHTML test. :-/

            caret = editor.fromDataLocation(
                initial.firstChild,
                initial.firstChild.nodeValue.length - 1);
            editor.setSelectionRange(
                caret.makeRange(editor.fromDataLocation(
                    initial.lastChild,
                    initial.lastChild.nodeValue.length)).range);

            tr.execute(data);

            assert.equal(initial.innerHTML,
                         'ab<div class="hi _real">c<div class="hi _real">' +
                         'de</div>fghij</div>');
            assert.equal(initial.childNodes.length, 2,
                         "length after second wrap");
        });

        it("wraps elements in elements (no limit case)", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var initial = editor.data_root.querySelectorAll(".body>.p")[4];

            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.nodeValue, "abcdefghij");

            var trs = editor.mode.getContextualActions(
                ["wrap"], "hi", initial, 0);

            var tr = trs[0];
            var data = {node: undefined, element_name: "hi"};
            var caret = editor.fromDataLocation(initial.firstChild, 3);
            editor.setSelectionRange(caret.makeRange(
                caret.make(caret.node, caret.offset + 2)).range);

            tr.execute(data);

            assert.equal(initial.childNodes.length, 3,
                         "length after first wrap");
            assert.equal(initial.innerHTML,
                         'abc<div class="hi _real">de</div>fghij');

            caret = editor.fromDataLocation(initial.firstChild, 2);
            editor.setSelectionRange(caret.makeRange(
                editor.fromDataLocation(initial.lastChild, 2)).range);

            tr.execute(data);

            assert.equal(initial.childNodes.length, 3,
                         "length after second wrap");
            assert.equal(initial.innerHTML,
                         'ab<div class="hi _real">c<div class="hi _real">' +
                         'de</div>fg</div>hij');
        });


        it("wraps text in elements (no limit case)", function () {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Text node inside title.
            var initial = editor.data_root.querySelectorAll(".body>.p")[4];

            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.data, "abcdefghij");

            var trs = editor.mode.getContextualActions(
                ["wrap"], "hi", initial, 0);

            var tr = trs[0];
            var data = {node: undefined, element_name: "hi"};
            var caret = editor.fromDataLocation(initial.firstChild, 0);
            editor.setSelectionRange(caret.makeRange(
                caret.make(caret.node, initial.firstChild.length)).range);

            tr.execute(data);

            assert.equal(initial.childNodes.length, 1, "length after wrap");
            assert.equal(initial.innerHTML,
                         '<div class="hi _real">abcdefghij</div>');
        });


        function activateContextMenu(editor) {
            var event = new $.Event("mousedown");
            var title = editor.gui_root.getElementsByClassName("title")[0];
            title.scrollIntoView();
            var rect = title.getBoundingClientRect();
            var left = rect.left + rect.width / 2;
            var top = rect.top + rect.height / 2;
            var scroll_top = editor.my_window.document.body.scrollTop;
            var scroll_left = editor.my_window.document.body.scrollLeft;
            event.which = 3;
            event.pageX = left + scroll_left;
            event.pageY = top + scroll_top;
            event.clientX = left,
            event.clientY = top,
            event.target = editor.gui_root;
            editor.$gui_root.trigger(event);
        }

        it("brings up a contextual menu even when there is no caret",
           function (done) {
            editor.validator._validateUpTo(editor.data_root, -1);
            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            assert.isUndefined(editor.getGUICaret());
            activateContextMenu(editor);
            window.setTimeout(function () {
                assert.isDefined(editor._current_dropdown,
                                 "dropdown defined");
                assert.isDefined(editor.getGUICaret(), "caret defined");
                done();
            }, 100);
        });

        it("does not crash when the user tries to bring up a contextual menu "+
           "when the caret is outside wed",
           function (done) {
            editor.validator._validateUpTo(editor.data_root, -1);

            // Set the range on the first hyperlink in the page.
            var range = rangy.createRange(editor.my_window.document);
            range.selectNode(editor.my_window.document
                             .getElementsByTagName("div")[0]);
            rangy.getSelection(editor.my_window).setSingleRange(range);
            assert.isUndefined(editor.getGUICaret());
                activateContextMenu(editor);
            window.setTimeout(function () {
                    assert.isDefined(editor._current_dropdown);
                done();
            }, 1);
        });

        it("brings up a contextual menu when there is a caret",
           function (done) {
            editor.validator._validateUpTo(editor.data_root, -1);

            var initial = editor.gui_root.getElementsByClassName("title")[0]
                .childNodes[1];
            editor.setGUICaret(initial, 0);

            activateContextMenu(editor);
            window.setTimeout(function () {
                assert.isDefined(editor._current_dropdown);
                done();
            }, 1);
        });

        it("handles pasting simple text", function () {
            var initial = editor.data_root.querySelector(".body>.p").firstChild;
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
            assert.equal(initial.nodeValue, "abcdef" + initial_value);
            dataCaretCheck(editor, initial, 6, "final position");
        });

        it("handles pasting structured text", function () {
            var p = editor.data_root.querySelector(".body>.p");
            var initial = p.firstChild;
            editor.setDataCaret(initial, 0);
            var initial_value = p.innerHTML;

            // Synthetic event
            var event = new $.Event("paste");
            // Provide a skeleton of clipboard data
            event.originalEvent = {
                clipboardData: {
                    types: ["text/html", "text/plain"],
                    getData: function (type) {
                        return p.innerHTML;
                    }
                }
            };
            editor.$gui_root.trigger(event);
            assert.equal(p.innerHTML, initial_value + initial_value);
            dataCaretCheck(editor, p.childNodes[2], 6, "final position");
        });

        it("handles pasting structured text: invalid, decline pasting as text",
           function (done) {
            var p = editor.data_root.querySelector(".body>.p");
            var initial = p.firstChild;
            editor.setDataCaret(initial, 0);
            var initial_value = p.innerHTML;

            // Synthetic event
            var event = new $.Event("paste");
            // Provide a skeleton of clipboard data
            event.originalEvent = {
                clipboardData: {
                    types: ["text/html", "text/plain"],
                    getData: function (type) {
                        return p.outerHTML;
                    }
                }
            };
            var $top = editor._paste_modal.getTopLevel();
            $top.one("shown.bs.modal", function () {
                // Wait until visible to add this handler so that it is
                // run after the callback that wed sets on the modal.
                $top.one("hidden.bs.modal",
                         function () {
                    assert.equal(p.innerHTML, initial_value);
                    dataCaretCheck(editor, initial, 0, "final position");
                    done();
                });
            });
            editor.$gui_root.trigger(event);
            // This clicks "No".
            editor._paste_modal._$footer.find(".btn")[1].click();
        });

        it("handles pasting structured text: invalid, accept pasting as text",
           function (done) {
            var p = editor.data_root.querySelector(".body>.p");
            var initial = p.firstChild;
            editor.setDataCaret(initial, 0);
            var initial_value = p.innerHTML;
            var initial_outer = p.outerHTML;
            var x = document.createElement("div");
            x.textContent = initial_outer;
            var initial_outer_from_text_to_html = x.innerHTML;

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
            var $top = editor._paste_modal.getTopLevel();
            $top.one("shown.bs.modal", function () {
                // Wait until visible to add this handler so that it is
                // run after the callback that wed sets on the modal.
                $top.one("hidden.bs.modal", function () {
                    assert.equal(p.innerHTML,
                                 initial_outer_from_text_to_html +
                                 initial_value);
                    dataCaretCheck(editor, p.firstChild,
                                   initial_outer.length, "final position");
                    done();
                });
            });
            editor.$gui_root.trigger(event);
            // This clicks "Yes".
            editor._paste_modal._$footer.find(".btn-primary")[0].click();
        });

        it("handles cutting a well formed selection", function (done) {
            var p = editor.data_root.querySelector(".body>.p");
            var gui_start = editor.fromDataLocation(p.firstChild, 4);
            editor.setGUICaret(gui_start);
            var range = gui_start.makeRange(
                editor.fromDataLocation(p.childNodes[2], 5)).range;
            rangy.getSelection(editor.my_window).setSingleRange(range);

            // Synthetic event
            var event = new $.Event("cut");
            editor.$gui_root.trigger(event);
            window.setTimeout(function () {
                assert.equal(p.innerHTML, "Blah.");
                done();
            }, 1);
        });

        it("handles cutting a bad selection", function (done) {
            var p = editor.data_root.querySelector(".body>.p");
            var original_inner_html = p.innerHTML;
            // Start caret is inside the term element.
            var gui_start = editor.fromDataLocation(p.childNodes[1].firstChild, 1);
            var gui_end = editor.fromDataLocation(p.childNodes[2], 5);
            editor.setGUICaret(gui_end);
            var range = gui_start.makeRange(gui_end).range;

            rangy.getSelection(editor.my_window).setSingleRange(range);
            assert.equal(p.innerHTML, original_inner_html);
            var $top = editor.straddling_modal.getTopLevel();
            $top.one("shown.bs.modal", function () {
                // Wait until visible to add this handler so that it is
                // run after the callback that wed sets on the modal.
                $top.one("hidden.bs.modal",
                         function () {
                    assert.equal(p.innerHTML, original_inner_html);
                    caretCheck(editor, gui_end.node, gui_end.offset,
                               "final position");
                    done();
                });
            });
            // Synthetic event
            var event = new $.Event("cut");
            editor.$gui_root.trigger(event);
            // This clicks dismisses the modal
            editor.straddling_modal._$footer.find(".btn-primary")[0].click();
        });

        it("handles properly caret position for words that are too " +
           "long to word wrap", function () {
            var p = editor.data_root.getElementsByClassName("p")[0];
            editor.setDataCaret(p, 0);
            editor.type("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
                        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
                        "AAAAAAAAAAAAA");
            editor.setDataCaret(p, 0);
            var range = editor.my_window.document.createRange();
            var gui_caret = editor.fromDataLocation(p.firstChild, 0);
            range.selectNode(gui_caret.node);
            var rect = range.getBoundingClientRect();
            // The caret should not be above the rectangle around the
            // unbreakable text.
            assert.isTrue(Math.round(rect.top) <=
                          Math.round(editor._$fake_caret.offset().top));
        });

        it("handles properly caret position for elements that span lines",
           function () {
            var p = editor.data_root.querySelectorAll(".body>.p")[5];
            var text_loc = editor.fromDataLocation(p.lastChild, 2);

            // Check that we are testing what we want to test. The end
            // label for the hi element must be on the next line.
            var his = text_loc.node.parentNode.getElementsByClassName("hi");
            var hi = his[his.length - 1];
            var $start_l = $(firstGUI(hi));
            var $end_l = $(lastGUI(hi));
            hi.scrollIntoView(true);
            assert.isTrue($end_l.offset().top > $start_l.offset().top +
                          $start_l.height(),
                          "PRECONDITION FAILED: please update your test " +
                          "case so that the end label of the hi element is " +
                          "on a line under the line that has the start label " +
                          "of this same element");

            var event = new $.Event("mousedown");
            event.target = text_loc.node;
            var rr = text_loc.makeRange(text_loc.make(text_loc.node, 3));
            var rect = rr.range.nativeRange.getBoundingClientRect();
            event.pageX = rect.left;
            event.pageY = ((rect.top + rect.bottom) / 2);
            event.clientX = rect.left;
            event.clientY = ((rect.top + rect.bottom) / 2);
            event.which = 1; // First mouse button.
            editor.$gui_root.trigger(event);
            caretCheck(editor, text_loc.node, text_loc.offset,
                       "the caret should be in the text node");
        });

        // This test only checks that the editor does not crash.
        it("autofills in the midst of text", function () {
            var p = editor.data_root.querySelector(".body>.p");
            assert.isTrue(p.firstChild.nodeType === Node.TEXT_NODE,
                          "we should set our caret in a text node");
            editor.setDataCaret(p.firstChild, 3);
            var trs = editor.mode.getContextualActions(
                ["insert"], "biblFull", p.firstChild, 0);

            var tr = trs[0];
            var data = {node: undefined, element_name: "biblFull"};
            tr.execute(data);
        });

        describe("interacts with the server:", function () {
            before(function () {
                src_stack.unshift("../../test-files/wed_test_data" +
                                  "/server_interaction_converted.xml");
            });

            after(function () {
                src_stack.shift();
            });

            beforeEach(function (done) {
                global.reset(done);
            });

            it("saves", function (done) {
                editor.addEventListener("saved", function () {
                    $.get("/build/ajax/save.txt", function (data) {
                        var obj = {
                            command: 'save',
                            version: wed.version,
                            data: '<div xmlns="http://www.w3.org/1999/xhtml" \
data-wed-xmlns="http://www.tei-c.org/ns/1.0" class="TEI _real">\
<div class="teiHeader _real"><div class="fileDesc _real">\
<div class="titleStmt _real"><div class="title _real">abcd</div>\
</div><div class="publicationStmt _real"><div class="p _real">\
</div></div><div class="sourceDesc _real"><div class="p _real"></div>\
</div></div></div><div class="text _real"><div class="body _real">\
<div class="p _real">Blah blah <div class="term _real">blah</div> blah.</div>\
<div class="p _real"><div class="term _real">blah</div></div></div></div></div>'
                        };
                        var expected = "\n***\n" + JSON.stringify(obj);
                        assert.equal(data, expected);
                        done();
                    });
                });
                editor.type(key_constants.CTRLEQ_S);
            });

            it("does not autosave if not modified", function (done) {
                editor.addEventListener("autosaved", function () {
                    throw new Error("autosaved!");
                });
                editor._saver.setAutosaveInterval(50);
                setTimeout(done, 500);
            });

            it("autosaves when the document is modified", function (done) {
                // We're testing that autosave is not called again
                // after the first time.
                var autosaved = false;
                editor.addEventListener("autosaved", function () {
                    if (autosaved)
                        throw new Error("autosaved more than once");
                    autosaved = true;
                    $.get("/build/ajax/save.txt", function (data) {
                        var obj = {
                            command: 'autosave',
                            version: wed.version,
                            data: '<div xmlns="http://www.w3.org/1999/xhtml" \
data-wed-xmlns="http://www.tei-c.org/ns/1.0" class="TEI _real">\
<div class="teiHeader _real"><div class="fileDesc _real">\
<div class="titleStmt _real"><div class="title _real">abcd</div>\
</div><div class="publicationStmt _real"></div><div class="sourceDesc _real">\
<div class="p _real"></div>\
</div></div></div><div class="text _real"><div class="body _real">\
<div class="p _real">Blah blah <div class="term _real">blah</div> blah.</div>\
<div class="p _real"><div class="term _real">blah</div></div></div></div></div>'
                        };
                        var expected = "\n***\n" + JSON.stringify(obj);
                        assert.equal(data, expected);
                    });
                });
                editor.data_updater.removeNode(
                    editor.data_root.querySelector(".p._real"));
                var interval = 50;
                editor._saver.setAutosaveInterval(interval);
                // This leaves ample time.
                setTimeout(function () {
                    assert.isTrue(autosaved, "should have been saved");
                    done();
                }, interval * 4);
            });

            it("autosaves when the document is modified after a " +
               "first autosave timeout that did nothing",
               function (done) {
                // We're testing that autosave is not called again
                // after the first time.
                var autosaved = false;
                editor.addEventListener("autosaved", function () {
                    if (autosaved)
                        throw new Error("autosaved more than once");
                    autosaved = true;
                    $.get("/build/ajax/save.txt", function (data) {
                        var obj = {
                            command: 'autosave',
                            version: wed.version,
                            data: '<div xmlns="http://www.w3.org/1999/xhtml" \
data-wed-xmlns="http://www.tei-c.org/ns/1.0" class="TEI _real">\
<div class="teiHeader _real"><div class="fileDesc _real">\
<div class="titleStmt _real"><div class="title _real">abcd</div>\
</div><div class="publicationStmt _real"></div><div class="sourceDesc _real">\
<div class="p _real"></div>\
</div></div></div><div class="text _real"><div class="body _real">\
<div class="p _real">Blah blah <div class="term _real">blah</div> blah.</div>\
<div class="p _real"><div class="term _real">blah</div></div></div></div></div>'
                        };
                        var expected = "\n***\n" + JSON.stringify(obj);
                        assert.equal(data, expected);
                    });
                });
                var interval = 50;
                editor._saver.setAutosaveInterval(interval);
                setTimeout(function () {
                    assert.isFalse(autosaved, "should not have been saved yet");
                    editor.data_updater.removeNode(
                        editor.data_root.querySelector(".p._real"));
                }, interval * 2);
                // This leaves ample time.
                setTimeout(function () {
                    assert.isTrue(autosaved, "should have been saved");
                    done();
                }, interval * 4);
            });

        });



        describe("fails as needed and recovers:", function () {
            before(function () {
                src_stack.unshift("../../test-files/wed_test_data/" +
                                  "server_interaction_converted.xml");
            });

            after(function () {
                src_stack.shift();
            });

            beforeEach(function (done) {
                global.reset(done);
            });

            it("tells the user to reload when save fails hard",
               function (done) {
                function doit() {
                    var $modal = onerror.__test.$modal;
                    $modal.on('shown.bs.modal', function () {
                        // Prevent a reload.
                        onerror.__test.reset();
                        done();
                    });

                    editor.type(key_constants.CTRLEQ_S);
                }

                global.no_response_on_save(doit);
            });

            it("warns of disconnection when the server returns a bad status",
               function (done) {
                function doit() {
                    var $modal = editor._disconnect_modal.getTopLevel();
                    $modal.on('shown.bs.modal', function () {
                        editor.addEventListener("saved", function () {
                            // Was saved on retry!

                            // This allows us to let the whole save
                            // process run its course before we
                            // declare it done.
                            setTimeout(done, 0);
                        });
                        // Reset so that the next save works.
                        global.reset(function () {
                            // This triggers a retry.
                            $modal.modal('hide');
                        });
                    });

                    editor.type(key_constants.CTRLEQ_S);
                }

                global.fail_on_save(doit);

            });

            it("brings up a modal when the document was edited by someone "+
               "else",
               function (done) {
                function doit() {
                    var $modal = editor._edited_by_other_modal.getTopLevel();
                    $modal.on('shown.bs.modal', function () {
                        // Prevent a reload.
                        $modal.off('hidden.bs.modal.modal');
                        $modal.modal('hide');
                        done();
                    });

                    editor.type(key_constants.CTRLEQ_S);
                }

                global.precondition_fail_on_save(doit);

            });

            it("brings up a modal when there is a new version of the editor",
               function (done) {
                function doit() {
                    var $modal = editor._too_old_modal.getTopLevel();
                    $modal.on('shown.bs.modal', function () {
                        // Prevent a reload.
                        $modal.off('hidden.bs.modal.modal');
                        $modal.modal('hide');
                        done();
                    });

                    editor.type(key_constants.CTRLEQ_S);
                }

                global.too_old_on_save(doit);

            });

            it("does not attempt recovery when save fails hard",
               function (done) {
                function doit() {
                    var $modal = onerror.__test.$modal;
                    $modal.on('shown.bs.modal', function () {
                        // The data was saved even though the server
                        // replied with an HTTP error code.
                        $.get("/build/ajax/save.txt", function (data) {
                            var obj = {
                                command: 'save',
                                version: wed.version,
                                data:
'<div xmlns="http://www.w3.org/1999/xhtml" \
data-wed-xmlns="http://www.tei-c.org/ns/1.0" class="TEI _real">\
<div class="teiHeader _real"><div class="fileDesc _real">\
<div class="titleStmt _real"><div class="title _real">abcd</div>\
</div><div class="publicationStmt _real"><div class="p _real"></div>\
</div><div class="sourceDesc _real"><div class="p _real"></div></div>\
</div></div><div class="text _real"><div class="body _real">\
<div class="p _real">Blah blah <div class="term _real">blah</div> blah.</div>\
<div class="p _real"><div class="term _real">blah</div></div></div></div></div>'
                            };
                            var expected = "\n***\n" + JSON.stringify(obj);
                            assert.equal(data, expected);
                            // Prevent a reload.
                            onerror.__test.reset();
                            done();
                        });
                    });

                    editor.type(key_constants.CTRLEQ_S);
                }

                global.no_response_on_save(doit);

            });

            it("attempts recovery on uncaught exception", function (done) {
                // We can't just raise an exception because mocha will
                // intercept it and it will never get to the onerror
                // handler. If we raise the error in a timeout, it will go
                // straight to onerror.

                window.setTimeout(function () {
                    window.setTimeout(function () {
                        $.get("/build/ajax/save.txt", function (data) {
                            var obj = {
                                command: 'recover',
                                version: wed.version,
                                data:
'<div xmlns="http://www.w3.org/1999/xhtml" \
data-wed-xmlns="http://www.tei-c.org/ns/1.0" class="TEI _real">\
<div class="teiHeader _real"><div class="fileDesc _real">\
<div class="titleStmt _real"><div class="title _real">abcd</div></div>\
<div class="publicationStmt _real"><div class="p _real"></div></div>\
<div class="sourceDesc _real"><div class="p _real"></div></div></div></div>\
<div class="text _real"><div class="body _real"><div class="p _real">Blah blah \
<div class="term _real">blah</div> blah.</div><div class="p _real">\
<div class="term _real">blah</div></div></div></div></div>'
                            };
                            var expected = "\n***\n" + JSON.stringify(obj);
                            assert.equal(data, expected);
                            onerror.__test.reset();
                            done();
                        });
                    }, 500);
                    throw new Error("I'm failing!");
                }, 0);
            });
        });
    });

    describe("(not state-sensitive)", function () {
        var editor, ps;
        before(function (done) {
            require(["requirejs/text!" + src_stack[0]], function(data) {
                wedroot.innerHTML = data;
                editor = new wed.Editor();
                editor.addEventListener("initialized", function () {
                    editor.validator._validateUpTo(editor.data_root, -1);
                    ps = editor.gui_root.querySelectorAll(".body>.p");
                    done();
                });
                editor.init(wedroot, options);
            });
        });

        after(function () {
            if (editor)
                editor.destroy();
            editor = undefined;
            assert.isFalse(onerror.__test.is_terminating(),
                           "test caused an unhandled exception to occur");
            // We don't reload our page so we need to do this.
            onerror.__test.reset();
        });

        afterEach(function () {
            assert.isFalse(onerror.__test.is_terminating(),
                           "test caused an unhandled exception to occur");
            // We don't reload our page so we need to do this.
            onerror.__test.reset();
        });

        describe("setNavigationList", function () {
            it("makes the navigation list appear", function () {
                assert.equal(editor._$navigation_panel.css("display"), "none",
                            "the list is not displayed");
                editor.setNavigationList("foo");
                assert.equal(editor._$navigation_panel.css("display"), "block",
                            "the list is displayed");
            });
        });

        function assertIsTextPhantom(node) {
            var cl;
            assert.isTrue(node && (cl = node.classList) &&
                          cl.contains("_text") &&
                          cl.contains("_phantom"));
        }

        describe("moveCaretRight", function () {
            it("works even if there is no caret defined", function () {
                editor._blur();
                assert.equal(editor.getGUICaret(), undefined, "no caret");
                editor.moveCaretRight();
                assert.equal(editor.getGUICaret(), undefined, "no caret");
            });

            it("moves right into gui elements",
               function () {
                // The 6th paragraph contains a test case.
                var initial =
                    editor.gui_root.querySelectorAll(".body>.p")[5]
                    .childNodes[1];
                assert.equal(initial.nodeType, Node.TEXT_NODE);
                editor.setGUICaret(initial, initial.length);
                caretCheck(editor, initial, initial.length, "initial");
                editor.moveCaretRight();
                var first_gui = firstGUI(initial.nextElementSibling);
                // It is now located inside the text inside
                // the label.
                var element_name =
                    first_gui.getElementsByClassName("_element_name")[0];
                caretCheck(editor, element_name, 0, "moved once");
                assert.equal(element_name.textContent, "hi");
            });


            it("moves into the first attribute of a start label",
               function () {
                // Start label of last paragraph...
                var first_gui = firstGUI(ps[7]);
                var initial = first_gui.parentNode;
                var offset = _indexOf.call(initial.childNodes, first_gui);
                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");
                editor.moveCaretRight();
                var first_gui = firstGUI(initial);
                // It is now located inside the text inside
                // the label which marks the start of the TEI
                // element.
                caretCheck(
                    editor,
                    first_gui.getElementsByClassName("_element_name")[0], 0,
                    "moved once");

                editor.moveCaretRight();
                caretCheck(
                    editor,
                    first_gui.getElementsByClassName("_attribute_value")[0]
                        .firstChild, 0,
                    "moved twice");

                editor.moveCaretRight();
                caretCheck(
                    editor,
                    first_gui.getElementsByClassName("_attribute_value")[0]
                        .firstChild, 1,
                    "moved thrice");
            });

            it("moves into empty attributes",
               function () {
                // Start label of last paragraph...
                var first_gui = firstGUI(ps[9]);
                var initial = first_gui.parentNode;
                var offset = _indexOf.call(initial.childNodes, first_gui);
                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");
                editor.moveCaretRight();
                // It is now located inside the text inside
                // the label which marks the start of the TEI
                // element.
                caretCheck(
                    editor,
                    first_gui.getElementsByClassName("_element_name")[0], 0,
                    "moved once");

                editor.moveCaretRight();
                caretCheck(
                    editor,
                    first_gui.getElementsByClassName("_attribute_value")[0]
                        .firstChild, 0,
                    "moved twice");
            });

            it("moves from attribute to attribute",
               function () {
                // First attribute of the start label of last paragraph...
                var first_gui = firstGUI(ps[7]);
                var initial =
                    first_gui.getElementsByClassName("_attribute_value")[0]
                    .firstChild;
                editor.setGUICaret(initial, initial.length);
                caretCheck(editor, initial, initial.length, "initial");
                editor.moveCaretRight();
                caretCheck(
                    editor,
                    first_gui.getElementsByClassName("_attribute_value")[1]
                        .firstChild, 0, "moved");
            });

            it("moves out of attributes", function () {
                // First attribute of the start label of last paragraph...
                var first_gui = firstGUI(ps[7]);
                var attributes =
                    first_gui.getElementsByClassName("_attribute_value");
                var initial = attributes[attributes.length - 1].firstChild;
                editor.setGUICaret(initial, initial.length);
                caretCheck(editor, initial, initial.length, "initial");
                editor.moveCaretRight();
                caretCheck(editor, first_gui.nextSibling, 0, "moved");
            });

            it("moves right into text",
               function () {
                var initial = editor.gui_root
                    .getElementsByClassName("title")[0];
                editor.setGUICaret(initial, 0);
                caretCheck(editor, initial, 0, "initial");
                editor.moveCaretRight();
                // It is now located inside the text inside
                // the label which marks the start of the TEI
                // element.
                caretCheck(
                    editor,
                    firstGUI(initial).
                        getElementsByClassName("_element_name")[0],
                    0, "moved once");
                editor.moveCaretRight();
                // It is now inside the text
                var text_node = domutil.childByClass(initial, "_gui")
                    .nextSibling;
                caretCheck(editor, text_node, 0, "moved 2 times");
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
                caretCheck(
                    editor,
                    lastGUI(initial)
                        .getElementsByClassName("_element_name")[0],
                    0, "moved 7 times");
            });

            it("moves right from text to text", function () {
                var term = editor.gui_root.querySelector(".body>.p>.term");
                var initial = term.previousSibling;
                // Make sure we are on the right element.
                assert.equal(initial.nodeType, Node.TEXT_NODE);
                assert.equal(initial.nodeValue, "Blah blah ");

                editor.setGUICaret(initial, initial.nodeValue.length - 1);
                caretCheck(editor, initial,
                           initial.nodeValue.length - 1, "initial");

                editor.moveCaretRight();
                caretCheck(editor, initial, initial.nodeValue.length,
                           "moved once");

                editor.moveCaretRight();
                // The first child node is an invisible element label.
                caretCheck(editor, term.childNodes[1], 0, "moved twice");
            });

            it("moves right out of elements",
               function () {
                var title = editor.gui_root.getElementsByClassName("title")[0];
                // Text node inside title.
                var initial = title.childNodes[1];
                editor.setGUICaret(initial, initial.nodeValue.length);
                caretCheck(editor, initial, initial.nodeValue.length,
                           "initial");
                editor.moveCaretRight();
                // It is now inside the final gui element.
                caretCheck(editor, lastGUI(initial.parentNode)
                           .getElementsByClassName("_element_name")[0],
                           0, "moved once");
                editor.moveCaretRight();
                // It is now before the gui element at end of
                // the title's parent.
                var last_gui = lastGUI(title.parentNode);
                caretCheck(editor, last_gui.parentNode,
                           last_gui.parentNode.childNodes.length - 1,
                           "moved twice");
            });

            it("moves past the initial nodes around editable contents",
               function () {
                var child = editor.gui_root.getElementsByClassName("ref")[0];
                var initial = child.parentNode;
                var offset = _indexOf.call(initial.childNodes, child);
                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");

                editor.moveCaretRight();

                var final_offset = 2;
                var caret_node = child.childNodes[final_offset];
                assertIsTextPhantom(caret_node);
                assertIsTextPhantom(caret_node.previousSibling);
                caretCheck(editor, child, final_offset, "moved once");
            });

            it("moves out of an element when past the last node around " +
               "editable contents", function () {

                var initial = editor.gui_root.getElementsByClassName("ref")[0];
                // Check that what we are expecting to be around the caret
                // is correct.
                var offset = 2;
                var caret_node = initial.childNodes[offset];
                assertIsTextPhantom(caret_node);
                assertIsTextPhantom(caret_node.previousSibling);

                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");

                editor.moveCaretRight();

                caretCheck(editor, initial.parentNode,
                           _indexOf.call(initial.parentNode.childNodes,
                                         initial) + 1, "moved once");
            });

            it("does not move when at end of document", function () {
                var initial = lastGUI(
                    domutil.childByClass(editor.gui_root, "TEI"));
                editor.setGUICaret(initial, 0);
                caretCheck(editor, initial, 0, "initial");
                editor.moveCaretRight();
                // Same position
                caretCheck(editor, initial, 0, "moved once");
            });
        });

        describe("moveCaretLeft", function () {
            it("works even if there is no caret defined", function () {
                editor._blur();
                assert.equal(editor.getGUICaret(), undefined, "no caret");
                editor.moveCaretLeft();
                assert.equal(editor.getGUICaret(), undefined, "no caret");
            });

            it("moves left into gui elements",
               function () {
                var initial = editor.gui_root.firstChild;
                var offset = initial.childNodes.length;
                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");
                var last_gui =  lastGUI(initial);

                editor.moveCaretLeft();
                // It is now located inside the text inside
                // the label which marks the end of the TEI
                // element.
                caretCheck(editor,
                           last_gui.getElementsByClassName("_element_name")[0],
                           0, "moved once");

                editor.moveCaretLeft();
                caretCheck(editor, last_gui.parentNode,
                           last_gui.parentNode.childNodes.length - 1,
                           "moved twice");

                editor.moveCaretLeft();
                // It is now in the gui element of the 1st
                // child.
                var texts = initial.getElementsByClassName("text");
                caretCheck(editor, lastGUI(texts[texts.length - 1])
                           .getElementsByClassName("_element_name")[0],
                           0, "moved 3 times");
            });

            it("moves into the last attribute of a start label",
               function () {
                // Start label of last paragraph...
                var first_gui = firstGUI(ps[7]);
                var initial = first_gui.parentNode;
                var offset = _indexOf.call(initial.childNodes, first_gui) + 1;
                // Set the caret just after the start label
                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");

                var attrs =
                    first_gui.getElementsByClassName("_attribute_value");
                var last_attr_text = attrs[attrs.length - 1].firstChild;
                editor.moveCaretLeft();
                caretCheck(editor, last_attr_text, last_attr_text.length,
                           "moved once");

                editor.moveCaretLeft();
                caretCheck(editor, last_attr_text, last_attr_text.length - 1,
                           "moved twice");
            });

            it("moves into empty attributes",
               function () {
                // Start label of last paragraph...
                var first_gui = firstGUI(ps[9]);
                var initial = first_gui.parentNode;
                var offset = _indexOf.call(initial.childNodes, first_gui) + 1;
                // Set the caret just after the start label
                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");

                var attrs =
                    first_gui.getElementsByClassName("_attribute_value");
                var last_attr = attrs[attrs.length - 1];
                editor.moveCaretLeft();
                caretCheck(editor, last_attr.firstChild, 0, "moved once");
            });

            it("moves from attribute to attribute",
               function () {
                // Start label of last paragraph...
                var first_gui = firstGUI(ps[7]);
                var attrs =
                    first_gui.getElementsByClassName("_attribute_value");
                var initial = attrs[attrs.length - 1].firstChild;
                // Set the caret at the start of the last attribute.
                editor.setGUICaret(initial, 0);
                caretCheck(editor, initial, 0, "initial");

                editor.moveCaretLeft();
                var next_to_last_attr_text = attrs[attrs.length - 2].firstChild;
                caretCheck(editor, next_to_last_attr_text,
                           next_to_last_attr_text.length,
                           "moved once");
            });

            it("moves out of attributes",
               function () {
                // Start label of last paragraph...
                var first_gui = firstGUI(ps[7]);
                var attrs =
                    first_gui.getElementsByClassName("_attribute_value");
                // Set the caret at the start of the first attribute.
                var initial = attrs[0].firstChild;
                editor.setGUICaret(initial, 0);
                caretCheck(editor, initial, 0, "initial");

                editor.moveCaretLeft();
                caretCheck(editor,
                           first_gui.getElementsByClassName("_element_name")[0],
                           0,
                           "moved once");
            });

            it("moves out of a start label",
               function () {
                var p = ps[7];
                // Start label of last paragraph...
                var first_gui = firstGUI(p);
                // Set the caret at the start of the first attribute.
                var initial =
                    first_gui.getElementsByClassName("_element_name")[0];
                editor.setGUICaret(initial, 0);
                caretCheck(editor, initial, 0, "initial");

                var parent = p.parentNode;
                editor.moveCaretLeft();
                caretCheck(editor,
                           parent,
                           _indexOf.call(parent.childNodes, p),
                           "moved once");
            });

            it("moves left into text", function () {
                var last_gui =
                    lastGUI(editor.gui_root.getElementsByClassName("title")[0]);
                var initial =
                    last_gui.getElementsByClassName("_element_name")[0];
                editor.setGUICaret(initial, 0);
                caretCheck(editor, initial, 0, "initial");
                editor.moveCaretLeft();
                // It is now inside the text
                var text_node = last_gui.previousSibling;
                var offset = text_node.length;
                caretCheck(editor, text_node, offset, "moved once");
                editor.moveCaretLeft();
                // move through text
                offset--;
                caretCheck(editor, text_node, offset, "moved twice");
                editor.moveCaretLeft();
                editor.moveCaretLeft();
                editor.moveCaretLeft();
                caretCheck(editor, text_node, 0, "moved 5 times");
                editor.moveCaretLeft();
                // It is now inside the first gui element.
                caretCheck(editor, firstGUI(editor.gui_root
                                            .getElementsByClassName("title")[0])
                           .getElementsByClassName("_element_name")[0],
                           0, "moved 6 times");
            });

            it("moves left out of elements", function () {
                var title = editor.gui_root.getElementsByClassName("title")[0];
                var initial = firstGUI(title);
                editor.setGUICaret(initial, 0);
                caretCheck(editor, initial, 0, "initial");
                editor.moveCaretLeft();
                // It is now after the gui element at start of
                // the title's parent.
                var first_gui = firstGUI(title.parentNode);

                caretCheck(editor, first_gui.parentNode, 1, "moved once");
            });

            it("moves left from text to text", function () {
                var term = editor.gui_root.querySelector(".body>.p>.term");
                var initial = term.nextSibling;
                // Make sure we are on the right element.
                assert.equal(initial.nodeType, Node.TEXT_NODE);
                assert.equal(initial.nodeValue, " blah.");

                editor.setGUICaret(initial, 1);
                caretCheck(editor, initial, 1, "initial");

                editor.moveCaretLeft();
                caretCheck(editor, initial, 0, "moved once");

                editor.moveCaretLeft();
                caretCheck(editor, term.childNodes[1],
                           term.childNodes[1].nodeValue.length,
                           "moved twice");
            });

            it("moves past the final nodes around editable contents",
               function () {
                var child = editor.gui_root.getElementsByClassName("ref")[0];
                var initial = child.parentNode;
                var offset = _indexOf.call(initial.childNodes, child) + 1;
                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");

                editor.moveCaretLeft();

                var final_offset = 2;
                var caret_node = child.childNodes[final_offset];
                assertIsTextPhantom(caret_node);
                assertIsTextPhantom(caret_node.previousSibling);
                caretCheck(editor, child, final_offset, "moved once");
            });

            it("moves out of an element when past the first node around " +
               "editable contents",
               function () {
                var initial = editor.gui_root.getElementsByClassName("ref")[0];
                // Check that what we are expecting to be around the caret
                // is correct.
                var offset = 2;
                var caret_node = initial.childNodes[offset];
                assertIsTextPhantom(caret_node);
                assertIsTextPhantom(caret_node.previousSibling);

                editor.setGUICaret(initial, offset);
                caretCheck(editor, initial, offset, "initial");

                editor.moveCaretLeft();

                caretCheck(editor, initial.parentNode,
                           _indexOf.call(initial.parentNode.childNodes,
                                         initial), "moved once");
            });


            it("does not move when at start of document",
               function () {
                var initial = firstGUI(domutil.childByClass(editor.gui_root,
                                                            "TEI"));
                editor.setGUICaret(initial, 0);
                caretCheck(editor, initial, 0, "initial");
                editor.moveCaretLeft();
                // Same position
                caretCheck(editor, initial, 0, "moved once");
            });
        });

        describe("the location bar", function () {
            it("ignores placeholders", function () {
                var ph = editor.gui_root
                    .getElementsByClassName("_placeholder")[0];
                editor.setGUICaret(ph, 0);
                assert.equal(
                    // Normalize all spaces to a regular space with
                    // ``replace``.
                    editor._wed_location_bar.textContent.replace(/\s+/g, ' '),
                    " TEI / teiHeader / fileDesc / publicationStmt / p ");
            });

            it("ignores phantom parents", function () {
                var p = editor.gui_root.querySelector(".ref>._text._phantom");
                // We are cheating here. Instead of creating a mode
                // what would put children elements inside of a
                // phantom element we manually add a child.
                p.innerHTML = "<span>foo</span>" + p.innerHTML;
                var child = p.firstChild;

                editor.setGUICaret(child, 0);
                assert.equal(
                    // Normalize all spaces to a regular space with
                    // ``replace``.
                    editor._wed_location_bar.textContent.replace(/\s+/g, ' '),
                    " TEI / text / body / p / ref ");
            });
        });
    });
});

});

//  LocalWords:  rng wedframe RequireJS dropdown Ctrl Mangalam MPL
//  LocalWords:  Dubeau previousSibling nextSibling abcd jQuery xmlns
//  LocalWords:  sourceDesc publicationStmt titleStmt fileDesc txt
//  LocalWords:  ajax xml moveCaretRight moveCaretLeft teiHeader html
//  LocalWords:  innerHTML nodeValue seekCaret nodeToPath pathToNode
//  LocalWords:  mouseup mousedown unhandled requirejs btn gui metas
//  LocalWords:  wedroot tei domutil onerror jquery chai
