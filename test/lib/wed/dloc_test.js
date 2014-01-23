/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
var jsdomfw = require("./jsdomfw");
var chai = require("chai");
var assert = chai.assert;
var path = require("path");
var fs = require("fs");

function defined(x) {
    assert.isDefined(x);
    return x;
}

describe("dloc", function () {
    var source = 'build/test-files/domutil_test_data/source_converted.xml';
    var source_txt = fs.readFileSync(source).toString();
    var fw;
    var window;
    var $root;
    var root_obj;
    var dloc;
    var $;

    this.timeout(0);
    before(function (done) {
        fw = new jsdomfw.FW();
        fw.create(function () {
            window = fw.window;
            window.require(["wed/dloc", "jquery"], function (_dloc, _$) {
                try {
                    assert.isUndefined(window.document.errors);
                    dloc = _dloc;
                    $ = _$;
                    $root = $("#root");
                    defined($root[0]);
                    $root.html(source_txt);
                    root_obj = new dloc.DLocRoot($root[0]);
                    done();
                }
                catch (e) {
                    done(e);
                    throw e;
                }
            }, done);
        });
    });

    describe("DLocRoot", function () {
        it("marks the root", function () {
            assert.equal(dloc.findRoot($root[0]), root_obj);
        });

        it("fails if the node is already marked", function () {
            assert.Throw(function () {
                new dloc.DLocRoot($root[0]);
            },
                         window.Error,
                         "node already marked as root");
        });

        describe("nodeToPath", function () {
            it("returns an empty string on root", function () {
                assert.equal(root_obj.nodeToPath($root[0]), "");
            });

            it("returns a correct path on text node", function () {
                var node = defined($root.find(".title")[0].childNodes[0]);
                assert.equal(root_obj.nodeToPath(node), "0/0/0/0/0/0");
            });

            it("returns a correct path on later text node", function () {
                var node =
                    defined($root.find(".body>.p").get(-1).childNodes[2]);
                assert.equal(root_obj.nodeToPath(node), "0/1/0/1/2");
            });

            it("returns a correct path on attribute", function () {
                var node =
                    defined($root.find(".body>.p").get(-1).attributes["class"]);
                assert.equal(root_obj.nodeToPath(node), "0/1/0/1/@class");
            });

            it("fails on a node which is not a descendant of its root",
               function () {
                var node = defined($("body")[0]);
                assert.Throw(root_obj.nodeToPath.bind(root_obj, node),
                             window.Error, "node is not a descendant of root");
            });

            it("fails on invalid node",
               function () {
                assert.Throw(root_obj.nodeToPath.bind(root_obj, null),
                             window.Error, "invalid node parameter");

                assert.Throw(root_obj.nodeToPath.bind(root_obj, undefined),
                             window.Error, "invalid node parameter");
            });

        });

        describe("pathToNode", function () {
            it("returns root when passed an empty string", function () {
                assert.equal(root_obj.pathToNode(""), $root[0]);
            });

            it("returns a correct node on a text path", function () {
                var node = defined($root.find(".title")[0].childNodes[0]);
                assert.equal(root_obj.pathToNode("0/0/0/0/0/0"), node);
            });

            it("returns a correct node on a later text path", function () {
                var node =
                    defined($root.find(".body>.p").get(-1).childNodes[2]);
                assert.equal(root_obj.pathToNode("0/1/0/1/2"), node);

            });

            it("returns a correct node on attribute path", function () {
                var node =
                    defined($root.find(".body>.p").get(-1).attributes["class"]);
                assert.equal(root_obj.pathToNode("0/1/0/1/@class"), node);
            });

            it("accepts more than one digit per path step",
               function () {
                var node = defined($root.find(".p").get(-1));
                // There was a stupid bug in an earlier version which
                // would make this fail with an exception complaining
                // that the path was malformed due to the presence of
                // "10". The null return value is fine since there is
                // no such element, but at least it should not
                // generate an exception.
                assert.equal(root_obj.pathToNode("0/10"), null);
            });

            it("fails on malformed path",
               function () {
                assert.Throw(root_obj.pathToNode.bind(root_obj, "+"),
                             window.Error, "malformed path expression");
            });
        });

    });

    describe("findRoot", function () {
        it("finds the root", function () {
            assert.equal(dloc.findRoot(defined($(".p")[0])), root_obj);
        });

        it("returns undefined if not in a root", function () {
            assert.isUndefined(dloc.findRoot(defined($root.parent()[0])));
        });

    });

    describe("getRoot", function () {
        it("gets the root", function () {
            assert.equal(dloc.getRoot(defined($(".p")[0])), root_obj);
        });

        it("throws an exception if not in a root", function () {
            assert.Throw(dloc.getRoot.bind(dloc, defined($root.parent()[0])),
                         window.Error, "no root found");
        });

    });

    describe("makeDLoc", function () {
        it("returns undefined when called with undefined location",
           function () {
            assert.isUndefined(dloc.makeDLoc($root, undefined));
        });

        it("returns a valid DLoc", function () {
            var a = defined($(".p")[0]);
            var loc = dloc.makeDLoc($root, a, 0);
            assert.equal(loc.node, a);
            assert.equal(loc.offset, 0);
            assert.equal(loc.root, $root[0]);
        });

        it("returns a valid DLoc on an attribute node", function () {
            var a = defined($(".quote")[0].getAttributeNode("data-wed-type"));
            var loc = dloc.makeDLoc($root, a, 0);
            assert.equal(loc.node, a);
            assert.equal(loc.offset, 0);
            assert.equal(loc.root, $root[0]);
        });

        it("returns a valid DLoc when called with an array", function () {
            var a = defined($(".p")[0]);
            var loc = dloc.makeDLoc($root, new window.Array(a, 0));
            assert.equal(loc.node, a);
            assert.equal(loc.offset, 0);
            assert.equal(loc.root, $root[0]);
        });

        it("returns undefined when called with an array that has an " +
           "undefined first member", function () {
            assert.isUndefined(dloc.makeDLoc($root,
                                             new window.Array(undefined,
                                                              0)));
        });

        it("returns undefined when called with an array that has an " +
           "an empty first member",
           function () {
            assert.isUndefined(dloc.makeDLoc($root, new window.Array($(),
                                                                     0)));
        });

        it("throws an error when the node is not in the root", function () {
            var c = defined($root.parent()[0]);
            assert.Throw(dloc.makeDLoc.bind(undefined, $root, c, 0),
                         window.Error, "node not in root");
        });

        it("throws an error when the root is not marked", function () {
            var c = defined($root.parent()[0]);
            assert.Throw(dloc.makeDLoc.bind(undefined, c, c, 0),
                         window.Error, /^root has not been marked as a root/);
        });
    });

    describe("DLoc", function () {
        describe("clone", function () {
            it("clones", function () {
                var a = defined($(".p")[0]);
                var loc = dloc.makeDLoc($root, a, 1);
                assert.deepEqual(loc, loc.clone());
            });
        });

        describe("make", function () {
            it("makes a new location with the same root", function () {
                var a = defined($(".p")[0]);
                var b = defined($(".p")[1]);
                var loc = dloc.makeDLoc($root, a, 1);
                var loc2 = loc.make(b, 0);
                assert.equal(loc.root, loc2.root);
                assert.equal(loc2.node, b);
                assert.equal(loc2.offset, 0);
            });
        });

        describe("makeRange", function () {
            it("makes a range", function () {
                var a = defined($(".p")[0]);
                var b = defined($(".p")[1]);
                var loc = dloc.makeDLoc($root, a, 0);
                var loc2 = loc.make(b, 1);
                var range = loc.makeRange(loc2);
                assert.equal(range.range.startContainer, a);
                assert.equal(range.range.startOffset, 0);
                assert.equal(range.range.endContainer, b);
                assert.equal(range.range.endOffset, 1);
                assert.isFalse(range.range.collapsed);
                assert.isFalse(range.reversed);
            });

            it("makes a collapsed range", function () {
                var a = defined($(".p")[0]);
                var loc = dloc.makeDLoc($root, a, 0);
                var range = loc.makeRange();
                assert.equal(range.startContainer, a);
                assert.equal(range.startOffset, 0);
                assert.equal(range.endContainer, a);
                assert.equal(range.endOffset, 0);
                assert.isTrue(range.collapsed);
            });

            it("makes a reversed range", function () {
                var a = defined($(".p")[0]);
                var b = defined($(".p")[1]);
                var loc = dloc.makeDLoc($root, b, 1);
                var loc2 = loc.make(a, 0);
                var range = loc.makeRange(loc2);
                assert.equal(range.range.startContainer, a);
                assert.equal(range.range.startOffset, 0);
                assert.equal(range.range.endContainer, b);
                assert.equal(range.range.endOffset, 1);
                assert.isFalse(range.range.collapsed);
                assert.isTrue(range.reversed);
            });

            it("fails on an attribute node", function () {
                var a = defined($(".quote")[0].getAttributeNode(
                    "data-wed-type"));
                var b = defined($(".p")[1]);
                var loc = dloc.makeDLoc($root, a, 0);
                var loc2 = loc.make(b, 1);
                assert.Throw(loc.makeRange.bind(loc, loc2),
                             window.Error,
                             "cannot make range from attribute node");
            });

            it("fails on an attribute node passed as other", function () {
                var a = defined($(".quote")[0].getAttributeNode(
                    "data-wed-type"));
                var b = defined($(".p")[1]);
                var loc = dloc.makeDLoc($root, a, 0);
                var loc2 = loc.make(b, 1);
                assert.Throw(loc2.makeRange.bind(loc2, loc),
                             window.Error,
                             "cannot make range from attribute node");
            });
        });

        describe("toArray", function () {
            it("returns an array with the right values", function () {
                var a = defined($(".p")[0]);
                var loc = dloc.makeDLoc($root, a, 1);
                assert.deepEqual(loc.toArray(), [a, 1]);
            });
        });
    });

});
