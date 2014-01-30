/**
 * @module refman
 * @desc Basic reference manager functions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:refman*/function (require, exports, module) {
'use strict';

var oop = require("./oop");

/**
 * @classdesc Maintains a mapping from HTML element id to labels
 * meaningful to humans. Also keeps a counter that can be used for
 * assigning new ids to elements that don't already have one.
 *
 * @constructor
 * @param {string} name The name of the reference manager.
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
 * <p>Allocate a label for an id. The relation between id an label
 * remains constant until {@link
 * module:refman~ReferenceManager#deallocateAll deallocateAll} is
 * called.</p>
 *
 * <p>This method must be implemented by child classes.</p>
 *
 * @param {string} id The id of the element.
 */
ReferenceManager.prototype.allocateLabel = function (id) {
    throw new Error("allocateLabel must be overriden in children.");
};

/**
 * Gets the label associated with an id.
 *
 * @param {string} id The id.
 * @returns {string|undefined} The label.
 */
ReferenceManager.prototype.idToLabel = function (id) {
    return this._id_to_label[id];
};

/**
 * Deallocate all mappings between ids and labels.
 */
ReferenceManager.prototype.deallocateAll = function () {
    this._id_to_label = {};
    this._deallocateAllLabels();
};

/**
 * <p>Clear out the labels that were allocated. This private method is
 * called by {@link module:refman~ReferenceManager#deallocateAll
 * deallocateAll}.</p>
 *
 * <p>This method must be implemented by child classes.</p>
 */
ReferenceManager.prototype._deallocateAllLabels = function () {
    throw new Error("_deallocateAllLabels must be overriden in children.");
};

/**
 * Gets the next number in the number sequence.
 *
 * @returns {integer} The number.
 */
ReferenceManager.prototype.nextNumber = function () {
    return ++this._highest_number;
};


exports.ReferenceManager = ReferenceManager;

var sense_labels = 'abcdefghijklmnopqrstuvwxyz';

/**
 * @classdesc Implementation required for testing the base
 * ReferenceManager object. It is used by the test suite.
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

//  LocalWords:  ReferenceManager jshint MPL overriden allocateLabel
//  LocalWords:  oop Mangalam Dubeau refman
