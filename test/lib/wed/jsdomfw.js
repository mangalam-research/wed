/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var jsdom = require("jsdom");
var chai = require("chai");
var assert = chai.assert;
var path = require("path");

var base_path = "file://" +
        path.join(__dirname, '/../../../build/standalone/');

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

function FW() {
    this.window = undefined;
    this.log_buffer = [];
}

FW.prototype.create = function (done) {
    var me = this;
    me.log_buffer = [];
    var vc = jsdom.createVirtualConsole();
    vc.on("log", function () {
        me.log_buffer.push(Array.prototype.slice.call(arguments));
    });
    vc.on("jsdomError", function (er) {
        // We do not report these. This will happen when using RequireJS'
        // optional! plugin.
        if (er.message.lastIndexOf("Could not load script", 0) === 0) {
            return;
        }
        throw er;
    });
    jsdom.env({
        html: html,
        url: base_path,
        features: {
            FetchExternalResources: ["script"],
            ProcessExternalResources: ["script"]
        },
        virtualConsole: vc,
        created: function (error, w) {
            assert.isNull(error);
        },
        onload: function (w) {
            me.window = w;
            // Mock createRange for rangy.
            w.document.createRange = function () {
                var range = new Range();
                range.setStart(w.document.body, 0);
                range.setEnd(w.document.body, 0);
                return range;
            };

            // Check that rangy loaded properly...
            w.require(["rangy"], function (rangy) {
                assert.isTrue(rangy.initialized, "rangy initialized.");
                assert.isTrue(rangy.supported,
                              "rangy supports our environment");

                // Rangy won't be able to initialize its internal
                // WrappedSelection module. That's fine.
                assert.equal(me.log_buffer.length, 1);
                assert.deepEqual(
                    me.log_buffer[0][0],
                    'Module \'WrappedSelection\' failed to load: ' +
                        'Module \'WrappedSelection\' failed to load: Neither ' +
                        'document.selection or window.getSelection() detected.'
                );
                me.log_buffer = []; // Flush
            });
        },
        done: function (error, w) {
            assert.isNull(error, "window creation failed with error: " +
                          error);
            done();
        }
    });
};

exports.FW = FW;
