/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as mergeOptions from "merge-options";
import * as sinon from "sinon";

import { CaretManager } from "wed/caret-manager";
import { EditingMenuManager } from "wed/gui/editing-menu-manager";
import * as onerror from "wed/onerror";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";
import { DataProvider, delay, makeWedRoot, setupServer } from "../util";
import { activateContextMenu, contextMenuHasOption,
         getAttributeValuesFor } from "../wed-test-util";

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

describe("wed menus:", () => {
  let source: string;
  let editor: wed.Editor;
  let caretManager: CaretManager;
  let topSandbox: sinon.SinonSandbox;
  let wedroot: HTMLElement;
  let ps: NodeListOf<Element>;
  let guiRoot: Element;
  let menuManager: EditingMenuManager;

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
        caretManager = editor.caretManager;
        guiRoot = editor.guiRoot;
        ps = guiRoot.querySelectorAll(".body .p");
        menuManager = editor.editingMenuManager;
      });
  });

  beforeEach(() => {
    editor.undoAll();
    editor.resetLabelVisibilityLevel();
  });

  afterEach(() => {
    assert.isFalse(onerror.is_terminating(),
                   "test caused an unhandled exception to occur");
    // We don't reload our page so we need to do this.
    onerror.__test.reset();
    menuManager.dismiss();
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
    expect(wasTerminating)
      .to.equal(false, "test caused an unhandled exception to occur");

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;
    // tslint:disable-next-line:no-any

    if (topSandbox !== undefined) {
      topSandbox.restore();
    }
    document.body.removeChild(wedroot);
  });

  function contextMenuHasAttributeOption(myEditor: wed.Editor): void {
    contextMenuHasOption(myEditor, /^Add @/);
  }

  describe("has context menus", () => {
    it("when there is no caret", async () => {
      const initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
      assert.isUndefined(caretManager.getNormalizedCaret());
      activateContextMenu(editor, initial.parentNode as Element);

      await delay(1);
      // tslint:disable-next-line:no-any
      assert.isDefined((menuManager as any).currentDropdown,
                       "dropdown defined");
      assert.isDefined(caretManager.getNormalizedCaret(), "caret defined");
    });

    it("when the user tries to bring up a contextual menu when the caret is " +
       "outside wed", async () => {
         caretManager.clearSelection(); // Also clears the caret.
         assert.isUndefined(caretManager.getNormalizedCaret());
         activateContextMenu(editor,
                             guiRoot.getElementsByClassName("title")[0]);
         await delay(1);
         // tslint:disable-next-line:no-any
         assert.isDefined((menuManager as any).currentDropdown);
       });

    it("when there is a caret", async () => {
      const initial = guiRoot.getElementsByClassName("title")[0].childNodes[1]!;
      caretManager.setCaret(initial, 0);

      activateContextMenu(editor, initial.parentNode as Element);
      await delay(1);
        // tslint:disable-next-line:no-any
      assert.isDefined((menuManager as any).currentDropdown);
    });

    it("with attribute options, when invoked on a start label", () => {
      activateContextMenu(
        editor,
        guiRoot.querySelector(".__start_label._title_label ._element_name")!);
      contextMenuHasAttributeOption(editor);
    });

    it("with attribute options, when invoked in an attribute", () => {
      activateContextMenu(
        editor,
        guiRoot.querySelector(".__start_label._p_label ._attribute_value")!);
      contextMenuHasAttributeOption(editor);
    });

    it("on elements inside _phantom_wrap", () => {
      const p = guiRoot.querySelector(".body .p[data-wed-rend='wrap']")!;
      const dataNode = $.data(p, "wed_mirror_node") as Element;
      const rend = dataNode.getAttribute("rend");
      // Make sure the paragraph has rend="wrap".
      assert.equal(rend, "wrap");
      activateContextMenu(editor, p);
    });
  });

  describe("has a completion menu when the caret is in an attribute", () => {
    it("that takes completions", () => {
      const p = ps[9];
      const attrVals = getAttributeValuesFor(p);
      caretManager.setCaret(attrVals[0].firstChild, 0);
      // This is an arbitrary menu item we check for.
      contextMenuHasOption(editor, /^Y$/);
    });

    it("for which the mode provides completion", () => {
      const p = ps[13];
      const attrVals = getAttributeValuesFor(p);
      caretManager.setCaret(attrVals[0].firstChild, 0);
      // This is an arbitrary menu item we check for.
      contextMenuHasOption(editor, /^completion1$/);
    });
  });

  describe("does not have completion menu", () => {
    it("when the caret is in an attribute that takes completions but the " +
       "attribute is not visible", () => {
         // Reduce visibility to 0 so that no attribute is visible.
         editor.setLabelVisibilityLevel(0);
         const attrVals = getAttributeValuesFor(ps[9]);
         caretManager.setCaret(attrVals[0].firstChild, 0);
         const menu = editor.window.document.
           getElementsByClassName("wed-context-menu")[0];
         assert.isUndefined(menu, "the menu should not exist");
       });
  });
});
