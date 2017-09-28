/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as mergeOptions from "merge-options";
import * as sinon from "sinon";

import { CaretManager } from "wed/caret-manager";
import * as log from "wed/log";
import * as onerror from "wed/onerror";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";
import { DataProvider, makeWedRoot, setupServer } from "../util";
import { caretCheck, getAttributeNamesFor, getAttributeValuesFor,
         getElementNameFor } from "../wed-test-util";

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

describe("wed transformation:", () => {
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

  it("doing an attribute addition changes the data", () => {
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

    const dataNode = editor.toDataNode(attrVals[0]) as Attr;
    assert.equal(dataNode.value, "");
    assert.equal(dataNode.name, "abbr");
  });

  it("doing an attribute deletion changes the data", () => {
    const p = ps[7];
    const dataP = editor.toDataNode(p) as Element;
    const attrNames = getAttributeNamesFor(p);
    let attrValues = getAttributeValuesFor(p);
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
  });

  it("unwraps elements", () => {
    const initial = editor.dataRoot.getElementsByTagName("title")[0];

    // Make sure we are looking at the right thing.
    assert.equal(initial.childNodes.length, 1);
    assert.equal(initial.firstChild!.textContent, "abcd");
    caretManager.setCaret(initial, 0);
    let caret = caretManager.getNormalizedCaret()!;
    assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");

    let trs = editor.modeTree.getMode(initial)
      .getContextualActions(["wrap"], "hi", initial, 0);

    caretManager.setCaret(initial.firstChild, 1);
    caret = caretManager.getNormalizedCaret()!;
    caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

    trs[0].execute({ node: undefined, name: "hi" });

    const node = initial.getElementsByTagName("hi")[0];
    trs = editor.modeTree.getMode(node).getContextualActions(["unwrap"], "hi",
                                                             node, 0);

    trs[0].execute({ node, element_name: "hi" });
    assert.equal(initial.childNodes.length, 1, "length after unwrap");
    assert.equal(initial.firstChild!.textContent, "abcd");
  });

  it("wraps elements in elements (offset 0)", () => {
    const initial = editor.dataRoot.querySelectorAll("body>p")[4];

    // Make sure we are looking at the right thing.
    assert.equal(initial.childNodes.length, 1);
    assert.equal(initial.firstChild!.textContent, "abcdefghij");

    const trs = editor.modeTree.getMode(initial)
      .getContextualActions(["wrap"], "hi", initial, 0);

    caretManager.setCaret(initial.firstChild, 3);
    let caret = caretManager.getNormalizedCaret()!;
    caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

    trs[0].execute({ node: undefined, name: "hi" });

    assert.equal(
      initial.outerHTML,
      `<p xmlns="http://www.tei-c.org/ns/1.0">abc<hi>de</hi>fghij</p>`);
    assert.equal(initial.childNodes.length, 3, "length after first wrap");

    caret = caretManager.fromDataLocation(initial.firstChild!, 0)!;
    caretManager.setRange(
      caret, caretManager.fromDataLocation(initial.lastChild!, 0)!);

    trs[0].execute({ node: undefined, name: "hi" });

    assert.equal(initial.outerHTML,
                 `<p xmlns="http://www.tei-c.org/ns/1.0"><hi>abc<hi>de</hi>\
</hi>fghij</p>`);
    assert.equal(initial.childNodes.length, 2, "length after second wrap");
  });

  it("wraps elements in elements (offset === nodeValue.length)", () => {
    const initial = editor.dataRoot.querySelectorAll("body>p")[4];

    // Make sure we are looking at the right thing.
    assert.equal(initial.childNodes.length, 1);
    assert.equal(initial.firstChild!.textContent, "abcdefghij");

    const trs = editor.modeTree.getMode(initial).getContextualActions(
      ["wrap"], "hi", initial, 0);

    let caret = caretManager.fromDataLocation(initial.firstChild!, 3)!;
    caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

    trs[0].execute({ node: undefined, name: "hi" });

    assert.equal(
      initial.outerHTML,
      `<p xmlns="http://www.tei-c.org/ns/1.0">abc<hi>de</hi>fghij</p>`);
    assert.equal(initial.childNodes.length, 3, "length after first wrap");

    // We can't set this to the full length of the node value on Chrome because
    // Chrome will move the range into the <div> that you see above in the
    // innerHTML test. :-/

    caret = caretManager.fromDataLocation(
      initial.firstChild!,
      initial.firstChild!.textContent!.length - 1)!;
    caretManager.setRange(
      caret, caretManager.fromDataLocation(
        initial.lastChild!,
        initial.lastChild!.textContent!.length)!);

    trs[0].execute({ node: undefined, name: "hi" });

    assert.equal(
      initial.outerHTML,
      `<p xmlns="http://www.tei-c.org/ns/1.0">ab<hi>c<hi>de</hi>fghij</hi>\
</p>`);
    assert.equal(initial.childNodes.length, 2, "length after second wrap");
  });

  it("wraps elements in elements (no limit case)", () => {
    const initial = editor.dataRoot.querySelectorAll("body>p")[4];

    // Make sure we are looking at the right thing.
    assert.equal(initial.childNodes.length, 1);
    assert.equal(initial.firstChild!.textContent, "abcdefghij");

    const trs = editor.modeTree.getMode(initial)
      .getContextualActions(["wrap"], "hi", initial, 0);

    let caret = caretManager.fromDataLocation(initial.firstChild!, 3)!;
    caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

    trs[0].execute({ node: undefined, name: "hi" });

    assert.equal(initial.childNodes.length, 3, "length after first wrap");
    assert.equal(
      initial.outerHTML,
      `<p xmlns="http://www.tei-c.org/ns/1.0">abc<hi>de</hi>fghij</p>`);

    caret = caretManager.fromDataLocation(initial.firstChild!, 2)!;
    caretManager.setRange(
      caret,
      caretManager.fromDataLocation(initial.lastChild!, 2)!);

    trs[0].execute({ node: undefined, name: "hi" });

    assert.equal(initial.childNodes.length, 3, "length after second wrap");
    assert.equal(initial.outerHTML,
                 `<p xmlns="http://www.tei-c.org/ns/1.0">ab<hi>c<hi>de</hi>fg\
</hi>hij</p>`);
  });

  it("wraps text in elements (no limit case)", () => {
    const initial = editor.dataRoot.querySelectorAll("body>p")[4];

    // Make sure we are looking at the right thing.
    assert.equal(initial.childNodes.length, 1);
    assert.equal(initial.firstChild!.textContent, "abcdefghij");

    const trs = editor.modeTree.getMode(initial)
      .getContextualActions(["wrap"], "hi", initial, 0);

    const caret = caretManager.fromDataLocation(initial.firstChild!, 0)!;
    caretManager.setRange(
      caret, caret.makeWithOffset(initial.firstChild!.textContent!.length));

    trs[0].execute({ node: undefined, name: "hi" });

    assert.equal(initial.childNodes.length, 1, "length after wrap");
    assert.equal(
      initial.outerHTML,
      `<p xmlns="http://www.tei-c.org/ns/1.0"><hi>abcdefghij</hi></p>`);
  });

  // This test only checks that the editor does not crash.
  it("autofills in the midst of text", () => {
    const p = editor.dataRoot.querySelector("body>p")!;
    assert.isTrue(p.firstChild!.nodeType === Node.TEXT_NODE,
                  "we should set our caret in a text node");
    caretManager.setCaret(p.firstChild, 3);
    const trs = editor.modeTree.getMode(p.firstChild!).getContextualActions(
      ["insert"], "biblFull", p.firstChild!, 0);

    trs[0].execute({ node: undefined, name: "biblFull" });
  });
});