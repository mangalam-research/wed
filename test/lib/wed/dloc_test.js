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

function defined(x) {
    assert.isDefined(x[0]);
    return x;
}

describe("dloc", function () {
    var fw;
    var window;
    var $root;
    var dloc;
    var $;

    before(function (done) {
        fw = new jsdomfw.FW();
        fw.create(function () {
            window = fw.window;
            window.require(["wed/dloc", "jquery"], function (_dloc, _$) {
                try {
                    assert.isUndefined(window.document.errors);
                    dloc = _dloc;
                    $ = _$;
                    $root = defined($("#root"));
                    dloc.markRoot($root);
                    done();
                }
                catch (e) {
                    done(e);
                    throw e;
                }
            }, done);
        });
    });

    describe("markRoot", function () {
        it("marks the root", function () {
            assert.equal(dloc.findRoot($root[0]), $root[0]);
        });
    });

    describe("findRoot", function () {
        it("finds the root", function () {
            assert.equal(dloc.findRoot(defined($("#a"))), $root[0]);
        });

        it("returns undefined if not in a root", function () {
            assert.isUndefined(dloc.findRoot(defined($("#c"))));
        });

    });

    describe("getRoot", function () {
        it("gets the root", function () {
            assert.equal(dloc.getRoot(defined($("#a"))), $root[0]);
        });

        it("throws an exception if not in a root", function () {
            assert.Throw(dloc.getRoot.bind(dloc, defined($("#c"))),
                         window.Error, "no root found");
        });

    });

    describe("makeDLoc", function () {
        it("returns undefined when called with undefined location",
           function () {
            assert.isUndefined(dloc.makeDLoc($root, undefined));
        });

        it("returns a valid DLoc", function () {
            var $a = defined($("#a"));
            var loc = dloc.makeDLoc($root, $a, 0);
            assert.equal(loc.node, $a[0]);
            assert.equal(loc.offset, 0);
            assert.equal(loc.root, $root[0]);
        });


        it("returns a valid DLoc when called with an array", function () {
            var $a = defined($("#a"));
            var loc = dloc.makeDLoc($root, new window.Array($a, 0));
            assert.equal(loc.node, $a[0]);
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
            var $c = defined($("#c"));
            assert.Throw(dloc.makeDLoc.bind(undefined, $root, $c, 0),
                         window.Error, "node not in root");
        });

        it("throws an error when the root is not marked", function () {
            var $c = defined($("#c"));
            assert.Throw(dloc.makeDLoc.bind(undefined, $c, $c, 0),
                         window.Error, /^root has not been marked as a root/);
        });
    });

    describe("DLoc", function () {
        describe("clone", function () {
            it("clones", function () {
                var $a = defined($("#a"));
                var loc = dloc.makeDLoc($root, $a, 1);
                assert.deepEqual(loc, loc.clone());
            });
        });

        describe("make", function () {
            it("makes a new location with the same root", function () {
                var $a = defined($("#a"));
                var $b = defined($("#b"));
                var loc = dloc.makeDLoc($root, $a, 1);
                var loc2 = loc.make($b, 0);
                assert.equal(loc.root, loc2.root);
                assert.equal(loc2.node, $b[0]);
                assert.equal(loc2.offset, 0);
            });
        });

        describe("makeRange", function () {
            it("makes a range", function () {
                var $a = defined($("#a"));
                var $b = defined($("#b"));
                var loc = dloc.makeDLoc($root, $a, 0);
                var loc2 = loc.make($b, 1);
                var range = loc.makeRange(loc2);
                assert.equal(range.range.startContainer, $a[0]);
                assert.equal(range.range.startOffset, 0);
                assert.equal(range.range.endContainer, $b[0]);
                assert.equal(range.range.endOffset, 1);
                assert.isFalse(range.range.collapsed);
                assert.isFalse(range.reversed);
            });

            it("makes a collapsed range", function () {
                var $a = defined($("#a"));
                var loc = dloc.makeDLoc($root, $a, 0);
                var range = loc.makeRange();
                assert.equal(range.startContainer, $a[0]);
                assert.equal(range.startOffset, 0);
                assert.equal(range.endContainer, $a[0]);
                assert.equal(range.endOffset, 0);
                assert.isTrue(range.collapsed);
            });

            it("makes a reversed range", function () {
                var $a = defined($("#a"));
                var $b = defined($("#b"));
                var loc = dloc.makeDLoc($root, $b, 1);
                var loc2 = loc.make($a, 0);
                var range = loc.makeRange(loc2);
                assert.equal(range.range.startContainer, $a[0]);
                assert.equal(range.range.startOffset, 0);
                assert.equal(range.range.endContainer, $b[0]);
                assert.equal(range.range.endOffset, 1);
                assert.isFalse(range.range.collapsed);
                assert.isTrue(range.reversed);
            });
        });

        describe("toArray", function () {
            it("returns an array with the right values", function () {
                var $a = defined($("#a"));
                var loc = dloc.makeDLoc($root, $a, 1);
                assert.deepEqual(loc.toArray(), [$a[0], 1]);
            });
        });
    });
});
