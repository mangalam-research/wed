/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as salve from "salve";
import * as sinon from "sinon";

import { GUISelector } from "wed/gui-selector";
import * as inputTriggerFactory from "wed/input-trigger-factory";
import * as key from "wed/key";
import { BACKSPACE, DELETE, ENTER } from "wed/key-constants";
import { Mode } from "wed/mode";
import * as onerror from "wed/onerror";
import { Options } from "wed/options";
import * as wed from "wed/wed";

import { DataProvider, makeFakePasteEvent, makeWedRoot,
         setupServer } from "../util";

const assert = chai.assert;

const options: Options = {
  schema: "",
  mode: {
    path: "wed/modes/generic/generic",
    options: {
      metadata: "/base/build/schemas/tei-metadata.json",
    },
  },
};

// This is an ad-hoc function meant for these tests *only*. The XML
// serialization adds an xmlns declaration that we don't care for. So...
function cleanNamespace(str: string): string {
  return str.replace(/ xmlns=".*?"/, "");
}

describe("input_trigger_factory", () => {
  let wedroot: HTMLElement;
  let topSandbox: sinon.SinonSandbox;
  let editor: wed.Editor;
  let mode: Mode;
  let genericSrc: string;
  let source2: string;
  let source3: string;
  const srcStack: string[] = [];

  // tslint:disable-next-line:mocha-no-side-effect-code
  const pSelector = GUISelector.fromDataSelector(
    "p",
    // tslint:disable-next-line:no-http-string
    { "": "http://www.tei-c.org/ns/1.0" });

  before(() => {
    const provider = new DataProvider("/base/build/");
    const dataDir = "standalone/lib/tests/input_trigger_test_data";

    return Promise.all([
      provider.getText("schemas/tei-simplified-rng.js").then((schema) => {
        // Resolve the schema to a grammar.
        options.schema = salve.constructTree(schema);
      }),
      provider.getText(`${dataDir}/source_converted.xml`).then((data) => {
        genericSrc = data;
        srcStack.push(genericSrc);
      }),
      provider.getText(`${dataDir}/source2_converted.xml`).then((data) => {
        source2 = data;
      }),
      provider.getText(`${dataDir}/source3_converted.xml`).then((data) => {
        source3 = data;
      }),
    ]);
  });

  before(() => {
    topSandbox = sinon.sandbox.create({
      useFakeServer: true,
    });
    setupServer(topSandbox.server);
  });

  beforeEach(() => {
    wedroot = makeWedRoot(document);
    document.body.appendChild(wedroot);
    editor = new wed.Editor(wedroot, options);
    return editor.init(srcStack[0]).then(() => {
      mode = editor.modeTree.getMode(editor.guiRoot);
    });
  });

  afterEach(() => {
    if (editor !== undefined) {
      editor.destroy();
    }
    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    assert.isFalse(onerror.is_terminating(),
                   "test caused an unhandled exception to occur");
    // We don't reload our page so we need to do this.
    onerror.__test.reset();
    document.body.removeChild(wedroot);
  });

  after(() => {
    if (topSandbox !== undefined) {
      topSandbox.restore();
    }
  });

  function mit(name: string, fn: () => void): void {
    it(name, () => {
      fn();
      // We want to make sure the changes do not screw up validation and we
      // want to catch these errors in the test, rather than the hook.
      // tslint:disable-next-line:no-any
      (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
    });
  }

  describe("makeSplitMergeInputTrigger creates an InputTrigger that", () => {
    // tslint:disable:mocha-no-side-effect-code
    mit("handles a split triggered by a keypress event", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, key.makeKey(";"), BACKSPACE, DELETE);

      let ps = editor.dataRoot.querySelectorAll("p");
      editor.caretManager.setCaret(ps[ps.length - 1].firstChild, 4);
      editor.type(";");

      ps = editor.dataRoot
        .querySelectorAll("body p") as NodeListOf<HTMLParagraphElement>;
      assert.equal(ps.length, 2);
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah</p>");
      assert.equal(cleanNamespace(ps[1].outerHTML),
                   "<p> blah <term>blah</term><term>blah2</term> blah.</p>");
    });

    mit("handles a split triggered by a keydown event", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, ENTER, BACKSPACE, DELETE);

      let ps = editor.dataRoot.getElementsByTagName("p");
      editor.caretManager.setCaret(ps[ps.length - 1].firstChild, 4);
      editor.type(ENTER);

      ps = editor.dataRoot
        .querySelectorAll("body p") as NodeListOf<HTMLParagraphElement>;
      assert.equal(ps.length, 2);
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Blah</p>");
      assert.equal(cleanNamespace(ps[1].outerHTML),
                   "<p> blah <term>blah</term><term>blah2</term> blah.</p>");
    });

    mit("handles a split triggered by a paste event", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, key.makeKey(";"), BACKSPACE, DELETE);

      let ps = editor.dataRoot.querySelectorAll("body p");
      assert.equal(ps.length, 1);

      // Synthetic event
      const event = makeFakePasteEvent({
        types: ["text/plain"],
        getData: () => "ab;cd;ef",
      });
      editor.caretManager.setCaret(ps[0], 0);
      editor.$guiRoot.trigger(event);

      ps = editor.dataRoot.querySelectorAll("body p");
      assert.equal(ps.length, 3);
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>");
      assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>");
      assert.equal(
        cleanNamespace(ps[2].outerHTML),
        "<p>efBlah blah <term>blah</term><term>blah2</term> blah.</p>");
    });
  });

  describe("makeSplitMergeInputTrigger creates an InputTrigger that", () => {
    before(() => {
      srcStack.unshift(source2);
    });
    after(() => {
      srcStack.shift();
    });

    mit("backspaces in phantom text", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, ENTER, BACKSPACE, DELETE);

      editor.caretManager.setCaret(
        editor.guiRoot.querySelector(".p>.ref")!.firstChild, 1);
      editor.type(BACKSPACE);

      assert.equal(editor.dataRoot.querySelectorAll("body>p").length, 1);
    });

    mit("deletes in phantom text", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, ENTER, BACKSPACE, DELETE);

      editor.caretManager.setCaret(
        editor.guiRoot.querySelector(".p>.ref")!.lastChild!.previousSibling, 0);
      editor.type(DELETE);

      assert.equal(editor.dataRoot.querySelectorAll("body>p").length, 1);
    });
  });

  describe("makeSplitMergeInputTrigger creates an InputTrigger that", () => {
    before(() => {
      srcStack.unshift(source3);
    });
    after(() => {
      srcStack.shift();
    });

    mit("merges on BACKSPACE", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, ENTER, BACKSPACE, DELETE);

      let ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 2,
                   "there should be 2 paragraphs before backspacing");

      editor.caretManager.setCaret(ps[1].firstChild, 0);
      editor.type(BACKSPACE);

      ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 1,
                   "there should be 1 paragraph after backspacing");
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");
    });

    mit("merges on BACKSPACE, and can undo", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, ENTER, BACKSPACE, DELETE);

      let ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 2,
                   "there should be 2 paragraphs before backspacing");

      editor.caretManager.setCaret(ps[1].firstChild, 0);
      editor.type(BACKSPACE);

      ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 1,
                   "there should be 1 paragraph after backspacing");
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");

      editor.undo();

      ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 2, "there should be 2 paragraphs after undo");
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Bar</p>");
      assert.equal(cleanNamespace(ps[1].outerHTML), "<p>Foo</p>");
    });

    mit("merges on DELETE", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, ENTER, BACKSPACE, DELETE);

      let ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 2,
                   "there should be 2 paragraphs before delete");

      editor.caretManager.setCaret(ps[0].lastChild,
                                   ps[0].lastChild!.nodeValue!.length);
      editor.type(DELETE);

      ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 1,
                   "there should be 1 paragraph after delete");
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");
    });

    mit("merges on DELETE, and can undo", () => {
      inputTriggerFactory.makeSplitMergeInputTrigger(
        editor, mode, pSelector, ENTER, BACKSPACE, DELETE);

      let ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 2,
                   "there should be 2 paragraphs before delete");

      editor.caretManager.setCaret(ps[0].lastChild,
                                   ps[0].lastChild!.nodeValue!.length);
      editor.type(DELETE);

      ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 1,
                   "there should be 1 paragraph after delete");
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>BarFoo</p>");

      editor.undo();
      ps = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps.length, 2, "there should be 2 paragraphs after undo");
      assert.equal(cleanNamespace(ps[0].outerHTML), "<p>Bar</p>");
      assert.equal(cleanNamespace(ps[1].outerHTML), "<p>Foo</p>");
    });
  });
});

// LocalWords:  chai jquery tei InputTrigger
