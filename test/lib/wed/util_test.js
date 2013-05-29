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
    
    describe("NameResolver", function () {
        describe("resolveName", function () {
            beforeEach(function () {
                resolver = new util.NameResolver();
                Object.keys(mapping).forEach(function (k) {
                    resolver.definePrefix(k, mapping[k]);
                });
            });

            it("returns a name in the default namespace when trying "+
               "to resolve an unprefixed name even when no default "+
               "namespace has been defined",
               function () {
                   resolver = new util.NameResolver();
                   assert.equal(
                       resolver.resolveName("blah").toString(),
                       "{}blah");
                   
               });
            it("returns undefined when resolving an unknown prefix", 
               function () {
                   assert.equal(
                       resolver.resolveName("garbage:blah", true), 
                       undefined);
               });
            it("throws an error when trying to resolve a badly "+
               "formed name", 
               function () {
                   assert.Throw(
                       resolver.resolveName.bind(resolver,
                                                 "gar:bage:blah", 
                                                 true), 
                       Error, 
                       "invalid name passed to resolveName");
               });
            it("resolves name without prefixes", function () {
                assert.equal(
                    resolver.resolveName("blah", false).toString(), 
                    new EName("http://www.tei-c.org/ns/1.0", 
                              "blah").toString());
            });
            it("resolves names with prefixes", function () {
                assert.equal(
                    resolver.resolveName("btw:blah", 
                                         false).toString(), 
                    new EName("http://lddubeau.com/ns/btw-storage", 
                              "blah").toString());
            });
            it("resolves attribute names without prefix", 
               function () {
                   assert.equal(
                       resolver.resolveName("blah", true).toString(), 
                       new EName("", "blah").toString());
               });
            it("resolves attribute names with prefix", function () {
                assert.equal(
                    resolver.resolveName("btw:blah", true).toString(), 
                    new EName("http://lddubeau.com/ns/btw-storage", 
                              "blah").toString());
            });
            it("resolves names even in a new context", 
               function () {
                   resolver.enterContext();
                   assert.equal(
                       resolver.resolveName("btw:blah", 
                                            false).toString(), 
                       new EName("http://lddubeau.com/ns/btw-storage", 
                                 "blah").toString());
               });
        });

        // We use this test twice because it tests both enterContext
        // and leaveContext.
        function enterLeaveTest() {
            resolver = new util.NameResolver();
            resolver.definePrefix("", "def1");
            resolver.definePrefix("X", "uri:X1");
            assert.equal(
                resolver.resolveName("blah").toString(),
                new EName("def1", "blah").toString());
            assert.equal(
                resolver.resolveName("X:blah").toString(),
                new EName("uri:X1", "blah").toString());
            
            resolver.enterContext();
            resolver.definePrefix("", "def2");
            resolver.definePrefix("X", "uri:X2");
            assert.equal(
                resolver.resolveName("blah").toString(),
                new EName("def2", "blah").toString());
            assert.equal(
                resolver.resolveName("X:blah").toString(),
                new EName("uri:X2", "blah").toString());
            
            resolver.leaveContext();
            assert.equal(
                resolver.resolveName("blah").toString(),
                new EName("def1", "blah").toString());
            assert.equal(
                resolver.resolveName("X:blah").toString(),
                new EName("uri:X1", "blah").toString());
        }

        describe("leaveContext", function () {
            it("allows leaving contexts that were entered, "+
               "but no more",
               function () {
                   resolver = new util.NameResolver();
                   resolver.enterContext();
                   resolver.enterContext();
                   resolver.leaveContext();
                   resolver.leaveContext();
                   assert.Throw(resolver.leaveContext.bind(resolver),
                                Error,
                                "trying to leave the default context");
               });

            it("does away with the definitions in the context "+
               "previously entered", enterLeaveTest);
        });

        describe("enterContext", function () {
            it("allows definitions in the new context to override "+
               "those in the upper contexts", enterLeaveTest);
        });
        
        describe("unresolveName", function () {
            beforeEach(function () {
                resolver = new util.NameResolver();
                Object.keys(mapping).forEach(function (k) {
                    resolver.definePrefix(k, mapping[k]);
                });
            });
            it("knows the uri for the default namespace", 
               function () {
                   assert.equal(
                       resolver.unresolveName(
                           "http://www.tei-c.org/ns/1.0", 
                           "blah"), 
                       "blah");
               });
            it("knows the uri of other namespaces that were defined",
               function () {
                   assert.equal(
                       resolver.unresolveName(
                           "http://lddubeau.com/ns/btw-storage", 
                           "blah"), 
                       "btw:blah");
               });
            it("returns undefined when passed an unknown uri", 
               function () {
                   assert.equal(
                       resolver.unresolveName("ttt", "blah"),
                       undefined);
               });
            // The next two tests show that the order of defintions
            // is irrelevant.
            it("gives priority to the default namespace (first)",
               function () {
                   resolver.definePrefix("X", "uri:X");
                   resolver.definePrefix("", "uri:X");
                   assert.equal(
                       resolver.unresolveName("uri:X", "blah"),
                       "blah");
               });
            it("gives priority to the default namespace (second)",
               function () {
                   resolver.definePrefix("", "uri:X");
                   resolver.definePrefix("X", "uri:X");
                   assert.equal(
                       resolver.unresolveName("uri:X", "blah"),
                       "blah");
               });
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

