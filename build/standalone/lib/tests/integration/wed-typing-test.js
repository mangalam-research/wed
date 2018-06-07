var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "wed/domtypeguards", "wed/domutil", "wed/key", "wed/key-constants", "../base-config", "../wed-test-util"], function (require, exports, domtypeguards_1, domutil_1, key, keyConstants, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    key = __importStar(key);
    keyConstants = __importStar(keyConstants);
    globalConfig = __importStar(globalConfig);
    var assert = chai.assert;
    describe("wed typing:", function () {
        var setup;
        var editor;
        var caretManager;
        var ps;
        var guiRoot;
        var titles;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
                guiRoot = editor.guiRoot;
                ps = guiRoot.querySelectorAll(".body .p");
                titles = guiRoot.getElementsByClassName("title");
            });
        });
        afterEach(function () {
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
            // tslint:disable-next-line:no-any
            caretManager = undefined;
        });
        it("typing BACKSPACE without caret", function () {
            assert.equal(caretManager.caret, undefined, "no caret");
            editor.type(keyConstants.BACKSPACE);
        });
        it("typing DELETE without caret", function () {
            assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
            editor.type(keyConstants.DELETE);
        });
        it("typing text", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            var parent = initial.parentNode;
            caretManager.setCaret(initial, 0);
            // There was a version of wed which would fail this test. The fake caret
            // would be inserted inside the text node, which would throw off the
            // nodeToPath/pathToNode calculations.
            editor.type("1");
            assert.equal(initial.nodeValue, "1abcd");
            assert.equal(parent.childNodes.length, 3);
            editor.type("1");
            assert.equal(initial.nodeValue, "11abcd");
            assert.equal(parent.childNodes.length, 3);
            // This is where wed used to fail.
            editor.type("1");
            assert.equal(initial.nodeValue, "111abcd");
            assert.equal(parent.childNodes.length, 3);
        });
        it("typing text when caret is adjacent to text (before text)", function () {
            // Text node inside title.
            var initial = editor.dataRoot.querySelectorAll("body>p")[3];
            var his = initial.getElementsByTagName("hi");
            var hi = his[his.length - 1];
            // We put the caret just after the last <hi>, which means it is just before
            // the last text node.
            caretManager.setCaret(initial, domutil_1.indexOf(initial.childNodes, hi) + 1);
            var initialLength = initial.childNodes.length;
            editor.type(" ");
            assert.equal(initial.lastChild.textContent, " c");
            assert.equal(initial.childNodes.length, initialLength);
        });
        it("typing text when caret is adjacent to text (after text)", function () {
            // Text node inside title.
            var initial = editor.dataRoot.querySelectorAll("body>p")[3];
            // We put the caret just after the last child, a text node.
            caretManager.setCaret(initial, initial.childNodes.length);
            var initialLength = initial.childNodes.length;
            editor.type(" ");
            assert.equal(initial.lastChild.textContent, "c ");
            assert.equal(initial.childNodes.length, initialLength);
        });
        it("typing longer than the length of a text undo", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            var parent = initial.parentNode;
            caretManager.setCaret(initial, 0);
            var text = 
            // tslint:disable-next-line:no-any prefer-array-literal
            new Array(editor.textUndoMaxLength + 1).join("a");
            editor.type(text);
            assert.equal(initial.nodeValue, text + "abcd");
            assert.equal(parent.childNodes.length, 3);
        });
        it("typing text after an element", function () {
            var initial = editor.dataRoot.querySelectorAll("body>p")[1];
            caretManager.setCaret(initial, 1);
            editor.type(" ");
            assert.equal(initial.childNodes.length, 2);
        });
        it("typing text in phantom text does nothing", function () {
            var ref = domutil_1.childByClass(ps[2], "ref");
            var initial = ref.childNodes[1];
            // Make sure we're looking at the right thing.
            assert.isTrue(domtypeguards_1.isElement(initial) && initial.classList.contains("_phantom"), "initial is phantom");
            assert.equal(initial.textContent, "(", "initial's value");
            caretManager.setCaret(initial, 1);
            editor.type(" ");
            assert.equal(initial.textContent, "(", "initial's value after");
        });
        it("typing text moves the caret", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            var parent = initial.parentNode;
            caretManager.setCaret(initial, 0);
            // There was a version of wed which would fail this test. The fake caret
            // would be inserted inside the text node, which would throw off the
            // nodeToPath/pathToNode calculations.
            editor.type("blah");
            assert.equal(initial.nodeValue, "blahabcd");
            assert.equal(parent.childNodes.length, 3);
            wed_test_util_1.caretCheck(editor, initial, 4, "caret after text insertion");
        });
        it("typing text in an attribute inserts text", function () {
            // Text node inside title.
            var initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            caretManager.setCaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type("blah");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, "blahrend_value");
            wed_test_util_1.caretCheck(editor, initial, 4, "caret after text insertion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(initial);
            assert.equal(dataNode.value, "blahrend_value");
        });
        it("typing multiple spaces in an attribute normalizes the space", function () {
            // Text node inside title.
            var initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            caretManager.setCaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type(" ");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, " rend_value");
            wed_test_util_1.caretCheck(editor, initial, 1, "caret after text insertion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(initial);
            assert.equal(dataNode.value, " rend_value");
            editor.type(" ");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, " rend_value");
            wed_test_util_1.caretCheck(editor, initial, 1, "caret after text insertion");
            // Check that the data is also modified
            assert.equal(dataNode.value, " rend_value");
            caretManager.setCaret(initial, 11);
            editor.type(" ");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, " rend_value ");
            wed_test_util_1.caretCheck(editor, initial, 12, "caret after text insertion");
            // Check that the data is also modified
            assert.equal(dataNode.value, " rend_value ");
            editor.type(" ");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, " rend_value ");
            wed_test_util_1.caretCheck(editor, initial, 12, "caret after text insertion");
            // Check that the data is also modified
            assert.equal(dataNode.value, " rend_value ");
        });
        it("typing text in an empty attribute inserts text", function () {
            // Text node inside title.
            var initial = wed_test_util_1.getAttributeValuesFor(ps[9])[0].firstChild;
            assert.isTrue(initial.classList.contains("_placeholder"));
            caretManager.setCaret(initial, 0);
            editor.type("blah");
            // We have to refetch because the decorations have been redone.
            var second = wed_test_util_1.getAttributeValuesFor(ps[9])[0].firstChild;
            assert.equal(second.data, "blah");
            wed_test_util_1.caretCheck(editor, second, 4, "caret after text insertion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(second);
            assert.equal(dataNode.value, "blah");
        });
        it("typing a double quote in an attribute inserts a double quote", function () {
            // Text node inside title.
            var initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            caretManager.setCaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type("\"");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, "\"rend_value");
            wed_test_util_1.caretCheck(editor, initial, 1, "caret after text insertion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(initial);
            assert.equal(dataNode.value, "\"rend_value");
        });
        it("typing a single quote in an attribute inserts a single quote", function () {
            // Text node inside title.
            var initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            caretManager.setCaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type("'");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, "'rend_value");
            wed_test_util_1.caretCheck(editor, initial, 1, "caret after text insertion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(initial);
            assert.equal(dataNode.value, "'rend_value");
        });
        it("typing an open angle bracket in an attribute inserts an open " +
            "angle bracket", function () {
            // Text node inside title.
            var initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            caretManager.setCaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type("<");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, "<rend_value");
            wed_test_util_1.caretCheck(editor, initial, 1, "caret after text insertion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(initial);
            assert.equal(dataNode.value, "<rend_value");
        });
        it("typing DELETE in an attribute deletes text", function () {
            // Text node inside title.
            var initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            caretManager.setCaret(initial, 0);
            assert.equal(initial.data, "rend_value");
            editor.type(keyConstants.DELETE);
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, "end_value");
            wed_test_util_1.caretCheck(editor, initial, 0, "caret after deletion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(initial);
            assert.equal(dataNode.value, "end_value");
        });
        it("typing DELETE in attribute when no more can be deleted is a noop", function () {
            // Text node inside title.
            var p = ps[8];
            var initial = wed_test_util_1.getAttributeValuesFor(p)[0].firstChild;
            caretManager.setCaret(initial, 0);
            assert.equal(initial.data, "abc");
            editor.type(keyConstants.DELETE);
            editor.type(keyConstants.DELETE);
            editor.type(keyConstants.DELETE);
            // We have to refetch because the decorations have been
            // redone.
            var laterValue = wed_test_util_1.getAttributeValuesFor(p)[0];
            assert.isTrue(laterValue.firstChild.classList
                .contains("_placeholder"));
            assert.equal(laterValue.childNodes.length, 1);
            wed_test_util_1.caretCheck(editor, laterValue.firstChild, 0, "caret after deletion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(laterValue);
            assert.equal(dataNode.value, "");
            // Overdeleting
            editor.type(keyConstants.DELETE);
            laterValue = wed_test_util_1.getAttributeValuesFor(p)[0];
            assert.isTrue(laterValue.firstChild.classList
                .contains("_placeholder"));
            assert.equal(laterValue.childNodes.length, 1);
            wed_test_util_1.caretCheck(editor, laterValue.firstChild, 0, "caret after deletion");
            // Check that the data is also modified
            dataNode = editor.toDataNode(laterValue);
            assert.equal(dataNode.value, "");
        });
        it("typing BACKSPACE in an attribute deletes text", function () {
            // Text node inside title.
            var initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            caretManager.setCaret(initial, 4);
            assert.equal(initial.data, "rend_value");
            editor.type(keyConstants.BACKSPACE);
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, "ren_value");
            wed_test_util_1.caretCheck(editor, initial, 3, "caret after deletion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(initial);
            assert.equal(dataNode.value, "ren_value");
        });
        it("typing BACKSPACE in attribute when no more can be deleted is a noop", function () {
            // Text node inside title.
            var p = ps[8];
            var initial = wed_test_util_1.getAttributeValuesFor(p)[0].firstChild;
            caretManager.setCaret(initial, 3);
            assert.equal(initial.data, "abc");
            editor.type(keyConstants.BACKSPACE);
            editor.type(keyConstants.BACKSPACE);
            editor.type(keyConstants.BACKSPACE);
            // We have to refetch because the decorations have been redone.
            var laterValue = wed_test_util_1.getAttributeValuesFor(p)[0];
            assert.isTrue(laterValue.firstChild
                .classList.contains("_placeholder"));
            assert.equal(laterValue.childNodes.length, 1);
            wed_test_util_1.caretCheck(editor, laterValue.firstChild, 0, "caret after deletion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(laterValue);
            assert.equal(dataNode.value, "");
            // Overdeleting
            editor.type(keyConstants.BACKSPACE);
            laterValue = wed_test_util_1.getAttributeValuesFor(p)[0];
            assert.isTrue(laterValue.firstChild
                .classList.contains("_placeholder"));
            assert.equal(laterValue.childNodes.length, 1);
            wed_test_util_1.caretCheck(editor, laterValue.firstChild, 0, "caret after deletion");
            // Check that the data is also modified
            dataNode = editor.toDataNode(laterValue);
            assert.equal(dataNode.value, "");
        });
        it("typing a non-breaking space converts it to a regular space", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            caretManager.setCaret(initial, 0);
            editor.type("\u00A0");
            assert.equal(initial.nodeValue, " abcd");
        });
        it("typing a zero-width space is a no-op", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            caretManager.setCaret(initial, 0);
            editor.type("\u200B");
            assert.equal(initial.nodeValue, "abcd");
        });
        it("typing adjancent spaces inserts only one space", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            var parent = initial.parentNode;
            caretManager.setCaret(initial, 0);
            editor.type(" ");
            assert.equal(initial.nodeValue, " abcd");
            assert.equal(parent.childNodes.length, 3);
            editor.type(" ");
            assert.equal(initial.nodeValue, " abcd");
            assert.equal(parent.childNodes.length, 3);
            caretManager.setCaret(initial, 5);
            editor.type(" ");
            assert.equal(initial.nodeValue, " abcd ");
            assert.equal(parent.childNodes.length, 3);
            editor.type(" ");
            assert.equal(initial.nodeValue, " abcd ");
            assert.equal(parent.childNodes.length, 3);
        });
        it("typing a control character in a placeholder", function (done) {
            var ph = guiRoot.getElementsByClassName("_placeholder")[0];
            caretManager.setCaret(ph, 0);
            var ctrlSomething = key.makeCtrlEqKey("A");
            $(editor.widget).on("wed-global-keydown.btw-mode", function (_wedEv, ev) {
                if (ctrlSomething.matchesEvent(ev)) {
                    done();
                }
            });
            editor.type(ctrlSomething);
        });
        it("clicking a gui element after typing text", function (done) {
            // Text node inside paragraph.
            var initial = editor.dataRoot.querySelector("body>p");
            caretManager.setCaret(initial.firstChild, 1);
            editor.type(" ");
            assert.equal(initial.firstChild.textContent, "B lah blah ");
            var caret = caretManager.getNormalizedCaret();
            var lastGUI = domutil_1.closestByClass(caret.node, "p").lastElementChild;
            assert.isTrue(lastGUI.classList.contains("_gui"));
            var lastGUISpan = lastGUI.firstElementChild;
            // We're simulating how Chrome would handle it. When a mousedown event
            // occurs, Chrome moves the caret *after* the mousedown event is
            // processed.
            var event = new $.Event("mousedown");
            event.target = lastGUISpan;
            caretManager.setCaret(caret);
            // This simulates the movement of the caret after the mousedown event is
            // processed. This will be processed after the mousedown handler but before
            // _seekCaret is run.
            window.setTimeout(function () {
                caretManager.setCaret(lastGUISpan, 0);
            }, 0);
            // We trigger the event here so that the order specified above is respected.
            $(lastGUISpan).trigger(event);
            window.setTimeout(function () {
                var clickEvent = new $.Event("click");
                var offset = $(lastGUISpan).offset();
                clickEvent.pageX = offset.left;
                clickEvent.pageY = offset.top;
                clickEvent.target = lastGUISpan;
                $(lastGUISpan).trigger(clickEvent);
                done();
            }, 1);
        });
        it("clicking a phantom element after typing text works", function (done) {
            // We create a special phantom element because the generic mode does not
            // create any.
            var title = editor.guiRoot.getElementsByClassName("title")[0];
            var phantom = title.ownerDocument.createElement("span");
            phantom.className = "_phantom";
            phantom.textContent = "phantom";
            title.insertBefore(phantom, null);
            // Text node inside paragraph.
            var initial = editor.dataRoot.querySelector("body>p");
            caretManager.setCaret(initial.firstChild, 1);
            editor.type(" ");
            assert.equal(initial.firstChild.nodeValue, "B lah blah ");
            var caret = caretManager.getNormalizedCaret();
            // We're simulating how Chrome would handle it. When a mousedown event
            // occurs, Chrome moves the caret *after* the mousedown event is processed.
            var event = new $.Event("mousedown");
            event.target = phantom;
            caretManager.setCaret(caret);
            // This simulates the movement of the caret after the mousedown event is
            // processed. This will be processed after the mousedown handler but before
            // _seekCaret is run.
            window.setTimeout(function () {
                caretManager.setCaret(phantom, 0);
            }, 0);
            // We trigger the event here so that the order specified above is respected.
            $(phantom).trigger(event);
            window.setTimeout(function () {
                var clickEvent = new $.Event("click");
                clickEvent.target = phantom;
                $(phantom).trigger(clickEvent);
                done();
            }, 1);
        });
    });
});
//# sourceMappingURL=wed-typing-test.js.map