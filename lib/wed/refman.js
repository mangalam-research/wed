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

/**
 * TBA
 * @classdesc TBA
 *
 * @constructor
 * @param name
*/
function ReferenceManager (name) {
    this.name = name;
    this._id_to_label = {};
    // The server assigns ids in the form #S.[a-z]
    // The editor assigns ids in the form #S.nnn
    // Highest nnn among #PREFIX.nnn seen.
    this._highest_number = 0;
}

/**
 *
 * TBA
 *
 * @param {TBA} id TBA
*/
ReferenceManager.prototype.allocateLabel = function (id) {
    throw new Error("allocateLabel must be overriden in children.");
};

/**
 *
 * TBA
 *
 * @param {TBA} id TBA
 *
 * @returns {TBA} TBA
*/
ReferenceManager.prototype.idToLabel = function (id) {
    return this._id_to_label[id];
};

/**
 *
 * TBA
*/
ReferenceManager.prototype.deallocateAll = function () {
    this._id_to_label = {};
    this._deallocateAllLabels();
};

/**
 *
 * TBA
 * @private
 *
*/
ReferenceManager.prototype._deallocateAllLabels = function () {
    throw new Error("_deallocateAllLabels must be overriden in children.");
};

/**
 *
 * TBA
 *
 * @return {TBA} TBA
*/
ReferenceManager.prototype.nextNumber = function () {
    return ++this._highest_number;
};


exports.ReferenceManager = ReferenceManager;

var sense_labels = 'abcdefghijklmnopqrstuvwxyz';

/**
 * @classdesc Implementation to test the base ReferenceManager object.
 * @extends module:refman~ReferenceManager
 *
 * @constructor
*/
function SenseReferenceManager() {
    ReferenceManager.call(this, "sense");
    this._next_sense_label_ix = 0;
}

oop.inherit(SenseReferenceManager, ReferenceManager);

SenseReferenceManager.prototype.allocateLabel = function (id) {
    // More than 26 senses in a single article seems much.
    if (this._next_sense_label_ix >= sense_labels.length)
        throw new Error("hit the hard limit of 26 sense " +
                        "labels in a single article");

    /* jshint boss:true */
    return this._id_to_label[id] = sense_labels[
        this._next_sense_label_ix++];
};

SenseReferenceManager.prototype._deallocateAllLabels = function () {
    this._next_sense_label_ix = 0;
};


exports.___test_rm = new SenseReferenceManager();

});

// LocalWords:  refman Dubeau Mangalam oop allocateLabel overriden
// LocalWords:  MPL jshint ReferenceManager LocalWords
