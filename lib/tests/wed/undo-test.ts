/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { elementAt, first } from "rxjs/operators";

import { assert, expect } from "chai";
import { Undo, UndoGroup, UndoList } from "wed/undo";

// tslint:disable:no-any

// tslint:disable-next-line:completed-docs
class MyUndo extends Undo {
  constructor(public readonly name: string, public readonly object: any) {
    super(`sets the field '${name}' from false to true'`);
    this.object = object;
    this.name = name;

    object[name] = true;
  }

  performUndo(): void {
    this.object[this.name] = false;
  }

  performRedo(): void {
    this.object[this.name] = true;
  }
}

// tslint:disable-next-line:completed-docs
class MyGroup extends UndoGroup {}

// tslint:disable-next-line:completed-docs
class Tracker {
  private flags: boolean[] = [];
  private _ordered: boolean = true;

  wrap<T>(real: (arg: T) => void): (arg: T) => void {

    const index = this.flags.length;
    this.flags.push(false);
    return (arg: T) => {
      if (index > 0) {
        this._ordered = this.flags.slice(0, index).every((x) => x);
      }
      this.flags[index] = true;
      real(arg);
    };
  }

  /** True if all wrappers were called. */
  get allCalled(): boolean {
    return this.flags.every((x) => x);
  }

  /** True if the wrappers were called in the same order as created. */
  get ordered(): boolean {
    return this._ordered;
  }
}

describe("Undo", () => {
  let obj: any;
  let undo: Undo;

  beforeEach(() => {
    obj = {};
    undo = new MyUndo("foo", obj);
  });

  describe("undo", () => {
    it("performs the undo", () => {
      undo.undo();
      expect(obj).to.have.property("foo").false;
    });

    it("emits an UndoEvent after the undo is done", () => {
      const tracker = new Tracker();
      undo.events.pipe(first()).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Undo",
          undo,
        });
        expect(obj).to.have.property("foo").false;
      }));
      undo.undo();
      expect(tracker).to.have.property("allCalled").true;
    });
  });

  describe("redo", () => {
    it("performs the redo", () => {
      undo.redo();
      expect(obj).to.have.property("foo").equal(true);
    });

    it("emits an RedoEvent after the redo is done", () => {
      const tracker = new Tracker();
      undo.events.pipe(first()).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Redo",
          undo,
        });
        expect(obj).to.have.property("foo").true;
      }));
      undo.redo();
      expect(tracker).to.have.property("allCalled").true;
    });
  });
});

describe("UndoGroup", () => {
  let obj: any;
  let group: UndoGroup;
  let firstUndo: Undo;
  let secondUndo: Undo;

  beforeEach(() => {
    obj = {
      foo: null,
      bar: null,
    };

    group = new UndoGroup("group");
    firstUndo = new MyUndo("foo", obj);
    group.record(firstUndo);

    secondUndo = new MyUndo("bar", obj);
    group.record(secondUndo);
  });

  describe("undo", () => {
    it("undoes all", () => {
      group.undo();
      expect(obj).to.deep.equal({
        foo: false,
        bar: false,
      });
    });

    it("emits UndoEvents for all undos", () => {
      const tracker = new Tracker();
      group.events.pipe(first()).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Undo",
          undo: secondUndo,
        });
        expect(obj).to.deep.equal({
          foo: true,
          bar: false,
        });
      }));
      group.events.pipe(elementAt(1)).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Undo",
          undo: firstUndo,
        });
        expect(obj).to.deep.equal({
          foo: false,
          bar: false,
        });
      }));
      group.events.pipe(elementAt(2)).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Undo",
          undo: group,
        });
        expect(obj).to.deep.equal({
          foo: false,
          bar: false,
        });
      }));
      group.undo();
      expect(tracker).to.have.property("allCalled").true;
      expect(tracker).to.have.property("ordered").true;
    });
  });

  describe("redo", () => {
    it("redoes all", () => {
      group.redo();
      expect(obj).to.deep.equal({
        foo: true,
        bar: true,
      });
    });

    it("emits RedoEvents for all redos", () => {
      group.undo();
      const tracker = new Tracker();
      group.events.pipe(first()).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Redo",
          undo: firstUndo,
        });
        expect(obj).to.deep.equal({
          foo: true,
          bar: false,
        });
      }));
      group.events.pipe(elementAt(1)).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Redo",
          undo: secondUndo,
        });
        expect(obj).to.deep.equal({
          foo: true,
          bar: true,
        });
      }));
      group.events.pipe(elementAt(2)).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Redo",
          undo: group,
        });
        expect(obj).to.deep.equal({
          foo: true,
          bar: true,
        });
      }));
      group.redo();
      expect(tracker).to.have.property("allCalled").true;
      expect(tracker).to.have.property("ordered").true;
    });
  });
});

describe("UndoList", () => {
  let obj: Record<string, boolean>;
  let ul: UndoList;

  beforeEach(() => {
    obj = { undo1: false, undo2: false };
    ul = new UndoList();
  });

  describe("canUndo", () => {
    it("returns false on new object", () => {
      assert.isFalse(ul.canUndo());
    });

    it("returns true when there is something to undo", () =>  {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      assert.isTrue(ul.canUndo());
    });

    it("returns false when all is undone", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      ul.undo();
      ul.undo();
      assert.isFalse(ul.canUndo());
    });

    it("returns true when there is at least one group in effect", () =>  {
      ul.startGroup(new MyGroup("group 1"));
      assert.isTrue(ul.canUndo());

      ul.endAllGroups();
      // The group has been ended and put in the list of undo objects so this
      // is still true.
      assert.isTrue(ul.canUndo());
    });
  });

  describe("canRedo", () => {
    it("returns false on new object", () => {
      assert.isFalse(ul.canRedo());
    });

    it("returns true when there is something to redo", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      ul.undo();
      assert.isTrue(ul.canRedo());
    });

    it("returns false when all is redone", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      ul.undo();
      ul.undo();
      ul.redo();
      ul.redo();
      assert.isFalse(ul.canRedo());
    });
  });

  describe("endGroup", () => {
    it("throws an error when the object is new", () => {
      assert.throws(ul.endGroup.bind(ul), Error, "ending a non-existent group");
    });

    it("throws an error upon extra calls", () => {
      ul.startGroup(new MyGroup("group1"));
      ul.endGroup();
      assert.throws(ul.endGroup.bind(ul), Error, "ending a non-existent group");
    });

    it("ends groups in the proper order", () => {
      ul.startGroup(new MyGroup("group1"));
      ul.startGroup(new MyGroup("group2"));
      ul.endGroup();
      ul.endGroup();
      assert.equal((ul as any).list[0].undo.desc, "group1");
      assert.equal((ul as any).list.length, 1);
    });

    it("triggers the end() method on a group", () => {
      const group1 = new MyGroup("group1");
      let ended = false;
      group1.end = () => {
        ended = true;
      };
      ul.startGroup(group1);
      ul.endGroup();
      assert.isTrue(ended);
    });
  });

  describe("endAllGroups", () => {
    it("does nothing when the object is new", () => {
      assert.doesNotThrow(ul.endAllGroups.bind(ul));
    });
    it("does nothing upon extra calls", () => {
      ul.startGroup(new MyGroup("group1"));
      ul.endGroup();
      assert.doesNotThrow(ul.endAllGroups.bind(ul));
    });
    it("ends all groups", () => {
      ul.startGroup(new MyGroup("group1"));
      ul.startGroup(new MyGroup("group2"));
      assert.equal(ul.getGroup().desc, "group2");
      ul.endAllGroups();
      assert.isUndefined(ul.getGroup());
    });

    it("triggers the end() method on a group, in the correct order",
       () => {
         let group1Ended = false;
         let group2Ended = false;
         const group1 = new MyGroup("group1");
         group1.end = () => {
           group1Ended = true;
         };
         const group2 = new MyGroup("group2");
         group2.end = () => {
           group2Ended = true;
           assert.isFalse(group1Ended);
         };
         ul.startGroup(group1);
         ul.startGroup(group2);
         assert.isFalse(group1Ended);
         assert.isFalse(group2Ended);
         ul.endAllGroups();
         assert.isTrue(group1Ended);
         assert.isTrue(group2Ended);
       });
  });

  describe("getGroup", () => {
    it("returns undefined when object is new", () => {
      assert.equal(ul.getGroup(), undefined);
    });

    it("returns undefined when all groups have ended", () => {
      ul.startGroup(new MyGroup("group1"));
      ul.endGroup();
      assert.equal(ul.getGroup(), undefined);
    });

    it("returns the group which is current", () => {
      const group1 = new MyGroup("group1");
      const group2 = new MyGroup("group2");
      ul.startGroup(group1);
      ul.startGroup(group2);
      assert.equal(ul.getGroup(), group2);
      ul.endGroup();
      assert.equal(ul.getGroup(), group1);
    });
  });

  describe("undoingOrRedoing", () => {
    it("returns false when object is new", () => {
      assert.isFalse(ul.undoingOrRedoing());
    });

    it("returns true in the middle of an undo but not before or after",
       () => {
         const undo1 = new MyUndo("undo1", obj);
         let wasTrue;
         undo1.undo = () => {
           wasTrue = ul.undoingOrRedoing();
         };
         assert.isFalse(ul.undoingOrRedoing());
         ul.record(undo1);
         assert.isFalse(ul.undoingOrRedoing());
         ul.undo();
         assert.isFalse(ul.undoingOrRedoing());
         assert.isTrue(wasTrue);
       });

    it("returns true in the middle of a redo, but not before or after",
       () => {
         const undo1 = new MyUndo("undo1", obj);
         let wasTrue;
         undo1.redo = () => {
           wasTrue = ul.undoingOrRedoing();
         };
         assert.isFalse(ul.undoingOrRedoing());
         ul.record(undo1);
         assert.isFalse(ul.undoingOrRedoing());
         ul.undo();
         assert.isFalse(ul.undoingOrRedoing());
         ul.redo();
         assert.isFalse(ul.undoingOrRedoing());
         assert.isTrue(wasTrue);
       });
  });

  describe("record", () => {
    it("records undo operations", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      // Peek in to make sure things are recorded.
      assert.equal((ul as any).list.length, 2);
      assert.strictEqual((ul as any).list[0].undo, undo1);
      assert.strictEqual((ul as any).list[1].undo, undo2);
    });

    it("overwrites old history", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      const undo3 = new MyUndo("undo3", obj);
      ul.record(undo3);
      const undo4 = new MyUndo("undo4", obj);
      ul.record(undo4);

      assert.isTrue(obj.undo3);
      assert.isTrue(obj.undo4);
      ul.undo();
      ul.undo();

      const undo5 = new MyUndo("undo5", obj);
      ul.record(undo5);
      const undo6 = new MyUndo("undo6", obj);
      ul.record(undo6);
      assert.equal((ul as any).list.length, 4);
      assert.strictEqual((ul as any).list[0].undo, undo1);
      assert.strictEqual((ul as any).list[1].undo, undo2);
      assert.strictEqual((ul as any).list[2].undo, undo5);
      assert.strictEqual((ul as any).list[3].undo, undo6);
    });

    it("records into the group when a group is in effect", () => {
      const group1 = new MyGroup("group1");
      ul.startGroup(group1);
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);
      ul.endGroup();

      const undo3 = new MyUndo("undo3", obj);
      ul.record(undo3);
      const undo4 = new MyUndo("undo4", obj);
      ul.record(undo4);

      assert.equal((ul as any).list.length, 3);
      assert.strictEqual((ul as any).list[0].undo, group1);
      assert.strictEqual((ul as any).list[1].undo, undo3);
      assert.strictEqual((ul as any).list[2].undo, undo4);
      assert.equal((group1 as any).list.length, 2);
    });
  });

  describe("undo", () => {
    it("actually undoes operations", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      assert.isTrue(obj.undo1);
      assert.isTrue(obj.undo2);
      ul.undo();
      assert.isTrue(obj.undo1);
      assert.isFalse(obj.undo2);
      ul.undo();
      assert.isFalse(obj.undo1);
      assert.isFalse(obj.undo2);
    });

    it("is a noop if there is nothing to undo", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      ul.undo();
      ul.undo();
      assert.equal((ul as any).list.length, 2);
      assert.equal((ul as any).index, -1);
      // Extra undo
      ul.undo();
      assert.equal((ul as any).list.length, 2);
      assert.equal((ul as any).index, -1);
    });

    it("undoes groups as a unit", () => {
      const group1 = new MyGroup("group1");
      ul.startGroup(group1);
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);
      ul.endGroup();

      assert.isTrue(obj.undo1);
      assert.isTrue(obj.undo2);
      ul.undo();
      assert.isFalse(obj.undo1);
      assert.isFalse(obj.undo2);
    });

    it("terminates any group in effect", () => {
      const group1 = new MyGroup("group1");
      const group2 = new MyGroup("group2");

      ul.startGroup(group1);
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);

      ul.startGroup(group2);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      assert.isTrue(obj.undo1);
      assert.isTrue(obj.undo2);
      ul.undo();
      assert.isFalse(obj.undo1);
      assert.isFalse(obj.undo2);
      assert.isUndefined(ul.getGroup());
    });

    it("emits UndoEvents", () => {
      const group1 = new MyGroup("group1");
      ul.startGroup(group1);
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);
      ul.endGroup();

      const tracker = new Tracker();
      ul.events.pipe(first()).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Undo",
          undo: undo2,
        });
        expect(obj).to.deep.equal({
          undo2: false,
          undo1: true,
        });
      }));
      ul.events.pipe(elementAt(1)).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Undo",
          undo: undo1,
        });
        expect(obj).to.deep.equal({
          undo2: false,
          undo1: false,
        });
      }));
      ul.events.pipe(elementAt(2)).subscribe(tracker.wrap((x) => {
        expect(x).to.deep.equal({
          name: "Undo",
          undo: group1,
        });
        expect(obj).to.deep.equal({
          undo2: false,
          undo1: false,
        });
      }));

      expect(obj).to.deep.equal({
        undo1: true,
        undo2: true,
      });
      ul.undo();
      expect(obj).to.deep.equal({
        undo1: false,
        undo2: false,
      });
      expect(tracker).to.have.property("allCalled").true;
      expect(tracker).to.have.property("ordered").true;
    });

});

  describe("redo", () => {
    it("actually redoes operations", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      ul.undo();
      ul.undo();
      assert.isFalse(obj.undo1);
      assert.isFalse(obj.undo2);
      ul.redo();
      assert.isTrue(obj.undo1);
      assert.isFalse(obj.undo2);
      ul.redo();
      assert.isTrue(obj.undo1);
      assert.isTrue(obj.undo2);
    });

    it("is a noop if there is nothing to redo", () => {
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);

      ul.undo();
      ul.undo();
      ul.redo();
      ul.redo();
      assert.equal((ul as any).list.length, 2);
      assert.equal((ul as any).index, 1);
      // Extra redo
      ul.redo();
      // No change
      assert.equal((ul as any).list.length, 2);
      assert.equal((ul as any).index, 1);
    });

    it("redoes groups as a unit", () => {
      const group1 = new MyGroup("group1");
      ul.startGroup(group1);
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);
      ul.endGroup();

      assert.isTrue(obj.undo1);
      assert.isTrue(obj.undo2);
      ul.undo();
      assert.isFalse(obj.undo1);
      assert.isFalse(obj.undo2);
      ul.redo();
      assert.isTrue(obj.undo1);
      assert.isTrue(obj.undo2);
    });

    it("emits RedoEvents", () => {
      const group1 = new MyGroup("group1");
      ul.startGroup(group1);
      const undo1 = new MyUndo("undo1", obj);
      ul.record(undo1);
      const undo2 = new MyUndo("undo2", obj);
      ul.record(undo2);
      ul.endGroup();

      expect(obj).to.deep.equal({
        undo1: true,
        undo2: true,
      });
      ul.undo();
      expect(obj).to.deep.equal({
        undo1: false,
        undo2: false,
      });
      ul.redo();
      expect(obj).to.deep.equal({
        undo1: true,
        undo2: true,
      });
    });
  });
});

//  LocalWords:  UndoList canUndo canRedo endGroup endAllGroups chai getGroup
//  LocalWords:  undoingOrRedoing noop ul Dubeau MPL Mangalam
