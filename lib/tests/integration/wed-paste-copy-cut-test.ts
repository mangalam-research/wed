/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as browsers from "wed/browsers";
import { CaretManager } from "wed/caret-manager";
import { DLoc } from "wed/dloc";
import { Editor } from "wed/editor";

import * as globalConfig from "../base-config";
import { delay, makeFakePasteEvent } from "../util";
import { dataCaretCheck, dataSelectionCheck, EditorSetup, expectNotification,
         getAttributeValuesFor } from "../wed-test-util";

const assert = chai.assert;

describe("wed paste copy cut:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let caretManager: CaretManager;

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
    });
  });

  afterEach(() => {
    setup.reset();
    document.designMode = "off";
  });

  after(() => {
    setup.restore();

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;
  });

  //
  // Ideally, the copy and cut tests would paste back the contents somewhere for
  // verification that the right contents was extracted to the
  // clipboard. However, we have not found a cross-platform way (as of
  // 2018/10/30) to trigger a paste operation from a test in Karma.
  //
  // * Dispatching a Ctrl-V does not work.
  //
  // * Dispatching a "paste" event does not work. (The problem is that we'd have
  //   to add the clipboard data to the synthetic event like we do when we test
  //   pasting. But by adding this data to the event, we're not testing a "real"
  //   paste event.)
  //
  // * execCommand("paste") does nothing.
  //
  // * The asynchronous clipboard API is problematic, as it is not quite
  //   cross-platform yet. And there's the issue of getting permissions for
  //   reading the clipboard.
  //

  it("copies well-formed selection", async () => {
    const p = editor.dataRoot.querySelector("body>p")!;
    const guiStart = caretManager.fromDataLocation(p.firstChild!, 4)!;
    const guiEnd = caretManager.fromDataLocation(p.childNodes[2], 5)!;
    const initialHTML = p.innerHTML;

    caretManager.setRange(guiStart, guiEnd);
    dataCaretCheck(editor, p.childNodes[2], 5, "initial caret position");

    // Synthetic event
    const event = new $.Event("copy");
    editor.$guiRoot.trigger(event);
    await delay(0.5);
    assert.equal(p.innerHTML, initialHTML, "the HTML should not have changed");
    dataCaretCheck(editor, p.childNodes[2], 5, "final caret position");
    dataSelectionCheck(editor,
                       DLoc.mustMakeDLoc(editor.dataRoot, p.firstChild!, 4),
                       DLoc.mustMakeDLoc(editor.dataRoot, p.childNodes[2], 5),
                       "final selection should not have changed");
    // tslint:disable-next-line:no-any
    assert.equal((editor as any).clipboard.buffer.textContent,
                 ` blah <term xmlns="http://www.tei-c.org/ns/1.0">blah</term> \
blah`);
  });

  it("copies malformed selections as text", async () => {
    const p = editor.dataRoot.querySelector("body>p")!;
    const guiStart = caretManager.fromDataLocation(p.firstChild!, 4)!;
    const guiEnd = caretManager.fromDataLocation(p.childNodes[1], 0)!;
    const initialHTML = p.innerHTML;

    caretManager.setRange(guiStart, guiEnd);
    // Synthetic event
    const event = new $.Event("copy");
    editor.$guiRoot.trigger(event);
    expectNotification(
      "warning",
      `Selection is not well-formed XML, and consequently was copied \
as text.`);
    await delay(0.5);
    assert.equal(p.innerHTML, initialHTML, "the HTML should not have changed");
    dataCaretCheck(editor, p.childNodes[1], 0, "final caret position");
    dataSelectionCheck(editor,
                       DLoc.mustMakeDLoc(editor.dataRoot, p.firstChild!, 4),
                       DLoc.mustMakeDLoc(editor.dataRoot, p.childNodes[1], 0),
                       "final selection should not have changed");

    // We do not use clipboard.buffer and we cannot check the clipboard.
  });

  it("copies attribute text", async () => {
    const p = editor.guiRoot.querySelectorAll(".body .p")[7];
    const attrVals = getAttributeValuesFor(p);
    const guiStart = caretManager.makeCaret(attrVals[0].firstChild, 0)!;
    const guiEnd = caretManager.makeCaret(attrVals[0].firstChild, 1)!;
    const dataStart = caretManager.toDataLocation(guiStart)!;
    const dataEnd = caretManager.toDataLocation(guiEnd)!;

    caretManager.setRange(guiStart, guiEnd);
    const initialHTML = p.innerHTML;
    // Synthetic event
    const event = new $.Event("copy");
    editor.$guiRoot.trigger(event);
    await delay(0.5);
    assert.equal(p.innerHTML, initialHTML, "the HTML should not have changed");
    dataCaretCheck(editor, dataEnd.node, dataEnd.offset,
                   "final caret position");
    dataSelectionCheck(editor, dataStart, dataEnd,
                       "final selection should not have changed");
    // tslint:disable-next-line:no-any
    assert.equal((editor as any).clipboard.buffer.textContent, "r");
  });

  it("cuts a well-formed selection", async () => {
    const p = editor.dataRoot.querySelector("body>p")!;
    const guiStart = caretManager.fromDataLocation(p.firstChild!, 4)!;
    caretManager.setRange(guiStart,
                          caretManager.fromDataLocation(p.childNodes[2], 5)!);

    // Synthetic event
    const event = new $.Event("cut");
    editor.$guiRoot.trigger(event);
    await delay(0.5);
    assert.equal(p.innerHTML, "Blah.");
    // tslint:disable-next-line:no-any
    assert.equal((editor as any).clipboard.buffer.textContent,
                 ` blah <term xmlns="http://www.tei-c.org/ns/1.0">blah</term> \
blah`);
  });

  it("refuses to cut a bad selection", () => {
    const p = editor.dataRoot.querySelector("body>p")!;
    // Start caret is inside the term element.
    const guiStart =
      caretManager.fromDataLocation(p.childNodes[1].firstChild!, 1)!;
    const guiEnd = caretManager.fromDataLocation(p.childNodes[2], 5)!;
    const dataStart = caretManager.toDataLocation(guiStart)!;
    const dataEnd = caretManager.toDataLocation(guiEnd)!;
    caretManager.setRange(guiStart, guiEnd);
    const initialHTML = p.innerHTML;

    // Synthetic event
    const event = new $.Event("cut");
    editor.$guiRoot.trigger(event);
    expectNotification(
      "danger",
      `Selection is not well-formed XML, and consequently the selection \
cannot be cut.`);
    assert.equal(p.innerHTML, initialHTML, "the HTML should not have changed");
    dataCaretCheck(editor, dataEnd.node, dataEnd.offset,
                   "final caret position");
    dataSelectionCheck(editor, dataStart, dataEnd,
                       "final selection should not have changed");
  });

  it("cuts in attributes", async () => {
    // force_reload = true;
    const p = editor.dataRoot.querySelector("body>p:nth-of-type(8)")!;
    const initial = p.getAttributeNode("rend")!;
    const initialValue = initial.value;
    const start = caretManager.fromDataLocation(initial, 2)!;
    const end = caretManager.fromDataLocation(initial, 4)!;

    caretManager.setRange(start, end);

    // Synthetic event
    const event = new $.Event("cut");
    editor.$guiRoot.trigger(event);
    await delay(1);
    assert.equal(initial.value, initialValue.slice(0, 2) +
                 initialValue.slice(4));
  });

  it("pastes simple text", () => {
    const initial = editor.dataRoot.querySelector("body>p")!.firstChild!;
    caretManager.setCaret(initial, 0);
    const initialValue = initial.nodeValue;

    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => "abcdef",
    });
    editor.$guiRoot.trigger(event);
    assert.equal(initial.nodeValue, `abcdef${initialValue}`);
    dataCaretCheck(editor, initial, 6, "final position");
  });

  it("pastes a single space for many spaces", () => {
    const initial = editor.dataRoot.querySelector("body>p")!.firstChild!;
    caretManager.setCaret(initial, 0);
    const initialValue = initial.nodeValue;

    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => "    \u00A0  ",
    });
    editor.$guiRoot.trigger(event);
    assert.equal(initial.nodeValue, ` ${initialValue}`);
    dataCaretCheck(editor, initial, 1, "final position");
  });

  it("pastes nothing for zero-width space", () => {
    const initial = editor.dataRoot.querySelector("body>p")!.firstChild!;
    caretManager.setCaret(initial, 0);
    const initialValue = initial.nodeValue;

    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => "\u200B\u200B",
    });
    editor.$guiRoot.trigger(event);
    assert.equal(initial.nodeValue, initialValue);
    dataCaretCheck(editor, initial, 0, "final position");
  });

  it("pastes XML", () => {
    const p = editor.dataRoot.querySelector("body>p")!;
    const initial = p.firstChild!;
    caretManager.setCaret(initial, 0);
    const initialValue = p.innerHTML;

    const toPaste = `Blah <term xmlns="http://www.tei-c.org/ns/1.0">blah\
</term> blah.`;
    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/html", "text/plain"],
      // We add the zero-width space for the heck of it.  It will be stripped.
      getData: () => `${toPaste}\u200B`,
    });
    editor.$guiRoot.trigger(event);
    let expected = toPaste + initialValue;
    if (browsers.MSIE) {
      expected = expected.replace(` xmlns="http://www.tei-c.org/ns/1.0"`, "");
    }
    assert.equal(p.innerHTML, expected);
    dataCaretCheck(editor, p.childNodes[2], 6, "final position");
  });

  it("pastes invalid xml", () => {
    const p = editor.dataRoot.querySelector("body>p")!;
    const initial = p.firstChild!;
    caretManager.setCaret(initial, 0);
    const initialValue = p.innerHTML;

    const toPaste = `Blah <fnord xmlns="http://www.tei-c.org/ns/1.0">blah\
</fnord> blah.`;
    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/html", "text/plain"],
      getData: () => toPaste,
    });
    editor.$guiRoot.trigger(event);
    let expected = toPaste + initialValue;
    if (browsers.MSIE) {
      expected = expected.replace(` xmlns="http://www.tei-c.org/ns/1.0"`, "");
    }
    assert.equal(p.innerHTML, expected);
    dataCaretCheck(editor, p.childNodes[2], 6, "final position");
  });

  it("pastes simple text into an attribute", () => {
    const p = editor.dataRoot.querySelector("body>p:nth-of-type(8)")!;
    const initial = p.getAttributeNode("rend")!;
    caretManager.setCaret(initial, 0);
    const initialValue = initial.value;

    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => "abcdef",
    });
    editor.$guiRoot.trigger(event);
    assert.equal(initial.value, `abcdef${initialValue}`);
    dataCaretCheck(editor, initial, 6, "final position");
  });

  it("pastes XML as text into an attribute", () => {
    const p = editor.dataRoot.querySelector("body>p:nth-of-type(8)")!;
    const initial = p.getAttributeNode("rend")!;
    caretManager.setCaret(initial, 0);
    const initialValue = initial.value;

    const toPaste = `<foo>blah</foo>`;
    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/html", "text/plain"],
      getData: () => toPaste,
    });
    editor.$guiRoot.trigger(event);
    assert.equal(initial.value, `${toPaste}${initialValue}`);
    dataCaretCheck(editor, initial, 15, "final position");
  });
});
