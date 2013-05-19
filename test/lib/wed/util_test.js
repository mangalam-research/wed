'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../build/standalone/lib',
    nodeRequire: require
});
var util = requirejs("wed/util");
var EName = requirejs("salve/validate").EName;
var chai = require("chai");
var assert = chai.assert;

describe("utils", function () {
    var resolver;
    var mapping = {
        "btw": "http://lddubeau.com/ns/btw-storage",
        "tei": "http://www.tei-c.org/ns/1.0",
        "xml": "http://www.w3.org/XML/1998/namespace",
        "": "http://www.tei-c.org/ns/1.0"
    };
    
    before(function () {
        resolver = new util.NameResolver(mapping);
    });

    describe("resolve names", function () {
        it("bad xml declaration", function () {
            assert.Throw(
                util.NameResolver.bind(
                    Object.create(util.NameResolver.prototype), 
                    {"xml": "x"}),
                Error, "invalid xml declaration: x");
                                               
        });
        it("no prefix", function () {
            assert.equal(
                resolver.resolveName("blah", false).toString(), 
                new EName("http://www.tei-c.org/ns/1.0", 
                          "blah").toString());
        });
        it("prefix", function () {
            assert.equal(
                resolver.resolveName("btw:blah", false).toString(), 
                new EName("http://lddubeau.com/ns/btw-storage", 
                          "blah").toString());
        });
        it("attribute, no prefix", function () {
            assert.equal(
                resolver.resolveName("blah", true).toString(), 
                new EName("", "blah").toString());
        });
        it("attribute:prefix", function () {
            assert.equal(
                resolver.resolveName("btw:blah", true).toString(), 
                new EName("http://lddubeau.com/ns/btw-storage", 
                          "blah").toString());
        });
        it("bad prefix", function () {
            assert.Throw(
                resolver.resolveName.bind(resolver, "garbage:blah", 
                                      true), 
                Error, 
                "trying to resolve an unexpected namespace: garbage");
        });
        it("badly formed name", function () {
            assert.Throw(
                resolver.resolveName.bind(resolver, "gar:bage:blah", 
                                      true), 
                Error, 
                "invalid name passed to resolveName");
        });
        it("no default namespace", function () {
            var mapping = {
                "btw": "http://lddubeau.com/ns/btw-storage",
                "tei": "http://www.tei-c.org/ns/1.0",
                "xml": "http://www.w3.org/XML/1998/namespace"
            };
            var resolver = new util.NameResolver(mapping);
            assert.Throw(resolver.resolveName.bind(resolver, "blah"),
                         Error,
                         "trying to resolve a name in the default namespace but the default namespace is undefined");
            
        });
    });

    describe("unresolve names", function () {
        it("default namespace", function () {
            assert.equal(
                resolver.unresolveName("http://www.tei-c.org/ns/1.0", 
                                   "blah"), 
                "blah");
        });
        it("other namespace", function () {
            assert.equal(
                resolver.unresolveName("http://lddubeau.com/ns/btw-storage", 
                                   "blah"), 
                "btw:blah");
        });
        it("bad uri", function () {
            assert.Throw(
                resolver.unresolveName.bind(resolver, "ttt", 
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
        it("match all", function () {
            assert.equal(util.classFromOriginalName("*"), "._real");
        });
        it("with namespace", function () { 
            assert.equal(util.classFromOriginalName("btw:foo"), "._real.btw\\:foo");
        });
    });
});

