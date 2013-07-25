'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../build/standalone/lib',
    nodeRequire: require
});
var util = requirejs("wed/util");
var chai = require("chai");
var assert = chai.assert;

describe("utils", function () {
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

