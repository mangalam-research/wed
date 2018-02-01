define(["require", "exports", "jquery", "wed/gui/modal", "../../wed-test-util"], function (require, exports, $, modal_1, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("Modal", function () {
        var wedroot;
        var modal;
        function clearWedRoot() {
            // tslint:disable-next-line:no-inner-html
            wedroot.innerHTML = "";
        }
        before(function () {
            wedroot = wed_test_util_1.makeWedRoot(document);
            document.body.appendChild(wedroot);
        });
        after(function () {
            document.body.removeChild(wedroot);
        });
        beforeEach(function () {
            modal = new modal_1.Modal();
        });
        describe("setTitle", function () {
            it("sets the title", function () {
                var $title = modal.getTopLevel().find(".modal-header>h3");
                assert.equal($title.text(), "Untitled", "initial title");
                modal.setTitle($("<b>foo</b>"));
                $title = modal.getTopLevel().find(".modal-header>h3");
                assert.equal($title[0].innerHTML, "<b>foo</b>", "new title");
            });
        });
        describe("setBody", function () {
            it("sets the body", function () {
                var body = modal.getTopLevel().find(".modal-body")[0];
                assert.equal(body.innerHTML.trim(), "<p>No body.</p>", "initial body");
                modal.setBody($("<p>A body.</p>"));
                assert.equal(body.innerHTML, "<p>A body.</p>", "new body");
            });
        });
        describe("setFooter", function () {
            it("sets the footer", function () {
                var footer = modal.getTopLevel().find(".modal-footer")[0];
                assert.equal(footer.innerHTML.trim(), "", "initial footer");
                modal.setFooter($("<p>A footer.</p>"));
                assert.equal(footer.innerHTML, "<p>A footer.</p>", "new footer");
            });
        });
        describe("addButton", function () {
            it("adds a button", function () {
                var footer = modal.getTopLevel().find(".modal-footer")[0];
                assert.equal(footer.innerHTML.trim(), "", "initial footer");
                var $button = modal.addButton("test");
                assert.isTrue($button.closest(footer).length > 0, "button is present in footer");
                assert.equal($button.text(), "test");
                assert.isFalse($button.hasClass("btn-primary"));
            });
            it("adds a primary button", function () {
                var footer = modal.getTopLevel().find(".modal-footer")[0];
                assert.equal(footer.innerHTML.trim(), "", "initial footer");
                var $button = modal.addButton("test", true);
                assert.isTrue($button.closest(footer).length > 0, "button is present in footer");
                assert.equal($button.text(), "test");
                assert.isTrue($button.hasClass("btn-primary"));
            });
        });
        describe("getPrimary", function () {
            it("returns an empty set if there is no primary", function () {
                assert.equal(modal.getPrimary()[0], undefined);
            });
            it("returns the primary", function () {
                var $button = modal.addButton("test", true);
                assert.equal(modal.getPrimary()[0], $button[0]);
            });
        });
        function makeAddXYTest(first, second) {
            describe("add" + first + second, function () {
                it("adds " + first + " and " + second + " button, " + first + " is primary", function () {
                    var footer = modal.getTopLevel().find(".modal-footer")[0];
                    assert.equal(footer.innerHTML.trim(), "", "initial footer");
                    // tslint:disable-next-line:no-any
                    var buttons = modal["add" + first + second].call(modal);
                    assert.isTrue(buttons[0].closest(footer).length > 0, "button 0 is present in footer");
                    assert.isTrue(buttons[1].closest(footer).length > 0, "button 1 is present in footer");
                    assert.equal(buttons[0].text(), first, "button 0 name");
                    assert.equal(buttons[1].text(), second, "button 1 name");
                    assert.isTrue(buttons[0].hasClass("btn-primary"), "button 0 is primary");
                    assert.isFalse(buttons[1].hasClass("btn-primary"), "button 1 is not primary");
                });
            });
        }
        // tslint:disable-next-line:mocha-no-side-effect-code
        makeAddXYTest("Ok", "Cancel");
        // tslint:disable-next-line:mocha-no-side-effect-code
        makeAddXYTest("Yes", "No");
        describe("getClicked", function () {
            afterEach(function () {
                clearWedRoot();
            });
            it("returns undefined on a fresh modal", function () {
                assert.isUndefined(modal.getClicked());
            });
            it("returns the button clicked", function (done) {
                var okCancel = modal.addOkCancel();
                var $dom = modal.getTopLevel();
                wedroot.appendChild($dom[0]);
                var clicked = false;
                window.setTimeout(function () {
                    clicked = true;
                    $dom.find(".btn-primary").click();
                }, 1);
                modal.modal(function () {
                    assert.isTrue(clicked);
                    assert.equal(modal.getClicked()[0], okCancel[0][0]);
                    done();
                });
            });
        });
        describe("getClickedAsText", function () {
            afterEach(function () {
                clearWedRoot();
            });
            it("returns undefined on a fresh modal", function () {
                assert.isUndefined(modal.getClickedAsText());
            });
            it("returns the name of the button clicked", function (done) {
                modal.addOkCancel();
                var $dom = modal.getTopLevel();
                wedroot.appendChild($dom[0]);
                var clicked = false;
                window.setTimeout(function () {
                    clicked = true;
                    $dom.find(".btn-primary").click();
                }, 1);
                modal.modal(function () {
                    assert.isTrue(clicked);
                    assert.equal(modal.getClickedAsText(), "Ok");
                    done();
                });
            });
        });
        describe("modal", function () {
            var $dom;
            beforeEach(function () {
                modal.addOkCancel();
                $dom = modal.getTopLevel();
                wedroot.appendChild($dom[0]);
            });
            afterEach(function () {
                clearWedRoot();
            });
            it("calls callback with proper values", function (done) {
                var clicked = false;
                window.setTimeout(function () {
                    clicked = true;
                    $dom.find(".btn-primary").click();
                }, 1);
                modal.modal(function (ev) {
                    assert.equal(ev.type, "hidden");
                    assert.equal(ev.namespace, "bs.modal");
                    assert.equal(ev.currentTarget, $dom[0]);
                    assert.isTrue(clicked);
                    done();
                });
            });
            it("without a callback", function (done) {
                window.setTimeout(function () {
                    $dom.find(".btn-primary").click();
                    // Wait a bit before considering it done.
                    window.setTimeout(function () {
                        done();
                    }, 1);
                }, 1);
                // An earlier version did not accept modal being called without a
                // callback. It would have crashed on the next call.
                modal.modal();
            });
            it("cleans event handlers properly", function (done) {
                function click() {
                    modal.getPrimary().click();
                }
                window.setTimeout(click, 1);
                var first = 0;
                modal.modal(function () {
                    first++;
                });
                window.setTimeout(click, 1);
                var second = 0;
                modal.modal(function () {
                    second++;
                    assert.equal(first, 1, "first handler count");
                    assert.equal(second, 1, "second handler count");
                    done();
                });
            });
        });
    });
});
//  LocalWords:  gui jQuery jquery Dubeau MPL Mangalam btn getClicked
//  LocalWords:  getClickedAsText Ok getPrimary addButton setFooter
//  LocalWords:  setBody setTitle chai wedframe wedroot
//# sourceMappingURL=modal-test.js.map