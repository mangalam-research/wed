/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
var jsdom = require("jsdom").jsdom;
var chai = require("chai");
var assert = chai.assert;
var path = require("path");

var lib_path = __dirname + '/../../../build/standalone/lib';
var base_path = path.join(__dirname, '/../../../build/standalone/');

/* jshint multistr: true */
var html = '<html>\
  <head>\
    <base href="@BASE@"></base>\
    <meta http-equiv="Content-Type" content="text/xhtml; charset=utf-8"/>\
    <script type="text/javascript" src="lib/requirejs/require.js"></script>\
    <script type="text/javascript" src="requirejs-config.js"></script>\
    <link rel="stylesheet" href="lib/external/bootstrap/css/bootstrap.min.css"></link>\
    <link href="lib/wed/wed.css" type="text/css" media="screen" rel="stylesheet"></link>\
  </head>\
  <body>\
    <div id="root">\
       <div id="a"><p>A</p></div>\
       <div id="b"><p>B</p></div>\
    </div>\
    <div id="c">C</div>\
  </body>\
</html>'.replace('@BASE@', base_path);

function defined(x) {
    assert.isDefined(x[0]);
    return x;
}

var log_buffer = [];

//
// Mock the DOM Range object.
//

function Range() {
    this.startContainer = undefined;
    this.startOffset = undefined;
    this.endContainer = undefined;
    this.endOffset = undefined;
    this.collapsed = true;
    this.commonAncestorContainer = "FAKE";
}

// These must all be set to make rangy happy. We set them to nothing
// useful because we won't actually use them.
["setStart", "setStartBefore", "setStartAfter", "setEnd", "setEndBefore",
 "setEndAfter", "collapse", "selectNode", "selectNodeContents",
 "compareBoundaryPoints", "deleteContents", "extractContents",
 "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString",
 "detach"].forEach(function (x) {
     Range.prototype[x] = function () {};
 });

// Set what we use.
Range.prototype.setStart = function (node, offset) {
    this.startContainer = node;
    this.startOffset = offset;
    if (this.collapsed)
        this.setEnd(node, offset);
    else
        this._setCollapsed();
};

Range.prototype.setEnd = function (node, offset) {
    this.endContainer = node;
    this.endOffset = offset;
    this._setCollapsed();
};

Range.prototype._setCollapsed = function () {
    this.collapsed = !this.endContainer ||
        (this.startContainer === this.endContainer &&
         this.startOffset === this.endOffset);
};

describe("dloc", function () {
    var window;

    before(function (done) {
        jsdom.env({
            html: html,
            url: base_path,
            features: {
                FetchExternalResources: ["script"],
                ProcessExternalResources: ["script"]
            },
            done: function (error, w) {
                assert.isNull(error, "window creation failed with error: " +
                              error);
                w.addEventListener('load', function () {
                    window = w;

                    // Replace default log to record what is going on.
                    w.console.log = function (msg) {
                        log_buffer.push(msg);
                    };
                    // Replace the default alert.
                    w.alert = function () {
                        w.console.log.apply(w.console, arguments);
                    };

                    // Mock createRange for rangy.
                    w.document.createRange = function () {
                        var range = new Range();
                        range.setStart(w.document.body, 0);
                        range.setEnd(w.document.body, 0);
                        return range;
                    };
                    done();
                });
            }
        });
    });

    var $root;
    var dloc;
    var $;
    before(function (done) {
        window.require(["wed/dloc", "jquery", "rangy"],
                       function (_dloc, _$, rangy) {
            try {
                assert.isTrue(rangy.initialized, "rangy initialized.");
                assert.isTrue(rangy.supported,
                              "rangy supports our environment");

                // Rangy won't be able to initialize its internal
                // WrappedSelection module. That's fine.
                assert.equal(log_buffer.length, 1);
                assert.deepEqual(
                    log_buffer[0],
                    'Module \'WrappedSelection\' failed to load: ' +
                        'Module \'WrappedSelection\' failed to load: Neither ' +
                        'document.selection or window.getSelection() detected.'
                );
                log_buffer = []; // Flush
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
