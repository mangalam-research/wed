/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../build/standalone/lib',
    nodeRequire: require
});
var refman = requirejs("wed/refman");
var chai = require("chai");
var assert = chai.assert;

describe("refman", function () {
    var sense_refs = refman.___test_rm;

    beforeEach(function () {
        sense_refs.deallocateAll();
    });

    it("allocate label", function () {
        assert.equal(sense_refs.allocateLabel("S.z"), "a");

        // Expected behavior: asking for a label for the same ID
        // will result in a NEW label.
        assert.equal(sense_refs.allocateLabel("S.z"), "b");
    });

    it("find label from id", function () {
        assert.equal(sense_refs.allocateLabel("S.z"), "a");
        assert.equal(sense_refs.allocateLabel("S.x"), "b");

        // Actual tests.
        assert.equal(sense_refs.idToLabel("S.z"), "a");
        assert.equal(sense_refs.idToLabel("S.x"), "b");
        // ID without allocated label.
        assert.equal(sense_refs.idToLabel("S.ttt"), undefined);
    });

    it("next number", function () {
        assert.equal(sense_refs.nextNumber(), 1);
        assert.equal(sense_refs.nextNumber(), 2);
    });

    it("deallocate all", function () {
        sense_refs.nextNumber();
        sense_refs.nextNumber();
        sense_refs.nextNumber();
        sense_refs.allocateLabel("S.z");
        sense_refs.allocateLabel("S.x");

        sense_refs.deallocateAll();
        // deallocateAll does not reset the numbers returned by nextNumber.
        assert.equal(sense_refs.nextNumber(), 6);
        // but it does deallocate labels.
        assert.equal(sense_refs.allocateLabel("S.z"), "a");
    });

    it("allocateLabel checks its hard limit", function () {
        for(var i = 0; i < 26; ++i)
            sense_refs.allocateLabel("S." + i);

        assert.Throw(sense_refs.allocateLabel.bind(sense_refs, "S.9999"),
                     Error);
    });
});

//  LocalWords:  Dubeau MPL Mangalam allocateLabel nextNumber refman
//  LocalWords:  deallocateAll deallocate chai
