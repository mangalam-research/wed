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
 * <p>Allocate a label for an id. The relation between id and label
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

function AlphabeticLabelManager(name) {
    ReferenceManager.call(this, name);
    this._nextSenseLabelIx = 0;
}

oop.inherit(AlphabeticLabelManager, ReferenceManager);

var AlphabeticLabelManagerP = AlphabeticLabelManager.prototype;

var alphabet = "abcdefghijklmnopqrstuvwxyz";
AlphabeticLabelManagerP.allocateLabel = function allocateLabel(id) {
    var label = this._id_to_label[id];
    if (label === undefined) {
        var ix = this._nextSenseLabelIx++;
        var round = Math.floor(ix / 26) + 1;
        var charIx = ix % 26;
        label = alphabet[charIx].repeat(round);
        this._id_to_label[id] = label;
    }

    return label;
};

AlphabeticLabelManagerP._deallocateAllLabels = function _deallocateAllLabels() {
    this._nextSenseLabelIx = 0;
};

exports.AlphabeticLabelManager = AlphabeticLabelManager;

});

//  LocalWords:  ReferenceManager jshint MPL overriden allocateLabel
//  LocalWords:  oop Mangalam Dubeau refman
