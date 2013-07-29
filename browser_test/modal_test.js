define(["mocha/mocha", "chai", "jquery", "wed/gui/modal"],
       function (mocha, chai, $, modal) {
'use strict';
var assert = chai.assert;
var Modal = modal.Modal;

describe("Modal", function () {
    var $wedroot = $("#wedframe-invisible").contents().find("#wedroot");
    var modal;
    beforeEach(function () {
        modal = new Modal();
    });
    describe("setTitle", function () {
        it("sets the title", function () {
            var $title = modal.getTopLevel().find(".modal-header>h3");
            assert.equal($title.text(), "Untitled", "initial title");
            modal.setTitle($("<b>foo</b>"));
            $title = modal.getTopLevel().find(".modal-header>h3");
            assert.equal($title.get(0).innerHTML, "<b>foo</b>", "new title");

        });
    });

    describe("setBody", function () {
        it("sets the body", function () {
            var body = modal.getTopLevel().find(".modal-body").get(0);
            assert.equal(body.innerHTML.trim(), "<p>No body.</p>",
                         "initial body");
            modal.setBody($("<p>A body.</p>"));
            assert.equal(body.innerHTML, "<p>A body.</p>", "new body");

        });
    });

    describe("setFooter", function () {
        it("sets the footer", function () {
            var footer = modal.getTopLevel().find(".modal-footer").get(0);
            assert.equal(footer.innerHTML.trim(), "", "initial footer");
            modal.setFooter($("<p>A footer.</p>"));
            assert.equal(footer.innerHTML, "<p>A footer.</p>", "new footer");

        });
    });

    describe("addButton", function () {
        it("adds a button", function () {
            var footer = modal.getTopLevel().find(".modal-footer").get(0);
            assert.equal(footer.innerHTML.trim(), "", "initial footer");
            var $button = modal.addButton("test");
            assert.isTrue($button.closest(footer).length > 0,
                          "button is present in footer");
            assert.equal($button.text(), "test");
            assert.isFalse($button.hasClass("btn-primary"));
        });

        it("adds a primary button", function () {
            var footer = modal.getTopLevel().find(".modal-footer").get(0);
            assert.equal(footer.innerHTML.trim(), "", "initial footer");
            var $button = modal.addButton("test", true);
            assert.isTrue($button.closest(footer).length > 0,
                          "button is present in footer");
            assert.equal($button.text(), "test");
            assert.isTrue($button.hasClass("btn-primary"));
        });
    });

    function makeAddXYTest(first, second) {
        describe("add" + first + second, function () {
            it("adds " + first + " and " + second + " button, "+
               first + " is primary", function () {
                var footer = modal.getTopLevel().find(".modal-footer").get(0);
                assert.equal(footer.innerHTML.trim(), "", "initial footer");
                var buttons = modal["add" + first + second].call(modal);
                assert.isTrue(buttons[0].closest(footer).length > 0,
                              "button 0 is present in footer");
                assert.isTrue(buttons[1].closest(footer).length > 0,
                              "button 1 is present in footer");

                assert.equal(buttons[0].text(), first, "button 0 name");
                assert.equal(buttons[1].text(), second, "button 1 name");

                assert.isTrue(buttons[0].hasClass("btn-primary"),
                              "button 0 is primary");
                assert.isFalse(buttons[1].hasClass("btn-primary"),
                               "button 1 is not primary");
            });
        });
    }

    makeAddXYTest("Ok", "Cancel");
    makeAddXYTest("Yes", "No");

    describe("getClicked", function () {
        it("returns undefined on a fresh modal", function () {
            assert.isUndefined(modal.getClicked());
        });

        afterEach(function () {
            $wedroot.empty();
        });

        it("returns the button clicked", function (done) {
            modal = new Modal();
            var ok_cancel = modal.addOkCancel();
            var $dom = modal.getTopLevel();
            $wedroot.append($dom);
            var clicked = false;
            window.setTimeout(function () {
                clicked = true;
                $dom.find(".btn-primary").click();
            }, 1);

            modal.modal(function () {
                assert.isTrue(clicked);
                assert.equal(modal.getClicked().get(0), ok_cancel[0].get(0));
                done();
            });
        });
    });

    describe("getClickedAsText", function () {
        it("returns undefined on a fresh modal", function () {
            assert.isUndefined(modal.getClickedAsText());
        });

        afterEach(function () {
            $wedroot.empty();
        });

        it("returns the name of the button clicked", function (done) {
            modal = new Modal();
            var ok_cancel = modal.addOkCancel();
            var $dom = modal.getTopLevel();
            $wedroot.append($dom);
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
        afterEach(function () {
            $wedroot.empty();
        });

        it("calls callback with proper values", function (done) {
            modal = new Modal();
            modal.addOkCancel();
            var $dom = modal.getTopLevel();
            $wedroot.append($dom);
            var clicked = false;
            window.setTimeout(function () {
                clicked = true;
                $dom.find(".btn-primary").click();
            }, 1);

            modal.modal(function (ev, jQthis) {
                assert.equal(ev.type, "hide");
                assert.equal(ev.namespace, "bs.modal");
                assert.equal(jQthis, $dom.get(0));
                assert.isTrue(clicked);
                done();
            });
        });
    });
});

});
