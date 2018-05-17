/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import $ from "jquery";

import * as convert from "wed/convert";
import { DLoc, DLocRange, DLocRoot, findRoot, getRoot } from "wed/dloc";
import { isAttr } from "wed/domutil";
import { encodeAttrName } from "wed/util";

import { DataProvider } from "../util";

const assert = chai.assert;

function defined<T>(x: T | null | undefined): T {
  assert.isDefined(x);
  // The assertion above already excludes null and undefined, but TypeScript
  // does not know this.
  return x as T;
}

describe("dloc", () => {
  let $root: JQuery;
  let root: HTMLElement;
  let rootObj: DLocRoot;
  let encodedType: string;

  before(() =>
         new DataProvider("/base/build/standalone/lib/tests/dloc_test_data/")
         .getText("source_converted.xml")
         .then((sourceXML) => {
           root = document.createElement("div");
           document.body.appendChild(root);
           $root = $(root);
           const parser = new window.DOMParser();
           const xmlDoc = parser.parseFromString(sourceXML, "text/xml");
           const htmlTree = convert.toHTMLTree(window.document,
                                               xmlDoc.firstElementChild!);
           root.appendChild(htmlTree);
           rootObj = new DLocRoot(root);
           encodedType = encodeAttrName("type");
         }));

  after(() => {
    document.body.removeChild(root);
  });

  afterEach(() => {
    // Some tests add elements with the class __test to the DOM tree.
    // Proactively delete them here.
    $(".__test").remove();
  });

  function makeAttributeNodeCase(): { attrLoc: DLoc; loc: DLoc } {
    const a = defined($(".quote")[0].getAttributeNode(encodedType));
    const b = defined($(".body .p")[1]);
    const attrLoc = defined(DLoc.makeDLoc(root, a, 0));
    const loc = attrLoc.make(b, 1);
    return { attrLoc, loc };
  }

  function makeInvalidCase(): { loc: DLoc; invalid: DLoc } {
    $root.append("<div class='__test'></div>");
    const t = defined($(".__test")[0]);
    assert.equal(t.nodeType, Node.ELEMENT_NODE);
    const b = defined($(".body .p")[1]);
    const loc = defined(DLoc.makeDLoc(root, b, 1));
    const invalid = loc.make(t, 0);
    t.parentNode!.removeChild(t);
    assert.isFalse(invalid.isValid());
    return { loc, invalid };
  }

  describe("DLocRoot", () => {
    it("marks the root", () => {
      assert.equal(findRoot(root), rootObj);
    });

    it("fails if the node is already marked", () => {
      assert.throws(() => {
        new DLocRoot(root);
      },
                    Error,
                    "node already marked as root");
    });

    describe("nodeToPath", () => {
      it("returns an empty string on root", () => {
        assert.equal(rootObj.nodeToPath(root), "");
      });

      it("returns a correct path on text node", () => {
        const node = defined($root.find(".title")[0].childNodes[0]);
        assert.equal(rootObj.nodeToPath(node), "0/0/0/0/0/0");
      });

      it("returns a correct path on later text node", () => {
        const node = defined($root.find(".body>.p")[1].childNodes[2]);
        assert.equal(rootObj.nodeToPath(node), "0/1/0/1/2");
      });

      it("returns a correct path on attribute", () => {
        const node =
          defined($root.find(".body>.p")[1].attributes.getNamedItem("class"));
        assert.equal(rootObj.nodeToPath(node), "0/1/0/1/@class");
      });

      it("fails on a node which is not a descendant of its root",
         () => {
           const node = defined($("body")[0]);
           assert.throws(rootObj.nodeToPath.bind(rootObj, node),
                         Error, "node is not a descendant of root");
         });

      it("fails on invalid node", () => {
        assert.throws(rootObj.nodeToPath.bind(rootObj, null),
                      Error, "invalid node parameter");

        assert.throws(rootObj.nodeToPath.bind(rootObj, undefined),
                      Error, "invalid node parameter");
      });
    });

    describe("pathToNode", () => {
      it("returns root when passed an empty string", () => {
        assert.equal(rootObj.pathToNode(""), root);
      });

      it("returns a correct node on a text path", () => {
        const node = defined($root.find(".title")[0].childNodes[0]);
        assert.equal(rootObj.pathToNode("0/0/0/0/0/0"), node);
      });

      it("returns a correct node on a later text path", () => {
        const node = defined($root.find(".body>.p")[1].childNodes[2]);
        assert.equal(rootObj.pathToNode("0/1/0/1/2"), node);
      });

      it("returns a correct node on attribute path", () => {
        const node =
          defined($root.find(".body>.p")[1].attributes.getNamedItem("class"));
        assert.equal(rootObj.pathToNode("0/1/0/1/@class"), node);
      });

      it("accepts more than one digit per path step", () => {
        // There was a stupid bug in an earlier version which would make this
        // fail with an exception complaining that the path was malformed due to
        // the presence of "10". The null return value is fine since there is no
        // such element, but at least it should not generate an exception.
        assert.equal(rootObj.pathToNode("0/10"), null);
      });

      it("fails on malformed path", () => {
        assert.throws(rootObj.pathToNode.bind(rootObj, "+"),
                     Error, "malformed path expression");
      });
    });
  });

  describe("findRoot", () => {
    it("finds the root", () => {
      assert.equal(findRoot(defined($(".p")[0])), rootObj);
    });

    it("returns undefined if not in a root", () => {
      assert.isUndefined(findRoot(defined($root.parent()[0])));
    });
  });

  describe("getRoot", () => {
    it("gets the root", () => {
      assert.equal(getRoot(defined($(".p")[0])), rootObj);
    });

    it("throws an exception if not in a root", () => {
      assert.throws(getRoot.bind(undefined, defined($root.parent()[0])),
                   Error, "no root found");
    });
  });

  describe("makeDLoc", () => {
    it("returns undefined when called with undefined location", () => {
      assert.isUndefined(DLoc.makeDLoc(root, undefined));
    });

    it("returns a valid DLoc", () => {
      const a = defined($(".p")[0]);
      const loc = DLoc.makeDLoc(root, a, 0)!;
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc when the root is a DLocRoot", () => {
      const a = defined($(".p")[0]);
      const loc = DLoc.makeDLoc(rootObj, a, 0)!;
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc on an attribute node", () => {
      const a = defined($(".quote")[0].getAttributeNode(encodedType));
      const loc = DLoc.makeDLoc(root, a, 0)!;
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc when called with an array", () => {
      const a = defined($(".p")[0]);
      const loc = DLoc.makeDLoc(root, [a, 0])!;
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc when the offset is omitted", () => {
      const a = defined($(".body .p")[1]);
      const loc = DLoc.makeDLoc(root, a)!;
      assert.equal(loc.node, a.parentNode);
      assert.equal(loc.offset, 1);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns undefined when called with an array that has an " +
       "undefined first member", () => {
         assert.isUndefined(DLoc.makeDLoc(root, [undefined!, 0]));
    });

    it("throws an error when the node is not in the root", () => {
      const c = defined($root.parent()[0]);
      assert.throws(DLoc.makeDLoc.bind(undefined, root, c, 0),
                   Error, "node not in root");
    });

    it("throws an error when the root is not marked", () => {
      const c = defined($root.parent()[0]);
      assert.throws(DLoc.makeDLoc.bind(undefined, c, c, 0), Error,
                    /^root has not been marked as a root/);
    });

    it("throws an error when the offset is negative", () => {
      const c = defined($root.parent()[0]);
      assert.throws(DLoc.makeDLoc.bind(undefined, root, c, -1), Error,
                    /^negative offsets are not allowed/);
    });

    it("throws an error when the offset is too large (element)", () => {
      const c = defined($(".p")[0]);
      assert.equal(c.nodeType, Node.ELEMENT_NODE);
      assert.throws(DLoc.makeDLoc.bind(undefined, root, c, 100), Error,
                    /^offset greater than allowable value/);
    });

    it("throws an error when the offset is too large (text)", () => {
      const c = defined($(".body .p")[0].firstChild);
      assert.equal(c.nodeType, Node.TEXT_NODE);
      assert.throws(DLoc.makeDLoc.bind(undefined, root, c, 100), Error,
                   /^offset greater than allowable value/);
    });

    it("throws an error when the offset is too large (attribute)", () => {
      const c = defined($(".quote")[0].getAttributeNode(encodedType));
      assert.isTrue(isAttr(c));
      assert.throws(DLoc.makeDLoc.bind(undefined, root, c, 100), Error,
                    /^offset greater than allowable value/);
    });

    it("normalizes a negative offset", () => {
      const c = defined($(".p")[0]);
      const loc = DLoc.makeDLoc(root, c, -1, true)!;
      assert.equal(loc.offset, 0);
    });

    it("normalizes an offset that is too large (element)", () => {
      const c = defined($(".p")[0]);
      assert.equal(c.nodeType, Node.ELEMENT_NODE);
      const loc = DLoc.makeDLoc(root, c, 100, true)!;
      assert.equal(loc.offset, 0);
    });

    it("normalizes an offset that is too large (text)", () => {
      const c = defined($(".body .p")[0].firstChild);
      assert.equal(c.nodeType, Node.TEXT_NODE);
      const loc = DLoc.makeDLoc(root, c, 100, true)!;
      assert.equal(loc.offset, (c as Text).data.length);
    });

    it("normalizes an offset that is too large (attribute)", () => {
      const c = defined($(".quote")[0].getAttributeNode(encodedType));
      assert.isTrue(isAttr(c));
      const loc = DLoc.makeDLoc(root, c, 100, true)!;
      assert.equal(loc.offset, c.value.length);
    });
  });

  describe("mustMakeDLoc", () => {
    it("throws when called with undefined location", () => {
      assert.throws(DLoc.mustMakeDLoc.bind(undefined, root, undefined),
                    Error,
                    /^called mustMakeDLoc with an absent node$/);
    });

    it("returns a valid DLoc", () => {
      const a = defined($(".p")[0]);
      const loc = DLoc.mustMakeDLoc(root, a, 0);
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc when called with an array", () => {
      const a = defined($(".p")[0]);
      const loc = DLoc.mustMakeDLoc(root, [a, 0]);
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("throws when called with an array that has an undefined first member",
       () => {
         assert.throws(DLoc.mustMakeDLoc.bind(
           undefined,
           root,
           [undefined, 0]),
                       Error,
                      /^called mustMakeDLoc with an absent node$/);
       });
  });

  describe("DLoc", () => {
    describe("clone", () => {
      it("clones", () => {
        const a = defined($(".body .p")[0]);
        const loc = defined(DLoc.makeDLoc(root, a, 1));
        assert.deepEqual(loc, loc.clone());
      });
    });

    describe("make", () => {
      it("makes a new location with the same root", () => {
        const a = defined($(".body .p")[0]);
        const b = defined($(".body .p")[1]);
        const loc = defined(DLoc.makeDLoc(root, a, 1));
        const loc2 = loc.make(b, 0);
        assert.equal(loc.root, loc2.root);
        assert.equal(loc2.node, b);
        assert.equal(loc2.offset, 0);
      });
    });

    describe("makeRange", () => {
      it("makes a range", () => {
        const a = defined($(".body .p")[0]);
        const b = defined($(".body .p")[1]);
        const loc = defined(DLoc.makeDLoc(root, a, 0));
        const loc2 = loc.make(b, 1);
        const range = defined(loc.makeRange(loc2));
        assert.equal(range.range.startContainer, a);
        assert.equal(range.range.startOffset, 0);
        assert.equal(range.range.endContainer, b);
        assert.equal(range.range.endOffset, 1);
        assert.isFalse(range.range.collapsed);
        assert.isFalse(range.reversed);
      });

      it("makes a collapsed range", () => {
        const a = defined($(".body .p")[0]);
        const loc = defined(DLoc.makeDLoc(root, a, 0));
        const range = defined(loc.makeRange());
        assert.equal(range.startContainer, a);
        assert.equal(range.startOffset, 0);
        assert.equal(range.endContainer, a);
        assert.equal(range.endOffset, 0);
        assert.isTrue(range.collapsed);
      });

      it("makes a reversed range", () => {
        const a = defined($(".body .p")[0]);
        const b = defined($(".body .p")[1]);
        const loc = defined(DLoc.makeDLoc(root, b, 1));
        const loc2 = loc.make(a, 0);
        const range = defined(loc.makeRange(loc2));
        assert.equal(range.range.startContainer, a);
        assert.equal(range.range.startOffset, 0);
        assert.equal(range.range.endContainer, b);
        assert.equal(range.range.endOffset, 1);
        assert.isFalse(range.range.collapsed);
        assert.isTrue(range.reversed);
      });

      it("fails on an attribute node", () => {
        const { attrLoc, loc } = makeAttributeNodeCase();
        assert.throws(() => attrLoc.makeRange(loc), Error,
                     "cannot make range from attribute node");
      });

      it("fails on an attribute node passed as other", () => {
        const { attrLoc, loc } = makeAttributeNodeCase();
        assert.throws(() => loc.makeRange(attrLoc), Error,
                     "cannot make range from attribute node");
      });

      it("returns undefined on invalid location", () => {
        const { invalid } = makeInvalidCase();
        const range = invalid.makeRange();
        assert.isUndefined(range);
      });

      it("returns undefined on invalid other", () => {
        const { loc, invalid } = makeInvalidCase();
        const range = loc.makeRange(invalid);
        assert.isUndefined(range);
      });
    });

    describe("makeDLocRange", () => {
      it("makes a range", () => {
        const a = defined($(".body .p")[0]);
        const b = defined($(".body .p")[1]);
        const loc = defined(DLoc.makeDLoc(root, a, 0));
        const loc2 = loc.make(b, 1);
        const range = defined(loc.makeDLocRange(loc2));
        assert.equal(range.start, loc);
        assert.equal(range.end, loc2);
      });

      it("makes a collapsed range", () => {
        const a = defined($(".body .p")[0]);
        const loc = defined(DLoc.makeDLoc(root, a, 0));
        const range = defined(loc.makeDLocRange());
        assert.equal(range.start, loc);
        assert.equal(range.end, loc);
        assert.isTrue(range.collapsed);
      });

      it("returns undefined on invalid location", () => {
        const { invalid } = makeInvalidCase();
        const range = invalid.makeDLocRange();
        assert.isUndefined(range);
      });

      it("returns undefined on invalid other", () => {
        const { loc, invalid } = makeInvalidCase();
        const range = loc.makeDLocRange(invalid);
        assert.isUndefined(range);
      });
    });

    describe("mustMakeDLocRange", () => {
      it("throws on invalid location", () => {
        const { invalid } = makeInvalidCase();
        assert.throws(() => invalid.mustMakeDLocRange(), Error,
                      "cannot make a range");
      });

      it("throws on invalid other", () => {
        const { loc, invalid } = makeInvalidCase();
        assert.throws(() => loc.mustMakeDLocRange(invalid), Error,
                      "cannot make a range");
      });
    });

    describe("toArray", () => {
      it("returns an array with the right values", () => {
        const a = defined($(".body .p")[0]);
        const loc = defined(DLoc.makeDLoc(root, a, 1));
        assert.deepEqual(loc.toArray(), [a, 1]);
      });
    });

    describe("isValid", () => {
      it("returns true when the location is valid (element)", () => {
        const p = defined($(".p")[0]);
        assert.equal(p.nodeType, Node.ELEMENT_NODE);
        const loc = defined(DLoc.makeDLoc(root, p, 0));
        assert.isTrue(loc.isValid());
      });

      it("returns true when the location is valid (text)", () => {
        const t = defined($(".body .p")[0].firstChild);
        assert.equal(t.nodeType, Node.TEXT_NODE);
        const loc = defined(DLoc.makeDLoc(root, t, 0));
        assert.isTrue(loc.isValid());
      });

      it("returns true when the location is valid (attribute)", () => {
        const a = defined($(".quote")[0].getAttributeNode(encodedType));
        assert.isTrue(isAttr(a));
        const loc = defined(DLoc.makeDLoc(root, a, 0));
        assert.isTrue(loc.isValid());
      });

      it("returns false when the node is no longer in the document (element)",
         () => {
           $root.append("<div class='__test'></div>");
           const t = defined($(".__test")[0]);
           assert.equal(t.nodeType, Node.ELEMENT_NODE);
           const loc = defined(DLoc.makeDLoc(root, t, 0));
           t.parentNode!.removeChild(t);
           assert.isFalse(loc.isValid());
         });

      it("returns false when the node is no longer in the document (text)",
         () => {
           $root.append("<div class='__test'>test</div>");
           const t = defined($(".__test")[0].firstChild);
           assert.equal(t.nodeType, Node.TEXT_NODE);
           const loc = defined(DLoc.makeDLoc(root, t, 0));
           t.parentNode!.removeChild(t);
           assert.isFalse(loc.isValid());
         });

      it("returns false when the node is no longer in the document (attribute)",
         () => {
           $root.append("<div class='__test' foo='bar'></div>");
           const t = defined($(".__test")[0].attributes.getNamedItem("foo"));
           assert.isTrue(isAttr(t));
           const loc = defined(DLoc.makeDLoc(root, t, 0));
           t.ownerElement!.removeAttribute("foo");
           assert.isFalse(loc.isValid());
         });

      it("returns false when the offset is not longer valid (element)", () => {
        $root.append("<div class='__test'>test</div>");
        const t = defined($(".__test")[0]);
        assert.equal(t.nodeType, Node.ELEMENT_NODE);
        const loc = defined(DLoc.makeDLoc(root, t, 1));
        t.removeChild(t.firstChild!);
        assert.isFalse(loc.isValid());
      });

      it("returns false when the offset is no longer valid (text)", () => {
        $root.append("<div class='__test'>test</div>");
        const t = defined($(".__test")[0].firstChild);
        assert.equal(t.nodeType, Node.TEXT_NODE);
        const loc = defined(DLoc.makeDLoc(root, t, 4));
        t.textContent = "t";
        assert.isFalse(loc.isValid());
      });

      it("returns false when the offset is no longer valid (attribute)", () => {
        $root.append("<div class='__test' foo='bar'></div>");
        const t = defined($(".__test")[0].attributes.getNamedItem("foo"));
        assert.isTrue(isAttr(t));
        const loc = defined(DLoc.makeDLoc(root, t, 3));
        t.value = "f";
        assert.isFalse(loc.isValid());
      });
    });

    describe("normalizeOffset", () => {
      it("makes a new valid location (element)", () => {
        $root.append("<div class='__test'>test</div>");
        const t = defined($(".__test")[0]);
        assert.equal(t.nodeType, Node.ELEMENT_NODE);
        const loc = defined(DLoc.makeDLoc(root, t, 1));
        t.removeChild(t.firstChild!);
        assert.isFalse(loc.isValid());
        const norm = loc.normalizeOffset();
        assert.isTrue(norm.isValid());
        assert.notEqual(loc, norm);
        assert.equal(norm.normalizeOffset(), norm);
      });

      it("makes a new valid location (text)", () => {
        $root.append("<div class='__test'>test</div>");
        const t = defined($(".__test")[0].firstChild);
        assert.equal(t.nodeType, Node.TEXT_NODE);
        const loc = defined(DLoc.makeDLoc(root, t, 4));
        t.textContent = "t";
        assert.isFalse(loc.isValid());
        const norm = loc.normalizeOffset();
        assert.isTrue(norm.isValid());
        assert.notEqual(loc, norm);
        assert.equal(norm.normalizeOffset(), norm);
      });

      it("makes a new valid location (attribute)", () => {
        $root.append("<div class='__test' foo='bar'></div>");
        const t = defined($(".__test")[0].attributes.getNamedItem("foo"));
        assert.isTrue(isAttr(t));
        const loc = defined(DLoc.makeDLoc(root, t, 3));
        t.value = "f";
        assert.isFalse(loc.isValid());
        const norm = loc.normalizeOffset();
        assert.isTrue(norm.isValid());
        assert.notEqual(loc, norm);
        assert.equal(norm.normalizeOffset(), norm);
      });
    });

    describe("equals", () => {
      let p: HTMLElement;
      let loc: DLoc;
      before(() => {
        p = defined($(".body .p")[0]);
        assert.equal(p.nodeType, Node.ELEMENT_NODE);
        loc = defined(DLoc.makeDLoc(root, p, 0));
      });

      it("returns true if it is the same object", () => {
        assert.isTrue(loc.equals(loc));
      });

      it("returns true if the two locations are equal", () => {
        const loc2 = DLoc.makeDLoc(root, p, 0);
        assert.isTrue(loc.equals(loc2));
      });

      it("returns false if other is null", () => {
        assert.isFalse(loc.equals(null));
      });

      it("returns false if other is undefined", () => {
        assert.isFalse(loc.equals(undefined));
      });

      it("returns false if the two nodes are unequal", () => {
        assert.isFalse(loc.equals(loc.make(p.parentNode!, 0)));
      });

      it("returns false if the two offsets are unequal", () => {
        assert.isFalse(loc.equals(loc.make(p, 1)));
      });
    });

    describe("compare", () => {
      let p: HTMLElement;
      let loc: DLoc;
      before(() => {
        p = defined($(".body .p")[0]);
        assert.equal(p.nodeType, Node.ELEMENT_NODE);
        loc = defined(DLoc.makeDLoc(root, p, 0));
      });

      it("returns 0 if it is the same object", () => {
        assert.equal(loc.compare(loc), 0);
      });

      it("returns 0 if the two locations are equal", () => {
        const loc2 = DLoc.mustMakeDLoc(root, p, 0);
        assert.equal(loc.compare(loc2), 0);
      });

      describe("(siblings)", () => {
        let next: DLoc;

        before(() => {
          next = DLoc.mustMakeDLoc(root, p.nextSibling, 0);
        });

        it("returns -1 if this precedes other", () => {
          assert.equal(loc.compare(next), -1);
        });

        it("returns 1 if this follows other", () => {
          assert.equal(next.compare(loc), 1);
        });
      });

      describe("(attribute - element)", () => {
        let quote: DLoc;
        let attr: DLoc;
        before(() => {
          const quoteNode = root.querySelector(".quote")!;
          quote = DLoc.mustMakeDLoc(root, quoteNode);
          attr = DLoc.mustMakeDLoc(
            root,
            quoteNode.getAttributeNode(encodedType), 0);
        });

        it("returns -1 if other is an attribute of this", () => {
          assert.equal(quote.compare(attr), -1);
        });

        it("returns 1 if this is an attribute of other", () => {
          assert.equal(attr.compare(quote), 1);
        });
      });

      describe("(two attributes)", () => {
        let parent: Element;
        let attr1: DLoc;
        let attr2: DLoc;
        before(() => {
          parent = document.createElement("div");
          parent.setAttribute("b", "2");
          parent.setAttribute("a", "1");
          new DLocRoot(parent);
          attr1 = DLoc.mustMakeDLoc(parent, parent.getAttributeNode("a"), 0);
          attr2 = DLoc.mustMakeDLoc(parent, parent.getAttributeNode("b"), 0);
        });

        it("returns -1 if this is an attribute coming before other", () => {
          assert.equal(attr1.compare(attr2), -1);
        });

        it("returns 1 if this is an attribute coming aftger other", () => {
          assert.equal(attr2.compare(attr1), 1);
        });
      });

      describe("(parent - child positions)", () => {
        let parentBefore: DLoc;
        let parentAfter: DLoc;

        before(() => {
          parentBefore = DLoc.mustMakeDLoc(root, p.parentNode, 0);
          parentAfter = parentBefore.makeWithOffset(1);
          // We want to check that we are looking at the p element we think
          // we are looking at.
          assert.equal(parentBefore.node.childNodes[0], p);
        });

        it("returns -1 if this is a parent position before other", () => {
          assert.equal(parentBefore.compare(loc), -1);
        });

        it("returns 1 if this is a parent position after other", () => {
          assert.equal(parentAfter.compare(loc), 1);
        });

        it("returns 1 if this is a child position after other", () => {
          assert.equal(loc.compare(parentBefore), 1);
        });

        it("returns -1 if this is a child position before other", () => {
          assert.equal(loc.compare(parentAfter), -1);
        });
      });
    });

    describe("pointedNode", () => {
      let quoteNode: Element;
      let attributeNode: Attr;
      let quote: DLoc;
      let attr: DLoc;
      before(() => {
        quoteNode = root.querySelector(".quote")!;
        attributeNode = quoteNode.getAttributeNode(encodedType)!;
        quote = DLoc.mustMakeDLoc(root, quoteNode);
        attr = DLoc.mustMakeDLoc(root, attributeNode, 0);
      });

      it("returns the child of an element node", () => {
        assert.equal(quoteNode.parentNode, quote.node);
        assert.equal(quote.pointedNode, quoteNode);
      });

      it("returns the text node itself", () => {
        const text = quoteNode.firstChild!;
        assert.equal(text.nodeType, Node.TEXT_NODE);
        const newLoc = quote.make(text, 0);
        assert.equal(newLoc.pointedNode, text);
      });

      it("returns the attribute node itself", () => {
        assert.equal(attr.pointedNode, attributeNode);
      });

      it("returns undefined if the offset is past all children", () => {
        assert.isUndefined(quote.make(quoteNode,
                                      quoteNode.childNodes.length).pointedNode);
      });
    });

    describe("makeWithOffset", () => {
      let p: HTMLElement;
      let loc: DLoc;
      before(() => {
        p = defined($(".body .p")[0]);
        assert.equal(p.nodeType, Node.ELEMENT_NODE);
        loc = defined(DLoc.makeDLoc(root, p, 0));
      });

      it("makes a new object with a new offset", () => {
        const loc2 = loc.makeWithOffset(1);
        assert.equal(loc2.offset, 1);
        assert.notEqual(loc.offset, loc2.offset);
        assert.notEqual(loc, loc2);
      });

      it("returns the same object if the offset is the same", () => {
        const loc2 = loc.makeWithOffset(0);
        assert.equal(loc, loc2);
      });
    });

    describe("getLocationInParent", () => {
      let p: HTMLElement;
      let loc: DLoc;
      before(() => {
        p = defined($(".body .p")[1]);
        assert.equal(p.nodeType, Node.ELEMENT_NODE);
        loc = defined(DLoc.makeDLoc(root, p, 0));
      });

      it("gets a valid location", () => {
        const loc2 = loc.getLocationInParent();
        assert.equal(loc2.offset, 1);
        assert.equal(loc2.node, loc.node.parentNode);
      });

      it("fails if we are already at the root", () => {
        const loc2 = loc.make(root, 0);
        assert.throws(loc2.getLocationInParent.bind(loc2),
                      Error, "node not in root");
      });
    });

    describe("getLocationAfterInParent", () => {
      let p: HTMLElement;
      let loc: DLoc;
      before(() => {
        p = defined($(".body .p")[1]);
        assert.equal(p.nodeType, Node.ELEMENT_NODE);
        loc = defined(DLoc.makeDLoc(root, p, 0));
      });

      it("gets a valid location", () => {
        const loc2 = loc.getLocationAfterInParent();
        assert.equal(loc2.offset, 2);
        assert.equal(loc2.node, loc.node.parentNode);
      });

      it("fails if we are already at the root", () => {
        const loc2 = loc.make(root, 0);
        assert.throws(loc2.getLocationAfterInParent.bind(loc2),
                      Error, "node not in root");
      });
    });
  });

  describe("DLocRange", () => {
    let a: Node;
    let loc: DLoc;

    before(() => {
      a = defined($(".body .p")[0].firstChild);
      loc = DLoc.mustMakeDLoc(root, a, 0);
    });

    describe("collapsed", () => {
      it("is true when a range is collapsed", () => {
        assert.isTrue(new DLocRange(loc, loc).collapsed);
      });

      it("is false when a range is not collapsed", () => {
        assert.isFalse(new DLocRange(loc, loc.makeWithOffset(1)).collapsed);
      });
    });

    describe("equals", () => {
      it("returns true when other is the same object as this", () => {
        const range = new DLocRange(loc, loc);
        assert.isTrue(range.equals(range));
      });

      it("returns true when the two ranges have the same start and end", () => {
        const range = new DLocRange(loc, loc.makeWithOffset(1));
        const range2 = new DLocRange(DLoc.mustMakeDLoc(root, a, 0),
                                     DLoc.mustMakeDLoc(root, a, 1));
        assert.isTrue(range.equals(range2));
      });

      it("returns false when the two ranges differ in start positions", () => {
        const range = new DLocRange(loc, loc.makeWithOffset(1));
        const range2 = new DLocRange(DLoc.mustMakeDLoc(root, a, 1),
                                     DLoc.mustMakeDLoc(root, a, 1));
        assert.isFalse(range.start.equals(range2.start));
        assert.isTrue(range.end.equals(range2.end));
        assert.isFalse(range.equals(range2));
      });

      it("returns false when the two ranges differ in end positions", () => {
        const range = new DLocRange(loc, loc);
        const range2 = new DLocRange(DLoc.mustMakeDLoc(root, a, 0),
                                     DLoc.mustMakeDLoc(root, a, 1));
        assert.isTrue(range.start.equals(range2.start));
        assert.isFalse(range.end.equals(range2.end));
        assert.isFalse(range.equals(range2));
      });
    });

    describe("isValid", () => {
      it("returns true if both ends are valid", () => {
        assert.isTrue(new DLocRange(loc, loc).isValid());
      });

      it("returns false if start is invalid", () => {
        const { invalid } = makeInvalidCase();
        assert.isFalse(new DLocRange(invalid, loc).isValid());
      });

      it("returns false if end is invalid", () => {
        const { invalid } = makeInvalidCase();
        assert.isFalse(new DLocRange(loc, invalid).isValid());
      });
    });

    describe("makeDOMRange", () => {
      it("makes a DOM range", () => {
        const loc2 = loc.makeWithOffset(1);
        const range = new DLocRange(loc, loc2).makeDOMRange()!;
        assert.isDefined(range);
        assert.equal(range.startContainer, loc.node);
        assert.equal(range.startOffset, loc.offset);
        assert.equal(range.endContainer, loc2.node);
        assert.equal(range.endOffset, loc2.offset);
      });

      it("fails if start is an attribute node", () => {
        const { attrLoc, loc: loc2 } = makeAttributeNodeCase();
        assert.throws(() => new DLocRange(attrLoc, loc2).makeDOMRange(), Error,
                      "cannot make range from attribute node");
      });

      it("fails if end is an attribute node", () => {
        const { attrLoc, loc: loc2 } = makeAttributeNodeCase();
        assert.throws(() => new DLocRange(loc2, attrLoc).makeDOMRange(), Error,
                      "cannot make range from attribute node");
      });

      it("returns undefined if start is invalid", () => {
        const { invalid } = makeInvalidCase();
        assert.isUndefined(new DLocRange(invalid, loc).makeDOMRange());
      });

      it("returns undefined if end is invalid", () => {
        const { invalid } = makeInvalidCase();
        assert.isUndefined(new DLocRange(loc, invalid).makeDOMRange());
      });
    });

    describe("mustMakeDOMRange", () => {
      it("makes a DOM range", () => {
        const loc2 = loc.makeWithOffset(1);
        const range = new DLocRange(loc, loc2).mustMakeDOMRange();
        assert.isDefined(range);
        assert.equal(range.startContainer, loc.node);
        assert.equal(range.startOffset, loc.offset);
        assert.equal(range.endContainer, loc2.node);
        assert.equal(range.endOffset, loc2.offset);
      });

      it("throws if start is invalid", () => {
        const { invalid } = makeInvalidCase();
        const range = new DLocRange(invalid, loc);
        assert.throws(() => range.mustMakeDOMRange(), Error,
                      "cannot make a range");
      });

      it("throws if end is invalid", () => {
        const { invalid } = makeInvalidCase();
        const range = new DLocRange(loc, invalid);
        assert.throws(() => range.mustMakeDOMRange(), Error,
                     "cannot make a range");
      });
    });

    describe("contains", () => {
      let range: DLocRange;
      before(() => {
        range = new DLocRange(loc, loc.makeWithOffset(2));
      });

      it("returns false if the location is before the range", () => {
        assert.isFalse(range.contains(loc.make(loc.node.parentNode!, 0)));
      });

      it("returns false if the location is after the range", () => {
        assert.isFalse(range.contains(loc.makeWithOffset(3)));
      });

      it("returns true if the location is at start of the range", () => {
        assert.isTrue(range.contains(loc.makeWithOffset(0)));
      });

      it("returns true if the location is at end of the range", () => {
        assert.isTrue(range.contains(loc.makeWithOffset(2)));
      });

      it("returns true if the location is between the ends", () => {
        assert.isTrue(range.contains(loc.makeWithOffset(1)));
      });
    });
  });
});
