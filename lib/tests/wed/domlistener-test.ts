/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import $ from "jquery";

import * as dloc from "wed/dloc";
import { AddedElementHandler, AttributeChangedHandler, ChildrenChangedHandler,
         ChildrenChangingHandler, DOMListener, ExcludedElementHandler,
         ExcludingElementHandler, IncludedElementHandler, RemovedElementHandler,
         RemovingElementHandler, TextChangedHandler } from "wed/domlistener";
import { indexOf } from "wed/domutil";
import { TreeUpdater } from "wed/tree-updater";

const assert = chai.assert;

// tslint:disable-next-line:completed-docs
class Mark {
  private count: number = 0;
  private readonly counts: Record<string, number> = Object.create(null);

  constructor(private readonly totalExpected: number,
              private readonly countsExpected: Record<string, number>,
              readonly listener: DOMListener,
              private readonly done: () => void) {}

  check(): void {
    // We iterate so that we can get a precise error message.
    for (const k of Object.keys(this.countsExpected)) {
      assert.equal(this.counts[k], this.countsExpected[k], `count for ${k}`);
    }

    for (const k of Object.keys(this.counts)) {
      assert.equal(this.counts[k], this.countsExpected[k]);
    }

    assert.equal(this.count, this.totalExpected, "total mark count");
    this.done();
  }

  mark(label: string): void {
    if (this.counts[label] === undefined) {
      this.counts[label] = 0;
    }

    this.counts[label]++;

    this.count++;
  }
}

describe("domlistener", () => {
  let domroot: HTMLElement;
  let root: HTMLElement;
  let $root: JQuery;
  let fragmentToAdd: HTMLElement;
  let listener: DOMListener;
  let treeUpdater: TreeUpdater;
  let mark: Mark;
  let marker: HTMLElement;

  before(() => {
    // This is a fake element we add to the root to know when we've seen
    // everything we care about.
    marker = document.createElement("div");
    marker.className = "_real _marker";

    domroot = document.createElement("div");
    document.body.appendChild(domroot);
  });

  after(() => {
    document.body.removeChild(domroot);
  });

  beforeEach(() => {
    // Create a new fragment each time.
    // tslint:disable-next-line:no-jquery-raw-elements
    fragmentToAdd = $("<div class='_real ul'><div class='_real li'>A</div>\
<div class='_real li'>B</div></div>")[0];
    // tslint:disable-next-line:no-inner-html
    domroot.innerHTML = "";
    root = document.createElement("div");
    domroot.appendChild(root);
    new dloc.DLocRoot(root);
    $root = $(root);
    treeUpdater = new TreeUpdater(root);
    listener = new DOMListener(root, treeUpdater);
  });

  afterEach(() => {
    listener.stopListening();
  });

  function makeIncludedHandler(name: string): IncludedElementHandler {
    return ((thisRoot, _tree, _parent, _previousSibling, _nextSibling,
             element) => {
      assert.equal(thisRoot, root);
      assert.equal(element.className, `_real ${name}`);
      mark.mark(`included ${name}`);
    }) as IncludedElementHandler;
  }

  function makeExcludedHandler(name: string): ExcludedElementHandler {
    return ((thisRoot, _tree, _parent, _previousSibling, _nextSibling,
             element) => {
      assert.equal(thisRoot, root);
      assert.equal(element.className, `_real ${name}`);
      mark.mark(`excluded ${name}`);
    }) as ExcludedElementHandler;
  }

  function makeExcludingHandler(name: string): ExcludingElementHandler {
    return ((thisRoot, _tree, _parent, _previousSibling, _nextSibling,
             element) => {
      assert.equal(thisRoot, root);
      assert.equal(element.className, `_real ${name}`);
      mark.mark(`excluding ${name}`);
    }) as ExcludingElementHandler;
  }

  it("fires included-element, added-element and children-changed when " +
     "adding a fragment", (done) => {
       mark = new Mark(5, {
         "included ul": 1,
         "added ul": 1,
         "children root": 1,
         "included li": 2,
       }, listener, done);
       listener.addHandler("included-element", "._real.ul",
                           makeIncludedHandler("ul"));
       listener.addHandler("included-element", "._real.li",
                           makeIncludedHandler("li"));
       listener.addHandler("added-element", "._real.ul",
                           ((thisRoot, parent, _previousSibling, _nextSibling,
                             element) => {
                              assert.equal(thisRoot, root);
                              assert.equal(thisRoot, parent);
                              assert.equal(element, fragmentToAdd);
                              mark.mark("added ul");
                            }) as AddedElementHandler);
       listener.addHandler(
         "children-changed", "*",
         ((thisRoot, added, removed, previousSibling, nextSibling, element) => {
           // The marker will also trigger this handler. Ignore it.
           if (added[0] === marker) {
             return;
           }
           assert.equal(thisRoot, element);
           assert.equal(removed.length, 0);
           assert.equal(added.length, 1);
           assert.equal(added[0], fragmentToAdd);
           assert.isNull(previousSibling);
           assert.isNull(nextSibling);
           mark.mark("children root");
         }) as ChildrenChangedHandler);
       listener.startListening();
       treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
       mark.check();
     });

  it("generates added-element with the right previous and next siblings",
     (done) => {
       mark = new Mark(2, { "added li": 2 }, listener, done);
       listener.addHandler(
         "added-element", "._real.li",
         ((_thisRoot, _parent, previousSibling, nextSibling, element) => {
           assert.equal(previousSibling, element.previousSibling);
           assert.equal(nextSibling, element.nextSibling);
           mark.mark("added li");
         }) as AddedElementHandler);
       root.appendChild(fragmentToAdd);
       const $li = $root.find("._real.li");
       $li.remove();
       listener.startListening();
       const parent = root.querySelector(".ul")!;
       $li.each(function each(this: Node): void {
         // tslint:disable-next-line:no-invalid-this
         treeUpdater.insertNodeAt(parent, parent.childNodes.length, this);
       });
       mark.check();
     });

  it("generates removing-element and removed-element with " +
     "the right previous and next siblings", (done) => {
       mark = new Mark(4, {
         "removing li": 2,
         "removed li": 2,
       }, listener, done);
       root.appendChild(fragmentToAdd);
       const $li = $root.find("._real.li");
       listener.addHandler(
         "removing-element", "._real.li",
         ((_thisRoot, _parent, previousSibling, nextSibling, element) => {
           const text = element.firstChild!.nodeValue;
           if (text === "A") {
             assert.isNull(previousSibling, "previous sibling of A");
             assert.equal(nextSibling, $li[1], "next sibling of A");
           }
           else {
             // By the time we get here, B is alone.
             assert.isNull(previousSibling, "previous sibling of B");
           }
           mark.mark("removing li");
         }) as RemovingElementHandler);

       const ul = root.querySelector("._real.ul");
       listener.addHandler(
         "removed-element", "._real.li",
         ((_thisRoot, parent, previousSibling, nextSibling) => {
           assert.isNull(previousSibling, "previous sibling of A");
           assert.isNull(nextSibling, "next sibling of B");
           assert.equal(parent, ul);
           mark.mark("removed li");
         }) as RemovedElementHandler);

       listener.startListening();
       $li.each(function each(this: HTMLElement): void {
         // tslint:disable-next-line:no-invalid-this
         treeUpdater.deleteNode(this);
       });
       mark.check();
     });

  it("fires excluding-element, excluded-element, removing-element, " +
     "removed-element, children-changing and children-changed when " +
     "removing a fragment", (done) => {
       root.appendChild(fragmentToAdd);
       mark = new Mark(10, {
         "excluding ul": 1,
         "excluded ul": 1,
         "removing ul": 1,
         "removed ul": 1,
         "children-changing root": 1,
         "children-changed root": 1,
         "excluding li": 2,
         "excluded li": 2,
       }, listener, done);
       listener.addHandler("excluding-element", "._real.ul",
                           makeExcludingHandler("ul"));
       listener.addHandler("excluded-element", "._real.ul",
                           makeExcludedHandler("ul"));
       listener.addHandler("excluding-element", "._real.li",
                           makeExcludingHandler("li"));
       listener.addHandler("excluded-element", "._real.li",
                           makeExcludedHandler("li"));

       listener.addHandler(
         "removing-element", "._real.ul",
         ((thisRoot, parent, _previousSibling, _nextSibling, element) => {
           assert.equal(thisRoot, root);
           assert.equal(thisRoot, parent);
           assert.equal(element, fragmentToAdd);
           mark.mark("removing ul");
         }) as RemovingElementHandler);

       listener.addHandler(
         "removed-element", "._real.ul",
         ((thisRoot, parent, previousSibling, nextSibling, element) => {
           assert.equal(thisRoot, root);
           assert.equal(thisRoot, parent);
           assert.equal(element, fragmentToAdd);
           assert.isNull(previousSibling);
           assert.isNull(nextSibling);
           mark.mark("removed ul");
         }) as RemovedElementHandler);

       listener.addHandler(
         "children-changing", "*",
         ((thisRoot, added, removed, previousSibling, nextSibling,
           element) => {
             // The marker will also trigger this handler. Ignore it.
             if (added[0] === marker) {
               return;
             }
             assert.equal(thisRoot, element);
             assert.equal(added.length, 0);
             assert.equal(removed.length, 1);
             assert.equal(removed[0], fragmentToAdd);
             assert.isNull(previousSibling);
             assert.isNull(nextSibling);
             mark.mark("children-changing root");
           }) as ChildrenChangingHandler);

       listener.addHandler(
         "children-changed", "*",
         ((thisRoot, added, removed, previousSibling, nextSibling, element) => {
           // The marker will also trigger this handler. Ignore it.
           if (added[0] === marker) {
             return;
           }
           assert.equal(thisRoot, element);
           assert.equal(added.length, 0);
           assert.equal(removed.length, 1);
           assert.equal(removed[0], fragmentToAdd);
           assert.isNull(previousSibling);
           assert.isNull(nextSibling);
           mark.mark("children-changed root");
         }) as ChildrenChangedHandler);
       listener.startListening();
       treeUpdater.deleteNode(fragmentToAdd);
       mark.check();
     });

  it("trigger triggered twice, invoked once", (done) => {
    mark = new Mark(3, { "triggered test": 1, "included li": 2 },
                    listener, done);
    listener.addHandler("trigger", "test", (thisRoot) => {
      assert.equal(thisRoot, root);
      mark.mark("triggered test");
    });
    listener.addHandler(
      "included-element", "._real.li",
      ((thisRoot, _tree, _parent, _previousSibling, _nextSibling, element) => {
        assert.equal(thisRoot, root);
        assert.equal(element.className, "_real li");
        listener.trigger("test");
        mark.mark("included li");
      }) as IncludedElementHandler);
    listener.startListening();
    treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
    // We have to allow for triggers to run.
    window.setTimeout(() => {
      mark.check();
    }, 0);
  });

  it("trigger triggering a trigger", (done) => {
    mark = new Mark(4, {
      "triggered test": 1,
      "triggered test2": 1,
      "included li": 2,
    }, listener, done);
    listener.addHandler("trigger", "test", (thisRoot) => {
      assert.equal(thisRoot, root);
      listener.trigger("test2");
      mark.mark("triggered test");
    });
    listener.addHandler("trigger", "test2", (thisRoot) => {
      assert.equal(thisRoot, root);
      mark.mark("triggered test2");
    });

    listener.addHandler(
      "included-element", "._real.li",
      ((thisRoot, _tree, _parent, _previousSibling, _nextSibling, element) => {
        assert.equal(thisRoot, root);
        assert.equal(element.className, "_real li");
        listener.trigger("test");
        mark.mark("included li");
      }) as IncludedElementHandler);
    listener.startListening();
    treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
    // We have to allow for triggers to run.
    window.setTimeout(() => {
      mark.check();
    }, 0);
  });

  it("fires text-changed when changing a text node", (done) => {
    mark = new Mark(1, { "text-changed": 1 }, listener, done);
    listener.addHandler(
      "text-changed", "._real.li", ((thisRoot, element, oldValue) => {
        assert.equal(thisRoot, root);
        assert.equal((element.parentNode as Element).className, "_real li");
        assert.equal(element.nodeValue, "Q");
        assert.equal(oldValue, "A");
        mark.mark("text-changed");
      }) as TextChangedHandler);
    root.appendChild(fragmentToAdd);
    listener.startListening();
    treeUpdater
      .setTextNodeValue(root.querySelector("._real.li")!.firstChild as Text,
                        "Q");
    mark.check();
  });

  it("fires children-changed when adding a text node", (done) => {
    // The handler is called twice. Once when the single text node which was
    // already there is removed. Once when the new text node is added.

    mark = new Mark(2, { "children li": 2 }, listener, done);
    let li: Node;
    let changeNo = 0;
    listener.addHandler(
      "children-changed", "._real.li",
      ((thisRoot, added, removed, previousSibling, nextSibling, element) => {
        // The marker will also trigger this handler. Ignore it.
        if (added[0] === marker) {
          return;
        }
        assert.equal(thisRoot, root);
        assert.equal(element, li);
        assert.equal(added.length, changeNo === 0 ? 0 : 1, "added elements");
        assert.equal(removed.length, changeNo === 0 ? 1 : 0,
                     "removed elements");
        assert.isNull(previousSibling);
        assert.isNull(nextSibling);
        if (changeNo === 0) {
          assert.equal(removed[0].nodeValue, "A");
        }
        else {
          assert.equal(added[0].nodeValue, "Q");
        }
        changeNo++;
        mark.mark("children li");
      }) as ChildrenChangedHandler);
    root.appendChild(fragmentToAdd);
    listener.startListening();
    li = root.querySelector("._real.li")!;
    // We'll simulate what jQuery does: remove the text node and add a new one.
    treeUpdater.deleteNode(li.firstChild!);
    treeUpdater.insertText(li, 0, "Q");
    mark.check();
  });

  it("fires attribute-changed when changing an attribute", (done) => {
    mark = new Mark(1, { "attribute-changed": 1 }, listener, done);
    listener.addHandler("attribute-changed", "._real.li",
                        ((thisRoot, element, ns, name, oldValue) => {
                          assert.equal(thisRoot, root);
                          assert.equal(element.className, "_real li");
                          // tslint:disable-next-line:no-http-string
                          assert.equal(ns, "http://foo.foo/foo");
                          assert.equal(name, "X");
                          assert.equal(oldValue, null);
                          mark.mark("attribute-changed");
                        }) as AttributeChangedHandler);
    root.appendChild(fragmentToAdd);
    listener.startListening();
    treeUpdater.setAttributeNS(
      // tslint:disable-next-line:no-http-string
      root.querySelector("._real.li")!, "http://foo.foo/foo", "X", "ttt");
    mark.check();
  });

  it("fires attribute-changed when deleting an attribute", (done) => {
    mark = new Mark(1, { "attribute-changed": 1 }, listener, done);
    listener.addHandler("attribute-changed", "._real.li",
                        ((thisRoot, element, ns, name, oldValue) => {
                          assert.equal(thisRoot, root);
                          assert.equal(element.className, "_real li");
                          // tslint:disable-next-line:no-http-string
                          assert.equal(ns, "http://foo.foo/foo");
                          assert.equal(name, "X");
                          assert.equal(oldValue, "ttt");
                          mark.mark("attribute-changed");
                        }) as AttributeChangedHandler);
    root.appendChild(fragmentToAdd);
    const li = root.querySelector("._real.li")!;
    // tslint:disable-next-line:no-http-string
    li.setAttributeNS("http://foo.foo/foo", "X", "ttt");
    listener.startListening();
    // tslint:disable-next-line:no-http-string
    treeUpdater.setAttributeNS(li, "http://foo.foo/foo", "X", null);
    mark.check();
  });

  it("generates children-changed with the right previous and " +
     "next siblings when adding", (done) => {
       mark = new Mark(1, { "children ul": 1 }, listener, done);
       root.appendChild(fragmentToAdd);
       const li = root.querySelectorAll("._real.li");
       listener.addHandler(
         "children-changed", "._real.ul",
         ((_thisRoot, added, _removed, previousSibling, nextSibling) => {
           // The marker will also trigger this handler. Ignore it.
           if (added[0] === marker) {
             return;
           }
           assert.equal(previousSibling, li[0]);
           assert.equal(nextSibling, li[1]);
           mark.mark("children ul");
         }) as ChildrenChangedHandler);
       listener.startListening();
       const $new = $("<li>Q</li>");
       treeUpdater
         .insertNodeAt(li[0].parentNode!,
                       indexOf(li[0].parentNode!.childNodes, li[0]) + 1,
                       $new[0]);
       mark.check();
     });

  it("generates children-changing and children-changed with " +
     "the right previous and next siblings when removing", (done) => {
       fragmentToAdd = $(`<div class='_real ul'><div class='_real li'>A</div>\
<div class='_real li'>B</div><div class='_real li'>C</div></div>`)[0];

       mark = new Mark(2, {
         "children-changed ul": 1,
         "children-changing ul": 1,
       }, listener, done);
       root.appendChild(fragmentToAdd);
       const $li = $root.find("._real.li");
       const parent = $li[0].parentNode;
       listener.addHandler(
         "children-changing", "._real.ul",
         ((_thisRoot, added, _removed, previousSibling, nextSibling,
           element) => {
           // The marker will also trigger this handler. Ignore it.
           if (added[0] === marker) {
             return;
           }
           assert.equal(previousSibling, $li[0]);
           assert.equal(nextSibling, $li[2]);
           assert.equal(element, parent);
           mark.mark("children-changing ul");
         }) as ChildrenChangingHandler);

       listener.addHandler(
         "children-changed", "._real.ul",
         ((_thisRoot, added, _removed, previousSibling, nextSibling,
           element) => {
           // The marker will also trigger this handler. Ignore it.
           if (added[0] === marker) {
             return;
           }
           assert.isNull(previousSibling);
           assert.isNull(nextSibling);
           assert.equal(element, parent);
           mark.mark("children-changed ul");
         }) as ChildrenChangedHandler);

       listener.startListening();
       treeUpdater.deleteNode($li[1]);
       mark.check();
     });

  it("generates included-element with the right tree, previous, next siblings",
     (done) => {
       mark = new Mark(8, {
         "included li at root": 2,
         "included li at ul": 2,
         "excluding li at ul": 2,
         "excluding li at root": 2,
       }, listener, done);
       const $fragment = $(`<div><p>before</p><div class='_real ul'>\
<div class='_real li'>A</div><div class='_real li'>B</div></div>\
<p>after</p></div>`);
       function addHandler(incex: "included" | "excluding"): void {
         listener.addHandler(
           `${incex}-element` as "included-element" | "excluding-element",
           "._real.li",
           ((thisRoot, tree, parent, previousSibling,
             nextSibling, element) => {
               assert.equal(thisRoot, root, "root");
               assert.equal(element.className, "_real li", "element class");
               // The following tests are against $fragment rather than $root
               // or $thisRoot because by the time the handler is called, the
               // $root could be empty!

               if (tree === $fragment[0]) {
                 mark.mark(`${incex} li at root`);
                 assert.equal(parent, root, "parent value");
                 assert.isNull(previousSibling, "previous sibling");
                 assert.isNull(nextSibling, "next sibling");
               }
               else {
                 assert.equal(tree, $fragment.find(".ul")[0], "tree value");
                 assert.equal(parent, $fragment[0]);
                 assert.equal(previousSibling, $fragment.find("p")[0]);
                 assert.equal(nextSibling, $fragment.find("p")[1]);
                 mark.mark(`${incex} li at ul`);
               }
             }) as IncludedElementHandler);
       }
       addHandler("included");
       addHandler("excluding");
       listener.startListening();
       treeUpdater.insertNodeAt(root, root.childNodes.length, $fragment[0]);
       const $ul = $root.find(".ul");
       treeUpdater.deleteNode($ul[0]);
       const p = $root.find("p")[0];
       const pParent = p.parentNode!;
       treeUpdater.insertNodeAt(pParent, indexOf(pParent.childNodes, p) + 1,
                                $ul[0]);
       $root.contents().each(function each(this: Node): void {
         // tslint:disable-next-line:no-invalid-this
         treeUpdater.deleteNode(this);
       });
       mark.check();
     });

  it("processImmediately processes immediately", () => {
    let marked = false;
    mark = new Mark(2, { "children root": 1, trigger: 1 }, listener,
                    () => {
                      marked = true;
                    });
    listener.addHandler("children-changed", "*",
                        ((_thisRoot, added) => {
                          if (added[0] === marker) {
                            return;
                          }
                          listener.trigger("t");
                          mark.mark("children root");
                        }) as ChildrenChangedHandler);
    listener.addHandler("trigger", "t", () => {
      mark.mark("trigger");
    });
    listener.startListening();

    treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
    listener.processImmediately();
    mark.check();
    assert.isTrue(marked);
  });

  it("clearPending clears pending operations", () => {
    let marked = false;
    mark = new Mark(1, { "children root": 1 }, listener, () => {
      marked = true;
    });
    listener.addHandler("children-changed", "*",
                        ((_thisRoot, added) => {
                          if (added[0] === marker) {
                            return;
                          }
                          listener.trigger("t");
                          mark.mark("children root");
                        }) as ChildrenChangedHandler);
    listener.addHandler("trigger", "t", () => {
      mark.mark("trigger");
    });
    listener.startListening();

    treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
    listener.clearPending();
    mark.check();
    assert.isTrue(marked);
  });
});

//  LocalWords:  domlistener Dubeau MPL Mangalam jsdom TreeUpdater
//  LocalWords:  MutationObserver
