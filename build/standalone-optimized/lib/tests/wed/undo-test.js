var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "rxjs/operators/elementAt", "rxjs/operators/first", "chai", "wed/undo"], function (require, exports, elementAt_1, first_1, chai_1, undo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable:no-any
    // tslint:disable-next-line:completed-docs
    var MyUndo = /** @class */ (function (_super) {
        __extends(MyUndo, _super);
        function MyUndo(name, object) {
            var _this = _super.call(this, "sets the field '" + name + "' from false to true'") || this;
            _this.name = name;
            _this.object = object;
            _this.object = object;
            _this.name = name;
            object[name] = true;
            return _this;
        }
        MyUndo.prototype.performUndo = function () {
            this.object[this.name] = false;
        };
        MyUndo.prototype.performRedo = function () {
            this.object[this.name] = true;
        };
        return MyUndo;
    }(undo_1.Undo));
    // tslint:disable-next-line:completed-docs
    var MyGroup = /** @class */ (function (_super) {
        __extends(MyGroup, _super);
        function MyGroup() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return MyGroup;
    }(undo_1.UndoGroup));
    // tslint:disable-next-line:completed-docs
    var Tracker = /** @class */ (function () {
        function Tracker() {
            this.flags = [];
            this._ordered = true;
        }
        Tracker.prototype.wrap = function (real) {
            var _this = this;
            var index = this.flags.length;
            this.flags.push(false);
            return function (arg) {
                if (index > 0) {
                    _this._ordered = _this.flags.slice(0, index).every(function (x) { return x; });
                }
                _this.flags[index] = true;
                real(arg);
            };
        };
        Object.defineProperty(Tracker.prototype, "allCalled", {
            /** True if all wrappers were called. */
            get: function () {
                return this.flags.every(function (x) { return x; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tracker.prototype, "ordered", {
            /** True if the wrappers were called in the same order as created. */
            get: function () {
                return this._ordered;
            },
            enumerable: true,
            configurable: true
        });
        return Tracker;
    }());
    describe("Undo", function () {
        var obj;
        var undo;
        beforeEach(function () {
            obj = {};
            undo = new MyUndo("foo", obj);
        });
        describe("undo", function () {
            it("performs the undo", function () {
                undo.undo();
                chai_1.expect(obj).to.have.property("foo").false;
            });
            it("emits an UndoEvent after the undo is done", function () {
                var tracker = new Tracker();
                undo.events.pipe(first_1.first()).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Undo",
                        undo: undo,
                    });
                    chai_1.expect(obj).to.have.property("foo").false;
                }));
                undo.undo();
                chai_1.expect(tracker).to.have.property("allCalled").true;
            });
        });
        describe("redo", function () {
            it("performs the redo", function () {
                undo.redo();
                chai_1.expect(obj).to.have.property("foo").equal(true);
            });
            it("emits an RedoEvent after the redo is done", function () {
                var tracker = new Tracker();
                undo.events.pipe(first_1.first()).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Redo",
                        undo: undo,
                    });
                    chai_1.expect(obj).to.have.property("foo").true;
                }));
                undo.redo();
                chai_1.expect(tracker).to.have.property("allCalled").true;
            });
        });
    });
    describe("UndoGroup", function () {
        var obj;
        var group;
        var firstUndo;
        var secondUndo;
        beforeEach(function () {
            obj = {
                foo: null,
                bar: null,
            };
            group = new undo_1.UndoGroup("group");
            firstUndo = new MyUndo("foo", obj);
            group.record(firstUndo);
            secondUndo = new MyUndo("bar", obj);
            group.record(secondUndo);
        });
        describe("undo", function () {
            it("undoes all", function () {
                group.undo();
                chai_1.expect(obj).to.deep.equal({
                    foo: false,
                    bar: false,
                });
            });
            it("emits UndoEvents for all undos", function () {
                var tracker = new Tracker();
                group.events.pipe(first_1.first()).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Undo",
                        undo: secondUndo,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        foo: true,
                        bar: false,
                    });
                }));
                group.events.pipe(elementAt_1.elementAt(1)).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Undo",
                        undo: firstUndo,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        foo: false,
                        bar: false,
                    });
                }));
                group.events.pipe(elementAt_1.elementAt(2)).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Undo",
                        undo: group,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        foo: false,
                        bar: false,
                    });
                }));
                group.undo();
                chai_1.expect(tracker).to.have.property("allCalled").true;
                chai_1.expect(tracker).to.have.property("ordered").true;
            });
        });
        describe("redo", function () {
            it("redoes all", function () {
                group.redo();
                chai_1.expect(obj).to.deep.equal({
                    foo: true,
                    bar: true,
                });
            });
            it("emits RedoEvents for all redos", function () {
                group.undo();
                var tracker = new Tracker();
                group.events.pipe(first_1.first()).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Redo",
                        undo: firstUndo,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        foo: true,
                        bar: false,
                    });
                }));
                group.events.pipe(elementAt_1.elementAt(1)).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Redo",
                        undo: secondUndo,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        foo: true,
                        bar: true,
                    });
                }));
                group.events.pipe(elementAt_1.elementAt(2)).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Redo",
                        undo: group,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        foo: true,
                        bar: true,
                    });
                }));
                group.redo();
                chai_1.expect(tracker).to.have.property("allCalled").true;
                chai_1.expect(tracker).to.have.property("ordered").true;
            });
        });
    });
    describe("UndoList", function () {
        var obj;
        var ul;
        beforeEach(function () {
            obj = { undo1: false, undo2: false };
            ul = new undo_1.UndoList();
        });
        describe("canUndo", function () {
            it("returns false on new object", function () {
                chai_1.assert.isFalse(ul.canUndo());
            });
            it("returns true when there is something to undo", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                chai_1.assert.isTrue(ul.canUndo());
            });
            it("returns false when all is undone", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.undo();
                ul.undo();
                chai_1.assert.isFalse(ul.canUndo());
            });
            it("returns true when there is at least one group in effect", function () {
                ul.startGroup(new MyGroup("group 1"));
                chai_1.assert.isTrue(ul.canUndo());
                ul.endAllGroups();
                // The group has been ended and put in the list of undo objects so this
                // is still true.
                chai_1.assert.isTrue(ul.canUndo());
            });
        });
        describe("canRedo", function () {
            it("returns false on new object", function () {
                chai_1.assert.isFalse(ul.canRedo());
            });
            it("returns true when there is something to redo", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                ul.undo();
                chai_1.assert.isTrue(ul.canRedo());
            });
            it("returns false when all is redone", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.undo();
                ul.undo();
                ul.redo();
                ul.redo();
                chai_1.assert.isFalse(ul.canRedo());
            });
        });
        describe("endGroup", function () {
            it("throws an error when the object is new", function () {
                chai_1.assert.throws(ul.endGroup.bind(ul), Error, "ending a non-existent group");
            });
            it("throws an error upon extra calls", function () {
                ul.startGroup(new MyGroup("group1"));
                ul.endGroup();
                chai_1.assert.throws(ul.endGroup.bind(ul), Error, "ending a non-existent group");
            });
            it("ends groups in the proper order", function () {
                ul.startGroup(new MyGroup("group1"));
                ul.startGroup(new MyGroup("group2"));
                ul.endGroup();
                ul.endGroup();
                chai_1.assert.equal(ul.list[0].undo.desc, "group1");
                chai_1.assert.equal(ul.list.length, 1);
            });
            it("triggers the end() method on a group", function () {
                var group1 = new MyGroup("group1");
                var ended = false;
                group1.end = function () {
                    ended = true;
                };
                ul.startGroup(group1);
                ul.endGroup();
                chai_1.assert.isTrue(ended);
            });
        });
        describe("endAllGroups", function () {
            it("does nothing when the object is new", function () {
                chai_1.assert.doesNotThrow(ul.endAllGroups.bind(ul));
            });
            it("does nothing upon extra calls", function () {
                ul.startGroup(new MyGroup("group1"));
                ul.endGroup();
                chai_1.assert.doesNotThrow(ul.endAllGroups.bind(ul));
            });
            it("ends all groups", function () {
                ul.startGroup(new MyGroup("group1"));
                ul.startGroup(new MyGroup("group2"));
                chai_1.assert.equal(ul.getGroup().desc, "group2");
                ul.endAllGroups();
                chai_1.assert.isUndefined(ul.getGroup());
            });
            it("triggers the end() method on a group, in the correct order", function () {
                var group1Ended = false;
                var group2Ended = false;
                var group1 = new MyGroup("group1");
                group1.end = function () {
                    group1Ended = true;
                };
                var group2 = new MyGroup("group2");
                group2.end = function () {
                    group2Ended = true;
                    chai_1.assert.isFalse(group1Ended);
                };
                ul.startGroup(group1);
                ul.startGroup(group2);
                chai_1.assert.isFalse(group1Ended);
                chai_1.assert.isFalse(group2Ended);
                ul.endAllGroups();
                chai_1.assert.isTrue(group1Ended);
                chai_1.assert.isTrue(group2Ended);
            });
        });
        describe("getGroup", function () {
            it("returns undefined when object is new", function () {
                chai_1.assert.equal(ul.getGroup(), undefined);
            });
            it("returns undefined when all groups have ended", function () {
                ul.startGroup(new MyGroup("group1"));
                ul.endGroup();
                chai_1.assert.equal(ul.getGroup(), undefined);
            });
            it("returns the group which is current", function () {
                var group1 = new MyGroup("group1");
                var group2 = new MyGroup("group2");
                ul.startGroup(group1);
                ul.startGroup(group2);
                chai_1.assert.equal(ul.getGroup(), group2);
                ul.endGroup();
                chai_1.assert.equal(ul.getGroup(), group1);
            });
        });
        describe("undoingOrRedoing", function () {
            it("returns false when object is new", function () {
                chai_1.assert.isFalse(ul.undoingOrRedoing());
            });
            it("returns true in the middle of an undo but not before or after", function () {
                var undo1 = new MyUndo("undo1", obj);
                var wasTrue;
                undo1.undo = function () {
                    wasTrue = ul.undoingOrRedoing();
                };
                chai_1.assert.isFalse(ul.undoingOrRedoing());
                ul.record(undo1);
                chai_1.assert.isFalse(ul.undoingOrRedoing());
                ul.undo();
                chai_1.assert.isFalse(ul.undoingOrRedoing());
                chai_1.assert.isTrue(wasTrue);
            });
            it("returns true in the middle of a redo, but not before or after", function () {
                var undo1 = new MyUndo("undo1", obj);
                var wasTrue;
                undo1.redo = function () {
                    wasTrue = ul.undoingOrRedoing();
                };
                chai_1.assert.isFalse(ul.undoingOrRedoing());
                ul.record(undo1);
                chai_1.assert.isFalse(ul.undoingOrRedoing());
                ul.undo();
                chai_1.assert.isFalse(ul.undoingOrRedoing());
                ul.redo();
                chai_1.assert.isFalse(ul.undoingOrRedoing());
                chai_1.assert.isTrue(wasTrue);
            });
        });
        describe("record", function () {
            it("records undo operations", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                // Peek in to make sure things are recorded.
                chai_1.assert.equal(ul.list.length, 2);
                chai_1.assert.strictEqual(ul.list[0].undo, undo1);
                chai_1.assert.strictEqual(ul.list[1].undo, undo2);
            });
            it("overwrites old history", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                var undo3 = new MyUndo("undo3", obj);
                ul.record(undo3);
                var undo4 = new MyUndo("undo4", obj);
                ul.record(undo4);
                chai_1.assert.isTrue(obj.undo3);
                chai_1.assert.isTrue(obj.undo4);
                ul.undo();
                ul.undo();
                var undo5 = new MyUndo("undo5", obj);
                ul.record(undo5);
                var undo6 = new MyUndo("undo6", obj);
                ul.record(undo6);
                chai_1.assert.equal(ul.list.length, 4);
                chai_1.assert.strictEqual(ul.list[0].undo, undo1);
                chai_1.assert.strictEqual(ul.list[1].undo, undo2);
                chai_1.assert.strictEqual(ul.list[2].undo, undo5);
                chai_1.assert.strictEqual(ul.list[3].undo, undo6);
            });
            it("records into the group when a group is in effect", function () {
                var group1 = new MyGroup("group1");
                ul.startGroup(group1);
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.endGroup();
                var undo3 = new MyUndo("undo3", obj);
                ul.record(undo3);
                var undo4 = new MyUndo("undo4", obj);
                ul.record(undo4);
                chai_1.assert.equal(ul.list.length, 3);
                chai_1.assert.strictEqual(ul.list[0].undo, group1);
                chai_1.assert.strictEqual(ul.list[1].undo, undo3);
                chai_1.assert.strictEqual(ul.list[2].undo, undo4);
                chai_1.assert.equal(group1.list.length, 2);
            });
        });
        describe("undo", function () {
            it("actually undoes operations", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                chai_1.assert.isTrue(obj.undo1);
                chai_1.assert.isTrue(obj.undo2);
                ul.undo();
                chai_1.assert.isTrue(obj.undo1);
                chai_1.assert.isFalse(obj.undo2);
                ul.undo();
                chai_1.assert.isFalse(obj.undo1);
                chai_1.assert.isFalse(obj.undo2);
            });
            it("is a noop if there is nothing to undo", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.undo();
                ul.undo();
                chai_1.assert.equal(ul.list.length, 2);
                chai_1.assert.equal(ul.index, -1);
                // Extra undo
                ul.undo();
                chai_1.assert.equal(ul.list.length, 2);
                chai_1.assert.equal(ul.index, -1);
            });
            it("undoes groups as a unit", function () {
                var group1 = new MyGroup("group1");
                ul.startGroup(group1);
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.endGroup();
                chai_1.assert.isTrue(obj.undo1);
                chai_1.assert.isTrue(obj.undo2);
                ul.undo();
                chai_1.assert.isFalse(obj.undo1);
                chai_1.assert.isFalse(obj.undo2);
            });
            it("terminates any group in effect", function () {
                var group1 = new MyGroup("group1");
                var group2 = new MyGroup("group2");
                ul.startGroup(group1);
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                ul.startGroup(group2);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                chai_1.assert.isTrue(obj.undo1);
                chai_1.assert.isTrue(obj.undo2);
                ul.undo();
                chai_1.assert.isFalse(obj.undo1);
                chai_1.assert.isFalse(obj.undo2);
                chai_1.assert.isUndefined(ul.getGroup());
            });
            it("emits UndoEvents", function () {
                var group1 = new MyGroup("group1");
                ul.startGroup(group1);
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.endGroup();
                var tracker = new Tracker();
                ul.events.pipe(first_1.first()).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Undo",
                        undo: undo2,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        undo2: false,
                        undo1: true,
                    });
                }));
                ul.events.pipe(elementAt_1.elementAt(1)).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Undo",
                        undo: undo1,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        undo2: false,
                        undo1: false,
                    });
                }));
                ul.events.pipe(elementAt_1.elementAt(2)).subscribe(tracker.wrap(function (x) {
                    chai_1.expect(x).to.deep.equal({
                        name: "Undo",
                        undo: group1,
                    });
                    chai_1.expect(obj).to.deep.equal({
                        undo2: false,
                        undo1: false,
                    });
                }));
                chai_1.expect(obj).to.deep.equal({
                    undo1: true,
                    undo2: true,
                });
                ul.undo();
                chai_1.expect(obj).to.deep.equal({
                    undo1: false,
                    undo2: false,
                });
                chai_1.expect(tracker).to.have.property("allCalled").true;
                chai_1.expect(tracker).to.have.property("ordered").true;
            });
        });
        describe("redo", function () {
            it("actually redoes operations", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.undo();
                ul.undo();
                chai_1.assert.isFalse(obj.undo1);
                chai_1.assert.isFalse(obj.undo2);
                ul.redo();
                chai_1.assert.isTrue(obj.undo1);
                chai_1.assert.isFalse(obj.undo2);
                ul.redo();
                chai_1.assert.isTrue(obj.undo1);
                chai_1.assert.isTrue(obj.undo2);
            });
            it("is a noop if there is nothing to redo", function () {
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.undo();
                ul.undo();
                ul.redo();
                ul.redo();
                chai_1.assert.equal(ul.list.length, 2);
                chai_1.assert.equal(ul.index, 1);
                // Extra redo
                ul.redo();
                // No change
                chai_1.assert.equal(ul.list.length, 2);
                chai_1.assert.equal(ul.index, 1);
            });
            it("redoes groups as a unit", function () {
                var group1 = new MyGroup("group1");
                ul.startGroup(group1);
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.endGroup();
                chai_1.assert.isTrue(obj.undo1);
                chai_1.assert.isTrue(obj.undo2);
                ul.undo();
                chai_1.assert.isFalse(obj.undo1);
                chai_1.assert.isFalse(obj.undo2);
                ul.redo();
                chai_1.assert.isTrue(obj.undo1);
                chai_1.assert.isTrue(obj.undo2);
            });
            it("emits RedoEvents", function () {
                var group1 = new MyGroup("group1");
                ul.startGroup(group1);
                var undo1 = new MyUndo("undo1", obj);
                ul.record(undo1);
                var undo2 = new MyUndo("undo2", obj);
                ul.record(undo2);
                ul.endGroup();
                chai_1.expect(obj).to.deep.equal({
                    undo1: true,
                    undo2: true,
                });
                ul.undo();
                chai_1.expect(obj).to.deep.equal({
                    undo1: false,
                    undo2: false,
                });
                ul.redo();
                chai_1.expect(obj).to.deep.equal({
                    undo1: true,
                    undo2: true,
                });
            });
        });
    });
});
//  LocalWords:  UndoList canUndo canRedo endGroup endAllGroups chai getGroup
//  LocalWords:  undoingOrRedoing noop ul Dubeau MPL Mangalam
//# sourceMappingURL=undo-test.js.map