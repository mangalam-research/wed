/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as mergeOptions from "merge-options";
import * as sinon from "sinon";

import { CaretManager } from "wed/caret-manager";
import { childByClass, firstDescendantOrSelf, indexOf } from "wed/domutil";
import * as keyConstants from "wed/key-constants";
import * as log from "wed/log";
import * as onerror from "wed/onerror";
import { distFromRect } from "wed/util";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";
import { DataProvider, makeWedRoot, setupServer } from "../util";
import { caretCheck, dataCaretCheck, firstGUI, getAttributeValuesFor,
         getElementNameFor, lastGUI } from "../wed-test-util";

const options = {
  schema: "/base/build/schemas/tei-simplified-rng.js",
  mode: {
    path: "wed/modes/test/test-mode",
    options: {
      metadata: "/base/build/schemas/tei-metadata.json",
    },
  },
};

const assert = chai.assert;

describe("wed caret", () => {
  let source: string;
  let editor: wed.Editor;
  let caretManager: CaretManager;
  let topSandbox: sinon.SinonSandbox;
  let wedroot: HTMLElement;
  let ps: NodeListOf<Element>;

  before(async () => {
    const provider =
      new DataProvider("/base/build/standalone/lib/tests/wed_test_data/");
    source = await provider.getText("source_converted.xml");
  });

  before(() => {
    topSandbox = sinon.sandbox.create({
      useFakeServer: true,
    });
    setupServer(topSandbox.server);

    wedroot = makeWedRoot(document);
    document.body.appendChild(wedroot);
    editor = new wed.Editor(wedroot,
                            mergeOptions(globalConfig.config, options));
    return editor.init(source)
      .then(() => {
        // tslint:disable-next-line:no-any
        (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
        ps = editor.guiRoot.querySelectorAll(".body .p");
        caretManager = editor.caretManager;
      });
  });

  afterEach(() => {
    assert.isFalse(onerror.is_terminating(),
                   "test caused an unhandled exception to occur");
    // We don't reload our page so we need to do this.
    onerror.__test.reset();
    editor.editingMenuManager.dismiss();
  });

  after(() => {
    if (editor !== undefined) {
      editor.destroy();
    }

    // We read the state, reset, and do the assertion later so that if the
    // assertion fails, we still have our reset.
    const wasTerminating = onerror.is_terminating();

    // We don't reload our page so we need to do this.
    onerror.__test.reset();
    log.clearAppenders();
    expect(wasTerminating)
      .to.equal(false, "test caused an unhandled exception to occur");

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;

    if (topSandbox !== undefined) {
      topSandbox.restore();
    }
    document.body.removeChild(wedroot);
  });

  function assertIsTextPhantom(node: Node | undefined | null): void {
    const cl = node != null ? (node as Element).classList : null;
    assert.isTrue(cl != null ?
                  (cl.contains("_text") && cl.contains("_phantom")) :
                  false);
  }

  describe("moveCaretRight", () => {
    it("works even if there is no caret defined", () => {
      editor.caretManager.onBlur();
      assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
      caretManager.move("right");
      assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
    });

    it("moves right into gui elements", () => {
      // The 6th paragraph contains a test case.
      const initial = editor.guiRoot.querySelectorAll(".body>.p")[5]
        .childNodes[1] as Text;
      assert.equal(initial.nodeType, Node.TEXT_NODE);
      caretManager.setCaret(initial, initial.length);
      caretCheck(editor, initial, initial.length, "initial");
      caretManager.move("right");
      // It is now located inside the text inside the label.
      const elementName = getElementNameFor(initial.nextElementSibling!)!;
      caretCheck(editor, elementName, 0, "moved once");
      assert.equal(elementName.textContent, "hi");
    });

    it("moves into the first attribute of a start label", () => {
      // Start label of last paragraph...
      const initial = ps[7];
      const firstGUIEl = firstGUI(initial)!;
      const offset = indexOf(initial.childNodes, firstGUIEl);
      caretManager.setCaret(initial, offset);
      caretCheck(editor, initial, offset, "initial");
      caretManager.move("right");
      // It is now located inside the text inside the label which marks the
      // start of the TEI element.
      caretCheck(editor, getElementNameFor(initial)!, 0, "moved once");

      caretManager.move("right");
      const attrNode = getAttributeValuesFor(initial)[0].firstChild!;
      caretCheck(editor, attrNode, 0, "moved twice");

      caretManager.move("right");
      caretCheck(editor, attrNode, 1, "moved thrice");
    });

    it("moves into empty attributes", () => {
      // Start label of last paragraph...
      const initial = ps[9];
      const firstGUIEl = firstGUI(initial)!;
      const offset = indexOf(initial.childNodes, firstGUIEl);
      caretManager.setCaret(initial, offset);
      caretCheck(editor, initial, offset, "initial");
      caretManager.move("right");
      // It is w located inside the text inside the label which marks the start
      // of the TEI element.
      caretCheck(editor, getElementNameFor(initial)!, 0, "moved once");

      caretManager.move("right");
      caretCheck(editor, getAttributeValuesFor(initial)[0].firstChild!, 0,
                 "moved twice");
    });

    it("moves from attribute to attribute", () => {
      // First attribute of the start label of last paragraph...
      const firstGUIEl = firstGUI(ps[7])!;
      const initial = firstGUIEl.getElementsByClassName("_attribute_value")[0]
        .firstChild as Text;
      caretManager.setCaret(initial, initial.length);
      caretCheck(editor, initial, initial.length, "initial");
      caretManager.move("right");
      caretCheck(editor, getAttributeValuesFor(ps[7])[1].firstChild!, 0,
                 "moved");
    });

    it("moves out of attributes", () => {
      // First attribute of the start label of last paragraph...
      const firstGUIEl = firstGUI(ps[7])!;
      const attributes = firstGUIEl.getElementsByClassName("_attribute_value");
      const initial = attributes[attributes.length - 1].firstChild as Text;
      caretManager.setCaret(initial, initial.length);
      caretCheck(editor, initial, initial.length, "initial");
      caretManager.move("right");
      caretCheck(editor, firstGUIEl.nextSibling!, 0, "moved");
    });

    it("moves right into text", () => {
      const initial = editor.guiRoot.getElementsByClassName("title")[0];
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("right");
      // It is now located inside the text inside the label which marks the
      // start of the TEI element.
      caretCheck(editor, getElementNameFor(initial)!, 0, "moved once");
      caretManager.move("right");
      // It is now inside the text
      const textNode = childByClass(initial, "_gui")!.nextSibling!;
      caretCheck(editor, textNode, 0, "moved 2 times");
      caretManager.move("right");
      // move through text
      caretCheck(editor, textNode, 1, "moved 3 times");
      caretManager.move("right");
      caretManager.move("right");
      caretManager.move("right");
      // move through text
      caretCheck(editor, textNode, 4, "moved 6 times");
      caretManager.move("right");
      // It is now inside the final gui element.
      caretCheck(editor, getElementNameFor(initial, true)!, 0, "moved 7 times");
    });

    it("moves right from text to text", () => {
      const term = editor.guiRoot.querySelector(".body>.p>.term")!;
      const initial = term.previousSibling as Text;
      // Make sure we are on the right element.
      assert.equal(initial.nodeType, Node.TEXT_NODE);
      assert.equal(initial.nodeValue, "Blah blah ");

      caretManager.setCaret(initial, initial.length - 1);
      caretCheck(editor, initial, initial.length - 1, "initial");

      caretManager.move("right");
      caretCheck(editor, initial, initial.length, "moved once");

      caretManager.move("right");
      // The first child node is an invisible element label.
      caretCheck(editor, term.childNodes[1], 0, "moved twice");
    });

    it("moves right out of elements", () => {
      const title = editor.guiRoot.getElementsByClassName("title")[0];
      // Text node inside title.
      const initial = title.childNodes[1] as Text;
      caretManager.setCaret(initial, initial.length);
      caretCheck(editor, initial, initial.length, "initial");
      caretManager.move("right");
      // It is now inside the final gui element.
      caretCheck(editor, getElementNameFor(initial.parentNode as Element,
                                           true)!,
                 0, "moved once");
      caretManager.move("right");
      // It is now before the gui element at end of the title's parent.
      const lastGUIEl = lastGUI(title.parentNode as Element)!;
      caretCheck(editor, lastGUIEl.parentNode as Element,
                 lastGUIEl.parentNode!.childNodes.length - 1,
                 "moved twice");
    });

    it("moves past the initial nodes around editable contents", () => {
      const child = editor.guiRoot.getElementsByClassName("ref")[0];
      const initial = child.parentNode!;
      const offset = indexOf(initial.childNodes, child);
      caretManager.setCaret(initial, offset);
      caretCheck(editor, initial, offset, "initial");

      caretManager.move("right");

      const finalOffset = 2;
      const caretNode = child.childNodes[finalOffset];
      assertIsTextPhantom(caretNode);
      assertIsTextPhantom(caretNode.previousSibling);
      caretCheck(editor, child, finalOffset, "moved once");
    });

    it("moves out of an element when past last node around editable contents",
       () => {
         const initial = editor.guiRoot.getElementsByClassName("ref")[0];
         // Check that what we are expecting to be around the caret is correct.
         const offset = 2;
         const caretNode = initial.childNodes[offset];
         assertIsTextPhantom(caretNode);
         assertIsTextPhantom(caretNode.previousSibling);

         caretManager.setCaret(initial, offset);
         caretCheck(editor, initial, offset, "initial");

         caretManager.move("right");

         caretCheck(editor, initial.parentNode!,
                    indexOf(initial.parentNode!.childNodes, initial) + 1,
                    "moved once");
       });

    it("does not move when at end of document", () => {
      const initial = lastGUI(childByClass(editor.guiRoot, "TEI")!)!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("right");
      // Same position
      caretCheck(editor, initial, 0, "moved once");
    });
  });

  describe("caretManager.newPosition left", () => {
    it("returns the first position in the element name if it starts " +
       "from any other position in the element name",
       () => {
         const firstGUIEl =
           editor.guiRoot.getElementsByClassName("__start_label")[0];
         const elName = firstGUIEl.getElementsByClassName("_element_name")[0];
         const before = caretManager.makeCaret(elName.firstChild, 1);
         const after = caretManager.newPosition(before, "left")!;
         assert.equal(after.node, elName);
         assert.equal(after.offset, 0);
       });

    it("returns the position before the element if it starts " +
       "in the first position in the element name",
       () => {
         const elName = getElementNameFor(ps[7]);
         const before = caretManager.makeCaret(elName, 0);
         const after = caretManager.newPosition(before, "left")!;
         const parent = ps[7].parentNode!;
         assert.equal(after.node, parent);
         assert.equal(after.offset, indexOf(parent.childNodes, ps[7]));
       });
  });

  describe("caretManager.move('left')", () => {
    it("works even if there is no caret defined", () => {
      editor.caretManager.onBlur();
      assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
      caretManager.move("left");
      assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
    });

    it("moves left into gui elements", () => {
      const initial = editor.guiRoot.firstChild as Element;
      const offset = initial.childNodes.length;
      caretManager.setCaret(initial, offset);
      caretCheck(editor, initial, offset, "initial");
      const lastGUIEl = lastGUI(initial)!;

      caretManager.move("left");
      // It is now located inside the text inside the label which marks the
      // end of the TEI element.
      caretCheck(editor, getElementNameFor(initial, true)!, 0, "moved once");

      caretManager.move("left");
      caretCheck(editor, lastGUIEl.parentNode!,
                 lastGUIEl.parentNode!.childNodes.length - 1,
                 "moved twice");

      caretManager.move("left");
      // It is now in the gui element of the 1st child.
      const texts = initial.getElementsByClassName("text");
      caretCheck(editor, getElementNameFor(texts[texts.length - 1], true)!,
                 0, "moved 3 times");
    });

    it("moves into the last attribute of a start label", () => {
      // Start label of last paragraph...
      const firstGUIEl = firstGUI(ps[7])!;
      const initial = firstGUIEl.parentNode!;
      const offset = indexOf(initial.childNodes, firstGUIEl) + 1;
      // Set the caret just after the start label
      caretManager.setCaret(initial, offset);
      caretCheck(editor, initial, offset, "initial");

      const attrs = getAttributeValuesFor(ps[7]);
      const lastAttrText = attrs[attrs.length - 1].firstChild as Text;
      caretManager.move("left");
      caretCheck(editor, lastAttrText, lastAttrText.length, "moved once");

      caretManager.move("left");
      caretCheck(editor, lastAttrText, lastAttrText.length - 1, "moved twice");
    });

    it("moves into empty attributes", () => {
      // Start label of last paragraph...
      const firstGUIEl = firstGUI(ps[9])!;
      const initial = firstGUIEl.parentNode!;
      const offset = indexOf(initial.childNodes, firstGUIEl) + 1;
      // Set the caret just after the start label
      caretManager.setCaret(initial, offset);
      caretCheck(editor, initial, offset, "initial");

      const attrs = getAttributeValuesFor(ps[9]);
      const lastAttr = attrs[attrs.length - 1];
      caretManager.move("left");
      caretCheck(editor, lastAttr.firstChild!, 0, "moved once");
    });

    it("moves from attribute to attribute", () => {
      // Start label of last paragraph...
      const attrs = getAttributeValuesFor(ps[7]);
      const initial = attrs[attrs.length - 1].firstChild!;
      // Set the caret at the start of the last attribute.
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");

      caretManager.move("left");
      const final = attrs[attrs.length - 2].firstChild as Text;
      caretCheck(editor, final, final.length, "moved once");
    });

    it("moves out of attributes", () => {
      // Start label of last paragraph...
      const attrs = getAttributeValuesFor(ps[7]);
      // Set the caret at the start of the first attribute.
      const initial = attrs[0].firstChild!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");

      caretManager.move("left");
      caretCheck(editor, getElementNameFor(ps[7])!, 0, "moved once");
    });

    it("moves out of a start label", () => {
      const p = ps[7];
      const initial = getElementNameFor(p)!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");

      const parent = p.parentNode!;
      caretManager.move("left");
      caretCheck(editor, parent, indexOf(parent.childNodes, p), "moved once");
    });

    it("moves left into text", () => {
      const title = editor.guiRoot.getElementsByClassName("title")[0];
      const lastGUIEl = lastGUI(title)!;
      const initial = getElementNameFor(title, true)!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("left");
      // It is now inside the text
      const textNode = lastGUIEl.previousSibling as Text;
      let offset = textNode.length;
      caretCheck(editor, textNode, offset, "moved once");
      caretManager.move("left");
      // move through text
      offset--;
      caretCheck(editor, textNode, offset, "moved twice");
      caretManager.move("left");
      caretManager.move("left");
      caretManager.move("left");
      caretCheck(editor, textNode, 0, "moved 5 times");
      caretManager.move("left");
      // It is now inside the first gui element.
      caretCheck(editor, getElementNameFor(title)!, 0, "moved 6 times");
    });

    it("moves left out of elements", () => {
      const title = editor.guiRoot.getElementsByClassName("title")[0];
      const initial = firstGUI(title)!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("left");
      // It is now after the gui element at start of the title's parent.
      const firstGUIEl = firstGUI(title.parentNode as Element)!;

      caretCheck(editor, firstGUIEl.parentNode!, 1, "moved once");
    });

    it("moves left from text to text", () => {
      const term = editor.guiRoot.querySelector(".body>.p>.term")!;
      const initial = term.nextSibling!;
      // Make sure we are on the right element.
      assert.equal(initial.nodeType, Node.TEXT_NODE);
      assert.equal(initial.nodeValue, " blah.");

      caretManager.setCaret(initial, 1);
      caretCheck(editor, initial, 1, "initial");

      caretManager.move("left");
      caretCheck(editor, initial, 0, "moved once");

      caretManager.move("left");
      caretCheck(editor, term.childNodes[1],
                 (term.childNodes[1] as Text).length, "moved twice");
    });

    it("moves past the final nodes around editable contents", () => {
      const child = editor.guiRoot.getElementsByClassName("ref")[0];
      const initial = child.parentNode!;
      const offset = indexOf(initial.childNodes, child) + 1;
      caretManager.setCaret(initial, offset);
      caretCheck(editor, initial, offset, "initial");

      caretManager.move("left");

      const finalOffset = 2;
      const caretNode = child.childNodes[finalOffset];
      assertIsTextPhantom(caretNode);
      assertIsTextPhantom(caretNode.previousSibling);
      caretCheck(editor, child, finalOffset, "moved once");
    });

    it("moves out of an element when past first node around editable contents",
       () => {
         const initial = editor.guiRoot.getElementsByClassName("ref")[0];
         // Check that what we are expecting to be around the caret is correct.
         const offset = 2;
         const caretNode = initial.childNodes[offset];
         assertIsTextPhantom(caretNode);
         assertIsTextPhantom(caretNode.previousSibling);

         caretManager.setCaret(initial, offset);
         caretCheck(editor, initial, offset, "initial");

         caretManager.move("left");

         caretCheck(editor, initial.parentNode!,
                    indexOf(initial.parentNode!.childNodes, initial),
                    "moved once");
       });

    it("does not move when at start of document", () => {
      const initial = firstGUI(childByClass(editor.guiRoot, "TEI")!)!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("left");
      // Same position
      caretCheck(editor, initial, 0, "moved once");
    });
  });

  describe("caretManager.move('up')", () => {
    it("does not move when at the start of a document", () => {
      const initial = firstGUI(childByClass(editor.guiRoot, "TEI")!)!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("up");
      // Same position
      caretCheck(editor, initial, 0, "moved once");
    });

    it("does not crash when moving from 2nd line", () => {
      const tei = getElementNameFor(childByClass(editor.guiRoot, "TEI")!)!;
      const initial =
        firstGUI(editor.guiRoot.getElementsByClassName("teiHeader")[0])!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("up");
      // It will be in the element name of TEI.
      caretCheck(editor, tei, 0, "moved once");
    });
  });

  describe("caretManager.move('down')", () => {
    it("does not move when at end of document", () => {
      const initial = lastGUI(childByClass(editor.guiRoot, "TEI")!)!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("down");
      // Same position
      caretCheck(editor, initial, 0, "moved once");
    });

    it("does not crash when moving from 2nd to last line", () => {
      const initial =
        lastGUI(editor.guiRoot.getElementsByClassName("text")[0])!;
      caretManager.setCaret(initial, 0);
      caretCheck(editor, initial, 0, "initial");
      caretManager.move("down");
      // It will be in the element name of TEI.
      const tei =
        getElementNameFor(childByClass(editor.guiRoot, "TEI")!, true)!;
      caretCheck(editor, tei, 0, "moved once");
    });
  });

  describe("down arrow", () => {
    it("moves the caret to the next line", () => {
      // Text node inside paragraph.
      const initial = editor.dataRoot.querySelector("body>p")!;
      caretManager.setCaret(initial.firstChild, 0);

      editor.type(keyConstants.DOWN_ARROW);

      // We end up in the next paragraph.
      dataCaretCheck(editor,
                     firstDescendantOrSelf(initial.nextElementSibling)!,
                     0, "moved down");
    });
  });

  describe("up arrow", () => {
    it("moves the caret to the previous line", () => {
      // Text node inside 2nd paragraph.
      const initial = editor.dataRoot.querySelectorAll("body>p")[1];
      caretManager.setCaret(initial.firstChild, 0);

      editor.type(keyConstants.UP_ARROW);

      // We end up in the previous paragraph.
      dataCaretCheck(editor,
                     firstDescendantOrSelf(initial.previousElementSibling)!,
                     0, "moved up");
    });
  });

  it("moving the caret scrolls the pane", (done) => {
    const initial = editor.dataRoot;
    caretManager.setCaret(initial.firstChild, 0);

    // tslint:disable-next-line:no-any
    const scroller = (editor as any).scroller;

    const initialScroll = scroller.scrollTop;

    scroller.events.first().subscribe(() => {
      // We need to wait until the scroller has fired the scroll event.
      assert.isTrue(initialScroll < scroller.scrollTop);
      const caretRect = editor.caretManager.mark.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      assert.equal(distFromRect(caretRect.left, caretRect.top,
                                scrollerRect.left, scrollerRect.top,
                                scrollerRect.right,
                                scrollerRect.bottom),
                   0, "caret should be in visible space");
      done();
    });

    caretManager.setCaret(initial.firstChild,
                          initial.firstChild!.childNodes.length);
  });
});
