/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import $ from "jquery";

import { Modal } from "wed/gui/modal";
import { makeWedRoot } from "../../wed-test-util";

const assert = chai.assert;

describe("Modal", () => {
  let wedroot: HTMLElement;
  let modal: Modal;

  function clearWedRoot(): void {
    // tslint:disable-next-line:no-inner-html
    wedroot.innerHTML = "";
  }

  before(() => {
    wedroot = makeWedRoot(document);
    document.body.appendChild(wedroot);
  });

  after(() => {
    document.body.removeChild(wedroot);
  });

  beforeEach(() => {
    modal = new Modal();
  });

  describe("setTitle", () => {
    it("sets the title", () => {
      let $title = modal.getTopLevel().find(".modal-header>h3");
      assert.equal($title.text(), "Untitled", "initial title");
      modal.setTitle($("<b>foo</b>"));
      $title = modal.getTopLevel().find(".modal-header>h3");
      assert.equal($title[0].innerHTML, "<b>foo</b>", "new title");
    });
  });

  describe("setBody", () => {
    it("sets the body", () => {
      const body = modal.getTopLevel().find(".modal-body")[0];
      assert.equal(body.innerHTML.trim(), "<p>No body.</p>", "initial body");
      modal.setBody($("<p>A body.</p>"));
      assert.equal(body.innerHTML, "<p>A body.</p>", "new body");
    });
  });

  describe("setFooter", () => {
    it("sets the footer", () => {
      const footer = modal.getTopLevel().find(".modal-footer")[0];
      assert.equal(footer.innerHTML.trim(), "", "initial footer");
      modal.setFooter($("<p>A footer.</p>"));
      assert.equal(footer.innerHTML, "<p>A footer.</p>", "new footer");
    });
  });

  describe("addButton", () => {
    it("adds a button", () => {
      const footer = modal.getTopLevel().find(".modal-footer")[0];
      assert.equal(footer.innerHTML.trim(), "", "initial footer");
      const $button = modal.addButton("test");
      assert.isTrue($button.closest(footer).length > 0,
                    "button is present in footer");
      assert.equal($button.text(), "test");
      assert.isFalse($button.hasClass("btn-primary"));
    });

    it("adds a primary button", () => {
      const footer = modal.getTopLevel().find(".modal-footer")[0];
      assert.equal(footer.innerHTML.trim(), "", "initial footer");
      const $button = modal.addButton("test", true);
      assert.isTrue($button.closest(footer).length > 0,
                    "button is present in footer");
      assert.equal($button.text(), "test");
      assert.isTrue($button.hasClass("btn-primary"));
    });
  });

  describe("getPrimary", () => {
    it("returns an empty set if there is no primary", () => {
      assert.equal(modal.getPrimary()[0], undefined);
    });

    it("returns the primary", () => {
      const $button = modal.addButton("test", true);
      assert.equal(modal.getPrimary()[0], $button[0]);
    });
  });

  function makeAddXYTest(first: string, second: string): void {
    describe(`add${first}${second}`, () => {
      it(`adds ${first} and ${second} button, ${first} is primary`, () => {
        const footer = modal.getTopLevel().find(".modal-footer")[0];
        assert.equal(footer.innerHTML.trim(), "", "initial footer");
        // tslint:disable-next-line:no-any
        const buttons = (modal as any)[`add${first}${second}`].call(modal);
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

  // tslint:disable-next-line:mocha-no-side-effect-code
  makeAddXYTest("Ok", "Cancel");
  // tslint:disable-next-line:mocha-no-side-effect-code
  makeAddXYTest("Yes", "No");

  describe("getClicked", () => {
    afterEach(() => {
      clearWedRoot();
    });

    it("returns undefined on a fresh modal", () => {
      assert.isUndefined(modal.getClicked());
    });

    it("returns the button clicked", (done) => {
      const okCancel = modal.addOkCancel();
      const $dom = modal.getTopLevel();
      wedroot.appendChild($dom[0]);
      let clicked = false;
      window.setTimeout(() => {
        clicked = true;
        $dom.find(".btn-primary").click();
      }, 1);

      modal.modal(() => {
        assert.isTrue(clicked);
        assert.equal(modal.getClicked()![0], okCancel[0][0]);
        done();
      });
    });
  });

  describe("getClickedAsText", () => {
    afterEach(() => {
      clearWedRoot();
    });

    it("returns undefined on a fresh modal", () => {
      assert.isUndefined(modal.getClickedAsText());
    });

    it("returns the name of the button clicked", (done) => {
      modal.addOkCancel();
      const $dom = modal.getTopLevel();
      wedroot.appendChild($dom[0]);
      let clicked = false;
      window.setTimeout(() => {
        clicked = true;
        $dom.find(".btn-primary").click();
      }, 1);

      modal.modal(() => {
        assert.isTrue(clicked);
        assert.equal(modal.getClickedAsText(), "Ok");
        done();
      });
    });
  });

  describe("modal", () => {
    let $dom: JQuery;

    beforeEach(() => {
      modal.addOkCancel();
      $dom = modal.getTopLevel();
      wedroot.appendChild($dom[0]);
    });

    afterEach(() => {
      clearWedRoot();
    });

    it("calls callback with proper values", (done) => {
      let clicked = false;
      window.setTimeout(() => {
        clicked = true;
        $dom.find(".btn-primary").click();
      }, 1);

      modal.modal((ev) => {
        assert.equal(ev.type, "hidden");
        assert.equal(ev.namespace, "bs.modal");
        assert.equal(ev.currentTarget, $dom[0]);
        assert.isTrue(clicked);
        done();
      });
    });

    it("without a callback", (done) => {
      window.setTimeout(() => {
        $dom.find(".btn-primary").click();
        // Wait a bit before considering it done.
        window.setTimeout(() => {
          done();
        }, 1);
      }, 1);

      // An earlier version did not accept modal being called without a
      // callback. It would have crashed on the next call.
      modal.modal();
    });

    it("cleans event handlers properly", (done) => {
      function click(): void {
        modal.getPrimary().click();
      }
      window.setTimeout(click, 1);

      let first = 0;
      modal.modal(() => {
        first++;
      });

      window.setTimeout(click, 1);
      let second = 0;
      modal.modal(() => {
        second++;
        assert.equal(first, 1, "first handler count");
        assert.equal(second, 1, "second handler count");
        done();
      });
    });
  });
});

//  LocalWords:  gui jQuery jquery Dubeau MPL Mangalam btn getClicked
//  LocalWords:  getClickedAsText Ok getPrimary addButton setFooter
//  LocalWords:  setBody setTitle chai wedframe wedroot
