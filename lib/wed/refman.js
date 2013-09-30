/**
 * @module refman
 * @desc TBA
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:refman*/function (require, exports, module) {
'use strict';

var oop = require("./oop");

function ReferenceManager (name) {
    this.name = name;
    this._id_to_label = {};
    // The server assigns ids in the form #S.[a-z]
    // The editor assigns ids in the form #S.nnn
    // Highest nnn among #PREFIX.nnn seen.
    this._highest_number = 0;
}

(function () {
    this.allocateLabel = function (id) {
        throw new Error("allocateLabel must be overriden in children.");
    };

    this.idToLabel = function (id) {
        return this._id_to_label[id];
    };

    this.deallocateAll = function () {
        this._id_to_label = {};
        this._deallocateAllLabels();
    };

    this._deallocateAllLabels = function () {
        throw new Error("_deallocateAllLabels must be overriden in children.");
    };

    this.nextNumber = function () {
        return ++this._highest_number;
    };
}).call(ReferenceManager.prototype);

exports.ReferenceManager = ReferenceManager;

// We need to have some sort of implementation to test the base
// ReferenceManager object. This is it.

var sense_labels = 'abcdefghijklmnopqrstuvwxyz';
function SenseReferenceManager() {
    ReferenceManager.call(this, "sense");
    this._next_sense_label_ix = 0;
}

oop.inherit(SenseReferenceManager, ReferenceManager);

(function () {
    this.allocateLabel = function (id) {
        // More than 26 senses in a single article seems much.
        if (this._next_sense_label_ix >= sense_labels.length)
            throw new Error("hit the hard limit of 26 sense labels in a single article");

        /* jshint boss:true */
        return this._id_to_label[id] = sense_labels[this._next_sense_label_ix++];
    };

    this._deallocateAllLabels = function () {
        this._next_sense_label_ix = 0;
    };
}).call(SenseReferenceManager.prototype);

exports.___test_rm = new SenseReferenceManager();

});
