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
import { DataProvider, makeWedRoot, setupServer } from "../util";

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

describe("wed location bar", () => {
  let source: string;
  let editor: wed.Editor;
  let caretManager: CaretManager;
  let topSandbox: sinon.SinonSandbox;
  let wedroot: HTMLElement;
  let locationBar: HTMLElement;

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
        // tslint:disable-next-line:no-any
        locationBar = (editor as any).wedLocationBar;
      });
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
    (locationBar as any) = undefined;

    if (topSandbox !== undefined) {
      topSandbox.restore();
    }
    document.body.removeChild(wedroot);
  });

  it("ignores placeholders", () => {
    const ph = editor.guiRoot.getElementsByClassName("_placeholder")[0];
    caretManager.setCaret(ph, 0);
    assert.equal(
      // Normalize all spaces to a regular space with ``replace``.
      locationBar.textContent!.replace(/\s+/g, " "),
      " TEI / teiHeader / fileDesc / publicationStmt / p ");
  });

  it("ignores phantom parents", () => {
    const p = editor.guiRoot.querySelector(".ref>._text._phantom")!;
    // We are cheating here. Instead of creating a mode what would put
    // children elements inside of a phantom element we manually add a child.
    // tslint:disable-next-line:no-inner-html
    p.innerHTML = `<span>foo</span>${p.innerHTML}`;
    caretManager.setCaret(p.firstChild, 0);
    assert.equal(
      // Normalize all spaces to a regular space with ``replace``.
      locationBar.textContent!.replace(/\s+/g, " "),
      " TEI / text / body / p / ref ");
  });
});
