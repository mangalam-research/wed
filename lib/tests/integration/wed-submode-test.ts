/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";

import { Editor } from "wed/editor";
import { encodeAttrName } from "wed/util";

import { config } from "../submode-config";
import { activateContextMenu, contextMenuHasOption, EditorSetup,
         getAttributeValuesFor } from "../wed-test-util";

describe("wed submodes", () => {
  let setup: EditorSetup;
  let editor: Editor;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/\
source_for_submodes_converted.xml",
      config,
      document);
    ({ editor } = setup);
    return setup.init();
  });

  after(() => {
    setup.restore();
  });

  it("dispatch to proper decorators", () => {
    const wrapped =
      editor.guiRoot.querySelectorAll(
        `[${encodeAttrName("rend")}='wrap'].tei\\:p._real`);
    expect(wrapped).to.have.length(2);
    function parentTest(el: HTMLElement, msg: string, expected: boolean): void {
      const parent = el.parentNode as HTMLElement;
      expect(parent.classList.contains("_gui_test"), msg).to.equal(expected);
    }

    parentTest(wrapped[0] as HTMLElement,
               "the first paragraph with rend='wrap' should be decorated by \
the test mode",
               true);
    parentTest(wrapped[1] as HTMLElement,
               "the second paragraph with rend='wrap' should not be decorated \
by the test mode",
               false);
  });

  it("present a contextual menu showing mode-specific actions", () => {
    function check(el: HTMLElement, custom: boolean): void {
      expect(el).to.not.be.null;
      activateContextMenu(editor, el);
      contextMenuHasOption(editor, /^Test draggable$/, custom ? 1 : 0);
      editor.editingMenuManager.dismiss();
    }

    const first =
      editor.guiRoot.querySelector(".tei\\:sourceDesc._real>.tei\\:p._real");
    check(first as HTMLElement, true);

    const second =
      editor.guiRoot.querySelector(".tei\\:body._real>.tei\\:p._real");
    check(second as HTMLElement, false);
  });

  it("present mode-specific completions", () => {
    function check(el: HTMLElement, custom: boolean): void {
      expect(el).to.not.be.null;
      const attrVals = getAttributeValuesFor(el);
      editor.caretManager.setCaret(attrVals[0].firstChild, 0);
      // This is an arbitrary menu item we check for.
      if (custom) {
        contextMenuHasOption(editor, /^completion1$/);
      }
      else {
        const menu = editor.window.document
          .getElementsByClassName("wed-context-menu")[0];
        expect(menu).to.be.undefined;
      }
    }

    const first =
      editor.guiRoot.querySelector(".tei\\:sourceDesc._real>.tei\\:p._real");
    check(first as HTMLElement, true);

    const second =
      editor.guiRoot.querySelectorAll(".tei\\:body._real>.tei\\:p._real")[13];
    check(second as HTMLElement, false);
  });

  it("adds mode-specific toolbar buttons", () => {
    function check(el: HTMLElement | null, expected: number): void {
      if (el !== null) {
        editor.caretManager.setCaret(el, 0);
      }
      const span = editor.toolbar.top.lastElementChild!;
      expect(span.children).to.have.lengthOf(expected);
    }

    // Initially we are out and so no mode-specific button.
    check(null, 0);

    // Move into the submode, and check again.
    const inSubmode =
      editor.guiRoot.querySelector(".tei\\:sourceDesc._real>.tei\\:p._real");
    check(inSubmode as HTMLElement, 1);

    // Move out, and check again.
    const outsideSubmode =
      editor.guiRoot.querySelectorAll(".tei\\:body._real>.tei\\:p._real")[13];
    check(outsideSubmode as HTMLElement, 0);
  });
});
