/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as browsers from "wed/browsers";
import { CaretManager } from "wed/caret-manager";
import { Editor } from "wed/editor";

import * as globalConfig from "../base-config";
import { delay, makeFakePasteEvent } from "../util";
import { caretCheck, dataCaretCheck, EditorSetup } from "../wed-test-util";

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
  });

  after(() => {
    setup.restore();

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;
  });

  it("pasting simple text", () => {
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

  it("pasting spaces pastes a single space", () => {
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

  it("pasting zero-width space pastes nothing", () => {
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

  it("pasting structured text", () => {
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

  it("pasting structured text: invalid, decline pasting as text", (done) => {
    const p = editor.dataRoot.querySelector("body>p")!;
    const initial = p.firstChild!;
    caretManager.setCaret(initial, 0);
    const initialValue = p.innerHTML;

    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/html", "text/plain"],
      getData: () => p.outerHTML,
    });
    const pasteModal = editor.modals.getModal("paste");
    const $top = pasteModal.getTopLevel();
    $top.one("shown.bs.modal", () => {
      // Wait until visible to add this handler so that it is run after the
      // callback that wed sets on the modal.
      $top.one("hidden.bs.modal", () => {
        assert.equal(p.innerHTML, initialValue);
        dataCaretCheck(editor, initial, 0, "final position");
        done();
      });
    });
    editor.$guiRoot.trigger(event);
    // This clicks "No".
    pasteModal.getTopLevel().find(".modal-footer .btn")[1].click();
  });

  it("pasting structured text: invalid, accept pasting as text", (done) => {
    const p = editor.dataRoot.querySelector("body>p")!;
    const initial = p.firstChild;
    caretManager.setCaret(initial, 0);
    const initialValue = p.innerHTML;
    const initialOuter = p.outerHTML;
    const x = document.createElement("div");
    x.textContent = initialOuter;
    const initialOuterFromTextToHtml = x.innerHTML;

    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/html", "text/plain"],
      getData: () => initialOuter,
    });

    const pasteModal = editor.modals.getModal("paste");
    const $top = pasteModal.getTopLevel();
    $top.one("shown.bs.modal", () => {
      // Wait until visible to add this handler so that it is run after the
      // callback that wed sets on the modal.
      $top.one("hidden.bs.modal", () => {
        assert.equal(p.innerHTML, initialOuterFromTextToHtml + initialValue);
        dataCaretCheck(editor, p.firstChild!, initialOuter.length,
                       "final position");
        done();
      });
      // This clicks "Yes".
      const button = pasteModal.getTopLevel()[0]
        .getElementsByClassName("btn-primary")[0] as HTMLElement;
      button.click();
    });
    editor.$guiRoot.trigger(event);
  });

  it("handles pasting simple text into an attribute", () => {
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

  it("handles cutting a well formed selection", () => {
    // force_reload = true;
    const p = editor.dataRoot.querySelector("body>p")!;
    const guiStart = caretManager.fromDataLocation(p.firstChild!, 4)!;
    caretManager.setCaret(guiStart);
    caretManager.setRange(guiStart,
                          caretManager.fromDataLocation(p.childNodes[2], 5)!);

    // Synthetic event
    const event = new $.Event("cut");
    editor.$guiRoot.trigger(event);
    return delay(1).then(() => {
      assert.equal(p.innerHTML, "Blah.");
    });
  });

  it("handles cutting a bad selection", (done) => {
    const p = editor.dataRoot.querySelector("body>p")!;
    const originalInnerHtml = p.innerHTML;
    // Start caret is inside the term element.
    const guiStart =
      caretManager.fromDataLocation(p.childNodes[1].firstChild!, 1)!;
    const guiEnd = caretManager.fromDataLocation(p.childNodes[2], 5)!;
    caretManager.setRange(guiStart, guiEnd);

    assert.equal(p.innerHTML, originalInnerHtml);
    const straddlingModal = editor.modals.getModal("straddling");
    const $top = straddlingModal.getTopLevel();
    $top.one("shown.bs.modal", () => {
      // Wait until visible to add this handler so that it is run after the
      // callback that wed sets on the modal.
      $top.one("hidden.bs.modal", () => {
        assert.equal(p.innerHTML, originalInnerHtml);
        caretCheck(editor, guiEnd.node, guiEnd.offset, "final position");
        done();
      });
    });
    // Synthetic event
    const event = new $.Event("cut");
    editor.$guiRoot.trigger(event);
    // This clicks dismisses the modal
    straddlingModal.getTopLevel().find(".btn-primary")[0].click();
  });

  it("handles cutting in attributes", () => {
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
    return delay(1).then(() => {
      assert.equal(initial.value, initialValue.slice(0, 2) +
                   initialValue.slice(4));
    });
  });
});
