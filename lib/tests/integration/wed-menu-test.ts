/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "wed/caret-manager";
import { Editor } from "wed/editor";
import { EditingMenuManager } from "wed/gui/editing-menu-manager";
import * as keyConstants from "wed/key-constants";
import { encodeAttrName } from "wed/util";

import * as globalConfig from "../base-config";
import { delay } from "../util";
import { activateContextMenu, contextMenuHasOption, EditorSetup,
         getAttributeValuesFor} from "../wed-test-util";

const assert = chai.assert;

describe("wed menus:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let caretManager: CaretManager;
  let ps: NodeListOf<Element>;
  let guiRoot: Element;
  let menuManager: EditingMenuManager;

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
      menuManager = editor.editingMenuManager;
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

  function contextMenuHasAttributeOption(myEditor: Editor): void {
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
      const initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
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
      const p =
        guiRoot.querySelector(`.body .p[${encodeAttrName("rend")}='wrap']`)!;
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

  describe("has a replacement menu when the caret is in an attribute", () => {
    it("that takes completions", () => {
      const p = ps[9];
      const attrVals = getAttributeValuesFor(p);
      caretManager.setCaret(attrVals[0].firstChild, 0);
      contextMenuHasOption(editor, /^Y$/);
      editor.type("Y");
      // The context menu should be gone.
      const menu = editor.window.document.
        getElementsByClassName("wed-context-menu")[0];
      assert.isUndefined(menu, "the menu should not exist");
      editor.type(keyConstants.REPLACEMENT_MENU);
      contextMenuHasOption(editor, /^Y$/);
    });

    it("for which the mode provides completion", () => {
      const p = ps[13];
      const attrVals = getAttributeValuesFor(p);
      caretManager.setCaret(attrVals[0].firstChild, 0);
      // This is an arbitrary menu item we check for.
      contextMenuHasOption(editor, /^completion1$/);
      editor.type("completion1");
      // The context menu should be gone.
      const menu = editor.window.document.
        getElementsByClassName("wed-context-menu")[0];
      assert.isUndefined(menu, "the menu should not exist");
      editor.type(keyConstants.REPLACEMENT_MENU);
      contextMenuHasOption(editor, /^completion1$/);
    });
  });

  describe("does not have a replacement menu", () => {
    it("when the caret is in an attribute that takes completions but the " +
       "attribute is not visible", () => {
         // Reduce visibility to 0 so that no attribute is visible.
         editor.setLabelVisibilityLevel(0);
         const attrVals = getAttributeValuesFor(ps[9]);
         caretManager.setCaret(attrVals[0].firstChild, 0);
         let menu = editor.window.document.
           getElementsByClassName("wed-context-menu")[0];
         assert.isUndefined(menu, "the menu should not exist");
         // The menu won't come up with a the shortcut.
         editor.type(keyConstants.REPLACEMENT_MENU);
         menu = editor.window.document.
           getElementsByClassName("wed-context-menu")[0];
         assert.isUndefined(menu, "the menu should not exist");
       });
  });
});
