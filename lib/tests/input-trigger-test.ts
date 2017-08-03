/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { assert } from "chai";
import * as mergeOptions from "merge-options";
import * as salve from "salve";

import { GUISelector } from "wed/gui-selector";
import { InputTrigger } from "wed/input-trigger";
import { makeSplitMergeInputTrigger } from "wed/input-trigger-factory";
import * as key from "wed/key";
import { BACKSPACE, DELETE, ENTER } from "wed/key-constants";
import { Mode } from "wed/mode";
import { Options} from "wed/options";
import * as wed from "wed/wed";
import * as globalConfig from "./base-config";
import { DataProvider, makeFakePasteEvent } from "./global";

const options: Options = {
  schema: "",
  mode: {
    path: "wed/modes/generic/generic",
    options: {
      metadata: "/build/schemas/tei-metadata.json",
    },
    // We set a submode that operates on teiHeader so as to be able to test
    // that input triggers operate only on their own region.
    submode: {
      method: "selector",
      selector: "TEI>teiHeader",
      mode: {
        path: "wed/modes/generic/generic",
        options: {
          metadata: "/build/schemas/tei-metadata.json",
        },
      },
    },
  },
};

// This is an ad-hoc function meant for these tests *only*. The XML
// serialization adds an xmlns declaration that we don't care for. So...
function cleanNamespace(str: string): string {
  return str.replace(/ xmlns=".*?"/, "");
}

describe("InputTrigger", () => {
  // tslint:disable-next-line:no-any
  let editor: any;
  let mode: Mode<{}>;
  const mappings: Record<string, string> =
    // tslint:disable-next-line:no-http-string
    { "": "http://www.tei-c.org/ns/1.0" };
  let pSelector: GUISelector;
  let pInBody: HTMLElement;
  let source: string;

  before(() => {
    pSelector = GUISelector.fromDataSelector("p", mappings);
    const provider = new DataProvider("");
    return Promise.all([
      provider.getText("../schemas/tei-simplified-rng.js")
        .then((schema) => {
          // Resolve the schema to a grammar.
          options.schema = salve.constructTree(schema);
        }),
      provider
        .getText("lib/tests/input_trigger_test_data/source_converted.xml")
        .then((xml) => {
          source = xml;
        }),
    ]);
  });

  beforeEach(() => {
    editor = new wed.Editor();
    const wedroot =
      (window.parent.document.getElementById("wedframe") as HTMLIFrameElement)
      .contentWindow.document.getElementById("wedroot");
    return editor.init(wedroot, mergeOptions({}, globalConfig.config, options),
                       source)
      .then(() => {
        mode = editor.modeTree.getMode(editor.gui_root);
        pInBody = editor.data_root.querySelector("body p");
      });
  });

  afterEach(() => {
    if (editor !== undefined) {
      editor.destroy();
    }
    editor = undefined;
  });

  function pasteTest(p: HTMLElement): number {
    const trigger = new InputTrigger(editor, mode, pSelector);
    let seen = 0;
    trigger.addKeyHandler(key.makeKey(";"), (evType, el) => {
      assert.equal(evType, "paste");
      assert.equal(el, p);
      seen++;
    });
    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => {
        return "abc;def";
      },
    });
    editor.caretManager.setCaret(p, 0);
    editor.$gui_root.trigger(event);
    return seen;
  }

  function keydownTest(p: HTMLElement): number {
    const trigger = new InputTrigger(editor, mode, pSelector);
    let seen = 0;
    trigger.addKeyHandler(ENTER,
                          (evType, el, ev) => {
                            assert.equal(evType, "keydown");
                            assert.equal(el, p);
                            ev.stopImmediatePropagation();
                            seen++;
                          });

    // Synthetic event
    editor.caretManager.setCaret(p, 0);
    editor.type(ENTER);
    return seen;
  }

  function keypressTest(p: HTMLElement): number {
    const trigger = new InputTrigger(editor, mode, pSelector);
    let seen = 0;
    trigger.addKeyHandler(key.makeKey(";"),
                          (evType, el, ev) => {
                            assert.equal(evType, "keypress");
                            assert.equal(el, p);
                            ev.stopImmediatePropagation();
                            seen++;
                          });

    editor.caretManager.setCaret(p, 0);
    editor.type(";");
    return seen;
  }

  it("triggers on paste events", () => {
    assert.equal(pasteTest(pInBody), 1);
  });

  it("triggers on keydown events", () => {
    assert.equal(keydownTest(pInBody), 1);
  });

  it("triggers on keypress events", () => {
    assert.equal(keypressTest(pInBody), 1);
  });

  it("does not trigger on unimportant input events", () => {
    const trigger = new InputTrigger(editor, mode, pSelector);
    let seen = 0;
    const p = pInBody;
    trigger.addKeyHandler(key.makeKey(";"), () => {
      seen++;
    });

    editor.caretManager.setCaret(p, 0);
    editor.type(":");
    assert.equal(seen, 0);
  });

  // The following tests need to modify the document in significant ways, so
  // we use input_trigger_factory to create an input_trigger that does
  // something significant.
  it("does not try to act on undo/redo changes", () => {
    makeSplitMergeInputTrigger(
      editor, mode, pSelector, key.makeKey(";"), BACKSPACE, DELETE);
    let ps = editor.data_root.querySelectorAll("body p");
    assert.equal(ps.length, 1);
    editor.caretManager.setCaret(ps[0], 0);
    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => {
        return "ab;cd;ef";
      },
    });
    editor.$gui_root.trigger(event);

    ps = editor.data_root.querySelectorAll("body p");
    assert.equal(ps.length, 3);
    assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>");
    assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>");
    assert.equal(cleanNamespace(ps[2].outerHTML),
                 "<p>efBlah blah <term>blah</term>" +
                 "<term>blah2</term> blah.</p>",
                 "first split: 3rd part");

    editor.undo();
    ps = editor.data_root.querySelectorAll("body p");
    assert.equal(ps.length, 1);
    assert.equal(cleanNamespace(ps[0].outerHTML),
                 "<p>Blah blah <term>blah</term>" +
                 "<term>blah2</term> blah.</p>",
                 "after undo");

    editor.redo();
    ps = editor.data_root.querySelectorAll("body p");
    assert.equal(ps.length, 3, "after redo: length");
    assert.equal(cleanNamespace(ps[0].outerHTML), "<p>ab</p>",
                 "after redo: 1st part");
    assert.equal(cleanNamespace(ps[1].outerHTML), "<p>cd</p>",
                 "after redo: 2nd part");
    assert.equal(cleanNamespace(ps[2].outerHTML),
                 "<p>efBlah blah <term>blah</term>" +
                 "<term>blah2</term> blah.</p>",
                 "after redo: 3rd part");
  });

  describe("respects mode regions", () => {
    let pInHeader: HTMLElement;

    beforeEach(() => {
      pInHeader = editor.data_root.querySelector("teiHeader p");
      assert.isDefined(pInHeader);
    });

    it("ignores paste events in the wrong region", () => {
      assert.equal(pasteTest(pInHeader), 0);
    });

    it("ignores on keydown events in the wrong region", () => {
      assert.equal(keydownTest(pInHeader), 0);
    });

    it("ignores on keypress events in the wrong region", () => {
      assert.equal(keypressTest(pInHeader), 0);
    });
  });
});

//  LocalWords:  requirejs wedroot wedframe metas js rng RequireJS cd
//  LocalWords:  Mangalam MPL Dubeau jquery jQuery tei keypress chai
//  LocalWords:  keydown InputTrigger
