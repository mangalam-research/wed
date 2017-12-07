/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as sinon from "sinon";

import * as editorActions from "wed/editor-actions";
import { Toolbar } from "wed/gui/toolbar";
import { EditorAPI } from "wed/mode-api";

// tslint:disable-next-line:mocha-no-side-effect-code
const fakeEditor: EditorAPI = {
  // tslint:disable-next-line:no-empty
  undo: () => {},
  // tslint:disable-next-line:no-empty
  redo: () => {},
} as EditorAPI;

describe("Toolbar", () => {
  let toolbar: Toolbar;
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    toolbar = new Toolbar();
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function checkCustomButtons(num: number): void {
    expect(toolbar.top.childNodes).to.have.lengthOf(num + 2);
  }

  describe("#addAction", () => {
    it("takes a single action", () => {
      checkCustomButtons(0);
      const action = new editorActions.Undo(fakeEditor);
      toolbar.addAction(action);
      checkCustomButtons(1);
    });

    it("takes an array", () => {
      checkCustomButtons(0);
      const action = new editorActions.Undo(fakeEditor);
      const action2 = new editorActions.Redo(fakeEditor);
      toolbar.addAction([action, action2]);
      checkCustomButtons(2);
    });

    it("appends by default", () => {
      const action = new editorActions.Undo(fakeEditor);
      toolbar.addAction(action);
      const action2 = new editorActions.Redo(fakeEditor);
      toolbar.addAction(action2);

      // Clicking the 2nd child executes the child that was added last.
      const spy = sandbox.spy(fakeEditor, "redo");
      (toolbar.top.children[1] as HTMLElement).click();
      expect(spy).to.have.been.calledOnce;
    });

    it("can prepend", () => {
      const action = new editorActions.Undo(fakeEditor);
      toolbar.addAction(action);
      const action2 = new editorActions.Redo(fakeEditor);
      toolbar.addAction(action2, { prepend: true });

      // Clicking the 1st child executes the child that was added last.
      const spy = sandbox.spy(fakeEditor, "redo");
      (toolbar.top.firstElementChild as HTMLElement).click();
      expect(spy).to.have.been.calledOnce;
    });

    it("refuses to allow right and prepend at the same time", () => {
      const action = new editorActions.Undo(fakeEditor);
      expect(() => {
        toolbar.addAction(action, { prepend: true, right: true });
      }).to.throw(Error, /^cannot use prepend and right at the same time/);
    });

    it("allows pushing right", () => {
      const action = new editorActions.Undo(fakeEditor);
      toolbar.addAction(action, { right: true });
      expect((toolbar.top.lastElementChild as HTMLElement).classList
             .contains("pull-right")).to.be.true;
    });
  });
});
