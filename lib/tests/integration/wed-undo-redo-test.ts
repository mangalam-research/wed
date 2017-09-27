/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as mergeOptions from "merge-options";
import * as sinon from "sinon";

import { CaretManager } from "wed/caret-manager";
import * as keyConstants from "wed/key-constants";
import * as log from "wed/log";
import * as onerror from "wed/onerror";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";
import { DataProvider, makeWedRoot, setupServer } from "../util";
import { caretCheck, getAttributeNamesFor,
         getAttributeValuesFor, getElementNameFor } from "../wed-test-util";

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

describe("wed undo redo:", () => {
  let source: string;
  let editor: wed.Editor;
  let caretManager: CaretManager;
  let topSandbox: sinon.SinonSandbox;
  let wedroot: HTMLElement;
  let ps: NodeListOf<Element>;
  let titles: NodeListOf<Element>;

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
        ps = editor.guiRoot.querySelectorAll(".body .p");
        titles = editor.guiRoot.getElementsByClassName("title");
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
    log.clearAppenders();
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

  it("undo undoes typed text as a group", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    const parent = initial.parentNode!;
    caretManager.setCaret(initial, 0);

    // There was a version of wed which would fail this test. The fake caret
    // would be inserted inside the text node, which would throw off the
    // nodeToPath/pathToNode calculations.
    editor.type("blah");
    assert.equal(initial.nodeValue, "blahabcd", "text after edit");
    assert.equal(parent.childNodes.length, 3);

    editor.undo();
    assert.equal(initial.nodeValue, "abcd", "text after undo");
    assert.equal(parent.childNodes.length, 3);
    caretCheck(editor, initial, 0, "caret after undo");
  });

  it("undo undoes typed text as a group (inside element)", () => {
    // Text node inside title.
    const title = titles[0];
    const titleData = $.data(title, "wed_mirror_node");

    const trs = editor.modeTree.getMode(titleData.firstChild)
      .getContextualActions(["insert"], "hi", titleData.firstChild, 2);

    caretManager.setCaret(titleData.firstChild, 2);

    trs[0].execute({ node: undefined, name: "hi" });

    editor.type("a");
    const hi = titleData.firstElementChild;
    const hiText = hi.firstChild;
    assert.equal(hiText.textContent, "a", "text after edit");
    assert.equal(titleData.childNodes.length, 3);

    editor.undo();
    editor.type(keyConstants.CTRLEQ_Z);
  });

  it("redo redoes typed text as a group", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    const parent = initial.parentNode!;
    caretManager.setCaret(initial, 0);

    // There was a version of wed which would fail this test. The fake caret
    // would be inserted inside the text node, which would throw off the
    // nodeToPath/pathToNode calculations.

    editor.type("blah");
    assert.equal(initial.nodeValue, "blahabcd", "text after edit");
    assert.equal(parent.childNodes.length, 3);

    editor.undo();
    assert.equal(initial.nodeValue, "abcd", "text after undo");
    assert.equal(parent.childNodes.length, 3);
    caretCheck(editor, initial, 0, "caret after undo");

    editor.redo();
    assert.equal(initial.nodeValue, "blahabcd", "text after undo");
    assert.equal(parent.childNodes.length, 3);
    caretCheck(editor, initial, 4, "caret after redo");
  });

  it("undoing an attribute value change undoes the value change", () => {
    let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    caretManager.setCaret(initial, 4);
    assert.equal(initial.data, "rend_value", "initial value");
    editor.type("blah");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, "rendblah_value");
    caretCheck(editor, initial, 8, "caret after text insertion");

    // Check that the data is also modified
    const dataNode = editor.toDataNode(initial) as Attr;
    assert.equal(dataNode.value, "rendblah_value");

    editor.undo();

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    assert.equal(initial.data, "rend_value");
    caretCheck(editor, initial, 4, "caret after undo");

    // Check that the data change has been undone.
    assert.equal(dataNode.value, "rend_value", "value undone");
  });

  it("undoing an attribute addition undoes the addition", () => {
    const p = ps[0];
    const dataP = editor.toDataNode(p);
    const elName = getElementNameFor(p)!;
    assert.equal(getAttributeValuesFor(p).length, 0, "no attributes");
    const trs = editor.modeTree.getMode(elName).getContextualActions(
      ["add-attribute"], "abbr", elName, 0);

    caretManager.setCaret(elName.firstChild, 0);
    caretCheck(editor, elName.firstChild!, 0,
               "the caret should be in the element name");
    trs[0].execute({ node: dataP, name: "abbr" });
    const attrVals = getAttributeValuesFor(p);
    assert.equal(attrVals.length, 1, "one attribute");
    caretCheck(editor, attrVals[0].firstChild!, 0,
               "the caret should be in the attribute value");

    editor.undo();
    assert.equal(getAttributeValuesFor(p).length, 0, "no attributes");
    // We would ideally want the caret to be back in the element name but
    // there's currently an issue with doing this.
    caretCheck(editor, p, 1, "the caret should be in a reasonable position");
  });

  it("undoing an attribute deletion undoes the deletion", () => {
    const p = ps[7];
    const dataP = editor.toDataNode(p) as Element;
    let attrNames = getAttributeNamesFor(p);
    let attrValues = getAttributeValuesFor(p);
    const initialValue = attrValues[0].textContent;
    const initialLength = attrValues.length;
    assert.isTrue(initialLength > 0, "the paragraph should have attributes");
    const attr = editor.toDataNode(attrValues[0]) as Attr;
    const decodedName = attrNames[0].textContent!;
    const trs = editor.modeTree.getMode(attr).getContextualActions(
      ["delete-attribute"], decodedName, attr);

    caretManager.setCaret(attr, 0);
    caretCheck(editor, attrValues[0].firstChild!, 0,
               "the caret should be in the attribute");
    trs[0].execute({ node: attr, name: decodedName });
    attrValues = getAttributeValuesFor(p);
    assert.equal(attrValues.length, initialLength - 1,
                 "one attribute should be gone");
    caretCheck(editor, attrValues[0].firstChild!, 0,
               "the caret should be in the first attribute value");

    assert.isNull(attr.ownerElement,
                  "the old attribute should not have an onwer element");
    assert.isNull(dataP.getAttribute(attr.name));

    editor.undo();

    attrValues = getAttributeValuesFor(p);
    attrNames = getAttributeNamesFor(p);
    assert.equal(attrValues.length, initialLength,
                 "the attribute should be back");
    assert.equal(attrNames[0].textContent, decodedName,
                 "the first attribute should be the one that was deleted");
    assert.equal(attrValues[0].textContent, initialValue,
                 "the attribute should have its initial value");
    caretCheck(editor, attrValues[0].firstChild!, 0,
               "the caret should be in the first attribute value");
  });
});
