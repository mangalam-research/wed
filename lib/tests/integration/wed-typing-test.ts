/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "wed/caret-manager";
import { isElement } from "wed/domtypeguards";
import { childByClass, closestByClass, indexOf } from "wed/domutil";
import { Editor } from "wed/editor";
import * as key from "wed/key";
import * as keyConstants from "wed/key-constants";

import * as globalConfig from "../base-config";
import { caretCheck, EditorSetup,
         getAttributeValuesFor } from "../wed-test-util";

const assert = chai.assert;

describe("wed typing:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let caretManager: CaretManager;
  let ps: NodeListOf<Element>;
  let guiRoot: Element;
  let titles: NodeListOf<Element>;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/source_converted.xml",
      globalConfig.config,
      document);
    ({ editor } = setup);
    return setup.init().then(() => {
      // tslint:disable-next-line:no-any
      (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
      caretManager = editor.caretManager;
      guiRoot = editor.guiRoot;
      ps = guiRoot.querySelectorAll(".body .p");
      titles = guiRoot.getElementsByClassName("title");
    });
  });

  afterEach(() => {
    setup.reset();
  });

  after(() => {
    setup.restore();

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;
  });

  it("typing BACKSPACE without caret", () => {
    assert.equal(caretManager.caret, undefined, "no caret");
    editor.type(keyConstants.BACKSPACE);
  });

  it("typing DELETE without caret", () => {
    assert.equal(caretManager.getNormalizedCaret(), undefined, "no caret");
    editor.type(keyConstants.DELETE);
  });

  it("typing text", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    const parent = initial.parentNode!;
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

  it("typing text when caret is adjacent to text (before text)", () => {
    // Text node inside title.
    const initial = editor.dataRoot.querySelectorAll("body>p")[3];
    const his = initial.getElementsByTagName("hi");
    const hi = his[his.length - 1];

    // We put the caret just after the last <hi>, which means it is just before
    // the last text node.
    caretManager.setCaret(initial, indexOf(initial.childNodes, hi) + 1);

    const initialLength = initial.childNodes.length;

    editor.type(" ");
    assert.equal(initial.lastChild!.textContent, " c");
    assert.equal(initial.childNodes.length, initialLength);
  });

  it("typing text when caret is adjacent to text (after text)", () => {
    // Text node inside title.
    const initial = editor.dataRoot.querySelectorAll("body>p")[3];

    // We put the caret just after the last child, a text node.
    caretManager.setCaret(initial, initial.childNodes.length);

    const initialLength = initial.childNodes.length;

    editor.type(" ");
    assert.equal(initial.lastChild!.textContent, "c ");
    assert.equal(initial.childNodes.length, initialLength);
  });

  it("typing longer than the length of a text undo", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    const parent = initial.parentNode!;
    caretManager.setCaret(initial, 0);

    const text =
      // tslint:disable-next-line:no-any prefer-array-literal
      new Array(((editor as any).textUndoMaxLength as number) + 1).join("a");
    editor.type(text);
    assert.equal(initial.nodeValue, `${text}abcd`);
    assert.equal(parent.childNodes.length, 3);
  });

  it("typing text after an element", () => {
    const initial = editor.dataRoot.querySelectorAll("body>p")[1];
    caretManager.setCaret(initial, 1);

    editor.type(" ");
    assert.equal(initial.childNodes.length, 2);
  });

  it("typing text in phantom text does nothing", () => {
    const ref = childByClass(ps[2], "ref")!;
    const initial = ref.childNodes[1];

    // Make sure we're looking at the right thing.
    assert.isTrue(isElement(initial) && initial.classList.contains("_phantom"),
                  "initial is phantom");
    assert.equal(initial.textContent, "(", "initial's value");
    caretManager.setCaret(initial, 1);

    editor.type(" ");
    assert.equal(initial.textContent, "(", "initial's value after");
  });

  it("typing text moves the caret", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    const parent = initial.parentNode!;
    caretManager.setCaret(initial, 0);

    // There was a version of wed which would fail this test. The fake caret
    // would be inserted inside the text node, which would throw off the
    // nodeToPath/pathToNode calculations.

    editor.type("blah");
    assert.equal(initial.nodeValue, "blahabcd");
    assert.equal(parent.childNodes.length, 3);
    caretCheck(editor, initial, 4, "caret after text insertion");
  });

  it("typing text in an attribute inserts text", () => {
    // Text node inside title.
    let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    caretManager.setCaret(initial, 0);
    assert.equal(initial.data, "rend_value");
    editor.type("blah");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, "blahrend_value");
    caretCheck(editor, initial, 4, "caret after text insertion");

    // Check that the data is also modified
    const dataNode = editor.toDataNode(initial) as Attr;
    assert.equal(dataNode.value, "blahrend_value");
  });

  it("typing multiple spaces in an attribute normalizes the space", () => {
    // Text node inside title.
    let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    caretManager.setCaret(initial, 0);
    assert.equal(initial.data, "rend_value");

    editor.type(" ");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, " rend_value");
    caretCheck(editor, initial, 1, "caret after text insertion");

    // Check that the data is also modified
    const dataNode = editor.toDataNode(initial) as Attr;
    assert.equal(dataNode.value, " rend_value");

    editor.type(" ");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, " rend_value");
    caretCheck(editor, initial, 1, "caret after text insertion");

    // Check that the data is also modified
    assert.equal(dataNode.value, " rend_value");

    caretManager.setCaret(initial, 11);

    editor.type(" ");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, " rend_value ");
    caretCheck(editor, initial, 12, "caret after text insertion");

    // Check that the data is also modified
    assert.equal(dataNode.value, " rend_value ");

    editor.type(" ");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, " rend_value ");
    caretCheck(editor, initial, 12, "caret after text insertion");

    // Check that the data is also modified
    assert.equal(dataNode.value, " rend_value ");
  });

  it("typing text in an empty attribute inserts text", () => {
    // Text node inside title.
    const initial = getAttributeValuesFor(ps[9])[0].firstChild as Element;
    assert.isTrue(initial.classList.contains("_placeholder"));
    caretManager.setCaret(initial, 0);
    editor.type("blah");

    // We have to refetch because the decorations have been redone.
    const second = getAttributeValuesFor(ps[9])[0].firstChild as Text;
    assert.equal(second.data, "blah");
    caretCheck(editor, second, 4, "caret after text insertion");

    // Check that the data is also modified
    const dataNode = editor.toDataNode(second) as Attr;
    assert.equal(dataNode.value, "blah");
  });

  it("typing a double quote in an attribute inserts a double quote", () => {
    // Text node inside title.
    let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    caretManager.setCaret(initial, 0);
    assert.equal(initial.data, "rend_value");
    editor.type("\"");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, "\"rend_value");
    caretCheck(editor, initial, 1, "caret after text insertion");

    // Check that the data is also modified
    const dataNode = editor.toDataNode(initial) as Attr;
    assert.equal(dataNode.value, "\"rend_value");
  });

  it("typing a single quote in an attribute inserts a single quote", () => {
    // Text node inside title.
    let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    caretManager.setCaret(initial, 0);
    assert.equal(initial.data, "rend_value");
    editor.type("'");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, "'rend_value");
    caretCheck(editor, initial, 1, "caret after text insertion");

    // Check that the data is also modified
    const dataNode = editor.toDataNode(initial) as Attr;
    assert.equal(dataNode.value, "'rend_value");
  });

  it("typing an open angle bracket in an attribute inserts an open " +
     "angle bracket",
     () => {
       // Text node inside title.
       let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
       caretManager.setCaret(initial, 0);
       assert.equal(initial.data, "rend_value");
       editor.type("<");

       // We have to refetch because the decorations have been redone.
       initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
       assert.equal(initial.data, "<rend_value");
       caretCheck(editor, initial, 1, "caret after text insertion");

       // Check that the data is also modified
       const dataNode = editor.toDataNode(initial) as Attr;
       assert.equal(dataNode.value, "<rend_value");
     });

  it("typing DELETE in an attribute deletes text", () => {
    // Text node inside title.
    let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    caretManager.setCaret(initial, 0);
    assert.equal(initial.data, "rend_value");
    editor.type(keyConstants.DELETE);

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, "end_value");
    caretCheck(editor, initial, 0, "caret after deletion");

    // Check that the data is also modified
    const dataNode = editor.toDataNode(initial) as Attr;
    assert.equal(dataNode.value, "end_value");
  });

  it("typing DELETE in attribute when no more can be deleted is a noop", () => {
    // Text node inside title.
    const p = ps[8];
    const initial = getAttributeValuesFor(p)[0].firstChild as Text;
    caretManager.setCaret(initial, 0);
    assert.equal(initial.data, "abc");
    editor.type(keyConstants.DELETE);
    editor.type(keyConstants.DELETE);
    editor.type(keyConstants.DELETE);

    // We have to refetch because the decorations have been
    // redone.
    let laterValue = getAttributeValuesFor(p)[0];
    assert.isTrue((laterValue.firstChild! as Element).classList
                  .contains("_placeholder"));
    assert.equal(laterValue.childNodes.length, 1);
    caretCheck(editor, laterValue.firstChild!, 0, "caret after deletion");

    // Check that the data is also modified
    let dataNode = editor.toDataNode(laterValue) as Attr;
    assert.equal(dataNode.value, "");

    // Overdeleting
    editor.type(keyConstants.DELETE);

    laterValue = getAttributeValuesFor(p)[0];
    assert.isTrue((laterValue.firstChild! as Element).classList
                  .contains("_placeholder"));
    assert.equal(laterValue.childNodes.length, 1);
    caretCheck(editor, laterValue.firstChild!, 0, "caret after deletion");

    // Check that the data is also modified
    dataNode = editor.toDataNode(laterValue) as Attr;
    assert.equal(dataNode.value, "");
  });

  it("typing BACKSPACE in an attribute deletes text", () => {
    // Text node inside title.
    let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    caretManager.setCaret(initial, 4);
    assert.equal(initial.data, "rend_value");
    editor.type(keyConstants.BACKSPACE);

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, "ren_value");
    caretCheck(editor, initial, 3, "caret after deletion");

    // Check that the data is also modified
    const dataNode = editor.toDataNode(initial) as Attr;
    assert.equal(dataNode.value, "ren_value");
  });

  it("typing BACKSPACE in attribute when no more can be deleted is a noop",
     () => {
       // Text node inside title.
       const p = ps[8];
       const initial = getAttributeValuesFor(p)[0].firstChild as Text;
       caretManager.setCaret(initial, 3);
       assert.equal(initial.data, "abc");
       editor.type(keyConstants.BACKSPACE);
       editor.type(keyConstants.BACKSPACE);
       editor.type(keyConstants.BACKSPACE);

       // We have to refetch because the decorations have been redone.
       let laterValue = getAttributeValuesFor(p)[0];
       assert.isTrue((laterValue.firstChild as Element)
                     .classList.contains("_placeholder"));
       assert.equal(laterValue.childNodes.length, 1);
       caretCheck(editor, laterValue.firstChild!, 0, "caret after deletion");

       // Check that the data is also modified
       let dataNode = editor.toDataNode(laterValue) as Attr;
       assert.equal(dataNode.value, "");

       // Overdeleting
       editor.type(keyConstants.BACKSPACE);

       laterValue = getAttributeValuesFor(p)[0];
       assert.isTrue((laterValue.firstChild as Element)
                     .classList.contains("_placeholder"));
       assert.equal(laterValue.childNodes.length, 1);
       caretCheck(editor, laterValue.firstChild!, 0, "caret after deletion");

       // Check that the data is also modified
       dataNode = editor.toDataNode(laterValue) as Attr;
       assert.equal(dataNode.value, "");
     });

  it("typing a non-breaking space converts it to a regular space", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    caretManager.setCaret(initial, 0);

    editor.type("\u00A0");
    assert.equal(initial.nodeValue, " abcd");
  });

  it("typing a zero-width space is a no-op", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    caretManager.setCaret(initial, 0);

    editor.type("\u200B");
    assert.equal(initial.nodeValue, "abcd");
  });

  it("typing adjancent spaces inserts only one space", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    const parent = initial.parentNode!;
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

  it("typing a control character in a placeholder", (done) => {
    const ph = guiRoot.getElementsByClassName("_placeholder")[0];
    caretManager.setCaret(ph, 0);
    const ctrlSomething = key.makeCtrlEqKey("A");
    $(editor.widget).on("wed-global-keydown.btw-mode", (_wedEv, ev) => {
      if (ctrlSomething.matchesEvent(ev)) {
        done();
      }
    });
    editor.type(ctrlSomething);
  });

  it("clicking a gui element after typing text", (done) => {
    // Text node inside paragraph.
    const initial = editor.dataRoot.querySelector("body>p")!;
    caretManager.setCaret(initial.firstChild, 1);

    editor.type(" ");
    assert.equal(initial.firstChild!.textContent, "B lah blah ");

    const caret = caretManager.getNormalizedCaret()!;
    const lastGUI = closestByClass(caret.node, "p")!.lastElementChild!;
    assert.isTrue(lastGUI.classList.contains("_gui"));
    const lastGUISpan = lastGUI.firstElementChild!;

    // We're simulating how Chrome would handle it. When a mousedown event
    // occurs, Chrome moves the caret *after* the mousedown event is
    // processed.
    const event = new $.Event("mousedown");
    event.target = lastGUISpan;
    caretManager.setCaret(caret);

    // This simulates the movement of the caret after the mousedown event is
    // processed. This will be processed after the mousedown handler but before
    // _seekCaret is run.
    window.setTimeout(() => {
      caretManager.setCaret(lastGUISpan, 0);
    }, 0);

    // We trigger the event here so that the order specified above is respected.
    $(lastGUISpan).trigger(event);

    window.setTimeout(() => {
      const clickEvent = new $.Event("click");
      const offset = $(lastGUISpan).offset()!;
      clickEvent.pageX = offset.left;
      clickEvent.pageY = offset.top;
      clickEvent.target = lastGUISpan;
      $(lastGUISpan).trigger(clickEvent);
      done();
    }, 1);
  });

  it("clicking a phantom element after typing text works", (done) => {
    // We create a special phantom element because the generic mode does not
    // create any.
    const title = editor.guiRoot.getElementsByClassName("title")[0];
    const phantom = title.ownerDocument.createElement("span");
    phantom.className = "_phantom";
    phantom.textContent = "phantom";
    title.insertBefore(phantom, null);

    // Text node inside paragraph.
    const initial = editor.dataRoot.querySelector("body>p")!;
    caretManager.setCaret(initial.firstChild, 1);

    editor.type(" ");
    assert.equal(initial.firstChild!.nodeValue, "B lah blah ");

    const caret = caretManager.getNormalizedCaret()!;

    // We're simulating how Chrome would handle it. When a mousedown event
    // occurs, Chrome moves the caret *after* the mousedown event is processed.
    const event = new $.Event("mousedown");
    event.target = phantom;
    caretManager.setCaret(caret);

    // This simulates the movement of the caret after the mousedown event is
    // processed. This will be processed after the mousedown handler but before
    // _seekCaret is run.
    window.setTimeout(() => {
      caretManager.setCaret(phantom, 0);
    }, 0);

    // We trigger the event here so that the order specified above is respected.
    $(phantom).trigger(event);

    window.setTimeout(() => {
      const clickEvent = new $.Event("click");
      clickEvent.target = phantom;
      $(phantom).trigger(clickEvent);
      done();
    }, 1);
  });
});
