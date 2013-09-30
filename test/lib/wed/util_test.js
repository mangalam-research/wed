/**
 * @module util_test
 * @desc TBA
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../build/standalone/lib',
    nodeRequire: require
});
var util = requirejs("wed/util");
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
            assert.equal(util.classFromOriginalName("li"), ".li._real");
        });
        it("match all", function () {
            assert.equal(util.classFromOriginalName("*"), "._real");
        });
        it("with namespace", function () {
            assert.equal(util.classFromOriginalName("btw:foo"), ".btw\\:foo._real");
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


});
