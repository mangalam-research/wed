/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";
var chai = require("chai");
var path = require("path");
var requirejs = require("requirejs");

requirejs.config({
  baseUrl: path.join(__dirname, "../../../build/standalone/lib"),
  nodeRequire: require,
});
var labelman = requirejs("wed/labelman");

var assert = chai.assert;

describe("labelman", function labelmanBlock() {
  var man = new labelman.AlphabeticLabelManager("sense");

  beforeEach(function beforeEach() {
    man.deallocateAll();
  });

  it("allocate label", function test() {
    assert.equal(man.allocateLabel("S.z"), "a");
    assert.equal(man.allocateLabel("S.z"), "a");
  });

  it("find label from id", function test() {
    assert.equal(man.allocateLabel("S.z"), "a");
    assert.equal(man.allocateLabel("S.x"), "b");

    // Actual tests.
    assert.equal(man.idToLabel("S.z"), "a");
    assert.equal(man.idToLabel("S.x"), "b");
    // ID without allocated label.
    assert.equal(man.idToLabel("S.ttt"), undefined);
  });

  it("next number", function test() {
    assert.equal(man.nextNumber(), 1);
    assert.equal(man.nextNumber(), 2);
  });

  it("deallocate all", function test() {
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

//  LocalWords:  Dubeau MPL Mangalam allocateLabel nextNumber labelman
//  LocalWords:  deallocateAll deallocate chai
