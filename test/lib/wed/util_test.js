/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";
var requirejs = require("requirejs");
var chai = require("chai");
var path = require("path");

var baseUrl = path.join(__dirname, "../../../build/standalone/lib");

// We have to use this so that the test can find xregexp. It is not
// possible to just configure RequireJS to load it. The problem is
// that when RequireJS finds the file, it loads it as an AMD
// module. Shims do not work in Node, so there's no fixing anything
// there. RequireJS will call on node to load it if it cannot find it,
// but then Node won't find it either, unless the following
// custom_require is used. Ick...
function custom_require() {
  if (arguments.length === 1 && arguments[0] === "xregexp") {
    // eslint-disable-next-line global-require
    return require(baseUrl + "/external/xregexp");
  }

  /* jshint validthis: true */
  return require.apply(this, arguments);
}

requirejs.config({
  baseUrl: baseUrl,
  packages: [
    {
      name: "lodash",
      location: "external/lodash",
    },
  ],
  nodeRequire: custom_require,
});
var util = requirejs("wed/util");
var salve = requirejs("salve");
var NameResolver = salve.NameResolver;
var assert = chai.assert;

describe("util", function utilBlock() {
  describe("decode attribute name", function decode() {
    it("no prefix", function test() {
      assert.equal(util.decodeAttrName("data-wed-blah"), "blah");
    });

    it("prefix", function test() {
      assert.equal(util.decodeAttrName("data-wed-btw---blah"), "btw:blah");
    });

    it("prefix dashes", function test() {
      assert.equal(
        util.decodeAttrName("data-wed-btw---blah-one--two----three-----four"),
        "btw:blah-one--two---three----four");
    });
  });

  describe("encode attribute name", function encode() {
    it("no prefix", function test() {
      assert.equal(util.encodeAttrName("blah"), "data-wed-blah");
    });

    it("prefix", function test() {
      assert.equal(util.encodeAttrName("btw:blah"), "data-wed-btw---blah");
    });

    it("prefix dashes", function test() {
      assert.equal(util.encodeAttrName("btw:blah-one--two---three----four"),
                   "data-wed-btw---blah-one--two----three-----four");
    });
  });

  describe("classFromOriginalName", function classFromOriginalName() {
    it("no namespace", function test() {
      assert.equal(util.classFromOriginalName("li", { "": "" }),
                   "._local_li._xmlns_._real");
    });

    it("match all", function test() {
      assert.equal(util.classFromOriginalName("*", {}), "._real");
    });

    it("with namespace", function test() {
      assert.equal(util.classFromOriginalName("btw:foo", {
        btw: "http://mangalamresearch.org/ns/btw-storage",
      }), "._local_foo.\
_xmlns_http\\:\\/\\/mangalamresearch\\.org\\/ns\\/btw-storage._real");
    });
  });

  describe("distFromDeltas", function distFromDeltas() {
    it("works", function test() {
      assert.equal(util.distFromDeltas(0, 0), 0);
      assert.equal(util.distFromDeltas(3, 4), 5);
    });
  });

  describe("distFromRect", function distFromRect() {
    it("returns 0 when point inside", function test() {
      assert.equal(util.distFromRect(5, 5, 0, 0, 10, 10), 0);
    });

    it("returns 0 when point at corners", function test() {
      assert.equal(util.distFromRect(0, 0, 0, 0, 10, 10), 0);
      assert.equal(util.distFromRect(0, 10, 0, 0, 10, 10), 0);
      assert.equal(util.distFromRect(10, 0, 0, 0, 10, 10), 0);
      assert.equal(util.distFromRect(10, 10, 0, 0, 10, 10), 0);
    });

    it("returns dist from top when point above", function test() {
      assert.equal(util.distFromRect(4, -5, 0, 0, 10, 10), 5);
    });

    it("returns dist from bottom when point below", function test() {
      assert.equal(util.distFromRect(4, 15, 0, 0, 10, 10), 5);
    });

    it("returns dist from left when point left", function test() {
      assert.equal(util.distFromRect(-5, 4, 0, 0, 10, 10), 5);
    });

    it("returns dist from right when point right", function test() {
      assert.equal(util.distFromRect(15, 4, 0, 0, 10, 10), 5);
    });

    it("returns min dist when point at corner", function test() {
      assert.equal(util.distFromRect(-5, -12, 0, 0, 10, 10), 13);
      assert.equal(util.distFromRect(13, -4, 0, 0, 10, 10), 5);
      assert.equal(util.distFromRect(-4, 13, 0, 0, 10, 10), 5);
      assert.equal(util.distFromRect(15, 22, 0, 0, 10, 10), 13);
    });
  });

  describe("convertPatternObj", function convertPatternObj() {
    var nr;
    before(function test() {
      nr = new NameResolver();
      nr.definePrefix("", "default");
      nr.definePrefix("prefix", "uri");
      nr.definePrefix("prefix2", "uri2");
    });

    it("converts a Name", function test() {
      var name = new salve.Name("", "uri", "name");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "prefix:name");
    });

    it("converts a Name with an unprefixed namespace", function test() {
      var name = new salve.Name("", "unprefixed", "name");
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "{unprefixed}name");
    });

    it("converts a Name with a default namespace", function test() {
      var name = new salve.Name("", "default", "name");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "name");
    });

    it("converts an NsName", function test() {
      var name = new salve.NsName("", "uri");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "prefix:*");
    });

    it("converts an NsName with a default namespace", function test() {
      var name = new salve.NsName("", "default");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "*");
    });

    it("converts an NsName with an unprefixed namespace", function test() {
      var name = new salve.NsName("", "unprefixed");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "{unprefixed}*");
    });

    it("converts an NsName with exception", function test() {
      var name = new salve.NsName("", "uri", new salve.Name("", "uri", "name"));
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "prefix:* except (prefix:name)");
    });

    it("converts an AnyName", function test() {
      var name = new salve.AnyName("");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "*:*");
    });

    it("converts an AnyName with exception", function test() {
      var name = new salve.AnyName("", new salve.Name("", "uri", "name"));
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "*:* except (prefix:name)");
    });

    it("converts a NameChoice", function test() {
      var name = new salve.NameChoice("", [
        new salve.Name("", "uri", "name"),
        new salve.Name("", "uri2", "name2"),
      ]);
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "(prefix:name) or (prefix2:name2)");
    });
  });
});

//  LocalWords:  requirejs util chai classFromOriginalName namespace
//  LocalWords:  distFromDeltas btw distFromRect li Dubeau MPL
//  LocalWords:  Mangalam RequireJS
