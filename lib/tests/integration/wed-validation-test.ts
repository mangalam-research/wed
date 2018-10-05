/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { use } from "chai";
import sinonChai from "sinon-chai";

use(sinonChai);

import { CaretManager } from "wed/caret-manager";
import { indexOf } from "wed/domutil";
import { Editor } from "wed/editor";
import * as keyConstants from "wed/key-constants";
import { TaskRunner } from "wed/task-runner";
import { ValidationController } from "wed/validation-controller";
import { INVALID, Validator } from "wed/validator";

import * as globalConfig from "../base-config";
import { EditorSetup, getAttributeValuesFor } from "../wed-test-util";

const expect = chai.expect;

describe("wed validation:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let caretManager: CaretManager;
  let validator: Validator;
  let controller: ValidationController;
  let processRunner: TaskRunner;
  // let refreshRunner: TaskRunner;
  let guiRoot: Element;
  let ps: NodeListOf<Element>;
  let startSpy: sinon.SinonSpy;

  before(async () => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/source_converted.xml",
      globalConfig.config,
      document);
    ({ editor } = setup);

    await setup.init();

    validator = editor.validator;
    // tslint:disable-next-line:no-any
    processRunner = (editor as any).validationController.processErrorsRunner;
    // tslint:disable-next-line:no-any
    // refreshRunner = (editor as any).validationController.refreshErrorsRunner;
    caretManager = editor.caretManager;
    // tslint:disable-next-line:no-any
    controller = (editor as any).validationController;
    guiRoot = editor.guiRoot;
    startSpy = setup.sandbox.spy(validator, "start");
  });

  beforeEach(async () => {
    // tslint:disable-next-line:no-any
    (validator as any)._validateUpTo(editor.dataRoot, -1);
    ps = guiRoot.querySelectorAll(".body .p");
    // Force the processing of errors
    controller.processErrors();
    await processRunner.onCompleted();
    // We want to start with a fresh state for the spies, etc.
    setup.sandbox.reset();
  });

  afterEach(() => {
    setup.reset();
    setup.sandbox.reset();
  });

  after(() => {
    setup.restore();

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;
    // tslint:disable-next-line:no-any
    (controller as any) = undefined;
  });

  it("restarts validation when deleting elements", () => {
    expect(validator.getWorkingState()).to.have.property("state")
      .equal(INVALID);

    const p = ps[0];
    const dataP = editor.toDataNode(p) as Element;
    const parent = dataP.parentElement!;
    caretManager.setCaret(parent, indexOf(parent.childNodes, dataP));
    const trs = editor.modeTree.getMode(dataP).getContextualActions(
      ["delete-element"], "p", dataP);

    trs[0].execute({ node: p });

    expect(startSpy).to.have.been.calledOnce;
  });

  it("restarts validation when adding elements", () => {
    expect(validator.getWorkingState()).to.have.property("state")
      .equal(INVALID);

    const initial =  editor.toDataNode(ps[4]) as Element;

    // Make sure we are looking at the right thing.
    expect(initial.childNodes).to.have.lengthOf(1);
    expect(initial).to.have.property("textContent").equal("abcdefghij");

    const trs = editor.modeTree.getMode(initial)
      .getContextualActions(["wrap"], "hi", initial, 0);

    caretManager.setCaret(initial.firstChild, 3);
    const caret = caretManager.getNormalizedCaret()!;
    caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

    trs[0].execute({ node: undefined, name: "hi" });

    expect(startSpy).to.have.been.calledOnce;
  });

  it("restarts validation when inserting text", () => {
    expect(validator.getWorkingState()).to.have.property("state")
      .equal(INVALID);

    const initial =  editor.toDataNode(ps[4]) as Element;

    // Make sure we are looking at the right thing.
    expect(initial.childNodes).to.have.lengthOf(1);
    expect(initial).to.have.property("textContent").equal("abcdefghij");

    caretManager.setCaret(initial.firstChild, 3);
    editor.type("f");

    expect(startSpy).to.have.been.calledOnce;
  });

  it("restarts validation when deleting text", () => {
    expect(validator.getWorkingState()).to.have.property("state")
      .equal(INVALID);

    const initial =  editor.toDataNode(ps[4]) as Element;

    // Make sure we are looking at the right thing.
    expect(initial.childNodes).to.have.lengthOf(1);
    expect(initial).to.have.property("textContent").equal("abcdefghij");

    caretManager.setCaret(initial.firstChild, 3);
    editor.type(keyConstants.DELETE);

    expect(startSpy).to.have.been.calledOnce;
  });

  it("restarts validation when cutting text", () => {
    expect(validator.getWorkingState()).to.have.property("state")
      .equal(INVALID);

    const initial =  editor.toDataNode(ps[4]) as Element;

    // Make sure we are looking at the right thing.
    expect(initial.childNodes).to.have.lengthOf(1);
    expect(initial).to.have.property("textContent").equal("abcdefghij");

    caretManager.setCaret(initial.firstChild, 3);
    const caret = caretManager.getNormalizedCaret()!;
    caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));

    // With the selection in effect, this has for effect to delete the
    // selection.
    editor.type(keyConstants.DELETE);

    expect(initial).to.have.property("textContent").equal("abcfghij");
    expect(startSpy).to.have.been.calledOnce;
  });

  it("restarts validation when editing attributes", () => {
    expect(validator.getWorkingState()).to.have.property("state")
      .equal(INVALID);

    let initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    caretManager.setCaret(initial, 0);
    expect(initial).to.have.property("data").equal("rend_value");
    editor.type("x");

    // We have to refetch because the decorations have been redone.
    initial = getAttributeValuesFor(ps[7])[0].firstChild as Text;
    expect(initial).to.have.property("data").equal("xrend_value");

    expect(startSpy).to.have.been.calledOnce;
  });
});
