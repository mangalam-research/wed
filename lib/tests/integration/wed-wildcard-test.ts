/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import mergeOptions from "merge-options";

import { CaretManager } from "wed/caret-manager";
import { Editor } from "wed/editor";

import * as globalConfig from "../base-config";
import { waitForSuccess } from "../util";
import { activateContextMenu, contextMenuHasOption, EditorSetup,
         getAttributeNamesFor } from "../wed-test-util";

const options = {
  schema: "/base/build/schemas/simplified-rng.js",
};

const assert = chai.assert;

describe("wed wildcard support:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let caretManager: CaretManager;
  let guiRoot: Element;

  before(async () => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/wildcard_converted.xml",
      mergeOptions(globalConfig.config, options),
      document);
    ({ editor } = setup);

    await setup.init();

    // tslint:disable-next-line:no-any
    (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
    caretManager = editor.caretManager;
    guiRoot = editor.guiRoot;
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

  it("elements and attributes allowed due to wildcards are readonly", () => {
    const bar = editor.dataRoot.querySelector("bar")!;
    const barGUI = caretManager.fromDataLocation(bar, 0)!.node as Element;
    assert.isTrue(barGUI.classList.contains("_readonly"));
    const attrNames = getAttributeNamesFor(barGUI);
    let attrName: Element;
    for (let ix = 0; ix < attrNames.length; ++ix) {
      attrName = attrNames[ix];
      if (attrName.textContent === "foo:baz") {
        break;
      }
    }
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const attr = attrName!.closest("._attribute")!;
    assert.isTrue(attr.classList.contains("_readonly"));
  });

  it("prevent typing in readonly elements and attributes", () => {
    const bar = editor.dataRoot.querySelector("bar")!;
    const barGUI = caretManager.fromDataLocation(bar, 0)!.node as Element;
    assert.isTrue(barGUI.classList.contains("_readonly"));

    caretManager.setCaret(bar, 0);
    editor.type("foo");
    assert.equal(bar.textContent, "abc");

    const attrNames = getAttributeNamesFor(barGUI);
    let attrName: Element;
    for (let ix = 0; ix < attrNames.length; ++ix) {
      attrName = attrNames[ix];
      if (attrName.textContent === "foo:baz") {
        break;
      }
    }
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const attr = attrName!.closest("._attribute")!;
    assert.isTrue(attr.classList.contains("_readonly"));

    const fooBaz = bar.getAttributeNode("foo:baz")!;
    caretManager.setCaret(fooBaz, 0);
    editor.type("foo");
    assert.equal(fooBaz.value, "x");

    // We drop the _readonly classes to make sure that we're testing what we
    // think we're testing. Note that the classes will be added right back as we
    // change the file because it is revalidated. This is why we type only one
    // character.
    barGUI.classList.remove("_readonly");
    attr.classList.remove("_readonly");

    caretManager.setCaret(fooBaz, 0);
    editor.type("f");
    assert.equal(fooBaz.value, "fx");

    barGUI.classList.remove("_readonly");
    caretManager.setCaret(bar, 0);
    editor.type("f");
    assert.equal(bar.textContent, "fabc");
  });

  describe("a context menu has the complex pattern action when invoked", () => {
    it("on an element allowed due to a complex pattern", async () => {
      let el!: Element;
      await waitForSuccess(() => {
        el = guiRoot.querySelector("._readonly ._element_name")!;
        assert.isNotNull(el);
      });
      activateContextMenu(editor, el);
      contextMenuHasOption(editor, /Complex name pattern/, 1);
    });

    it("on an attribute allowed due to a complex pattern", async () => {
      let el!: Element;
      await waitForSuccess(() => {
        el = guiRoot.querySelector("._readonly ._attribute_value")!;
        assert.isNotNull(el);
      });
      activateContextMenu(editor, el);
      contextMenuHasOption(editor, /Complex name pattern/, 1);
    });
  });

  function contextMenuHasNoTransforms(): void {
    const menu =
      editor.window.document.getElementsByClassName("wed-context-menu")[0];
    assert.isDefined(menu, "the menu should exist");
    const items = menu.querySelectorAll("li[data-kind]");
    assert.equal(items.length, 0,
                 "there should be no items that can transform the document");
  }

  describe("a context menu invoked on a readonly", () => {
    it("element has no actions that can transform the document", async () => {
      let el!: Element;
      await waitForSuccess(() => {
        el = guiRoot.querySelector("._readonly ._element_name")!;
        assert.isNotNull(el);
      });
      activateContextMenu(editor, el);
      contextMenuHasNoTransforms();
    });

    it("attribute has no actions that can transform the document", async () => {
      let el!: Element;
      await waitForSuccess(() => {
        el = guiRoot.querySelector("._readonly ._attribute_value")!;
        assert.isNotNull(el);
      });
      activateContextMenu(editor, el);
      contextMenuHasNoTransforms();
    });
  });
});
