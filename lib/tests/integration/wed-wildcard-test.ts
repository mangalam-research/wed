/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as mergeOptions from "merge-options";
import * as sinon from "sinon";

import { CaretManager } from "wed/caret-manager";
import * as onerror from "wed/onerror";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";
import { DataProvider, delay, makeFakePasteEvent, makeWedRoot,
         setupServer } from "../util";
import { activateContextMenu, contextMenuHasOption, dataCaretCheck,
         getAttributeNamesFor } from "../wed-test-util";

const options = {
  schema: "/base/build/schemas/simplified-rng.js",
  mode: {
    path: "wed/modes/test/test-mode",
    options: {
      metadata: "/base/build/schemas/tei-metadata.json",
    },
  },
};

const assert = chai.assert;

describe("wed wildcard support:", () => {
  let source: string;
  let editor: wed.Editor;
  let caretManager: CaretManager;
  let topSandbox: sinon.SinonSandbox;
  let wedroot: HTMLElement;
  let ps: NodeListOf<Element>;
  let guiRoot: Element;
  let titles: NodeListOf<Element>;

  before(async () => {
    const provider =
      new DataProvider("/base/build/standalone/lib/tests/wed_test_data/");
    source = await provider.getText("wildcard_converted.xml");
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
        titles = guiRoot.getElementsByClassName("title");
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
    const attr = attrName!.closest("._attribute")!;
    assert.isTrue(attr.classList.contains("_readonly"));

    const fooBaz = bar.getAttributeNode("foo:baz");
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

  it("prevents pasting in readonly elements and attributes", () => {
    const initial = editor.dataRoot.querySelector("bar")!;
    const initialGUI =
      caretManager.fromDataLocation(initial, 0)!.node as Element;
    assert.isTrue(initialGUI.classList.contains("_readonly"));
    caretManager.setCaret(initial, 0);
    const initialValue = initial.textContent;

    // Synthetic event
    let event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => "a",
    });
    editor.$guiRoot.trigger(event);
    assert.equal(initial.textContent, initialValue);
    dataCaretCheck(editor, initial, 0, "final position");

    // Check that removing _readonly would make the paste work. This proves that
    // the only thing that was preventing pasting was _readonly.
    initialGUI.classList.remove("_readonly");
    caretManager.setCaret(initial, 0);

    // We have to create a new event.
    event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => "a",
    });

    editor.$guiRoot.trigger(event);
    assert.equal(initial.textContent, `a${initialValue}`);
    dataCaretCheck(editor, initial.firstChild!, 4, "final position");
  });

  it("prevents cutting from readonly elements", async () => {
    const initial = editor.dataRoot.querySelector("bar")!;
    const initialGUI =
      caretManager.fromDataLocation(initial, 0)!.node as Element;
    assert.isTrue(initialGUI.classList.contains("_readonly"));
    const initialValue = initial.textContent!;

    const guiStart = caretManager.fromDataLocation(initial.firstChild!, 1)!;
    caretManager.setCaret(guiStart);
    caretManager.setRange(
      guiStart,
      caretManager.fromDataLocation(initial.firstChild!, 2)!);

    // Synthetic event
    editor.$guiRoot.trigger(new $.Event("cut"));
    await delay(1);

    assert.equal(initial.textContent, initialValue);
    // Try again, after removing _readonly so that we prove the only reason the
    // cut did not work is that _readonly was present.
    initialGUI.classList.remove("_readonly");
    editor.$guiRoot.trigger(new $.Event("cut"));

    await delay(1);
    assert.equal(initial.textContent,
                 initialValue.slice(0, 1) + initialValue.slice(2));
  });

  describe("a context menu has the complex pattern action", () => {
    it("when invoked on an element allowed due to a complex pattern", () => {
      activateContextMenu(editor,
                          guiRoot.querySelector("._readonly ._element_name")!);
      contextMenuHasOption(editor, /Complex name pattern/, 1);
    });

    it("when invoked on an attribute allowed due to a complex pattern", () => {
      activateContextMenu(
        editor,
        guiRoot.querySelector("._readonly ._attribute_value")!);
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
    it("element has no actions that can transform the document", () => {
      activateContextMenu(editor,
                          guiRoot.querySelector("._readonly ._element_name")!);
      contextMenuHasNoTransforms();
    });

    it("attribute has no actions that can transform the document", () => {
      activateContextMenu(
        editor,
        guiRoot.querySelector("._readonly ._attribute_value")!);
      contextMenuHasNoTransforms();
    });
  });
});
