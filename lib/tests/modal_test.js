/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var $ = require("jquery");
  var modalMod = require("wed/gui/modal");

  var assert = chai.assert;
  var Modal = modalMod.Modal;

  describe("Modal", function ModalBlock() {
    var $wedroot;
    var modal;
    beforeEach(function beforeEach() {
      $wedroot = $("#wedframe-invisible").contents().find("#wedroot");
      modal = new Modal();
    });
    describe("setTitle", function setTitle() {
      it("sets the title", function test() {
        var $title = modal.getTopLevel().find(".modal-header>h3");
        assert.equal($title.text(), "Untitled", "initial title");
        modal.setTitle($("<b>foo</b>"));
        $title = modal.getTopLevel().find(".modal-header>h3");
        assert.equal($title[0].innerHTML, "<b>foo</b>", "new title");
      });
    });

    describe("setBody", function setBody() {
      it("sets the body", function test() {
        var body = modal.getTopLevel().find(".modal-body")[0];
        assert.equal(body.innerHTML.trim(), "<p>No body.</p>", "initial body");
        modal.setBody($("<p>A body.</p>"));
        assert.equal(body.innerHTML, "<p>A body.</p>", "new body");
      });
    });

    describe("setFooter", function setFooter() {
      it("sets the footer", function test() {
        var footer = modal.getTopLevel().find(".modal-footer")[0];
        assert.equal(footer.innerHTML.trim(), "", "initial footer");
        modal.setFooter($("<p>A footer.</p>"));
        assert.equal(footer.innerHTML, "<p>A footer.</p>", "new footer");
      });
    });

    describe("addButton", function addButton() {
      it("adds a button", function test() {
        var footer = modal.getTopLevel().find(".modal-footer")[0];
        assert.equal(footer.innerHTML.trim(), "", "initial footer");
        var $button = modal.addButton("test");
        assert.isTrue($button.closest(footer).length > 0,
                      "button is present in footer");
        assert.equal($button.text(), "test");
        assert.isFalse($button.hasClass("btn-primary"));
      });

      it("adds a primary button", function test() {
        var footer = modal.getTopLevel().find(".modal-footer")[0];
        assert.equal(footer.innerHTML.trim(), "", "initial footer");
        var $button = modal.addButton("test", true);
        assert.isTrue($button.closest(footer).length > 0,
                      "button is present in footer");
        assert.equal($button.text(), "test");
        assert.isTrue($button.hasClass("btn-primary"));
      });
    });

    describe("getPrimary", function getPrimary() {
      it("returns an empty set if there is no primary", function test() {
        assert.equal(modal.getPrimary()[0], undefined);
      });

      it("returns the primary", function test() {
        var $button = modal.addButton("test", true);
        assert.equal(modal.getPrimary()[0], $button[0]);
      });
    });

    function makeAddXYTest(first, second) {
      describe("add" + first + second, function block() {
        it("adds " + first + " and " + second + " button, " +
           first + " is primary",
           function test() {
             var footer = modal.getTopLevel().find(".modal-footer")[0];
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

    describe("getClicked", function getClicked() {
      it("returns undefined on a fresh modal", function test() {
        assert.isUndefined(modal.getClicked());
      });

      afterEach(function afterEach() {
        $wedroot.empty();
      });

      it("returns the button clicked", function test(done) {
        modal = new Modal();
        var ok_cancel = modal.addOkCancel();
        var $dom = modal.getTopLevel();
        $wedroot.append($dom);
        var clicked = false;
        window.setTimeout(function timeout() {
          clicked = true;
          $dom.find(".btn-primary").click();
        }, 1);

        modal.modal(function modalDone() {
          assert.isTrue(clicked);
          assert.equal(modal.getClicked()[0], ok_cancel[0][0]);
          done();
        });
      });
    });

    describe("getClickedAsText", function getClickedAsText() {
      it("returns undefined on a fresh modal", function test() {
        assert.isUndefined(modal.getClickedAsText());
      });

      afterEach(function afterEach() {
        $wedroot.empty();
      });

      it("returns the name of the button clicked", function test(done) {
        modal = new Modal();
        modal.addOkCancel();
        var $dom = modal.getTopLevel();
        $wedroot.append($dom);
        var clicked = false;
        window.setTimeout(function timeout() {
          clicked = true;
          $dom.find(".btn-primary").click();
        }, 1);

        modal.modal(function modalDone() {
          assert.isTrue(clicked);
          assert.equal(modal.getClickedAsText(), "Ok");
          done();
        });
      });
    });


    describe("modal", function modalBlock() {
      afterEach(function afterEach() {
        $wedroot.empty();
      });

      it("calls callback with proper values", function test(done) {
        modal = new Modal();
        modal.addOkCancel();
        var $dom = modal.getTopLevel();
        $wedroot.append($dom);
        var clicked = false;
        window.setTimeout(function timeout() {
          clicked = true;
          $dom.find(".btn-primary").click();
        }, 1);

        modal.modal(function modalDone(ev) {
          assert.equal(ev.type, "hidden");
          assert.equal(ev.namespace, "bs.modal");
          assert.equal(ev.currentTarget, $dom[0]);
          assert.isTrue(clicked);
          done();
        });
      });

      it("without a callback", function test(done) {
        modal = new Modal();
        modal.addOkCancel();
        var $dom = modal.getTopLevel();
        $wedroot.append($dom);
        window.setTimeout(function timeout() {
          $dom.find(".btn-primary").click();
          // Wait a bit before considering it done.
          window.setTimeout(function timeout2() {
            done();
          }, 1);
        }, 1);

        // An earlier version did not accept modal being called
        // without a callback. It would have crashed on the next call.
        modal.modal();
      });

      it("cleans event handlers properly", function test(done) {
        modal = new Modal();
        modal.addOkCancel();
        var $dom = modal.getTopLevel();
        $wedroot.append($dom);
        function click() {
          modal.getPrimary().click();
        }
        window.setTimeout(click, 1);

        var first = 0;
        modal.modal(function modalDone() {
          first++;
        });

        window.setTimeout(click, 1);
        var second = 0;
        modal.modal(function modalDone() {
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
