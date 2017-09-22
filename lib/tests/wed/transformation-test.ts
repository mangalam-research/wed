/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as mergeOptions from "merge-options";
import * as salve from "salve";
import * as sinon from "sinon";

import * as log from "wed/log";
import * as onerror from "wed/onerror";
import { Options } from "wed/options";
import * as transformation from "wed/transformation";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";

import { DataProvider, makeWedRoot, setupServer } from "../util";

const assert = chai.assert;

const options: Options = {
  schema: "",
  mode: {
    path: "wed/modes/test/test-mode",
    options: {
      metadata: "/base/build/schemas/tei-metadata.json",
    },
  },
};

describe("transformation", () => {
  let source: string;
  let editor: wed.Editor;
  let topSandbox: sinon.SinonSandbox;
  let wedroot: HTMLElement;

  before(() => {
    const provider = new DataProvider("/base/build/");
    const dataDir = "standalone/lib/tests/wed_test_data";

    return Promise.all([
      provider.getText("schemas/tei-simplified-rng.js").then((schema) => {
        // Resolve the schema to a grammar.
        options.schema = salve.constructTree(schema);
      }),
      provider.getText(`${dataDir}/source_converted.xml`).then((data) => {
        source = data;
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
    editor = new wed.Editor(wedroot,
                            mergeOptions({}, globalConfig.config, options));
    return editor.init(source);
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
    log.clearAppenders();
    document.body.removeChild(wedroot);
  });

  after(() => {
    if (topSandbox !== undefined) {
      topSandbox.restore();
    }
  });

  describe("swapWithPreviousHomogeneousSibling", () => {
    it("swaps", () => {
      const ps = editor.dataRoot.querySelectorAll("body>p");
      transformation.swapWithPreviousHomogeneousSibling(editor, ps[1]);

      const ps2 = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps[0], ps2[1]);
      assert.equal(ps2[1], ps[0]);
    });

    it("does nothing if the element is the first child", () => {
      const ps = editor.dataRoot.querySelectorAll("publicationStmt>p");
      transformation.swapWithPreviousHomogeneousSibling(editor, ps[0]);

      const ps2 = editor.dataRoot.querySelectorAll("publicationStmt>p");
      assert.equal(ps[0], ps2[0]);
    });

    it("does nothing if the previous element is not homogeneous", () => {
      const divs = editor.dataRoot.querySelectorAll("body>div");
      transformation.swapWithPreviousHomogeneousSibling(editor, divs[0]);

      const divs2 = editor.dataRoot.querySelectorAll("body>div");
      assert.equal(divs[0].previousSibling, divs2[0].previousSibling);
    });
  });

  describe("swapWithNextHomogeneousSibling", () => {
    it("swaps", () => {
      const ps = editor.dataRoot.querySelectorAll("body>p");
      transformation.swapWithNextHomogeneousSibling(editor, ps[0]);

      const ps2 = editor.dataRoot.querySelectorAll("body>p");
      assert.equal(ps[0], ps2[1]);
      assert.equal(ps2[1], ps[0]);
    });

    it("does nothing if the element is the last child", () => {
      const ps = editor.dataRoot.querySelectorAll("publicationStmt>p");
      transformation.swapWithNextHomogeneousSibling(editor, ps[ps.length - 1]);

      const ps2 = editor.dataRoot.querySelectorAll("publicationStmt>p");
      assert.equal(ps[ps.length - 1], ps2[ps.length - 1]);
    });

    it("does nothing if the next element is not homogeneous", () => {
      const divs = editor.dataRoot.querySelectorAll("body>div");
      transformation.swapWithNextHomogeneousSibling(editor, divs[0]);

      const divs2 = editor.dataRoot.querySelectorAll("body>div");
      assert.equal(divs[0].previousSibling, divs2[0].previousSibling);
    });
  });
});

//  LocalWords:  rng wedframe RequireJS dropdown Ctrl Mangalam MPL
//  LocalWords:  Dubeau previousSibling nextSibling abcd jQuery xmlns
//  LocalWords:  sourceDesc publicationStmt titleStmt fileDesc txt
//  LocalWords:  ajax xml moveCaretRight moveCaretLeft teiHeader html
//  LocalWords:  innerHTML nodeValue seekCaret nodeToPath pathToNode
//  LocalWords:  mouseup mousedown unhandled requirejs btn gui metas
//  LocalWords:  wedroot tei domutil onerror jquery chai
