define(["require", "exports", "chai", "sinon", "wed/editor-actions", "wed/gui/toolbar"], function (require, exports, chai_1, sinon, editorActions, toolbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:mocha-no-side-effect-code
    var fakeEditor = {
        // tslint:disable-next-line:no-empty
        undo: function () { },
        // tslint:disable-next-line:no-empty
        redo: function () { },
    };
    describe("Toolbar", function () {
        var toolbar;
        var sandbox;
        beforeEach(function () {
            toolbar = new toolbar_1.Toolbar();
            sandbox = sinon.sandbox.create();
        });
        afterEach(function () {
            sandbox.restore();
        });
        function checkCustomButtons(num) {
            chai_1.expect(toolbar.top.childNodes).to.have.lengthOf(num + 2);
        }
        function checkModeButtons(num) {
            // tslint:disable-next-line:no-any
            chai_1.expect(toolbar.modeSpan.childNodes).to.have.lengthOf(num);
        }
        describe("#addButton", function () {
            it("takes a single button", function () {
                checkCustomButtons(0);
                var button = new editorActions.Undo(fakeEditor).makeButton();
                toolbar.addButton(button);
                checkCustomButtons(1);
            });
            it("takes an array", function () {
                checkCustomButtons(0);
                var button = new editorActions.Undo(fakeEditor).makeButton();
                var button2 = new editorActions.Redo(fakeEditor).makeButton();
                toolbar.addButton([button, button2]);
                checkCustomButtons(2);
            });
            it("appends by default", function () {
                var button = new editorActions.Undo(fakeEditor).makeButton();
                toolbar.addButton(button);
                var button2 = new editorActions.Redo(fakeEditor).makeButton();
                toolbar.addButton(button2);
                // Clicking the 2nd child executes the child that was added last.
                var spy = sandbox.spy(fakeEditor, "redo");
                toolbar.top.children[1].click();
                chai_1.expect(spy).to.have.been.calledOnce;
            });
            it("can prepend", function () {
                var button = new editorActions.Undo(fakeEditor).makeButton();
                toolbar.addButton(button);
                var button2 = new editorActions.Redo(fakeEditor).makeButton();
                toolbar.addButton(button2, { prepend: true });
                // Clicking the 1st child executes the child that was added last.
                var spy = sandbox.spy(fakeEditor, "redo");
                toolbar.top.firstElementChild.click();
                chai_1.expect(spy).to.have.been.calledOnce;
            });
            it("refuses to allow right and prepend at the same time", function () {
                var button = new editorActions.Undo(fakeEditor).makeButton();
                chai_1.expect(function () {
                    toolbar.addButton(button, { prepend: true, right: true });
                }).to.throw(Error, /^cannot use prepend and right at the same time/);
            });
            it("allows pushing right", function () {
                var button = new editorActions.Undo(fakeEditor).makeButton();
                toolbar.addButton(button, { right: true });
                chai_1.expect(toolbar.top.lastElementChild.classList
                    .contains("pull-right")).to.be.true;
            });
        });
        describe("#setModeButtons", function () {
            it("takes buttons", function () {
                checkCustomButtons(0);
                checkModeButtons(0);
                var button = new editorActions.Undo(fakeEditor).makeButton();
                var button2 = new editorActions.Undo(fakeEditor).makeButton();
                toolbar.setModeButtons([button, button2]);
                checkCustomButtons(0);
                checkModeButtons(2);
            });
            it("replaces buttons", function () {
                checkCustomButtons(0);
                checkModeButtons(0);
                var button = new editorActions.Undo(fakeEditor).makeButton();
                var button2 = new editorActions.Undo(fakeEditor).makeButton();
                toolbar.setModeButtons([button, button2]);
                checkCustomButtons(0);
                checkModeButtons(2);
                toolbar.setModeButtons([]);
                checkCustomButtons(0);
                checkModeButtons(0);
            });
        });
    });
});
//# sourceMappingURL=toolbar-test.js.map