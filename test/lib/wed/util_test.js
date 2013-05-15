'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../static/lib/',
    nodeRequire: require
});
var util = requirejs("wed/util");
var EName = requirejs("salve/validate").EName;
var chai = require("chai");
var assert = chai.assert;

describe("utils", function () {
    describe("resolve names", function () {
        it("no prefix", function () {
            assert.equal(
                util.resolveName("blah", false).toString(), 
                new EName("http://www.tei-c.org/ns/1.0", 
                          "blah").toString());
        });
        it("prefix", function () {
            assert.equal(
                util.resolveName("btw:blah", false).toString(), 
                new EName("http://lddubeau.com/ns/btw-storage", 
                          "blah").toString());
        });
        it("attribute, no prefix", function () {
            assert.equal(
                util.resolveName("blah", true).toString(), 
                new EName("", "blah").toString());
        });
        it("attribute:prefix", function () {
            assert.equal(
                util.resolveName("btw:blah", true).toString(), 
                new EName("http://lddubeau.com/ns/btw-storage", 
                          "blah").toString());
        });
        it("bad prefix", function () {
            assert.throw(
                util.resolveName.bind(undefined, "garbage:blah", 
                                      true), 
                Error, 
                "trying to resolve an unexpected namespace: garbage");
        });
        it("badly formed name", function () {
            assert.throw(
                util.resolveName.bind(undefined, "gar:bage:blah", 
                                      true), 
                Error, 
                "invalid name passed to resolveName");
        });

    });

    describe("unresolve names", function () {
        it("default namespace", function () {
            assert.equal(
                util.unresolveName("http://www.tei-c.org/ns/1.0", 
                                   "blah"), 
                "blah");
        });
        it("other namespace", function () {
            assert.equal(
                util.unresolveName("http://lddubeau.com/ns/btw-storage", 
                                   "blah"), 
                "btw:blah");
        });
        it("bad uri", function () {
            assert.throw(
                util.unresolveName.bind(undefined, "ttt", 
                                   "blah"),
                Error,
                "unknown uri");
        });
    });

    describe("decode attribute name", function () {
        it("no prefix", function () {
            assert.equal(util.decodeAttrName("data-wed-blah"), "blah");
        });
        it("prefix", function () {
            assert.equal(util.decodeAttrName("data-wed-btw---blah"), "btw:blah");
        });
        it("prefix dashes", function () {
            assert.equal(util.decodeAttrName("data-wed-btw---blah-one--two----three-----four"), "btw:blah-one--two---three----four");
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
            assert.equal(util.encodeAttrName("btw:blah-one--two---three----four"), "data-wed-btw---blah-one--two----three-----four");
        });
    });

    describe("classFromOriginalName", function () {
        it("no namespace", function () {
            assert.equal(util.classFromOriginalName("li"), "._real.li");
        });
        it("with namespace", function () { 
            assert.equal(util.classFromOriginalName("btw:foo"), "._real.btw\\:foo");
        });
    });
});

