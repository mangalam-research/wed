/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { filter } from "rxjs/operators";

import * as convert from "wed/convert";
import { DLoc, DLocRoot } from "wed/dloc";
import { childByClass, childrenByClass, indexOf } from "wed/domutil";
import { BeforeDeleteNodeEvent, BeforeInsertNodeAtEvent, DeleteNodeEvent,
         InsertNodeAtEvent, SetAttributeNSEvent, SetTextNodeValueEvent,
         TextInsertionResult, TreeUpdater,
         TreeUpdaterEvents } from "wed/tree-updater";

import { DataProvider } from "../util";

const assert = chai.assert;

function filterSetTextNodeValue(ev: TreeUpdaterEvents):
ev is SetTextNodeValueEvent {
  return ev.name === "SetTextNodeValue";
}

function filterSetAttributeNS(ev: TreeUpdaterEvents):
ev is SetAttributeNSEvent {
  return ev.name === "SetAttributeNS";
}

function filterInsertNodeAtAndBefore(ev: TreeUpdaterEvents):
ev is (InsertNodeAtEvent | BeforeInsertNodeAtEvent) {
  return ev.name === "InsertNodeAt" || ev.name === "BeforeInsertNodeAt";
}

function filterBeforeDeleteNode(ev: TreeUpdaterEvents):
ev is BeforeDeleteNodeEvent {
  return ev.name === "BeforeDeleteNode";
}

function filterDeleteNode(ev: TreeUpdaterEvents): ev is DeleteNodeEvent {
  return ev.name === "DeleteNode";
}

describe("TreeUpdater", () => {
  let root: HTMLElement;
  let htmlTree: Node;

  before(() =>
         new DataProvider(
           "/base/build/standalone/lib/tests/tree_updater_test_data/")
         .getText("source_converted.xml")
         .then((sourceXML) => {
           root = document.createElement("div");
           document.body.appendChild(root);
           new DLocRoot(root);

           const parser = new DOMParser();
           const xmlDoc = parser.parseFromString(sourceXML, "text/xml");
           htmlTree = convert.toHTMLTree(document, xmlDoc.firstElementChild!);
         }));

  let tu: TreeUpdater;

  beforeEach(() => {
    root.appendChild(htmlTree.cloneNode(true));
    tu = new TreeUpdater(root);
  });

  afterEach(() => {
    while (root.lastChild !== null) {
      root.removeChild(root.lastChild);
    }
  });

  after(() => {
    document.body.removeChild(root);
  });

  // tslint:disable-next-line:completed-docs
  class Listener {
    expected: Record<string, number | undefined> = {
      BeforeInsertNodeAt: 0,
      InsertNodeAt: 0,
      SetTextNodeValue: 0,
      BeforeDeleteNode: 0,
      DeleteNode: 0,
      SetAttributeNS: 0,
      Changed: undefined,
    };

    _events: Record<string, number> = Object.create(null);

    constructor(updater: TreeUpdater) {
      updater.events.subscribe((ev) => {
        const name = ev.name;
        if (this._events[name] === undefined) {
          this._events[name] = 0;
        }

        this._events[name]++;
      });
    }

    check(): void {
      // The event "changed" is special. We should get one "changed" event per
      // other event.
      const keys = Object.keys(this.expected);
      if (this.expected.Changed === undefined) {
        let total = 0;
        for (const k of keys) {
          if (k === "Changed") {
            continue;
          }
          total += this.expected[k]!;
        }
        this.expected.Changed = total;
      }

      for (const k of keys) {
        let actual = this._events[k];
        if (actual === undefined) {
          actual = 0;
        }
        assert.equal(actual, this.expected[k], `number of events ${k}`);
      }

      for (const k of Object.keys(this._events)) {
        assert.isDefined(this.expected[k], `unaccounted event ${k}`);
      }
    }
  }

  describe("insertNodeAt", () => {
    it("fails on fragments", () => {
      const top = root.querySelector(".p");
      const node = document.createDocumentFragment();
      assert.throws(tu.insertNodeAt.bind(tu, top, 0, node), Error,
                    "document fragments cannot be passed to insertNodeAt");
    });
  });

  describe("splitAt", () => {
    it("fails on node which is not child of the top", () => {
      const top = root.querySelector(".p");
      const node = root.querySelector(".title");
      assert.throws(tu.splitAt.bind(tu, top, node, 0), Error,
                    "split location is not inside top");
    });

    it("fails if splitting would denormalize an element", () => {
      const node = root.querySelector(".title")!;
      assert.throws(tu.splitAt.bind(tu, node.firstChild, node.firstChild, 2),
                    Error,
                    "splitAt called in a way that would result in " +
                    "two adjacent text nodes");
    });

    it("splitting recursively, one level of depth generates appropriate events",
       () => {
         const node = root.querySelector(".title")!;
         const parent = node.parentNode!;

         const listener = new Listener(tu);
         const calls = [
           // Insertion of a text node into <title>.
           [parent, 0],
           // Insertion of the completed 2nd half into the DOM tree.
           [parent, 1],
         ];
         let callsIx = 0;
         tu.events.pipe(filter(filterInsertNodeAtAndBefore))
           .subscribe((ev) => {
             const call = calls[callsIx];
             assert.equal(ev.parent, call[0]);
             assert.equal(ev.index, call[1]);
             if (ev.name === "InsertNodeAt") {
               callsIx++;
             }
           });
         listener.expected.InsertNodeAt = 2;
         listener.expected.BeforeInsertNodeAt = 2;

         const formerParent = node.parentNode;
         tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
           assert.equal(ev.node, node);
           assert.isNotNull(ev.node.parentNode);
         });
         listener.expected.BeforeDeleteNode = 1;

         tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
           assert.equal(ev.node, node);
           assert.isNull(ev.node.parentNode);
           assert.equal(ev.formerParent, formerParent);
         });
         listener.expected.DeleteNode = 1;

         tu.splitAt(node, node.firstChild!, 2);

         // Check that we're doing what we think we're doing.
         assert.equal((parent.firstChild as HTMLElement).outerHTML,
                      `<div class="title _local_title \
_xmlns_http://www.tei-c.org/ns/1.0 _real">ab</div>`, "first half");
         assert.equal((parent.childNodes[1] as HTMLElement).outerHTML,
                      `<div class="title _local_title \
_xmlns_http://www.tei-c.org/ns/1.0 _real">cd</div>`, "second half");
         listener.check();
       });

    it("spliting recursively, at multiple levels does the right work", () => {
      const node = root.querySelector(".quote")!.firstChild!;
      const top = root.querySelector(".text")!;
      const body = top.querySelector(".body")!;
      // Drop the nodes from 3 onwards so that future additions don't change
      // this test.
      while (body.childNodes[3] !== undefined) {
        body.removeChild(body.childNodes[3]);
      }
      const parent = top.parentNode!;

      const pair = tu.splitAt(top, node, 3);

      const texts = childrenByClass(parent, "text");
      const firstText = texts[0];
      const nextText = texts[1];
      // Check that we're doing what we think we're doing.
      assert.equal(firstText.outerHTML,
                   `\
<div class="text _local_text _xmlns_http://www.tei-c.org/ns/1.0 _real">\
<div class="body _local_body _xmlns_http://www.tei-c.org/ns/1.0 _real">\
<div class="p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real">blah</div>\
<div class="p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real">\
before \
<div class="quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real">\
quo</div></div></div></div>`, "before");
      assert.equal(pair[0], firstText);
      assert.equal(pair[1], nextText);
      assert.equal(nextText.outerHTML,
                   `\
<div class="text _local_text _xmlns_http://www.tei-c.org/ns/1.0 _real">\
<div class="body _local_body _xmlns_http://www.tei-c.org/ns/1.0 _real">\
<div class="p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real">\
<div class="quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real">\
ted</div> between \
<div class="quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real">\
quoted2</div> after</div>\
<div class="p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real">\
<div class="quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real">\
quoted</div>\
<div class="quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real">\
quoted2</div>\
<div class="quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real">\
quoted3</div></div>\
</div></div>`, "after");
       });

    it("does the right thing if spliting at end an element", () => {
      const top = root.querySelector(".body>.p")!;
      const node = top.firstChild!;
      // Make sure we're looking at the right stuff.
      assert.equal(node.nodeValue!.length, 4);
      const pair = tu.splitAt(top, node, 4);
      assert.equal((pair[0] as HTMLElement).outerHTML, `\
<div class="p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real">blah</div>`);
      assert.equal((pair[1] as HTMLElement).outerHTML, `\
<div class="p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real"></div>`);
    });
  });

  describe("insertText", () => {
    it("generates appropriate events when it modifies a text node", () => {
      const node = root.querySelector(".title")!.firstChild!;
      const listener = new Listener(tu);
      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.equal(ev.value, "abQcd");
      });
      listener.expected.SetTextNodeValue = 1;
      const { node: textNode, isNew, caret } = tu.insertText(node, 2, "Q");

      // Check that we're doing what we think we're doing.
      assert.equal(textNode as Node, node);
      assert.isFalse(isNew);
      assert.equal(textNode!.nodeValue, "abQcd");
      assert.equal(caret.node, textNode);
      assert.equal(caret.offset, 3);
      listener.check();
    });

    function makeSeries(seriesTitle: string,
                        caretAtEnd: boolean,
                        adapter: (node: Node,
                                  offset: number,
                                  text: string) => TextInsertionResult)
    : void {
      describe(seriesTitle, () => {
        it("generates appropriate events when it uses the next text node",
           () => {
             const node = root.querySelector(".title")!;
             const listener = new Listener(tu);
             tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
               assert.equal(ev.node, node.firstChild);
               assert.equal(ev.value, "Qabcd");
             });
             listener.expected.SetTextNodeValue = 1;

             const { node: textNode, isNew, caret } = adapter(node, 0, "Q");

             // Check that we're doing what we think we're doing.
             assert.equal(textNode as Node, node.firstChild);
             assert.isFalse(isNew);
             assert.equal(textNode!.nodeValue, "Qabcd");
             assert.equal(caret.node, textNode);
             assert.equal(caret.offset, caretAtEnd ? 1 : 0);

             listener.check();
           });

        it("generates appropriate events when it uses the previous text node",
           () => {
             const node = root.querySelector(".title")!;

             const listener = new Listener(tu);
             tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
               assert.equal(ev.node, node.firstChild);
               assert.equal(ev.value, "abcdQ");
             });
             listener.expected.SetTextNodeValue = 1;

             const { node: textNode, isNew, caret } = adapter(node, 1, "Q");

             // Check that we're doing what we think we're doing.
             assert.equal(textNode as Node, node.firstChild);
             assert.isFalse(isNew);
             assert.equal(textNode!.nodeValue, "abcdQ");
             assert.equal(caret.node, textNode);
             assert.equal(caret.offset, caretAtEnd ? 5 : 4);

             listener.check();
           });

        it("generates appropriate events when it creates a text node", () => {
          const node = root.querySelector(".title") as HTMLElement;
          // tslint:disable-next-line:no-inner-html
          node.innerHTML = "";

          const listener = new Listener(tu);
          tu.events.pipe(filter(filterInsertNodeAtAndBefore))
            .subscribe((ev) => {
              assert.equal(ev.parent, node);
              assert.equal(ev.index, 0);
              assert.equal(ev.node.nodeValue, "test");
            });
          listener.expected.InsertNodeAt = 1;
          listener.expected.BeforeInsertNodeAt = 1;

          const { node: textNode, isNew, caret } = adapter(node, 0, "test");

          // Check that we're doing what we think we're doing.
          assert.equal(textNode as Node, node.firstChild);
          assert.equal(textNode!.nodeValue, "test");
          assert.isTrue(isNew);
          assert.equal(caret.node, textNode);
          assert.equal(caret.offset, caretAtEnd ? 4 : 0);

          listener.check();
        });

        it("does nothing if passed an empty string", () => {
          const node = root.querySelector(".title")!;
          const listener = new Listener(tu);

          assert.equal(node.firstChild!.nodeValue, "abcd");
          const { node: textNode, isNew, caret } = adapter(node, 1, "");

          // Check that we're doing what we think we're doing.
          assert.equal(node.firstChild!.nodeValue, "abcd");
          assert.isUndefined(textNode);
          assert.isFalse(isNew);
          assert.equal(caret.node, node);
          assert.equal(caret.offset, 1);

          listener.check();
        });
      });
    }

    // tslint:disable-next-line:mocha-no-side-effect-code
    makeSeries("(caretAtEnd unspecified)",
               true,
               (node, offset, text) => tu.insertText(node, offset, text));
    // tslint:disable-next-line:mocha-no-side-effect-code
    makeSeries("(caretAtEnd true)",
               true,
               (node, offset, text) => tu.insertText(node, offset, text, true));
    // tslint:disable-next-line:mocha-no-side-effect-code
    makeSeries("(caretAtEnd false)",
               false,
               (node, offset, text) =>
               tu.insertText(node, offset, text, false));
  });

  describe("deleteText", () => {
    it("fails on non-text node", () => {
      const node = root.querySelector(".title")!;
      assert.throws(tu.deleteText.bind(tu, node, 0, "t"), Error,
                   "deleteText called on non-text");
    });

    it("generates appropriate events when it modifies a text node", () => {
      const node = root.querySelector(".title")!.firstChild as Text;
      const listener = new Listener(tu);
      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.equal(ev.value, "ab");
      });
      listener.expected.SetTextNodeValue = 1;

      tu.deleteText(node, 2, 2);

      // Check that we're doing what we think we're doing.
      assert.equal(node.nodeValue, "ab");
      listener.check();
    });

    it("generates appropriate events when it deletes an empty text node",
       () => {
         const node = root.querySelector(".title")!.firstChild as Text;
         const listener = new Listener(tu);

         tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
           assert.equal(ev.node, node);
           assert.isNotNull(ev.node.parentNode);
         });
         listener.expected.BeforeDeleteNode = 1;

         tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
           assert.equal(ev.node, node);
           assert.isNull(ev.node.parentNode);
         });
         listener.expected.DeleteNode = 1;

         tu.deleteText(node, 0, 4);
         // Check that we're doing what we think we're doing.
         assert.isNull(node.parentNode);
         listener.check();
       });
  });

  describe("setAttribute", () => {
    it("fails on non-element node", () => {
      const node = root.querySelector(".title")!.firstChild;
      assert.throws(tu.setAttribute.bind(tu, node, "q", "ab"), Error,
                    "setAttribute called on non-element");
    });

    it("generates appropriate events when changing an attribute", () => {
      const node = root.querySelector(".title")!;

      // Check that the attribute is not set yet.
      assert.equal(node.getAttribute("q"), undefined);

      const listener = new Listener(tu);
      tu.events.pipe(filter(filterSetAttributeNS)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.equal(ev.ns, "");
        assert.equal(ev.attribute, "q");
        assert.equal(ev.oldValue, undefined);
        assert.equal(ev.newValue, "ab");
      });
      listener.expected.SetAttributeNS = 1;

      tu.setAttribute(node, "q", "ab");

      // Check that we're doing what we think we're doing.
      assert.equal(node.getAttribute("q"), "ab");
      listener.check();
    });

    it("generates appropriate events when removing an attribute", () => {
      const node = root.querySelector(".title")!;

      // Set the attribute
      node.setAttribute("q", "ab");

      const listener = new Listener(tu);
      tu.events.pipe(filter(filterSetAttributeNS)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.equal(ev.ns, "");
        assert.equal(ev.attribute, "q");
        assert.equal(ev.oldValue, "ab");
        assert.equal(ev.newValue, null);
      });
      listener.expected.SetAttributeNS = 1;

      tu.setAttribute(node, "q", null);

      assert.equal(node.getAttribute("q"), undefined, "value after");
      listener.check();
    });
  });

  describe("insertIntoText", () => {
    it("fails on non-text node", () => {
      const node = root.querySelector(".title")!;
      assert.throws(tu.insertIntoText.bind(tu, node, 0, node), Error,
                    "insertIntoText called on non-text");
    });

    it("fails on undefined node to insert", () => {
      const node = root.querySelector(".title")!.firstChild;
      assert.throws(tu.insertIntoText.bind(tu, node, 0, undefined), Error,
                    "must pass an actual node to insert");
    });

    it("generates appropriate events when inserting a new element", () => {
      const parent = root.querySelector(".title")!;
      const node = parent.firstChild as Text;
      const el = document.createElement("span");
      const listener = new Listener(tu);

      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = 1;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNull(ev.node.parentNode);
      });
      listener.expected.DeleteNode = 1;

      const inaCalls = [
        [parent, 0],
        [parent, 1],
        [parent, 2],
      ];
      let inaCallIx = 0;
      tu.events.pipe(filter(filterInsertNodeAtAndBefore))
        .subscribe((ev) => {
          const call = inaCalls[inaCallIx];
          assert.equal(ev.parent, call[0] as Node);
          assert.equal(ev.index, call[1]);
          // We don't check ev.node here.
          if (ev.name === "InsertNodeAt") {
            inaCallIx++;
          }
        });
      listener.expected.InsertNodeAt = 3;
      listener.expected.BeforeInsertNodeAt = 3;

      const pair = tu.insertIntoText(node, 2, el);

      // Check that we're doing what we think we're doing.
      assert.equal(pair[0].node.nodeValue, "ab");
      assert.equal(pair[0].node.nextSibling, el);
      assert.equal(pair[0].offset, 2);
      assert.equal(pair[1].node.nodeValue, "cd");
      assert.equal(pair[1].node.previousSibling, el);
      assert.equal(pair[1].offset, 0);
      assert.equal(root.querySelector(".title")!.childNodes.length, 3);
      assert.equal(root.querySelector(".title")!.childNodes[1], el);

      listener.check();
    });

    it("works fine with negative offset", () => {
      const node = root.querySelector(".title")!.firstChild as Text;
      const parent = node.parentNode;
      const el = document.createElement("span");

      const listener = new Listener(tu);

      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = 1;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNull(ev.node.parentNode);
      });
      listener.expected.DeleteNode = 1;

      const inaCalls = [
        [parent, 0],
        [parent, 1],
      ];
      let inaCallIx = 0;
      tu.events.pipe(filter(filterInsertNodeAtAndBefore))
        .subscribe((ev) => {
          const call = inaCalls[inaCallIx];
          assert.equal(ev.parent, call[0]);
          assert.equal(ev.index, call[1]);
          // We don't check ev.node here.
          if (ev.name === "InsertNodeAt") {
            inaCallIx++;
          }
        });
      listener.expected.InsertNodeAt = 2;
      listener.expected.BeforeInsertNodeAt = 2;

      const pair = tu.insertIntoText(node, -1, el);

      // Check that we're doing what we think we're doing.
      assert.equal(pair[0].node, parent);
      assert.equal(pair[0].offset, 0);
      assert.equal(pair[1].node.nodeValue, "abcd");
      assert.equal(pair[1].node.previousSibling, el);
      assert.equal(root.querySelector(".title")!.childNodes.length, 2);

      listener.check();
    });

    it("works fine with offset beyond text length", () => {
      const node = root.querySelector(".title")!.firstChild as Text;
      const parent = node.parentNode;
      const el = document.createElement("span");

      const listener = new Listener(tu);

      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = 1;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNull(ev.node.parentNode);
      });
      listener.expected.DeleteNode = 1;

      const inaCalls = [
        [parent, 0],
        [parent, 1],
      ];
      let inaCallIx = 0;
      tu.events.pipe(filter(filterInsertNodeAtAndBefore))
        .subscribe((ev) => {
          const call = inaCalls[inaCallIx];
          assert.equal(ev.parent, call[0]);
          assert.equal(ev.index, call[1]);
          // We don't check ev.node here.
          if (ev.name === "InsertNodeAt") {
            inaCallIx++;
          }
        });
      listener.expected.InsertNodeAt = 2;
      listener.expected.BeforeInsertNodeAt = 2;

      const pair = tu.insertIntoText(node, node.nodeValue!.length, el);

      // Check that we're doing what we think we're doing.
      assert.equal(pair[0].node.nodeValue, "abcd");
      assert.equal(pair[0].node.nextSibling, el);
      assert.equal(pair[1].node, parent);
      assert.equal(pair[1].offset, 2);
      assert.equal(root.querySelector(".title")!.childNodes.length, 2);
      listener.check();
    });
  });

  describe("setTextNodeValue", () => {
    it("fails on non-text node", () => {
      const node = root.querySelector(".title")!;
      assert.throws(tu.setTextNode.bind(tu, node, "test"), Error,
                   "setTextNode called on non-text");
    });

    it("generates appropriate events when setting text", () => {
      const node = root.querySelector(".title")!.firstChild as Text;
      const listener = new Listener(tu);
      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.equal(ev.value, node.nodeValue);
      });
      listener.expected.SetTextNodeValue = 1;

      assert.equal(node.nodeValue, "abcd");
      tu.setTextNode(node, "test");

      // Check that we're doing what we think we're doing.
      assert.equal(node.nodeValue, "test");
      listener.check();
    });

    it("generates appropriate events when setting text to an empty string",
       () => {
         const node = root.querySelector(".title")!.firstChild as Text;
         const listener = new Listener(tu);

         tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
           assert.equal(ev.node, node);
           assert.isNotNull(ev.node.parentNode);
         });
         listener.expected.BeforeDeleteNode = 1;

         tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
           assert.equal(ev.node, node);
           assert.isNull(ev.node.parentNode);
         });
         listener.expected.DeleteNode = 1;

         assert.equal(node.nodeValue, "abcd");
         tu.setTextNode(node, "");

         // Check that we're doing what we think we're doing.
         assert.isNull(node.parentNode);
         listener.check();
       });
  });

  describe("removeNode", () => {
    it("generates appropriate events when removing a node", () => {
      const node = root.querySelectorAll(".body>.p")[2]
        .querySelectorAll(".quote")[1];
      const parent = node.parentNode as HTMLElement;
      assert.equal(parent.childNodes.length, 3);
      const listener = new Listener(tu);
      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = 1;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNull(ev.node.parentNode);
      });
      listener.expected.DeleteNode = 1;

      tu.removeNode(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.outerHTML,
                   ("\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div>\
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted3</div></div>"));

      assert.equal(parent.childNodes.length, 2);
      listener.check();
    });

    it("generates appropriate events when merging text", () => {
      const node = root.querySelectorAll(".body>.p")[1]
        .querySelector(".quote")!;
      const parent = node.parentNode as HTMLElement;
      const prev = node.previousSibling;
      const next = node.nextSibling;
      assert.equal(parent.childNodes.length, 5);
      const listener = new Listener(tu);
      let firstBefore = true;
      let first = true;
      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        // beforeDeleteNode will be emitted twice. Once to
        // remove the node itself, and second to merge the
        // text nodes.
        if (firstBefore) {
          assert.equal(ev.node, node);
        }
        else {
          assert.equal(ev.node, next);
        }
        assert.isNotNull(ev.node.parentNode);
        firstBefore = false;
      });
      listener.expected.BeforeDeleteNode = 2;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        // deleteNode will be emitted twice. Once to
        // remove the node itself, and second to merge the
        // text nodes.
        if (first) {
          assert.equal(ev.node, node);
        }
        else {
          assert.equal(ev.node, next);
        }
        assert.isNull(ev.node.parentNode);
        first = false;
      });
      listener.expected.DeleteNode = 2;

      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        assert.equal(ev.node, prev);
        assert.equal(ev.value, "before  between ");
      });
      listener.expected.SetTextNodeValue = 1;

      tu.removeNode(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 3);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
      listener.check();
    });

    it("does not bork on missing previous text", () => {
      // An earlier bug would cause an unhandled exception on this test.
      const node =
        root.querySelectorAll(".body>.p")[2].querySelector(".quote")!;
      const parent = node.parentNode;
      const ret = tu.removeNode(node);
      assert.equal(ret.node, parent);
      assert.equal(ret.offset, 0);
    });
  });

  describe("removeNodeNF", () => {
    it("generates appropriate events when removing a node", () => {
      const node = root.querySelectorAll(".body>.p")[2]
        .querySelectorAll(".quote")[1];
      const parent = node.parentNode as HTMLElement;
      assert.equal(parent.childNodes.length, 3);
      const listener = new Listener(tu);

      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = 1;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.isNull(ev.node.parentNode);
      });
      listener.expected.DeleteNode = 1;

      tu.removeNodeNF(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div>\
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted3</div></div>");

      assert.equal(parent.childNodes.length, 2);
      listener.check();
    });

    it("generates appropriate events when merging text", () => {
      const node = root.querySelectorAll(".body>.p")[1]
        .querySelector(".quote")!;
      const parent = node.parentNode as HTMLElement;
      const prev = node.previousSibling;
      const next = node.nextSibling;
      assert.equal(parent.childNodes.length, 5);
      const listener = new Listener(tu);

      let firstBefore = true;
      let first = true;

      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        // beforeDeleteNode will be emitted twice. Once to
        // remove the node itself, and second to merge the
        // text nodes.
        if (firstBefore) {
          assert.equal(ev.node, node);
        }
        else {
          assert.equal(ev.node, next);
        }
        assert.isNotNull(ev.node.parentNode);
        firstBefore = false;
      });
      listener.expected.BeforeDeleteNode = 2;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        // deleteNode will be emitted twice. Once to
        // remove the node itself, and second to merge the
        // text nodes.
        if (first) {
          assert.equal(ev.node, node);
        }
        else {
          assert.equal(ev.node, next);
        }
        assert.isNull(ev.node.parentNode);
        first = false;
      });
      listener.expected.DeleteNode = 2;

      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        assert.equal(ev.node, prev);
        assert.equal(ev.value, "before  between ");
      });
      listener.expected.SetTextNodeValue = 1;

      tu.removeNodeNF(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 3);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
      listener.check();
    });

    it("does not bork on missing previous text", () => {
      // An earlier bug would cause an unhandled exception on this
      // test.
      const node = root.querySelectorAll(".body>.p")[2]
        .querySelector(".quote")!;
      const parent = node.parentNode;
      const ret = tu.removeNodeNF(node)!;
      assert.equal(ret.node, parent);
      assert.equal(ret.offset, 0);
    });

    it("generates no events if the node is undefined", () => {
      const listener = new Listener(tu);
      const initialHTML = root.outerHTML;

      assert.isUndefined(tu.removeNodeNF(undefined));

      // Check that nothing changed.
      assert.equal(root.outerHTML, initialHTML);
      listener.check();
    });

    it("generates no events if the node is null", () => {
      const listener = new Listener(tu);
      const initialHTML = root.outerHTML;

      assert.isUndefined(tu.removeNodeNF(null));

      // Check that nothing changed.
      assert.equal(root.outerHTML, initialHTML);
      listener.check();
    });
  });

  describe("removeNodes", () => {
    it("fails on nodes of different parents", () => {
      // An earlier bug would cause an unhandled exception on this
      // test.
      const node = root.querySelectorAll(".body>.p")[2]
        .querySelector(".quote")!;
      assert.throws(tu.removeNodes.bind(tu, [node, node.parentNode]),
                    Error,
                   "nodes are not immediately contiguous in document order");
    });

    it("generates appropriate events when merging text", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const quotes = childrenByClass(p, "quote");
      const firstNode = quotes[0];
      const lastNode = quotes[quotes.length - 1];
      const nodes = Array.prototype.slice.call(
        p.childNodes,
        indexOf(p.childNodes, firstNode),
        indexOf(p.childNodes, lastNode) + 1);
      const parent = firstNode.parentNode as HTMLElement;
      const prev = firstNode.previousSibling;
      const next = lastNode.nextSibling;
      assert.equal(parent.childNodes.length, 5);

      const listener = new Listener(tu);
      const calls = nodes.concat([next]);
      let callsIx = 0;
      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        const call = calls[callsIx];
        assert.equal(ev.node, call, `beforeDeleteNode call ${callsIx}`);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = 4;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        const call = calls[callsIx];
        assert.equal(ev.node, call, `beforeDeleteNode call ${callsIx}`);
        assert.isNull(ev.node.parentNode);
        callsIx++;
      });
      listener.expected.DeleteNode = 4;

      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        assert.equal(ev.node, prev, "setTextNodeValue node");
        assert.equal(ev.value, "before  after", "setTextNodeValue value");
      });
      listener.expected.SetTextNodeValue = 1;

      tu.removeNodes(nodes);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 1);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
before  after</div>");
      listener.check();
    });

    it("does not bork on missing previous text", () => {
      // An earlier bug would cause an unhandled exception on this
      // test.
      const node = root.querySelectorAll(".body>.p")[2]
        .querySelector(".quote")!;
      const parent = node.parentNode;
      const ret = tu.removeNodes([node])!;
      assert.equal(ret.node, parent);
      assert.equal(ret.offset, 0);
    });
  });

  describe("mergeTextNodes", () => {
    it("generates appropriate events when merging text", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      // Remove the first quote so that we have two text nodes adjacent.
      const quote = childByClass(p, "quote")!;
      p.removeChild(quote);
      const node = p.firstChild!;
      const parent = node.parentNode as HTMLElement;
      const next = node.nextSibling;
      assert.equal(parent.childNodes.length, 4);
      const listener = new Listener(tu);

      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, next);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = 1;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, next);
        assert.isNull(ev.node.parentNode);
      });
      listener.expected.DeleteNode = 1;

      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.equal(ev.value, "before  between ");
      });
      listener.expected.SetTextNodeValue = 1;

      tu.mergeTextNodes(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 3);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
      listener.check();
    });

    it("does nothing if there is nothing to do", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const node = p.firstChild!;
      const parent = node.parentNode as HTMLElement;
      assert.equal(parent.childNodes.length, 5);

      const listener = new Listener(tu);
      tu.mergeTextNodes(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 5);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div> between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
      listener.check();
    });

    it("returns a proper caret value when it merges", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      // Remove the first quote so that we have two text nodes adjacent.
      const quote = childByClass(p, "quote")!;
      p.removeChild(quote);
      const node = p.firstChild!;
      const parent = node.parentNode as HTMLElement;
      assert.equal(parent.childNodes.length, 4);
      const ret = tu.mergeTextNodes(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 3);
      assert.equal(
        parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
before  between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");

      // Check return value.
      assert.equal(ret.node, node);
      assert.equal(ret.offset, 7);
    });

    it("returns a proper caret value when it does nothing", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const node = p.firstChild!;
      const parent = node.parentNode as HTMLElement;
      assert.equal(parent.childNodes.length, 5);

      const listener = new Listener(tu);
      const ret = tu.mergeTextNodes(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 5);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div> between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
      listener.check();

      // Check the return value.
      assert.equal(ret.node, parent);
      assert.equal(ret.offset, indexOf(parent.childNodes, node) + 1);
    });
  });

  describe("mergeTextNodesNF", () => {
    it("generates appropriate events when merging text", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      // Remove the first quote so that we have two text nodes adjacent.
      const quote = childByClass(p, "quote")!;
      p.removeChild(quote);
      const node = p.firstChild!;
      const parent = node.parentNode as HTMLElement;
      const next = node.nextSibling;
      assert.equal(parent.childNodes.length, 4);
      const listener = new Listener(tu);

      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, next);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = 1;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        assert.equal(ev.node, next);
        assert.isNull(ev.node.parentNode);
      });
      listener.expected.DeleteNode = 1;

      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        assert.equal(ev.node, node);
        assert.equal(ev.value, "before  between ");
      });
      listener.expected.SetTextNodeValue = 1;

      tu.mergeTextNodesNF(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 3);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
      listener.check();
    });

    it("does nothing if there is nothing to do", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const node = p.firstChild!;
      const parent = node.parentNode as HTMLElement;
      assert.equal(parent.childNodes.length, 5);

      const listener = new Listener(tu);
      tu.mergeTextNodesNF(node);

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 5);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div> between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
      listener.check();
    });

    it("returns a proper caret value when it merges", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      // Remove the first quote so that we have two text nodes adjacent.
      const quote = childByClass(p, "quote")!;
      p.removeChild(quote);
      const node = p.firstChild!;
      const parent = node.parentNode as HTMLElement;
      assert.equal(parent.childNodes.length, 4);
      const ret = tu.mergeTextNodesNF(node)!;

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 3);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");

      // Check return value.
      assert.equal(ret.node, node);
      assert.equal(ret.offset, 7);
    });

    it("returns a proper caret value when it does nothing", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const node = p.firstChild!;
      const parent = node.parentNode as HTMLElement;
      assert.equal(parent.childNodes.length, 5);

      const listener = new Listener(tu);
      const ret = tu.mergeTextNodesNF(node)!;

      // Check that we're doing what we think we're doing.
      assert.equal(parent.childNodes.length, 5);
      assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div> between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
      listener.check();

      // Check the return value.
      assert.equal(ret.node, parent);
      assert.equal(ret.offset, indexOf(parent.childNodes, node) + 1);
    });

    it("generates no events if the node is undefined", () => {
      const listener = new Listener(tu);
      const initialHTML = root.outerHTML;

      assert.isUndefined(tu.removeNodeNF(undefined));

      // Check that nothing changed.
      assert.equal(root.outerHTML, initialHTML);
      listener.check();
    });

    it("generates no events if the node is null", () => {
      const listener = new Listener(tu);
      const initialHTML = root.outerHTML;

      assert.isUndefined(tu.mergeTextNodesNF(null));

      // Check that nothing changed.
      assert.equal(root.outerHTML, initialHTML);
      listener.check();
    });
  });

  describe("cut", () => {
    function checkNodes(ret: Node[], nodes: Node[]): void {
      assert.equal(ret.length, nodes.length, "result length");
      for (let i = 0; i < nodes.length; ++i) {
        assert.equal(ret[i].nodeType, nodes[i].nodeType);
        assert.isTrue(ret[i].nodeType === Node.TEXT_NODE ||
                      ret[i].nodeType === Node.ELEMENT_NODE, "node type");
        switch (ret[i].nodeType) {
        case Node.TEXT_NODE:
          assert.equal(ret[i].nodeValue, nodes[i].nodeValue,
                       `text node at ${i}`);
          break;
        case Node.ELEMENT_NODE:
          assert.equal((ret[i] as HTMLElement).outerHTML,
                       (nodes[i] as HTMLElement).outerHTML,
                       `element node at ${i}`);
          break;
        default:
        }
      }
    }

    it("generates appropriate events when merging text", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const start = DLoc.mustMakeDLoc(root, p.firstChild, 4);
      const end = DLoc.mustMakeDLoc(root, p.childNodes[4], 3);
      assert.equal(p.childNodes.length, 5);

      let nodes = Array.prototype.slice.call(
        p.childNodes,
        indexOf(p.childNodes, start.node.nextSibling!),
        indexOf(p.childNodes, end.node.previousSibling!) + 1);
      const listener = new Listener(tu);
      nodes = nodes.reverse();
      const calls = nodes.concat([end.node]);
      let callsIx = 0;

      tu.events.pipe(filter(filterBeforeDeleteNode)).subscribe((ev) => {
        const call = calls[callsIx];
        assert.equal(ev.node, call, `beforeDeleteNode call ${callsIx}`);
        assert.isNotNull(ev.node.parentNode);
      });
      listener.expected.BeforeDeleteNode = calls.length;

      tu.events.pipe(filter(filterDeleteNode)).subscribe((ev) => {
        const call = calls[callsIx];
        assert.equal(ev.node, call, `beforeDeleteNode call ${callsIx}`);
        assert.isNull(ev.node.parentNode);
        callsIx++;
      });
      listener.expected.DeleteNode = calls.length;

      const stnvCalls = [
        [start.node, "befo"],
        [end.node, "ter"],
        [start.node, "befoter"],
      ];
      let stnvCallsIx = 0;
      tu.events.pipe(filter(filterSetTextNodeValue)).subscribe((ev) => {
        const call = stnvCalls[stnvCallsIx];
        assert.equal(ev.node, call[0],
                     `setTextNodeValue node, call ${stnvCallsIx}`);
        assert.equal(ev.value, call[1],
                     `setTextNodeValue value, call ${stnvCallsIx}`);
        stnvCallsIx++;
      });
      listener.expected.SetTextNodeValue = 3;

      tu.cut(start, end);

      // Check that we're doing what we think we're doing.
      assert.equal(p.childNodes.length, 1);
      assert.equal(p.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
befoter</div>");
      listener.check();
    });

    it("returns proper nodes when merging a single node", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const start = DLoc.mustMakeDLoc(root, p.firstChild, 4);
      const end = DLoc.mustMakeDLoc(root, p.firstChild, 6);
      assert.equal(p.childNodes.length, 5);

      const nodes = [p.ownerDocument.createTextNode("re")];
      const ret = tu.cut(start, end);

      // Check that we're doing what we think we're doing.
      assert.equal(p.childNodes.length, 5);
      assert.equal(p.firstChild!.nodeValue, "befo ");

      assert.isTrue(ret.length > 0);
      checkNodes(ret[1], nodes);
      assert.equal(ret[0].node, p.firstChild);
      assert.equal(ret[0].offset, 4);
    });

    it("returns proper nodes when merging text", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const start = DLoc.mustMakeDLoc(root, p.firstChild, 4);
      const end = DLoc.mustMakeDLoc(root, p.childNodes[4], 3);
      assert.equal(p.childNodes.length, 5);

      const nodes = Array.prototype.slice.call(
        p.childNodes,
        indexOf(p.childNodes, start.node.nextSibling!),
        indexOf(p.childNodes, end.node.previousSibling!) + 1);
      new Listener(tu); // eslint-disable-line no-new
      nodes.unshift(p.ownerDocument.createTextNode("re "));
      nodes.push(p.ownerDocument.createTextNode(" af"));

      const ret = tu.cut(start, end);

      // Check that we're doing what we think we're doing.
      assert.equal(p.childNodes.length, 1);
      assert.equal(p.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
befoter</div>");

      assert.isTrue(ret.length > 0);
      checkNodes(ret[1], nodes);
      assert.equal(ret[0].node, p.firstChild);
      assert.equal(ret[0].offset, 4);
    });

    it("empties an element without problem", () => {
      const p = root.querySelectorAll(".body>.p")[1];
      const start = DLoc.mustMakeDLoc(root, p, 0);
      const end = DLoc.mustMakeDLoc(root, p, p.childNodes.length);
      assert.equal(p.childNodes.length, 5);

      const nodes = Array.prototype.slice.call(p.childNodes);
      const ret = tu.cut(start, end);

      // Check that we're doing what we think we're doing.
      assert.equal(p.childNodes.length, 0);

      assert.isTrue(ret.length > 0);
      // Check the caret position.
      assert.equal(ret[0].node, p);
      assert.equal(ret[0].offset, 0);
      // Check that the nodes are those we expected.
      checkNodes(ret[1], nodes);
    });
  });
});

//  LocalWords:  domroot concat DOM html previousSibling nextSibling
//  LocalWords:  prev abcd jQuery cd Dubeau MPL Mangalam RequireJS
//  LocalWords:  mergeTextNodes removeNodes unhandled removeNode chai
//  LocalWords:  insertIntoText deleteText setTextNodeValue onwards
//  LocalWords:  insertText deleteNode denormalize splitAt jquery
//  LocalWords:  insertNodeAt TreeUpdater
