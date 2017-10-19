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
define(["require", "exports", "module"], function (require, exports, module) {
    /**
     * Basic undo/redo framework.
     * @author Louis-Dominique Dubeau
     * @license MPL 2.0
     * @copyright Mangalam Research Center for Buddhist Languages
     */
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Records operations that may be undone or redone. It maintains a single list
     * of [[Undo]] objects in the order by which they are passed to the
     * [[UndoList.record]] method.
     *
     * This object maintains a single history. So if operations A, B, C, D are
     * recorded, C and D are undone and then E is recorded, the list of recorded
     * operations will then be A, B, E.
     */
    var UndoList = /** @class */ (function () {
        function UndoList() {
            this.stack = [];
            this.list = [];
            this.index = -1;
            this._undoingOrRedoing = false;
        }
        /**
         * This method makes the UndoList object record the object passed to it. Any
         * operations that had previously been undone are forgotten.
         *
         * @param obj An undo object to record.
         */
        UndoList.prototype.record = function (obj) {
            if (this.stack.length > 0) {
                this.stack[0].record(obj);
            }
            else {
                this.list = this.list.splice(0, this.index + 1);
                this.list.push(obj);
                this.index++;
            }
        };
        /**
         * Undoes the latest [[Undo]] that was recorded. If any [[UndoGroup]] objects
         * were in effect when called, they are terminated. It is an error to call
         * this method or [[redo]] from within this method. Does nothing if there is
         * nothing to undo.
         *
         * @throws {Error} If an undo is attempted when an undo or redo is already in
         * progress.
         */
        UndoList.prototype.undo = function () {
            // If undo is invoked in the middle of a group, we must end it first.
            if (this._undoingOrRedoing) {
                throw new Error("calling undo while undoing or redoing");
            }
            this._undoingOrRedoing = true;
            while (this.stack.length > 0) {
                this.endGroup();
            }
            if (this.index >= 0) {
                this.list[this.index--].undo();
            }
            this._undoingOrRedoing = false;
        };
        /**
         * Redoes the latest [[Undo]] object that was undone.  It is an error to call
         * this method or [[undo]] from within this method. Does nothing if there is
         * nothing to redo.
         *
         * @throws {Error} If an undo is attempted when an undo or redo is already in
         * progress.
         */
        UndoList.prototype.redo = function () {
            if (this._undoingOrRedoing) {
                throw new Error("calling redo while undoing or redoing");
            }
            this._undoingOrRedoing = true;
            if (this.index < this.list.length - 1) {
                this.list[++this.index].redo();
            }
            this._undoingOrRedoing = false;
        };
        /**
         * @returns True if the object is in the midst of undoing or redoing, false
         * otherwise.
         */
        UndoList.prototype.undoingOrRedoing = function () {
            return this._undoingOrRedoing;
        };
        /**
         * @returns True if there is something to undo, false otherwise.
         */
        UndoList.prototype.canUndo = function () {
            // If there is a group on the stack, then we have to return true. That's
            // because when the group is ended when undo() is called, it will be added
            // at the end of this.list.
            return this.index > -1 || this.stack.length > 0;
        };
        /**
         * @returns True if there is something to redo, false otherwise.
         */
        UndoList.prototype.canRedo = function () {
            return this.index < this.list.length - 1;
        };
        /**
         * Starts recording a group of undo operations.
         *
         * @param group The undo group to start.
         */
        UndoList.prototype.startGroup = function (group) {
            this.stack.unshift(group);
        };
        /**
         * Ends recording a group of undo operations. The group currently in effect is
         * terminated, and made the last recorded operation (as if it had been passed
         * to [[UndoList.record]]).
         *
         * @throws {Error} If there is no current undo group.
         */
        UndoList.prototype.endGroup = function () {
            var group = this.stack.shift();
            if (group === undefined) {
                throw new Error("ending a non-existent group.");
            }
            group.end();
            this.record(group);
        };
        /**
         * Ends all groups currently in effect. This is the same as calling
         * [[endGroup]] repeatedly until there are no more groups to end.
         */
        UndoList.prototype.endAllGroups = function () {
            while (this.stack.length > 0) {
                this.endGroup();
            }
        };
        /**
         * @returns The group currently being recorded.
         */
        UndoList.prototype.getGroup = function () {
            return this.stack[0];
        };
        /**
         * @returns A string showing all the undo steps and undo groups stored in this
         * undo list.
         */
        UndoList.prototype.toString = function () {
            var ret = [];
            ret.push("Start of list\n");
            for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                var it_1 = _a[_i];
                ret.push(it_1.toString());
            }
            ret.push("End of list\n");
            ret.push("Unfinished groups:\n");
            for (var i = this.stack.length - 1; i >= 0; --i) {
                var it_2 = this.stack[i];
                ret.push(it_2.toString());
            }
            ret.push("End of unfinished groups\n");
            return ret.join("");
        };
        return UndoList;
    }());
    exports.UndoList = UndoList;
    /**
     * An undo operation.
     * @param {string} desc The description of this undo operation.
     */
    var Undo = /** @class */ (function () {
        function Undo(desc) {
            this.desc = desc;
        }
        /**
         * @returns The description of this object.
         */
        Undo.prototype.toString = function () {
            return this.desc + "\n";
        };
        return Undo;
    }());
    exports.Undo = Undo;
    /**
     * A group of undo operations.
     */
    var UndoGroup = /** @class */ (function (_super) {
        __extends(UndoGroup, _super);
        function UndoGroup() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.list = [];
            return _this;
        }
        /**
         * Undoes this group, which means undoing all the operations that this group
         * has recorded.
         */
        UndoGroup.prototype.undo = function () {
            for (var i = this.list.length - 1; i >= 0; --i) {
                this.list[i].undo();
            }
        };
        /**
         * Redoes this group, which means redoing all the operations that this group
         * has recorded.
         */
        UndoGroup.prototype.redo = function () {
            for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                var it_3 = _a[_i];
                it_3.redo();
            }
        };
        /**
         * Records an operation as part of this group.
         *
         * @param obj The operation to record.
         */
        UndoGroup.prototype.record = function (obj) {
            this.list.push(obj);
        };
        /**
         * This method is called by [[UndoList.endGroup]] when it ends a group. The
         * default implementation does nothing.
         */
        UndoGroup.prototype.end = function () {
            // by default we do nothing
        };
        UndoGroup.prototype.toString = function () {
            var ret = [];
            ret.push("Start of " + this.desc + "\n");
            for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                var it_4 = _a[_i];
                ret.push(it_4.toString().replace(/(^|\n)/g, "$1 ").slice(0, -1));
            }
            ret.push("End of " + this.desc + "\n");
            return ret.join("");
        };
        return UndoGroup;
    }(Undo));
    exports.UndoGroup = UndoGroup;
});
//  LocalWords:  boolean Dubeau MPL Mangalam UndoList desc

//# sourceMappingURL=undo.js.map
