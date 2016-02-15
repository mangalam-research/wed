/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");

var baseUrl = __dirname + '/../../../build/standalone/lib';

// We have to use this so that the test can find xregexp. It is not
// possible to just configure RequireJS to load it. The problem is
// that when RequireJS finds the file, it loads it as an AMD
// module. Shims do not work in Node, so there's no fixing anything
// there. RequireJS will call on node to load it if it cannot find it,
// but then Node won't find it either, unless the following
// custom_require is used. Ick...
function custom_require() {
    if (arguments.length === 1 && arguments[0] === "xregexp")
        return require(baseUrl + '/external/xregexp');

    /* jshint validthis: true */
    return require.apply(this, arguments);
}

requirejs.config({
    baseUrl: baseUrl,
    packages: [
        {
            name: "lodash",
            location: "external/lodash"
        }
    ],
    nodeRequire: custom_require
});
var util = requirejs("wed/util");
var name_patterns = requirejs("salve/name_patterns");
var NameResolver = requirejs("salve/name_resolver").NameResolver;
var chai = require("chai");
var assert = chai.assert;

describe("util", function () {
    describe("decode attribute name", function () {
        it("no prefix", function () {
            assert.equal(util.decodeAttrName("data-wed-blah"), "blah");
        });
        it("prefix", function () {
            assert.equal(util.decodeAttrName("data-wed-btw---blah"), "btw:blah");
        });
        it("prefix dashes", function () {
            assert.equal(util.decodeAttrName("data-wed-btw---blah-one--two----\
three-----four"), "btw:blah-one--two---three----four");
        });
    });

    describe("encode attribute name", function () {
        it("no prefix", function () {
            assert.equal(util.encodeAttrName("blah"), "data-wed-blah");
        });
        it("prefix", function () {
            assert.equal(util.encodeAttrName("btw:blah"), "data-wed-btw---blah");
        });
        it("prefix dashes", function () {
            assert.equal(util.encodeAttrName("btw:blah-one--two---three----four"),
                         "data-wed-btw---blah-one--two----three-----four");
        });
    });

    describe("classFromOriginalName", function () {
        it("no namespace", function () {
            assert.equal(util.classFromOriginalName("li"), ".li._real");
        });
        it("match all", function () {
            assert.equal(util.classFromOriginalName("*"), "._real");
        });
        it("with namespace", function () {
            assert.equal(util.classFromOriginalName("btw:foo"),
                         ".btw\\:foo._real");
        });
    });

    describe("distFromDeltas", function () {
        it("works", function () {
            assert.equal(util.distFromDeltas(0, 0), 0);
            assert.equal(util.distFromDeltas(3, 4), 5);
        });
    });

    describe("distFromRect", function () {
        it("returns 0 when point inside", function () {
            assert.equal(util.distFromRect(5, 5, 0, 0, 10, 10), 0);
        });

        it("returns 0 when point at corners", function () {
            assert.equal(util.distFromRect(0, 0, 0, 0, 10, 10), 0);
            assert.equal(util.distFromRect(0, 10, 0, 0, 10, 10), 0);
            assert.equal(util.distFromRect(10, 0, 0, 0, 10, 10), 0);
            assert.equal(util.distFromRect(10, 10, 0, 0, 10, 10), 0);
        });

        it("returns dist from top when point above", function () {
            assert.equal(util.distFromRect(4, -5, 0, 0, 10, 10), 5);
        });

        it("returns dist from bottom when point below", function () {
            assert.equal(util.distFromRect(4, 15, 0, 0, 10, 10), 5);
        });

        it("returns dist from left when point left", function () {
            assert.equal(util.distFromRect(-5, 4, 0, 0, 10, 10), 5);
        });

        it("returns dist from right when point right", function () {
            assert.equal(util.distFromRect(15, 4, 0, 0, 10, 10), 5);
        });

        it("returns min dist when point at corner", function () {
            assert.equal(util.distFromRect(-5, -12, 0, 0, 10, 10), 13);
            assert.equal(util.distFromRect(13, -4, 0, 0, 10, 10), 5);
            assert.equal(util.distFromRect(-4, 13, 0, 0, 10, 10), 5);
            assert.equal(util.distFromRect(15, 22, 0, 0, 10, 10), 13);
        });
    });

    describe("convertPatternObj", function () {
        var nr;
        before(function () {
            nr = new NameResolver();
            nr.definePrefix("", "default");
            nr.definePrefix("prefix", "uri");
            nr.definePrefix("prefix2", "uri2");
        });

        it("converts a Name", function () {
            var name = new name_patterns.Name("", "uri", "name");
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "prefix:name");
        });

        it("converts a Name with an unprefixed namespace", function () {
            var name = new name_patterns.Name("", "unprefixed", "name");
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "{unprefixed}name");
        });

        it("converts a Name with a default namespace", function () {
            var name = new name_patterns.Name("", "default", "name");
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "name");
        });

        it("converts an NsName", function () {
            var name = new name_patterns.NsName("", "uri");
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "prefix:*");
        });

        it("converts an NsName with a default namespace", function () {
            var name = new name_patterns.NsName("", "default");
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "*");
        });

        it("converts an NsName with an unprefixed namespace", function () {
            var name = new name_patterns.NsName("", "unprefixed");
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "{unprefixed}*");
        });

        it("converts an NsName with exception", function () {
            var name = new name_patterns.NsName(
                "", "uri",
                new name_patterns.Name("", "uri", "name"));
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "prefix:* except (prefix:name)");
        });

        it("converts an AnyName", function () {
            var name = new name_patterns.AnyName("");
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "*:*");
        });

        it("converts an AnyName with exception", function () {
            var name = new name_patterns.AnyName("",
                new name_patterns.Name("", "uri", "name"));
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "*:* except (prefix:name)");
        });

        it("converts a NameChoice", function () {
            var name = new name_patterns.NameChoice("", [
                new name_patterns.Name("", "uri", "name"),
                new name_patterns.Name("", "uri2", "name2")]);
            assert.equal(util.convertPatternObj(name.toObject(), nr),
                         "(prefix:name) or (prefix2:name2)");
        });
    });
});

//  LocalWords:  requirejs util chai classFromOriginalName namespace
//  LocalWords:  distFromDeltas btw distFromRect li Dubeau MPL
//  LocalWords:  Mangalam RequireJS
