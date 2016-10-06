/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../build/standalone/lib',
    nodeRequire: require
});
var refman = requirejs("wed/labelman");
var chai = require("chai");
var assert = chai.assert;

describe("labelman", function () {
    var man = new refman.AlphabeticLabelManager("sense");

    beforeEach(function () {
        man.deallocateAll();
    });

    it("allocate label", function () {
        assert.equal(man.allocateLabel("S.z"), "a");
        assert.equal(man.allocateLabel("S.z"), "a");
    });

    it("find label from id", function () {
        assert.equal(man.allocateLabel("S.z"), "a");
        assert.equal(man.allocateLabel("S.x"), "b");

        // Actual tests.
        assert.equal(man.idToLabel("S.z"), "a");
        assert.equal(man.idToLabel("S.x"), "b");
        // ID without allocated label.
        assert.equal(man.idToLabel("S.ttt"), undefined);
    });

    it("next number", function () {
        assert.equal(man.nextNumber(), 1);
        assert.equal(man.nextNumber(), 2);
    });

    it("deallocate all", function () {
        man.nextNumber();
        man.nextNumber();
        man.nextNumber();
        man.allocateLabel("S.z");
        man.allocateLabel("S.x");

        man.deallocateAll();
        assert.equal(man.nextNumber(), 1);
        assert.equal(man.allocateLabel("S.z"), "b");
    });
});

//  LocalWords:  Dubeau MPL Mangalam allocateLabel nextNumber refman
//  LocalWords:  deallocateAll deallocate chai
