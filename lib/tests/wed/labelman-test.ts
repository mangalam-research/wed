/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as labelman from "wed/labelman";

const assert = chai.assert;

describe("labelman", () => {
  let man: labelman.AlphabeticLabelManager;

  beforeEach(() => {
    man = new labelman.AlphabeticLabelManager("sense");
  });

  it("allocate label", () => {
    assert.equal(man.allocateLabel("S.z"), "a");
    assert.equal(man.allocateLabel("S.z"), "a");
  });

  it("find label from id", () => {
    assert.equal(man.allocateLabel("S.z"), "a");
    assert.equal(man.allocateLabel("S.x"), "b");

    // Actual tests.
    assert.equal(man.idToLabel("S.z"), "a");
    assert.equal(man.idToLabel("S.x"), "b");
    // ID without allocated label.
    assert.equal(man.idToLabel("S.ttt"), undefined);
  });

  it("next number", () => {
    assert.equal(man.nextNumber(), 1);
    assert.equal(man.nextNumber(), 2);
  });

  it("deallocate all", () => {
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
