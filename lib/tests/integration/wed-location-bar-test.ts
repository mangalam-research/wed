/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "wed/caret-manager";
import { Editor } from "wed/editor";

import * as globalConfig from "../base-config";
import { EditorSetup } from "../wed-test-util";

const assert = chai.assert;

describe("wed location bar", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let caretManager: CaretManager;
  let locationBar: HTMLElement;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/source_converted.xml",
      globalConfig.config,
      document);
    ({ editor } = setup);
    return setup.init().then(() => {
      caretManager = editor.caretManager;
      // tslint:disable-next-line:no-any
      locationBar = (editor as any).wedLocationBar;
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
    // tslint:disable-next-line:no-any
    (locationBar as any) = undefined;
  });

  it("ignores placeholders", () => {
    const ph = editor.guiRoot.getElementsByClassName("_placeholder")[0];
    caretManager.setCaret(ph, 0);
    assert.equal(
      // Normalize all spaces to a regular space with ``replace``.
      locationBar.textContent!.replace(/\s+/g, " "),
      "@ TEI / teiHeader / fileDesc / publicationStmt / p ");
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
      "@ TEI / text / body / p / ref ");
  });
});
