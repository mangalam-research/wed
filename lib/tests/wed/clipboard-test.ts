/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { expect } from "chai";

import { Clipboard } from "wed/clipboard";
import { SelectionMode } from "wed/selection-mode";

describe("clipboard", () => {
  describe("Clipboard", () => {
    describe("#mode", () => {
      it("starts in span mode", () => {
        expect(new Clipboard().mode).to.equal(SelectionMode.SPAN);
      });
    });

    describe("#putSpan", () => {
      let clipboard: Clipboard;
      beforeEach(() => {
        clipboard = new Clipboard();
      });

      describe("called with a node array", () => {
        it("clears the clipboard", () => {
          clipboard.putSpan([document.createTextNode("foo")]);
          // This should overwrite the first.
          clipboard.putSpan([document.createTextNode("bar")]);
          expect(clipboard.cloneTree().textContent).to.equal("bar");
        });

        it("sets the mode to span", () => {
          // tslint:disable-next-line:no-any
          (clipboard as any).setMode(SelectionMode.UNIT);
          expect(clipboard.mode).to.equal(SelectionMode.UNIT);
          clipboard.putSpan([document.createTextNode("foo")]);
          expect(clipboard.mode).to.equal(SelectionMode.SPAN);
        });
      });

      describe("called with a string", () => {
        it("clears the clipboard", () => {
          clipboard.putSpan("fnord");
          // This should overwrite the first.
          clipboard.putSpan("bar");
          expect(clipboard.cloneTree().textContent).to.equal("bar");
        });

        it("sets the mode to span", () => {
          // tslint:disable-next-line:no-any
          (clipboard as any).setMode(SelectionMode.UNIT);
          expect(clipboard.mode).to.equal(SelectionMode.UNIT);
          clipboard.putSpan("bar");
          expect(clipboard.mode).to.equal(SelectionMode.SPAN);
        });
      });
    });

    describe("#putUnit", () => {
      describe("called with an attribute", () => {
        let clipboard: Clipboard;
        let barAttr: Attr;
        let bazAttr: Attr;
        let barSerial: string;
        let bazSerial: string;

        beforeEach(() => {
          clipboard = new Clipboard();
          barAttr = document.createAttribute("bar");
          barAttr.value = "barValue";
          bazAttr = document.createAttribute("baz");
          bazAttr.value = "bazValue";
          barSerial = `\
<wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" \
bar="barValue"/>`;
          bazSerial = `\
<wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" \
baz="bazValue"/>`;
        });

        describe("not adding", () => {
          it("clears the clipboard", () => {
            clipboard.putUnit(barAttr, false);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(barSerial);
            clipboard.putUnit(bazAttr, false);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(bazSerial);
          });

          it("sets the mode to unit", () => {
            expect(clipboard.mode).to.equal(SelectionMode.SPAN);
            clipboard.putUnit(barAttr, false);
            expect(clipboard.mode).to.equal(SelectionMode.UNIT);
          });
        });

        describe("adding", () => {
          it("clears the clipboard, if it did not contain attributes", () => {
            clipboard.putSpan("foo");
            clipboard.putUnit(bazAttr, true);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(bazSerial);
          });

          it("does not clear the clipboard, if it contained attributes", () => {
            clipboard.putUnit(barAttr, true);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(barSerial);
            clipboard.putUnit(bazAttr, true);
            expect(clipboard.cloneTree()).to.have.property("innerHTML").equal(`\
<wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" \
bar="barValue" baz="bazValue"/>`);
          });

          it("sets the mode to unit", () => {
            // tslint:disable-next-line:no-any
            (clipboard as any).setMode(SelectionMode.SPAN);
            expect(clipboard.mode).to.equal(SelectionMode.SPAN);
            clipboard.putUnit(barAttr, true);
            expect(clipboard.mode).to.equal(SelectionMode.UNIT);
          });
        });
      });

      describe("called with a non-attribute", () => {
        let clipboard: Clipboard;
        let barNode: Element;
        let bazNode: Element;
        let barSerial: string;
        let bazSerial: string;

        beforeEach(() => {
          clipboard = new Clipboard();
          barNode = document.createElement("bar");
          barNode.textContent = "bar content";
          bazNode = document.createElement("baz");
          bazNode.textContent = "baz content";
          barSerial =
            `<bar xmlns="http://www.w3.org/1999/xhtml">bar content</bar>`;
          bazSerial =
            `<baz xmlns="http://www.w3.org/1999/xhtml">baz content</baz>`;
        });

        describe("not adding", () => {
          it("clears the clipboard", () => {
            clipboard.putUnit(barNode, false);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(barSerial);
            clipboard.putUnit(bazNode, false);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(bazSerial);
          });

          it("sets the mode to unit", () => {
            expect(clipboard.mode).to.equal(SelectionMode.SPAN);
            clipboard.putUnit(barNode, false);
            expect(clipboard.mode).to.equal(SelectionMode.UNIT);
          });
        });

        describe("adding", () => {
          it("clears the clipboard, if it did not contain nodes", () => {
            clipboard.putSpan("foo");
            clipboard.putUnit(barNode, true);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(barSerial);
          });

          it("clears the clipboard, if it contained attributes", () => {
            clipboard.putUnit(document.createAttribute("foo"), false);
            clipboard.putUnit(barNode, true);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(barSerial);
          });

          it("does not clear the clipboard, if it contained nodes", () => {
            clipboard.putUnit(barNode, true);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(barSerial);
            clipboard.putUnit(bazNode, true);
            expect(clipboard.cloneTree()).to.have.property("innerHTML")
              .equal(barSerial + bazSerial);
          });

          it("sets the mode to unit", () => {
            // tslint:disable-next-line:no-any
            (clipboard as any).setMode(SelectionMode.SPAN);
            expect(clipboard.mode).to.equal(SelectionMode.SPAN);
            clipboard.putUnit(barNode, true);
            expect(clipboard.mode).to.equal(SelectionMode.UNIT);
          });
        });
      });
    });

    describe("#isSerializedTree", () => {
      let clipboard: Clipboard;

      before(() => {
        clipboard = new Clipboard();
        clipboard.putSpan("foo");
      });

      it("returns true if the argument is serialized tree", () => {
        expect(clipboard.isSerializedTree(clipboard.cloneTree().innerHTML))
          .to.be.true;
      });

      it("returns false if the argument is not serialized tree", () => {
        expect(clipboard.isSerializedTree("MERMER")).to.be.false;
      });
    });

    // cloneTree is effectively tested through all the other tests above.
    // describe("#cloneTree", () => {});

    describe("#setupDOMClipboardData", () => {
      let clipboard: Clipboard;
      let data: DataTransfer;

      beforeEach(() => {
        clipboard = new Clipboard();
        data = new DataTransfer();
      });

      it("transfers text", () => {
        clipboard.putSpan("foo & bar");
        clipboard.setupDOMClipboardData(data);
        expect(data.getData("text/plain")).to.equal("foo & bar");
        expect(data.getData("text/xml")).to.equal("foo &amp; bar");
      });

      it("transfers node arrays", () => {
        const bar = document.createElement("bar");
        bar.textContent = "bar content";
        const baz = document.createElement("baz");
        baz.textContent = "baz content";
        clipboard.putSpan([bar, baz]);
        clipboard.setupDOMClipboardData(data);
        expect(data.getData("text/plain")).to.equal("bar contentbaz content");
        expect(data.getData("text/xml")).to.equal(`\
<bar xmlns="http://www.w3.org/1999/xhtml">bar content</bar>\
<baz xmlns="http://www.w3.org/1999/xhtml">baz content</baz>`);
      });

      it("transfers attributes", () => {
        const bar = document.createAttribute("bar");
        bar.value = "barValue";
        const baz = document.createAttribute("baz");
        baz.value = "bazValue";
        clipboard.putUnit(bar, true);
        clipboard.putUnit(baz, true);
        clipboard.setupDOMClipboardData(data);
        expect(data.getData("text/plain")).to.equal("");
        expect(data.getData("text/xml")).to.equal(`\
<wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" \
bar="barValue" baz="bazValue"/>`);
      });

      it("transfers nodes added one by one", () => {
        const bar = document.createElement("bar");
        bar.textContent = "bar content";
        const baz = document.createElement("baz");
        baz.textContent = "baz content";
        clipboard.putUnit(bar, true);
        clipboard.putUnit(baz, true);
        clipboard.setupDOMClipboardData(data);
        expect(data.getData("text/plain")).to.equal("bar contentbaz content");
        expect(data.getData("text/xml")).to.equal(`\
<bar xmlns="http://www.w3.org/1999/xhtml">bar content</bar>\
<baz xmlns="http://www.w3.org/1999/xhtml">baz content</baz>`);
      });
    });
  });
});
