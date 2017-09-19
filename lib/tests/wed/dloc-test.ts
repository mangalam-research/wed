/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import * as $ from "jquery";

import * as convert from "wed/convert";
import { DLoc, DLocRoot, findRoot, getRoot } from "wed/dloc";
import { isAttr } from "wed/domutil";

import * as sourceXML from "../dloc_test_data/source_converted.xml";

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

  before(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
    $root = $(root);
    const parser = new window.DOMParser();
    const xmlDoc = parser.parseFromString(sourceXML, "text/xml");
    const htmlTree = convert.toHTMLTree(window.document,
                                        xmlDoc.firstElementChild!);
    root.appendChild(htmlTree);
    rootObj = new DLocRoot(root);
  });

  after(() => {
    document.body.removeChild(root);
  });

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
      const a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
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
      const c = defined($(".quote")[0].getAttributeNode("data-wed-type"));
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
      const c = defined($(".quote")[0].getAttributeNode("data-wed-type"));
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
      afterEach(() => {
        $(".__test").remove();
      });

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
        const a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
        const b = defined($(".body .p")[1]);
        const loc = defined(DLoc.makeDLoc(root, a, 0));
        const loc2 = loc.make(b, 1);
        assert.throws(loc.makeRange.bind(loc, loc2), Error,
                     "cannot make range from attribute node");
      });

      it("fails on an attribute node passed as other", () => {
        const a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
        const b = defined($(".body .p")[1]);
        const loc = defined(DLoc.makeDLoc(root, a, 0));
        const loc2 = loc.make(b, 1);
        assert.throws(loc2.makeRange.bind(loc2, loc), Error,
                     "cannot make range from attribute node");
      });

      it("returns undefined on invalid location", () => {
        $root.append("<div class='__test'></div>");
        const t = defined($(".__test")[0]);
        assert.equal(t.nodeType, Node.ELEMENT_NODE);
        const loc = defined(DLoc.makeDLoc(root, t, 0));
        t.parentNode!.removeChild(t);
        assert.isFalse(loc.isValid());
        const range = loc.makeRange();
        assert.isUndefined(range);
      });

      it("returns undefined on invalid other", () => {
        $root.append("<div class='__test'></div>");
        const t = defined($(".__test")[0]);
        assert.equal(t.nodeType, Node.ELEMENT_NODE);
        const b = defined($(".body .p")[1]);
        const loc = defined(DLoc.makeDLoc(root, b, 1));
        const loc2 = loc.make(t, 0);
        t.parentNode!.removeChild(t);
        assert.isFalse(loc2.isValid());
        const range = loc.makeRange(loc2);
        assert.isUndefined(range);
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
      afterEach(() => {
        $(".__test").remove();
      });

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
        const a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
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
           t.ownerElement.removeAttribute("foo");
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
      afterEach(() => {
        $(".__test").remove();
      });

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
});
