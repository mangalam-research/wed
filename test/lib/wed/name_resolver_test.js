'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../build/standalone/lib',
    nodeRequire: require
});
var name_resolver = requirejs("wed/name_resolver");
var EName = requirejs("salve/validate").EName;
var chai = require("chai");
var assert = chai.assert;

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
            resolver = new name_resolver.NameResolver();
            Object.keys(mapping).forEach(function (k) {
                resolver.definePrefix(k, mapping[k]);
            });
        });

        it("returns a name in the default namespace when trying "+
           "to resolve an unprefixed name even when no default "+
           "namespace has been defined",
           function () {
            resolver = new name_resolver.NameResolver();
            assert.equal(resolver.resolveName("blah").toString(), "{}blah");
        });
        it("returns undefined when resolving an unknown prefix",
           function () {
            assert.equal(resolver.resolveName("garbage:blah", true),
                         undefined);
        });
        it("throws an error when trying to resolve a badly "+
           "formed name",
           function () {
            assert.Throw(
                resolver.resolveName.bind(resolver, "gar:bage:blah", true),
                Error,
                "invalid name passed to resolveName");
        });
        it("resolves name without prefixes", function () {
            assert.equal(
                resolver.resolveName("blah", false).toString(),
                new EName("http://www.tei-c.org/ns/1.0", "blah").toString());
        });
        it("resolves names with prefixes", function () {
            assert.equal(
                resolver.resolveName("btw:blah", false).toString(),
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
            assert.equal(resolver.resolveName("btw:blah", false).toString(),
                         new EName("http://lddubeau.com/ns/btw-storage",
                                   "blah").toString());
        });
    });

    // We use this test twice because it tests both enterContext
    // and leaveContext.
    function enterLeaveTest() {
        resolver = new name_resolver.NameResolver();
        resolver.definePrefix("", "def1");
        resolver.definePrefix("X", "uri:X1");
        assert.equal(resolver.resolveName("blah").toString(),
                     new EName("def1", "blah").toString());
        assert.equal(resolver.resolveName("X:blah").toString(),
                     new EName("uri:X1", "blah").toString());

        resolver.enterContext();
        resolver.definePrefix("", "def2");
        resolver.definePrefix("X", "uri:X2");
        assert.equal(resolver.resolveName("blah").toString(),
                     new EName("def2", "blah").toString());
        assert.equal(resolver.resolveName("X:blah").toString(),
                     new EName("uri:X2", "blah").toString());

        resolver.leaveContext();
        assert.equal(resolver.resolveName("blah").toString(),
                     new EName("def1", "blah").toString());
        assert.equal(resolver.resolveName("X:blah").toString(),
                     new EName("uri:X1", "blah").toString());
    }

    describe("leaveContext", function () {
        it("allows leaving contexts that were entered, but no more",
           function () {
            resolver = new name_resolver.NameResolver();
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
            resolver = new name_resolver.NameResolver();
            Object.keys(mapping).forEach(function (k) {
                resolver.definePrefix(k, mapping[k]);
            });
        });
        it("knows the uri for the default namespace",
           function () {
            assert.equal(resolver.unresolveName("http://www.tei-c.org/ns/1.0",
                                                "blah"),
                         "blah");
        });
        it("knows the uri of other namespaces that were defined",
           function () {
            assert.equal(
                resolver.unresolveName("http://lddubeau.com/ns/btw-storage",
                                       "blah"),
                "btw:blah");
        });
        it("returns undefined when passed an unknown uri",
           function () {
            assert.isUndefined(resolver.unresolveName("ttt", "blah"));
        });
        // The next two tests show that the order of defintions
        // is irrelevant.
        it("gives priority to the default namespace (first)",
           function () {
            resolver.definePrefix("X", "uri:X");
            resolver.definePrefix("", "uri:X");
            assert.equal(resolver.unresolveName("uri:X", "blah"), "blah");
        });
        it("gives priority to the default namespace (second)",
           function () {
            resolver.definePrefix("", "uri:X");
            resolver.definePrefix("X", "uri:X");
            assert.equal(resolver.unresolveName("uri:X", "blah"), "blah");
        });
        it("handles attributes outside namespaces",
           function () {
            assert.equal(resolver.unresolveName("", "blah", true),
                         "blah");
        });
        it("handles attributes in namespaces",
           function () {
            assert.equal(resolver.unresolveName(
                "http://lddubeau.com/ns/btw-storage", "blah", true),
                         "btw:blah");
        });


    });

    describe("prefixFromURI", function () {
        beforeEach(function () {
            resolver = new name_resolver.NameResolver();
            Object.keys(mapping).forEach(function (k) {
                resolver.definePrefix(k, mapping[k]);
            });
        });
        it("knows the uri for the default namespace",
           function () {
            assert.equal(resolver.prefixFromURI("http://www.tei-c.org/ns/1.0"),
                         "");
        });
        it("knows the uri of other namespaces that were defined",
           function () {
            assert.equal(
                resolver.prefixFromURI("http://lddubeau.com/ns/btw-storage"),

                "btw");
        });
        it("returns undefined when passed an unknown uri", function () {
            assert.isUndefined(resolver.prefixFromURI("ttt"));
        });
        // The next two tests show that the order of defintions
        // is irrelevant.
        it("gives priority to the default namespace (first)",
           function () {
            resolver.definePrefix("X", "uri:X");
            resolver.definePrefix("", "uri:X");
            assert.equal(resolver.prefixFromURI("uri:X"), "");
        });
        it("gives priority to the default namespace (second)",
           function () {
            resolver.definePrefix("", "uri:X");
            resolver.definePrefix("X", "uri:X");
            assert.equal(resolver.prefixFromURI("uri:X"), "");
        });
    });


    describe("clone", function () {
        beforeEach(function () {
            resolver = new name_resolver.NameResolver();
            Object.keys(mapping).forEach(function (k) {
                resolver.definePrefix(k, mapping[k]);
            });
        });

        it("creates a clone", function () {
            var cloned = resolver.clone();
            Object.keys(mapping).forEach(function (k) {
                assert.equal(cloned.resolveName(k + ":x").toString(),
                             resolver.resolveName(k + ":x").toString());
            });
        });

        it("creates a clone that is independent from the original",
           function () {
            var cloned = resolver.clone();
            resolver.enterContext();
            resolver.definePrefix("X", "uri:original");

            cloned.enterContext();
            cloned.definePrefix("X", "uri:cloned");

            assert.equal(resolver.resolveName("X:x").toString(),
                         new EName("uri:original", "x").toString());
            assert.equal(cloned.resolveName("X:x").toString(),
                         new EName("uri:cloned", "x").toString());

        });

    });
});
