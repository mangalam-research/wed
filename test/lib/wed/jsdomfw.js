/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";
var jsdom = require("jsdom");
var chai = require("chai");
var path = require("path");

var JSDOM = jsdom.JSDOM;
var assert = chai.assert;
var base_path = "file://" + path.join(__dirname, "/../../../build/standalone/");

/* jshint multistr: true */
var html = "<html>\
  <head>\
    <base href=\"@BASE@\"></base>\
    <meta http-equiv=\"Content-Type\" content=\"text/xhtml; charset=utf-8\"/>\
    <script type=\"text/javascript\" src=\"lib/requirejs/require.js\"></script>\
    <script type=\"text/javascript\" src=\"requirejs-config.js\"></script>\
    <link rel=\"stylesheet\" href=\"lib/external/bootstrap/css/bootstrap.min.css\"></link>\
    <link href=\"lib/wed/wed.css\" type=\"text/css\" media=\"screen\" rel=\"stylesheet\"></link>\
  </head>\
  <body>\
    <div id=\"root\">\
       <div id=\"a\"><p>A</p></div>\
       <div id=\"b\"><p>B</p></div>\
    </div>\
    <div id=\"c\">C</div>\
  </body>\
</html>".replace("@BASE@", base_path);

//
// Mock the DOM Range and Selection objects. We're doing only just
// enough to prevent Rangy from going nuts. Note that this is not
// enough to be able to use Rangy for general Range and Selection
// manipulations.
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
[
  "setStart", "setStartBefore", "setStartAfter", "setEnd", "setEndBefore",
  "setEndAfter", "collapse", "selectNode", "selectNodeContents",
  "compareBoundaryPoints", "deleteContents", "extractContents",
  "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString",
  "detach",
].forEach(function each(x) {
  Range.prototype[x] = function fake() {};
});

// Set what we use.
Range.prototype.setStart = function setStart(node, offset) {
  this.startContainer = node;
  this.startOffset = offset;
  if (this.collapsed) {
    this.setEnd(node, offset);
  }
  else {
    this._setCollapsed();
  }
};

Range.prototype.setEnd = function setEnd(node, offset) {
  this.endContainer = node;
  this.endOffset = offset;
  this._setCollapsed();
};

Range.prototype._setCollapsed = function _setCollapsed() {
  this.collapsed = !this.endContainer ||
    (this.startContainer === this.endContainer &&
     this.startOffset === this.endOffset);
};

function Selection() {
  this.anchorNode = null;
  this.anchorOffset = null;
  this.baseNode = null;
  this.baseOffset = null;
  this.extentNode = null;
  this.extentOffset = null;
  this.focusNode = null;
  this.focusOffset = null;
  this.isCollapsed = true;
  this._ranges = [];
  this.type = "Range";
}

Object.defineProperty(Selection.prototype, "rangeCount", {
  get: function rangeCount() {
    return this._ranges.length;
  },
  enumerable: true,
  configurable: true,
});

Selection.prototype.addRange = function addRange(r) {
  this._ranges.push(r);
};

Selection.prototype.removeAllRanges = function removeAllRanges() {
  this._ranges = [];
};


function FW() {
  this.window = undefined;
  this.log_buffer = [];
}

FW.prototype.create = function create(done) {
  var me = this;
  me.log_buffer = [];
  var vc = new jsdom.VirtualConsole();
  vc.on("log", function log() {
    me.log_buffer.push(Array.prototype.slice.call(arguments));
  });
  vc.on("jsdomError", function jsdomError(er) {
    throw er;
  });
  var dom = new JSDOM(html, {
    url: base_path,
    runScripts: "dangerously",
    resources: "usable",
    virtualConsole: vc,
  });
  var w = me.window = dom.window;

  w.addEventListener("load", function loaded() {
    // Mock createRange for rangy.
    w.document.createRange = function createRange() {
      var range = new Range();
      range.setStart(w.document.body, 0);
      range.setEnd(w.document.body, 0);
      return range;
    };

    // Mock window.getSelection for rangy.
    w.getSelection = function getSelection() {
      return new Selection();
    };

    // Check that rangy loaded properly...
    w.require(["rangy"], function loadedRangy(rangy) {
      assert.isTrue(rangy.initialized, "rangy initialized.");
      assert.isTrue(rangy.supported, "rangy supports our environment");

      // There should not be any errors.
      assert.equal(me.log_buffer.length, 0);
      done();
    });
  });
};

exports.FW = FW;
