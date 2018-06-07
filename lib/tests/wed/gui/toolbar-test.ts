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

// tslint:disable-next-line:max-line-length
// tslint:disable-next-line:mocha-no-side-effect-code no-object-literal-type-assertion
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
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function checkCustomButtons(num: number): void {
    expect(toolbar.top.childNodes).to.have.lengthOf(num + 2);
  }

  function checkModeButtons(num: number): void {
    // tslint:disable-next-line:no-any
    expect((toolbar as any).modeSpan.childNodes).to.have.lengthOf(num);
  }

  describe("#addButton", () => {
    it("takes a single button", () => {
      checkCustomButtons(0);
      const button = new editorActions.Undo(fakeEditor).makeButton();
      toolbar.addButton(button);
      checkCustomButtons(1);
    });

    it("takes an array", () => {
      checkCustomButtons(0);
      const button = new editorActions.Undo(fakeEditor).makeButton();
      const button2 = new editorActions.Redo(fakeEditor).makeButton();
      toolbar.addButton([button, button2]);
      checkCustomButtons(2);
    });

    it("appends by default", () => {
      const button = new editorActions.Undo(fakeEditor).makeButton();
      toolbar.addButton(button);
      const button2 = new editorActions.Redo(fakeEditor).makeButton();
      toolbar.addButton(button2);

      // Clicking the 2nd child executes the child that was added last.
      const spy = sandbox.spy(fakeEditor, "redo");
      (toolbar.top.children[1] as HTMLElement).click();
      expect(spy).to.have.been.calledOnce;
    });

    it("can prepend", () => {
      const button = new editorActions.Undo(fakeEditor).makeButton();
      toolbar.addButton(button);
      const button2 = new editorActions.Redo(fakeEditor).makeButton();
      toolbar.addButton(button2, { prepend: true });

      // Clicking the 1st child executes the child that was added last.
      const spy = sandbox.spy(fakeEditor, "redo");
      (toolbar.top.firstElementChild as HTMLElement).click();
      expect(spy).to.have.been.calledOnce;
    });

    it("refuses to allow right and prepend at the same time", () => {
      const button = new editorActions.Undo(fakeEditor).makeButton();
      expect(() => {
        toolbar.addButton(button, { prepend: true, right: true });
      }).to.throw(Error, /^cannot use prepend and right at the same time/);
    });

    it("allows pushing right", () => {
      const button = new editorActions.Undo(fakeEditor).makeButton();
      toolbar.addButton(button, { right: true });
      expect((toolbar.top.lastElementChild as HTMLElement).classList
             .contains("pull-right")).to.be.true;
    });
  });

  describe("#setModeButtons", () => {
    it("takes buttons", () => {
      checkCustomButtons(0);
      checkModeButtons(0);
      const button = new editorActions.Undo(fakeEditor).makeButton();
      const button2 = new editorActions.Undo(fakeEditor).makeButton();
      toolbar.setModeButtons([button, button2]);
      checkCustomButtons(0);
      checkModeButtons(2);
    });

    it("replaces buttons", () => {
      checkCustomButtons(0);
      checkModeButtons(0);
      const button = new editorActions.Undo(fakeEditor).makeButton();
      const button2 = new editorActions.Undo(fakeEditor).makeButton();
      toolbar.setModeButtons([button, button2]);
      checkCustomButtons(0);
      checkModeButtons(2);
      toolbar.setModeButtons([]);
      checkCustomButtons(0);
      checkModeButtons(0);
    });
  });
});
