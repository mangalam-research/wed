define(["require", "exports", "rxjs/operators/first", "wed/browsers", "wed/domutil", "wed/key-constants", "wed/util", "../base-config", "../wed-test-util"], function (require, exports, first_1, browsers, domutil_1, keyConstants, util_1, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("wed caret", function () {
        var setup;
        var editor;
        var caretManager;
        var ps;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                ps = editor.guiRoot.querySelectorAll(".body .p");
                caretManager = editor.caretManager;
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
        function assertIsTextPhantom(node) {
            var cl = node != null ? node.classList : null;
            assert.isTrue(cl != null ?
                (cl.contains("_text") && cl.contains("_phantom")) :
                false);
        }
        it("starts with undefined carets and selection ranges", function () {
            assert.isUndefined(caretManager.caret, "no gui caret");
            assert.isUndefined(caretManager.getDataCaret(), "no data caret");
            assert.isUndefined(caretManager.range, "no gui selection range");
        });
        describe("moveCaretRight", function () {
            it("works even if there is no caret defined", function () {
                editor.caretManager.onBlur();
                assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
                caretManager.move("right");
                assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
            });
            it("moves right into gui elements", function () {
                // The 6th paragraph contains a test case.
                var initial = editor.guiRoot.querySelectorAll(".body>.p")[5]
                    .childNodes[1];
                assert.equal(initial.nodeType, Node.TEXT_NODE);
                caretManager.setCaret(initial, initial.length);
                wed_test_util_1.caretCheck(editor, initial, initial.length, "initial");
                caretManager.move("right");
                // It is now located inside the text inside the label.
                var elementName = wed_test_util_1.getElementNameFor(initial.nextElementSibling);
                wed_test_util_1.caretCheck(editor, elementName, 0, "moved once");
                assert.equal(elementName.textContent, "hi");
            });
            it("moves into the first attribute of a start label", function () {
                // Start label of last paragraph...
                var initial = ps[7];
                var firstGUIEl = wed_test_util_1.firstGUI(initial);
                var offset = domutil_1.indexOf(initial.childNodes, firstGUIEl);
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                caretManager.move("right");
                // It is now located inside the text inside the label which marks the
                // start of the TEI element.
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(initial), 0, "moved once");
                caretManager.move("right");
                var attrNode = wed_test_util_1.getAttributeValuesFor(initial)[0].firstChild;
                wed_test_util_1.caretCheck(editor, attrNode, 0, "moved twice");
                caretManager.move("right");
                wed_test_util_1.caretCheck(editor, attrNode, 1, "moved thrice");
            });
            it("moves into empty attributes", function () {
                // Start label of last paragraph...
                var initial = ps[9];
                var firstGUIEl = wed_test_util_1.firstGUI(initial);
                var offset = domutil_1.indexOf(initial.childNodes, firstGUIEl);
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                caretManager.move("right");
                // It is w located inside the text inside the label which marks the start
                // of the TEI element.
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(initial), 0, "moved once");
                caretManager.move("right");
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getAttributeValuesFor(initial)[0].firstChild, 0, "moved twice");
            });
            it("moves from attribute to attribute", function () {
                // First attribute of the start label of last paragraph...
                var firstGUIEl = wed_test_util_1.firstGUI(ps[7]);
                var initial = firstGUIEl.getElementsByClassName("_attribute_value")[0]
                    .firstChild;
                caretManager.setCaret(initial, initial.length);
                wed_test_util_1.caretCheck(editor, initial, initial.length, "initial");
                caretManager.move("right");
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getAttributeValuesFor(ps[7])[1].firstChild, 0, "moved");
            });
            it("moves out of attributes", function () {
                // First attribute of the start label of last paragraph...
                var firstGUIEl = wed_test_util_1.firstGUI(ps[7]);
                var attributes = firstGUIEl.getElementsByClassName("_attribute_value");
                var initial = attributes[attributes.length - 1].firstChild;
                caretManager.setCaret(initial, initial.length);
                wed_test_util_1.caretCheck(editor, initial, initial.length, "initial");
                caretManager.move("right");
                wed_test_util_1.caretCheck(editor, firstGUIEl.nextSibling, 0, "moved");
            });
            it("moves right into text", function () {
                var initial = editor.guiRoot.getElementsByClassName("title")[0];
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("right");
                // It is now located inside the text inside the label which marks the
                // start of the TEI element.
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(initial), 0, "moved once");
                caretManager.move("right");
                // It is now inside the text
                var textNode = domutil_1.childByClass(initial, "_gui").nextSibling;
                wed_test_util_1.caretCheck(editor, textNode, 0, "moved 2 times");
                caretManager.move("right");
                // move through text
                wed_test_util_1.caretCheck(editor, textNode, 1, "moved 3 times");
                caretManager.move("right");
                caretManager.move("right");
                caretManager.move("right");
                // move through text
                wed_test_util_1.caretCheck(editor, textNode, 4, "moved 6 times");
                caretManager.move("right");
                // It is now inside the final gui element.
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(initial, true), 0, "moved 7 times");
            });
            it("moves right from text to text", function () {
                var term = editor.guiRoot.querySelector(".body>.p>.term");
                var initial = term.previousSibling;
                // Make sure we are on the right element.
                assert.equal(initial.nodeType, Node.TEXT_NODE);
                assert.equal(initial.nodeValue, "Blah blah ");
                caretManager.setCaret(initial, initial.length - 1);
                wed_test_util_1.caretCheck(editor, initial, initial.length - 1, "initial");
                caretManager.move("right");
                wed_test_util_1.caretCheck(editor, initial, initial.length, "moved once");
                caretManager.move("right");
                // The first child node is an invisible element label.
                wed_test_util_1.caretCheck(editor, term.childNodes[1], 0, "moved twice");
            });
            it("moves right out of elements", function () {
                var title = editor.guiRoot.getElementsByClassName("title")[0];
                // Text node inside title.
                var initial = title.childNodes[1];
                caretManager.setCaret(initial, initial.length);
                wed_test_util_1.caretCheck(editor, initial, initial.length, "initial");
                caretManager.move("right");
                // It is now inside the final gui element.
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(initial.parentNode, true), 0, "moved once");
                caretManager.move("right");
                // It is now before the gui element at end of the title's parent.
                var lastGUIEl = wed_test_util_1.lastGUI(title.parentNode);
                wed_test_util_1.caretCheck(editor, lastGUIEl.parentNode, lastGUIEl.parentNode.childNodes.length - 1, "moved twice");
            });
            it("moves past the initial nodes around editable contents", function () {
                var child = editor.guiRoot.getElementsByClassName("ref")[0];
                var initial = child.parentNode;
                var offset = domutil_1.indexOf(initial.childNodes, child);
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                caretManager.move("right");
                var finalOffset = 2;
                var caretNode = child.childNodes[finalOffset];
                assertIsTextPhantom(caretNode);
                assertIsTextPhantom(caretNode.previousSibling);
                wed_test_util_1.caretCheck(editor, child, finalOffset, "moved once");
            });
            it("moves out of an element when past last node around editable contents", function () {
                var initial = editor.guiRoot.getElementsByClassName("ref")[0];
                // Check that what we are expecting to be around the caret is correct.
                var offset = 2;
                var caretNode = initial.childNodes[offset];
                assertIsTextPhantom(caretNode);
                assertIsTextPhantom(caretNode.previousSibling);
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                caretManager.move("right");
                wed_test_util_1.caretCheck(editor, initial.parentNode, domutil_1.indexOf(initial.parentNode.childNodes, initial) + 1, "moved once");
            });
            it("does not move when at end of document", function () {
                var initial = wed_test_util_1.lastGUI(domutil_1.childByClass(editor.guiRoot, "TEI"));
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("right");
                // Same position
                wed_test_util_1.caretCheck(editor, initial, 0, "moved once");
            });
        });
        describe("caretManager.newPosition left", function () {
            it("returns the first position in the element name if it starts " +
                "from any other position in the element name", function () {
                var firstGUIEl = editor.guiRoot.getElementsByClassName("__start_label")[0];
                var elName = firstGUIEl.getElementsByClassName("_element_name")[0];
                var before = caretManager.makeCaret(elName.firstChild, 1);
                var after = caretManager.newPosition(before, "left");
                assert.equal(after.node, elName);
                assert.equal(after.offset, 0);
            });
            it("returns the position before the element if it starts " +
                "in the first position in the element name", function () {
                var elName = wed_test_util_1.getElementNameFor(ps[7]);
                var before = caretManager.makeCaret(elName, 0);
                var after = caretManager.newPosition(before, "left");
                var parent = ps[7].parentNode;
                assert.equal(after.node, parent);
                assert.equal(after.offset, domutil_1.indexOf(parent.childNodes, ps[7]));
            });
        });
        describe("caretManager.move('left')", function () {
            it("works even if there is no caret defined", function () {
                editor.caretManager.onBlur();
                assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
                caretManager.move("left");
                assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
            });
            it("moves left into gui elements", function () {
                var initial = editor.guiRoot.firstChild;
                var offset = initial.childNodes.length;
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                var lastGUIEl = wed_test_util_1.lastGUI(initial);
                caretManager.move("left");
                // It is now located inside the text inside the label which marks the
                // end of the TEI element.
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(initial, true), 0, "moved once");
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, lastGUIEl.parentNode, lastGUIEl.parentNode.childNodes.length - 1, "moved twice");
                caretManager.move("left");
                // It is now in the gui element of the 1st child.
                var texts = initial.getElementsByClassName("text");
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(texts[texts.length - 1], true), 0, "moved 3 times");
            });
            it("moves into the last attribute of a start label", function () {
                // Start label of last paragraph...
                var firstGUIEl = wed_test_util_1.firstGUI(ps[7]);
                var initial = firstGUIEl.parentNode;
                var offset = domutil_1.indexOf(initial.childNodes, firstGUIEl) + 1;
                // Set the caret just after the start label
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                var attrs = wed_test_util_1.getAttributeValuesFor(ps[7]);
                var lastAttrText = attrs[attrs.length - 1].firstChild;
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, lastAttrText, lastAttrText.length, "moved once");
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, lastAttrText, lastAttrText.length - 1, "moved twice");
            });
            it("moves into empty attributes", function () {
                // Start label of last paragraph...
                var firstGUIEl = wed_test_util_1.firstGUI(ps[9]);
                var initial = firstGUIEl.parentNode;
                var offset = domutil_1.indexOf(initial.childNodes, firstGUIEl) + 1;
                // Set the caret just after the start label
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                var attrs = wed_test_util_1.getAttributeValuesFor(ps[9]);
                var lastAttr = attrs[attrs.length - 1];
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, lastAttr.firstChild, 0, "moved once");
            });
            it("moves from attribute to attribute", function () {
                // Start label of last paragraph...
                var attrs = wed_test_util_1.getAttributeValuesFor(ps[7]);
                var initial = attrs[attrs.length - 1].firstChild;
                // Set the caret at the start of the last attribute.
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("left");
                var final = attrs[attrs.length - 2].firstChild;
                wed_test_util_1.caretCheck(editor, final, final.length, "moved once");
            });
            it("moves out of attributes", function () {
                // Start label of last paragraph...
                var attrs = wed_test_util_1.getAttributeValuesFor(ps[7]);
                // Set the caret at the start of the first attribute.
                var initial = attrs[0].firstChild;
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(ps[7]), 0, "moved once");
            });
            it("moves out of a start label", function () {
                var p = ps[7];
                var initial = wed_test_util_1.getElementNameFor(p);
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                var parent = p.parentNode;
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, parent, domutil_1.indexOf(parent.childNodes, p), "moved once");
            });
            it("moves left into text", function () {
                var title = editor.guiRoot.getElementsByClassName("title")[0];
                var lastGUIEl = wed_test_util_1.lastGUI(title);
                var initial = wed_test_util_1.getElementNameFor(title, true);
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("left");
                // It is now inside the text
                var textNode = lastGUIEl.previousSibling;
                var offset = textNode.length;
                wed_test_util_1.caretCheck(editor, textNode, offset, "moved once");
                caretManager.move("left");
                // move through text
                offset--;
                wed_test_util_1.caretCheck(editor, textNode, offset, "moved twice");
                caretManager.move("left");
                caretManager.move("left");
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, textNode, 0, "moved 5 times");
                caretManager.move("left");
                // It is now inside the first gui element.
                wed_test_util_1.caretCheck(editor, wed_test_util_1.getElementNameFor(title), 0, "moved 6 times");
            });
            it("moves left out of elements", function () {
                var title = editor.guiRoot.getElementsByClassName("title")[0];
                var initial = wed_test_util_1.firstGUI(title);
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("left");
                // It is now after the gui element at start of the title's parent.
                var firstGUIEl = wed_test_util_1.firstGUI(title.parentNode);
                wed_test_util_1.caretCheck(editor, firstGUIEl.parentNode, 1, "moved once");
            });
            it("moves left from text to text", function () {
                var term = editor.guiRoot.querySelector(".body>.p>.term");
                var initial = term.nextSibling;
                // Make sure we are on the right element.
                assert.equal(initial.nodeType, Node.TEXT_NODE);
                assert.equal(initial.nodeValue, " blah.");
                caretManager.setCaret(initial, 1);
                wed_test_util_1.caretCheck(editor, initial, 1, "initial");
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, initial, 0, "moved once");
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, term.childNodes[1], term.childNodes[1].length, "moved twice");
            });
            it("moves past the final nodes around editable contents", function () {
                var child = editor.guiRoot.getElementsByClassName("ref")[0];
                var initial = child.parentNode;
                var offset = domutil_1.indexOf(initial.childNodes, child) + 1;
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                caretManager.move("left");
                var finalOffset = 2;
                var caretNode = child.childNodes[finalOffset];
                assertIsTextPhantom(caretNode);
                assertIsTextPhantom(caretNode.previousSibling);
                wed_test_util_1.caretCheck(editor, child, finalOffset, "moved once");
            });
            it("moves out of an element when past first node around editable contents", function () {
                var initial = editor.guiRoot.getElementsByClassName("ref")[0];
                // Check that what we are expecting to be around the caret is correct.
                var offset = 2;
                var caretNode = initial.childNodes[offset];
                assertIsTextPhantom(caretNode);
                assertIsTextPhantom(caretNode.previousSibling);
                caretManager.setCaret(initial, offset);
                wed_test_util_1.caretCheck(editor, initial, offset, "initial");
                caretManager.move("left");
                wed_test_util_1.caretCheck(editor, initial.parentNode, domutil_1.indexOf(initial.parentNode.childNodes, initial), "moved once");
            });
            it("does not move when at start of document", function () {
                var initial = wed_test_util_1.firstGUI(domutil_1.childByClass(editor.guiRoot, "TEI"));
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("left");
                // Same position
                wed_test_util_1.caretCheck(editor, initial, 0, "moved once");
            });
        });
        describe("caretManager.move('up')", function () {
            it("does not move when at the start of a document", function () {
                var initial = wed_test_util_1.firstGUI(domutil_1.childByClass(editor.guiRoot, "TEI"));
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("up");
                // Same position
                wed_test_util_1.caretCheck(editor, initial, 0, "moved once");
            });
            it("does not crash when moving from 2nd line", function () {
                var tei = wed_test_util_1.getElementNameFor(domutil_1.childByClass(editor.guiRoot, "TEI"));
                var initial = wed_test_util_1.firstGUI(editor.guiRoot.getElementsByClassName("teiHeader")[0]);
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("up");
                // It will be in the element name of TEI.
                wed_test_util_1.caretCheck(editor, tei, 0, "moved once");
            });
        });
        describe("caretManager.move('down')", function () {
            it("does not move when at end of document", function () {
                var initial = wed_test_util_1.lastGUI(domutil_1.childByClass(editor.guiRoot, "TEI"));
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("down");
                // Same position
                wed_test_util_1.caretCheck(editor, initial, 0, "moved once");
            });
            it("does not crash when moving from 2nd to last line", function () {
                var initial = wed_test_util_1.lastGUI(editor.guiRoot.getElementsByClassName("text")[0]);
                caretManager.setCaret(initial, 0);
                wed_test_util_1.caretCheck(editor, initial, 0, "initial");
                caretManager.move("down");
                // It will be in the element name of TEI.
                var tei = wed_test_util_1.getElementNameFor(domutil_1.childByClass(editor.guiRoot, "TEI"), true);
                wed_test_util_1.caretCheck(editor, tei, 0, "moved once");
            });
        });
        describe("down arrow", function () {
            it("moves the caret to the next line", function () {
                // Text node inside paragraph.
                var initial = editor.dataRoot.querySelector("body>p");
                caretManager.setCaret(initial.firstChild, 0);
                editor.type(keyConstants.DOWN_ARROW);
                // We end up in the next paragraph.
                wed_test_util_1.dataCaretCheck(editor, domutil_1.firstDescendantOrSelf(initial.nextElementSibling), 0, "moved down");
            });
        });
        describe("up arrow", function () {
            it("moves the caret to the previous line", function () {
                // Text node inside 2nd paragraph.
                var initial = editor.dataRoot.querySelectorAll("body>p")[1];
                caretManager.setCaret(initial.firstChild, 0);
                editor.type(keyConstants.UP_ARROW);
                // We end up in the previous paragraph.
                wed_test_util_1.dataCaretCheck(editor, domutil_1.firstDescendantOrSelf(initial.previousElementSibling), 0, "moved up");
            });
        });
        it("moving the caret scrolls the pane", function (done) {
            var initial = editor.dataRoot;
            caretManager.setCaret(initial.firstChild, 0);
            // tslint:disable-next-line:no-any
            var scroller = editor.scroller;
            var initialScroll = scroller.scrollTop;
            scroller.events.pipe(first_1.first()).subscribe(function () {
                // We need to wait until the scroller has fired the scroll event.
                assert.isTrue(initialScroll < scroller.scrollTop);
                var caretRect = editor.caretManager.mark.getBoundingClientRect();
                var scrollerRect = scroller.getBoundingClientRect();
                assert.equal(util_1.distFromRect(caretRect.left, caretRect.top, scrollerRect.left, scrollerRect.top, scrollerRect.right, scrollerRect.bottom), 0, "caret should be in visible space");
                done();
            });
            caretManager.setCaret(initial.firstChild, initial.firstChild.childNodes.length);
        });
        it("proper caret position for words that are too long to word wrap", function () {
            var p = editor.dataRoot.getElementsByTagName("p")[0];
            editor.dataUpdater.insertText(p, 0, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
            caretManager.setCaret(p, 0);
            var range = editor.window.document.createRange();
            var guiCaret = caretManager.fromDataLocation(p.firstChild, 0);
            range.selectNode(guiCaret.node);
            var rect = range.getBoundingClientRect();
            // The caret should not be above the rectangle around the unbreakable text.
            assert.isTrue(Math.round(rect.top) <=
                Math.round(caretManager.mark.getBoundingClientRect().top));
        });
        // tslint:disable-next-line:mocha-no-side-effect-code
        var itNoIE = browsers.MSIE ? it.skip : it;
        // We cannot right now run this on IE.
        // tslint:disable-next-line:mocha-no-side-effect-code
        itNoIE("proper caret position for elements that span lines", function () {
            var p = editor.dataRoot.querySelectorAll("body>p")[5];
            // Check that we are testing what we want to test. The end label for the hi
            // element must be on the next line. If we don't have that condition yet,
            // we modify the document to create the condition we want.
            var textLoc;
            var hi;
            // This is extremely high on purpose. We don't want to have an arbitrarily
            // low number that will cause issues *sometimes*.
            var tries = 1000;
            var satisfied = false;
            // tslint:disable-next-line:no-constant-condition
            while (true) {
                tries--;
                textLoc = caretManager.fromDataLocation(p.lastChild, 2);
                assert.equal(textLoc.node.nodeType, Node.TEXT_NODE);
                var his = textLoc.node.parentNode.getElementsByClassName("hi");
                hi = his[his.length - 1];
                var startRect = wed_test_util_1.firstGUI(hi).getBoundingClientRect();
                var endRect = wed_test_util_1.lastGUI(hi).getBoundingClientRect();
                if (endRect.top > startRect.top + startRect.height) {
                    satisfied = true;
                    break;
                }
                if (tries === 0) {
                    break;
                }
                editor.dataUpdater.insertText(editor.toDataNode(hi), 0, "AA");
            }
            assert.isTrue(satisfied, "PRECONDITION FAILED: the test is unable to establish the \
necessary precondition");
            hi.scrollIntoView(true);
            var event = new $.Event("mousedown");
            event.target = textLoc.node.parentNode;
            var range = textLoc.makeRange(textLoc.make(textLoc.node, 3)).range;
            var _a = range.getBoundingClientRect(), top = _a.top, bottom = _a.bottom, left = _a.left;
            event.clientX = left;
            event.clientY = (top + bottom) / 2;
            event.pageX = event.clientX + editor.window.document.body.scrollLeft;
            event.pageY = event.clientY + editor.window.document.body.scrollTop;
            event.which = 1; // First mouse button.
            editor.$guiRoot.trigger(event);
            wed_test_util_1.caretCheck(editor, textLoc.node, textLoc.offset, "the caret should be in the text node");
        });
    });
});
//# sourceMappingURL=wed-caret-test.js.map