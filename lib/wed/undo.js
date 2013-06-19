define(function (require, exports, module) {
'use strict';

var oop = require("./oop");

function UndoList() {
    this._stack = [];
    this._list = [];
    this._index = -1;
    this._undoing_or_redoing = false;
}

(function () {
    this.record = function(obj) {
        if (this._stack.length > 0)
            this._stack[0].record(obj);
        else {
            this._list = this._list.splice(0, this._index + 1);
            this._list.push(obj);
            this._index++;
        }
    };

    this.undo = function() {
        // If undo is invoked in the middle of a group,
        // we must end it first.
        if (this._undoing_or_redoing)
            throw new Error("calling undo while undoing or redoing");
        this._undoing_or_redoing = true;
        while (this._stack.length > 0)
            this.endGroup();
        if (this._index >= 0)
            this._list[this._index--].undo();
        this._undoing_or_redoing = false;
    };

    this.redo = function() {
        if (this._undoing_or_redoing)
            throw new Error("calling redo while undoing or redoing");
        this._undoing_or_redoing = true;
        if (this._index < this._list.length - 1)
            this._list[++this._index].redo();
        this._undoing_or_redoing = false;
    };

    this.undoingOrRedoing = function () {
        return this._undoing_or_redoing;
    };

    this.canUndo = function () {
        return this._index > -1;
    };

    this.canRedo = function () {
        return this._index < this._list.length - 1;
    };

    this.startGroup = function (group) {
        this._stack.unshift(group);
    };

    this.endGroup = function () {
        if (this._stack.length === 0)
            throw new Error("ending a non-existent group.");
        var group = this._stack.shift();
        group.end();
        this.record(group);
    };

    this.getGroup = function () {
        return this._stack[0];
    };
}).call(UndoList.prototype);

exports.UndoList = UndoList;

function Undo(desc) {
    this._desc = desc;
}

(function () {
    this.undo = function () {
        throw new Error("must override the undo method.");
    };

    this.redo = function () {
        throw new Error("must override the redo method.");
    };

    this.toString = function () {
        return this._desc;
    };
}).call(Undo.prototype);

exports.Undo = Undo;

function UndoGroup() {
    Undo.apply(this, arguments);
    this._list = [];
}

oop.inherit(UndoGroup, Undo);

(function () {
    this.undo = function () {
        for(var i = this._list.length - 1; i >= 0; --i)
            this._list[i].undo();
    };

    this.redo = function () {
        for(var i = 0; i < this._list.length; ++i)
            this._list[i].redo();
    };

    this.record = function (obj) {
        this._list.push(obj);
    };

    this.end = function () {
        // by default we do nothing
    };
}).call(UndoGroup.prototype);


exports.UndoGroup = UndoGroup;

});
