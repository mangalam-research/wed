/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as transformation from "wed/transformation";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";

import { EditorSetup } from "../wed-test-util";

const assert = chai.assert;

describe("transformation", () => {
  let setup: EditorSetup;
  let editor: wed.Editor;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/source_converted.xml",
      globalConfig.config,
      document);
    ({ editor } = setup);
    return setup.init();
  });

  afterEach(() => {
    setup.reset();
  });

  after(() => {
    setup.restore();
    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
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
