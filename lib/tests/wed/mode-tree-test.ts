/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect, use } from "chai";
import * as mergeOptions from "merge-options";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
use(sinonChai);

import { Editor } from "wed/editor";
import { ModeTree } from "wed/mode-tree";
import { Options } from "wed/options";

import * as globalConfig from "../base-config";
import { expectError } from "../util";
import { EditorSetup } from "../wed-test-util";

const options: Options = {
  schema: "/base/build/schemas/tei-simplified-rng.js",
  mode: {
    path: "wed/modes/generic/generic",
    options: {
      metadata: "/base/build/schemas/tei-metadata.json",
    },
    // We set a submode that operates on teiHeader so as to be able to test
    // that input triggers operate only on their own region.
    submode: {
      method: "selector",
      selector: "p",
      mode: {
        path: "wed/modes/test/test-mode",
        options: {
          metadata: "/base/build/schemas/tei-metadata.json",
          nameSuffix: "1",
          hide_attributes: true,
          stylesheets: ["a.css", "b.css"],
        },
        submode: {
          method: "selector",
          selector: "teiHeader",
          mode: {
            path: "wed/modes/test/test-mode",
            options: {
              metadata: "/base/build/schemas/tei-metadata.json",
              nameSuffix: "2",
              stylesheets: ["b.css", "c.css"],
            },
          },
        },
      },
    },
  },
};

describe("ModeTree", () => {
  let setup: EditorSetup;
  let editor: Editor;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/source_converted.xml",
      mergeOptions(globalConfig.config, options),
      document);
    ({ editor } = setup);
    return setup.init();
  });

  after(() => {
    setup.restore();

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
  });

  // tslint:disable-next-line:no-empty
  describe("#init", () => {
    it("resolves to the mode tree", async () => {
      const tree = new ModeTree(editor, options.mode);
      const resolved = await tree.init();
      expect(resolved).to.equal(tree);
    });

    it("rejects if there are any wedOptions errors", async () => {
      const newOptions = mergeOptions({}, options.mode);
      const path = "tests/modes/failing-init";
      newOptions.path = path;

      const tree = new ModeTree(editor, newOptions);
      await expectError(() => tree.init(), Error, /^failed init$/);
    });
  });

  describe("#getMode", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    it("returns the top mode for the top GUI node", () => {
      const mode = tree.getMode(editor.guiRoot);
      expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
        .equal("Generic");
    });

    it("returns the top mode for the top data node", () => {
      const mode = tree.getMode(editor.dataRoot);
      expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
        .equal("Generic");
    });

    it("returns a submode for a GUI node governed by a submode", () => {
      const p = editor.guiRoot.querySelector(".p._real")!;
      const mode = tree.getMode(p);
      expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
        .equal("Test1");
    });

    it("returns a submode for a data node governed by a submode", () => {
      const p = editor.dataRoot.querySelector("p")!;
      const mode = tree.getMode(p);
      expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
        .equal("Test1");
    });

    it("returns the same submode for nodes governed by same submode", () => {
      const ps = editor.dataRoot.querySelectorAll("p");
      const mode = tree.getMode(ps[0]);
      expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
        .equal("Test1");
      for (const p of Array.from(ps)) {
        expect(mode).to.equal(tree.getMode(p));
      }
    });

    it("constrain submodes to the region of their parent mode", () => {
      // We have set a submode that matches teiHeader but that submode is a
      // child of a mode that matches p. The one teiHeader in the document is
      // not a child of p and so should not match the submode. teiHeader should
      // be governed by the top mode.
      const el = editor.dataRoot.querySelector("teiHeader")!;
      const mode = tree.getMode(el);
      expect(mode.getWedOptions()).to.have.deep.property("metadata.name")
        .equal("Generic");
    });

    it("fails if the node passed was not in the GUI or data trees", () => {
      expect(tree.getMode.bind(tree, editor.guiRoot.parentNode)).to.throw(
        Error,
        /^did not pass a node in the GUI or data tree$/);
    });
  });

  describe("#getWedOptions", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    it("returns the top options for the top GUI node", () => {
      const opts = tree.getWedOptions(editor.guiRoot);
      expect(opts).to.have.deep.property("metadata.name").equal("Generic");
    });

    it("returns the top options for the top data node", () => {
      const opts = tree.getWedOptions(editor.dataRoot);
      expect(opts).to.have.deep.property("metadata.name").equal("Generic");
    });

    it("returns the submode options for a GUI node governed by a submode",
       () => {
         const p = editor.guiRoot.querySelector(".p._real")!;
         const opts = tree.getWedOptions(p);
         expect(opts).to.have.deep.property("metadata.name").equal("Test1");
       });

    it("returns the submode options for a data node governed by a submode",
       () => {
         const p = editor.dataRoot.querySelector("p")!;
         const opts = tree.getWedOptions(p);
         expect(opts).have.deep.property("metadata.name").equal("Test1");
       });

    it("returns the same submode options for nodes governed by same submode",
       () => {
         const ps = editor.dataRoot.querySelectorAll("p");
         const opts = tree.getWedOptions(ps[0]);
         expect(opts).to.have.deep.property("metadata.name")
           .equal("Test1");
         for (const p of Array.from(ps)) {
           expect(opts).to.equal(tree.getWedOptions(p));
         }
       });

    it("constrain submodes to the region of their parent mode", () => {
      // We have set a submode that matches teiHeader but that submode is a
      // child of a mode that matches p. The one teiHeader in the document is
      // not a child of p and so should not match the submode. teiHeader should
      // be governed by the top mode.
      const el = editor.dataRoot.querySelector("teiHeader")!;
      const opts = tree.getWedOptions(el);
      expect(opts).to.have.deep.property("metadata.name").equal("Generic");
    });

    it("fails if the node passed was not in the GUI or data trees", () => {
      expect(tree.getMode.bind(tree, editor.guiRoot.parentNode)).to.throw(
        Error,
        /^did not pass a node in the GUI or data tree$/);
    });
  });

  describe("#getAttributeHandling", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    it("returns the right value for the top GUI node", () => {
      const handling = tree.getAttributeHandling(editor.guiRoot);
      expect(handling).to.equal("edit");
    });

    it("returns the right value for the top data node", () => {
      const handling = tree.getAttributeHandling(editor.guiRoot);
      expect(handling).to.equal("edit");
    });

    it("returns the right value for a GUI node governed by a submode", () => {
      const p = editor.guiRoot.querySelector(".p._real")!;
      const handling = tree.getAttributeHandling(p);
      expect(handling).to.equal("hide");
    });

    it("returns the right value for a data node governed by a submode", () => {
      const p = editor.dataRoot.querySelector("p")!;
      const handling = tree.getAttributeHandling(p);
      expect(handling).to.equal("hide");
    });
  });

  describe("#getAttributeHidingSpecs", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      // We modify the default to have test-mode do its default behavior
      // which is to hide *some* attributes.
      const localOptions: Options = mergeOptions({}, options);
      localOptions.mode.submode!.mode.options!.hide_attributes = false;
      tree = new ModeTree(editor, localOptions.mode);
      await tree.init();
    });

    it("returns the right value for the top GUI node", () => {
      const handling = tree.getAttributeHidingSpecs(editor.guiRoot);
      expect(handling).to.be.null;
    });

    it("returns the right value for the top data node", () => {
      const handling = tree.getAttributeHidingSpecs(editor.guiRoot);
      expect(handling).to.be.null;
    });

    it("returns the right value for a GUI node governed by a submode", () => {
      const p = editor.guiRoot.querySelector(".p._real")!;
      const handling = tree.getAttributeHidingSpecs(p);
      expect(handling).to.not.be.null;
    });

    it("returns the right value for a data node governed by a submode", () => {
      const p = editor.dataRoot.querySelector("p")!;
      const handling = tree.getAttributeHidingSpecs(p);
      expect(handling).to.not.be.null;
    });
  });

  describe("#getStylesheets", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    it("returns the stylesheets used, without duplicates", () => {
      expect(tree.getStylesheets()).to.have
        .members(["a.css", "b.css", "c.css"]);
    });
  });

  describe("#getStylesheets", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    it("returns the stylesheets used, without duplicates", () => {
      expect(tree.getStylesheets()).to.have
        .members(["a.css", "b.css", "c.css"]);
    });
  });

  describe("#getMaxLabelLevel", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    it("returns the maximum level set", () => {
      expect(tree.getMaxLabelLevel()).to.equal(2);
    });
  });

  describe("#getInitialLabelLevel", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    it("returns the level set by the same mode as the maximum", () => {
      expect(tree.getInitialLabelLevel()).to.equal(1);
    });
  });

  describe("#getValidators", () => {
    let tree: ModeTree;
    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    it("returns all the validators", () => {
      // We have two validators because the generic mode does not define one.
      // We use test-mode twice. So two validators.
      const validators = tree.getValidators();
      expect(validators).to.have.length(2);
      expect(validators).to.have.deep.property("[0].validateDocument");
    });
  });

  describe("#addDecoratorHandlers", () => {
    let tree: ModeTree;
    let sandbox: sinon.SinonSandbox;

    before(() => {
      sandbox = sinon.sandbox.create();
    });

    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    afterEach(() => {
      sandbox.reset();
    });

    after(() => {
      sandbox.restore();
    });

    it("calls addHandlers on all decorators", () => {
      // tslint:disable-next-line:no-any
      const root = (tree as any).root;
      const decorators =
        // tslint:disable-next-line:no-any
        root.reduceTopFirst((accumulator: any[], node: any) => {
          return accumulator.concat(node.decorator);
        }, []);
      const spies = [];
      for (const decorator of decorators) {
        spies.push(sandbox.spy(decorator, "addHandlers"));
      }
      tree.addDecoratorHandlers();
      for (const spy of spies) {
        expect(spy).to.have.been.calledOnce;
      }
    });
  });

  describe("#startListening", () => {
    let tree: ModeTree;
    let sandbox: sinon.SinonSandbox;

    before(() => {
      sandbox = sinon.sandbox.create();
    });

    beforeEach(async () => {
      tree = new ModeTree(editor, options.mode);
      await tree.init();
    });

    afterEach(() => {
      sandbox.reset();
    });

    after(() => {
      sandbox.restore();
    });

    it("calls startListening on all decorators", () => {
      // tslint:disable-next-line:no-any
      const root = (tree as any).root;
      const decorators =
        // tslint:disable-next-line:no-any
        root.reduceTopFirst((accumulator: any[], node: any) => {
          return accumulator.concat(node.decorator);
        }, []);
      const spies = [];
      for (const decorator of decorators) {
        spies.push(sandbox.spy(decorator, "startListening"));
      }
      tree.startListening();
      for (const spy of spies) {
        expect(spy).to.have.been.calledOnce;
      }
    });
  });
});
