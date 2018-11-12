/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as browsers from "wed/browsers";
import { CaretManager } from "wed/caret-manager";
import { Editor } from "wed/editor";

import * as globalConfig from "../base-config";
import { makeFakePasteEvent } from "../util";
import { dataCaretCheck, EditorSetup } from "../wed-test-util";

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
  // Ideally, the copy and cut tests would be done here. However, there is no
  // cross platform reliable way to perform those tests here. The issue
  // ultimately stems from limitations as to how we can create synthetic events,
  // and how browsers protect users from nefarious clipboard modifications.
  // Browsers allow event handlers to manipulate the clipboard if and only if
  // the event was ultimately triggered by a user action, lick typing Ctrl-C or
  // clicking on a button. Using `dispatchEvent` or anything that relies on this
  // mechanism to generate a synthetic event that initates a copy/cut operation
  // is untrusted and does not have access to the clipboard.
  //
  // So the copy/cut tests are done through Selenium, which **can** simulate
  // real user interactions with the browser. (At least on many platforms it
  // can.)
  //

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
