/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

var jsdomfw = require("./jsdomfw");
var chai = require("chai");
var fs = require("fs");

var assert = chai.assert;

function defined(x) {
  assert.isDefined(x);
  return x;
}

describe("dloc", function dlocBlock() {
  var source = "build/test-files/dloc_test_data/source_converted.xml";
  var source_txt = fs.readFileSync(source).toString();
  var fw;
  var window;
  var $root;
  var root;
  var root_obj;
  var dloc;
  var domutil;
  var isAttr;
  var $;

  this.timeout(0);
  before(function before(done) {
    fw = new jsdomfw.FW();
    fw.create(function created() {
      window = fw.window;
      window.require(
        ["wed/dloc", "wed/domutil", "jquery"],
        function loaded(_dloc, _domutil, _$) {
          try {
            assert.isUndefined(window.document.errors);
            dloc = _dloc;
            domutil = _domutil;
            isAttr = domutil.isAttr;
            $ = _$;
            $root = $("#root");
            root = defined($root[0]);
            $root.html(source_txt);
            root_obj = new dloc.DLocRoot(root);
            done();
          }
          catch (e) {
            done(e);
            throw e;
          }
        }, done);
    });
  });

  describe("DLocRoot", function DLocRoot() {
    it("marks the root", function test() {
      assert.equal(dloc.findRoot(root), root_obj);
    });

    it("fails if the node is already marked", function test() {
      assert.throws(function fn() {
        new dloc.DLocRoot(root); // eslint-disable-line no-new
      },
                   window.Error,
                   "node already marked as root");
    });

    describe("nodeToPath", function nodeToPath() {
      it("returns an empty string on root", function test() {
        assert.equal(root_obj.nodeToPath(root), "");
      });

      it("returns a correct path on text node", function test() {
        var node = defined($root.find(".title")[0].childNodes[0]);
        assert.equal(root_obj.nodeToPath(node), "0/0/0/0/0/0");
      });

      it("returns a correct path on later text node", function test() {
        var node = defined($root.find(".body>.p").get(1).childNodes[2]);
        assert.equal(root_obj.nodeToPath(node), "0/1/0/1/2");
      });

      it("returns a correct path on attribute", function test() {
        var node = defined($root.find(".body>.p").get(1).attributes.class);
        assert.equal(root_obj.nodeToPath(node), "0/1/0/1/@class");
      });

      it("fails on a node which is not a descendant of its root",
         function test() {
           var node = defined($("body")[0]);
           assert.throws(root_obj.nodeToPath.bind(root_obj, node),
                        window.Error, "node is not a descendant of root");
         });

      it("fails on invalid node", function test() {
        assert.throws(root_obj.nodeToPath.bind(root_obj, null),
                     window.Error, "invalid node parameter");

        assert.throws(root_obj.nodeToPath.bind(root_obj, undefined),
                     window.Error, "invalid node parameter");
      });
    });

    describe("pathToNode", function pathToNode() {
      it("returns root when passed an empty string", function test() {
        assert.equal(root_obj.pathToNode(""), root);
      });

      it("returns a correct node on a text path", function test() {
        var node = defined($root.find(".title")[0].childNodes[0]);
        assert.equal(root_obj.pathToNode("0/0/0/0/0/0"), node);
      });

      it("returns a correct node on a later text path", function test() {
        var node = defined($root.find(".body>.p").get(1).childNodes[2]);
        assert.equal(root_obj.pathToNode("0/1/0/1/2"), node);
      });

      it("returns a correct node on attribute path", function test() {
        var node = defined($root.find(".body>.p").get(1).attributes.class);
        assert.equal(root_obj.pathToNode("0/1/0/1/@class"), node);
      });

      it("accepts more than one digit per path step", function test() {
        // There was a stupid bug in an earlier version which would make this
        // fail with an exception complaining that the path was malformed due to
        // the presence of "10". The null return value is fine since there is no
        // such element, but at least it should not generate an exception.
        assert.equal(root_obj.pathToNode("0/10"), null);
      });

      it("fails on malformed path", function test() {
        assert.throws(root_obj.pathToNode.bind(root_obj, "+"),
                     window.Error, "malformed path expression");
      });
    });
  });

  describe("findRoot", function findRoot() {
    it("finds the root", function test() {
      assert.equal(dloc.findRoot(defined($(".p")[0])), root_obj);
    });

    it("returns undefined if not in a root", function test() {
      assert.isUndefined(dloc.findRoot(defined($root.parent()[0])));
    });
  });

  describe("getRoot", function getRoot() {
    it("gets the root", function test() {
      assert.equal(dloc.getRoot(defined($(".p")[0])), root_obj);
    });

    it("throws an exception if not in a root", function test() {
      assert.throws(dloc.getRoot.bind(dloc, defined($root.parent()[0])),
                   window.Error, "no root found");
    });
  });

  describe("makeDLoc", function makeDLoc() {
    it("returns undefined when called with undefined location", function test() {
      assert.isUndefined(dloc.makeDLoc(root, undefined));
    });

    it("returns a valid DLoc", function test() {
      var a = defined($(".p")[0]);
      var loc = dloc.makeDLoc(root, a, 0);
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc when the root is a DLocRoot", function test() {
      var a = defined($(".p")[0]);
      var loc = dloc.makeDLoc(root_obj, a, 0);
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc on an attribute node", function test() {
      var a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
      var loc = dloc.makeDLoc(root, a, 0);
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc when called with an array", function test() {
      var a = defined($(".p")[0]);
      var loc = dloc.makeDLoc(root, new window.Array(a, 0));
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns undefined when called with an array that has an " +
       "undefined first member", function test() {
      assert.isUndefined(dloc.makeDLoc(root, new window.Array(undefined, 0)));
    });

    it("throws an error when the node is not in the root", function test() {
      var c = defined($root.parent()[0]);
      assert.throws(dloc.makeDLoc.bind(undefined, root, c, 0),
                   window.Error, "node not in root");
    });

    it("throws an error when the root is not marked", function test() {
      var c = defined($root.parent()[0]);
      assert.throws(dloc.makeDLoc.bind(undefined, c, c, 0), window.Error,
                   /^root has not been marked as a root/);
    });

    it("throws an error when the offset is negative", function test() {
      var c = defined($root.parent()[0]);
      assert.throws(dloc.makeDLoc.bind(undefined, root, c, -1), window.Error,
                   /^negative offsets are not allowed/);
    });

    it("throws an error when the offset is too large (element)", function test() {
      var c = defined($(".p")[0]);
      assert.equal(c.nodeType, window.Node.ELEMENT_NODE);
      assert.throws(dloc.makeDLoc.bind(undefined, root, c, 100), window.Error,
                   /^offset greater than allowable value/);
    });

    it("throws an error when the offset is too large (text)", function test() {
      var c = defined($(".body .p")[0].firstChild);
      assert.equal(c.nodeType, window.Node.TEXT_NODE);
      assert.throws(dloc.makeDLoc.bind(undefined, root, c, 100), window.Error,
                   /^offset greater than allowable value/);
    });

    it("throws an error when the offset is too large (attribute)",
       function test() {
         var c = defined($(".quote")[0].getAttributeNode("data-wed-type"));
         assert.isTrue(isAttr(c));
         assert.throws(dloc.makeDLoc.bind(undefined, root, c, 100), window.Error,
                      /^offset greater than allowable value/);
       });

    it("normalizes a negative offset", function test() {
      var c = defined($(".p")[0]);
      var loc = dloc.makeDLoc(root, c, -1, true);
      assert.equal(loc.offset, 0);
    });

    it("normalizes an offset that is too large (element)", function test() {
      var c = defined($(".p")[0]);
      assert.equal(c.nodeType, window.Node.ELEMENT_NODE);
      var loc = dloc.makeDLoc(root, c, 100, true);
      assert.equal(loc.offset, 0);
    });

    it("normalizes an offset that is too large (text)", function test() {
      var c = defined($(".body .p")[0].firstChild);
      assert.equal(c.nodeType, window.Node.TEXT_NODE);
      var loc = dloc.makeDLoc(root, c, 100, true);
      assert.equal(loc.offset, c.data.length);
    });

    it("normalizes an offset that is too large (attribute)", function test() {
      var c = defined($(".quote")[0].getAttributeNode("data-wed-type"));
      assert.isTrue(isAttr(c));
      var loc = dloc.makeDLoc(root, c, 100, true);
      assert.equal(loc.offset, c.value.length);
    });
  });

  describe("mustMakeDLoc", function makeDLoc() {
    it("throws when called with undefined location", function test() {
      assert.throws(dloc.DLoc.mustMakeDLoc.bind(undefined, root, undefined),
                    window.Error,
                    /^called mustMakeDLoc with an absent node$/);
    });

    it("returns a valid DLoc", function test() {
      var a = defined($(".p")[0]);
      var loc = dloc.DLoc.mustMakeDLoc(root, a, 0);
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("returns a valid DLoc when called with an array", function test() {
      var a = defined($(".p")[0]);
      var loc = dloc.DLoc.mustMakeDLoc(root, new window.Array(a, 0));
      assert.equal(loc.node, a);
      assert.equal(loc.offset, 0);
      assert.equal(loc.root, root);
      assert.isTrue(loc.isValid());
    });

    it("throws when called with an array that has an undefined first member",
       function test() {
         assert.throws(dloc.DLoc.mustMakeDLoc.bind(
           undefined,
           root,
           new window.Array(undefined, 0)),
                       window.Error,
                      /^called mustMakeDLoc with an absent node$/);
       });
  });

  describe("DLoc", function DLoc() {
    describe("clone", function clone() {
      it("clones", function test() {
        var a = defined($(".body .p")[0]);
        var loc = dloc.makeDLoc(root, a, 1);
        assert.deepEqual(loc, loc.clone());
      });
    });

    describe("make", function make() {
      it("makes a new location with the same root", function test() {
        var a = defined($(".body .p")[0]);
        var b = defined($(".body .p")[1]);
        var loc = dloc.makeDLoc(root, a, 1);
        var loc2 = loc.make(b, 0);
        assert.equal(loc.root, loc2.root);
        assert.equal(loc2.node, b);
        assert.equal(loc2.offset, 0);
      });
    });

    describe("makeRange", function makeRange() {
      afterEach(function afterEach() {
        $(".__test").remove();
      });

      it("makes a range", function test() {
        var a = defined($(".body .p")[0]);
        var b = defined($(".body .p")[1]);
        var loc = dloc.makeDLoc(root, a, 0);
        var loc2 = loc.make(b, 1);
        var range = loc.makeRange(loc2);
        assert.equal(range.range.startContainer, a);
        assert.equal(range.range.startOffset, 0);
        assert.equal(range.range.endContainer, b);
        assert.equal(range.range.endOffset, 1);
        assert.isFalse(range.range.collapsed);
        assert.isFalse(range.reversed);
      });

      it("makes a collapsed range", function test() {
        var a = defined($(".body .p")[0]);
        var loc = dloc.makeDLoc(root, a, 0);
        var range = loc.makeRange();
        assert.equal(range.startContainer, a);
        assert.equal(range.startOffset, 0);
        assert.equal(range.endContainer, a);
        assert.equal(range.endOffset, 0);
        assert.isTrue(range.collapsed);
      });

      it("makes a reversed range", function test() {
        var a = defined($(".body .p")[0]);
        var b = defined($(".body .p")[1]);
        var loc = dloc.makeDLoc(root, b, 1);
        var loc2 = loc.make(a, 0);
        var range = loc.makeRange(loc2);
        assert.equal(range.range.startContainer, a);
        assert.equal(range.range.startOffset, 0);
        assert.equal(range.range.endContainer, b);
        assert.equal(range.range.endOffset, 1);
        assert.isFalse(range.range.collapsed);
        assert.isTrue(range.reversed);
      });

      it("fails on an attribute node", function test() {
        var a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
        var b = defined($(".body .p")[1]);
        var loc = dloc.makeDLoc(root, a, 0);
        var loc2 = loc.make(b, 1);
        assert.throws(loc.makeRange.bind(loc, loc2), window.Error,
                     "cannot make range from attribute node");
      });

      it("fails on an attribute node passed as other", function test() {
        var a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
        var b = defined($(".body .p")[1]);
        var loc = dloc.makeDLoc(root, a, 0);
        var loc2 = loc.make(b, 1);
        assert.throws(loc2.makeRange.bind(loc2, loc), window.Error,
                     "cannot make range from attribute node");
      });

      it("returns undefined on invalid location", function test() {
        $root.append("<div class='__test'></div>");
        var t = defined($(".__test")[0]);
        assert.equal(t.nodeType, window.Node.ELEMENT_NODE);
        var loc = dloc.makeDLoc(root, t, 0);
        t.parentNode.removeChild(t);
        assert.isFalse(loc.isValid());
        var range = loc.makeRange();
        assert.isUndefined(range);
      });

      it("returns undefined on invalid other", function test() {
        $root.append("<div class='__test'></div>");
        var t = defined($(".__test")[0]);
        assert.equal(t.nodeType, window.Node.ELEMENT_NODE);
        var b = defined($(".body .p")[1]);
        var loc = dloc.makeDLoc(root, b, 1);
        var loc2 = loc.make(t, 0);
        t.parentNode.removeChild(t);
        assert.isFalse(loc2.isValid());
        var range = loc.makeRange(loc2);
        assert.isUndefined(range);
      });
    });

    describe("toArray", function toArray() {
      it("returns an array with the right values", function test() {
        var a = defined($(".body .p")[0]);
        var loc = dloc.makeDLoc(root, a, 1);
        assert.deepEqual(loc.toArray(), [a, 1]);
      });
    });

    describe("isValid", function isValid() {
      afterEach(function afterEach() {
        $(".__test").remove();
      });

      it("returns true when the location is valid (element)", function test() {
        var p = defined($(".p")[0]);
        assert.equal(p.nodeType, window.Node.ELEMENT_NODE);
        var loc = dloc.makeDLoc(root, p, 0);
        assert.isTrue(loc.isValid());
      });

      it("returns true when the location is valid (text)", function test() {
        var t = defined($(".body .p")[0].firstChild);
        assert.equal(t.nodeType, window.Node.TEXT_NODE);
        var loc = dloc.makeDLoc(root, t, 0);
        assert.isTrue(loc.isValid());
      });

      it("returns true when the location is valid (attribute)", function test() {
        var a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
        assert.isTrue(isAttr(a));
        var loc = dloc.makeDLoc(root, a, 0);
        assert.isTrue(loc.isValid());
      });

      it("returns false when the node is no longer in the document (element)",
         function test() {
           $root.append("<div class='__test'></div>");
           var t = defined($(".__test")[0]);
           assert.equal(t.nodeType, window.Node.ELEMENT_NODE);
           var loc = dloc.makeDLoc(root, t, 0);
           t.parentNode.removeChild(t);
           assert.isFalse(loc.isValid());
         });

      it("returns false when the node is no longer in the document (text)",
         function test() {
           $root.append("<div class='__test'>test</div>");
           var t = defined($(".__test")[0].firstChild);
           assert.equal(t.nodeType, window.Node.TEXT_NODE);
           var loc = dloc.makeDLoc(root, t, 0);
           t.parentNode.removeChild(t);
           assert.isFalse(loc.isValid());
         });

      it("returns false when the node is no longer in the document (attribute)",
         function test() {
           $root.append("<div class='__test' foo='bar'></div>");
           var t = defined($(".__test")[0].attributes.foo);
           assert.isTrue(isAttr(t));
           var loc = dloc.makeDLoc(root, t, 0);
           t.ownerElement.removeAttribute("foo");
           assert.isFalse(loc.isValid());
         });

      it("returns false when the offset is not longer valid (element)",
         function test() {
           $root.append("<div class='__test'>test</div>");
           var t = defined($(".__test")[0]);
           assert.equal(t.nodeType, window.Node.ELEMENT_NODE);
           var loc = dloc.makeDLoc(root, t, 1);
           t.removeChild(t.firstChild);
           assert.isFalse(loc.isValid());
         });

      it("returns false when the offset is no longer valid (text)",
         function test() {
           $root.append("<div class='__test'>test</div>");
           var t = defined($(".__test")[0].firstChild);
           assert.equal(t.nodeType, window.Node.TEXT_NODE);
           var loc = dloc.makeDLoc(root, t, 4);
           t.textContent = "t";
           assert.isFalse(loc.isValid());
         });

      it("returns false when the offset is no longer valid (attribute)",
         function test() {
           $root.append("<div class='__test' foo='bar'></div>");
           var t = defined($(".__test")[0].attributes.foo);
           assert.isTrue(isAttr(t));
           var loc = dloc.makeDLoc(root, t, 3);
           t.value = "f";
           assert.isFalse(loc.isValid());
         });
    });

    describe("normalizeOffset", function normalizeOffset() {
      afterEach(function afterEach() {
        $(".__test").remove();
      });

      it("makes a new valid location (element)", function test() {
        $root.append("<div class='__test'>test</div>");
        var t = defined($(".__test")[0]);
        assert.equal(t.nodeType, window.Node.ELEMENT_NODE);
        var loc = dloc.makeDLoc(root, t, 1);
        t.removeChild(t.firstChild);
        assert.isFalse(loc.isValid());
        var norm = loc.normalizeOffset();
        assert.isTrue(norm.isValid());
        assert.notEqual(loc, norm);
        assert.equal(norm.normalizeOffset(), norm);
      });

      it("makes a new valid location (text)", function test() {
        $root.append("<div class='__test'>test</div>");
        var t = defined($(".__test")[0].firstChild);
        assert.equal(t.nodeType, window.Node.TEXT_NODE);
        var loc = dloc.makeDLoc(root, t, 4);
        t.textContent = "t";
        assert.isFalse(loc.isValid());
        var norm = loc.normalizeOffset();
        assert.isTrue(norm.isValid());
        assert.notEqual(loc, norm);
        assert.equal(norm.normalizeOffset(), norm);
      });

      it("makes a new valid location (attribute)", function test() {
        $root.append("<div class='__test' foo='bar'></div>");
        var t = defined($(".__test")[0].attributes.foo);
        assert.isTrue(isAttr(t));
        var loc = dloc.makeDLoc(root, t, 3);
        t.value = "f";
        assert.isFalse(loc.isValid());
        var norm = loc.normalizeOffset();
        assert.isTrue(norm.isValid());
        assert.notEqual(loc, norm);
        assert.equal(norm.normalizeOffset(), norm);
      });
    });
  });
});
