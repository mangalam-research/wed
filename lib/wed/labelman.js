/**
 * @module labelman
 * @desc Label manager.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:labelman */function (require, exports, module) {
'use strict';

var oop = require("./oop");

/**
 * @classdesc Maintains a mapping from HTML element id to labels
 * meaningful to humans. Also keeps a counter that can be used for
 * assigning new ids to elements that don't already have one.
 *
 * @constructor
 *
 * @param {string} name The name of this label manager.
 *
 */
function LabelManager (name) {
    /**
     * The name of this label manager. This is a convenience that can
     * be used to produce distinctive error messages, for instance.
     *
     * @access public
     *
     * @readonly
     *
     * @type {string}
     */
    this.name = name;
    /**
     * A mapping of element id to allocated label.
     *
     * @access protected
     *
     * @type {object}
     */
    this._idToLabel = Object.create(null);

    /**
     * A counter that must be incremented with each new label
     * allocation. This allows the allocation algorithm to know what
     * the next label should be.
     *
     * @access protected
     *
     * @type {number}
     */
    this._labelIndex = 0;
}

/**
 * Allocate a label for an id. The relation between id and label
 * remains constant until {@link
 * module:labelman~LabelManager#deallocateAll deallocateAll} is
 * called.
 *
 * This method must be implemented by child classes.
 *
 * @param {string} id The id of the element.
 *
 * @returns {string} The allocated label. If the method is called
 * multiple times iwth the same ``id``, the return value must be the
 * same. It may change only if {@link
 * module:labelman~LabelManager#deallocateAll deallocateAll} has been
 * called between the calls to this method.
 */
LabelManager.prototype.allocateLabel = function (id) {
    throw new Error("allocateLabel must be overriden in children.");
};

/**
 * Gets the label associated with an id.
 *
 * @param {string} id The id.
 *
 * @returns {string|undefined} The label. The value returned by this
 * method obeys the same rules as that of {@link
 * module:labelman~LabelManager#allocateLabel allocateLabel} with the
 * exception that if a call returned ``undefined`` it may return
 * another value on a subsequent call. (That is, an ``id`` that did
 * not have a label allocated to it may acquire such label.)
 */
LabelManager.prototype.idToLabel = function (id) {
    return this._idToLabel[id];
};

/**
 * Deallocate all mappings between ids and labels. This will reset
 * {@link module:labelman~LabelManager#_idToLabel _idToLabel} to an
 * empty map and {@link module:labelman~LabelManager#_labelIndex
 * _labelIndex} to 0.
 */
LabelManager.prototype.deallocateAll = function () {
    this._idToLabel = {};
    this._labelIndex = 0;
    this._deallocateAllLabels();
};

/**
 * Clear out the labels that were allocated. This private method is
 * called by {@link module:labelman~LabelManager#deallocateAll
 * deallocateAll} to perform class-specific cleanup.
 *
 * This method must be implemented by child classes.
 */
LabelManager.prototype._deallocateAllLabels = function () {
    throw new Error("_deallocateAllLabels must be overriden in children.");
};

/**
 * Gets the next number in the number sequence. This increments {@link
 * module:labelman~LabelManager#_labelIndex _labelIndex}.
 *
 * @returns {integer} The number.
 */
LabelManager.prototype.nextNumber = function () {
    return ++this._labelIndex;
};

exports.LabelManager = LabelManager;


/**
 * @classdesc A label manager that associates alphabetical labels to
 * each id given to it. It will associate labels "a", "b", "c", ... up
 * to "z" and then will associate "aa", "bb", "cc", ... up to "zz",
 * and continues repeating characters each time it cycles over the
 * alphabet.
 *
 * @constructor
 *
 * @param {string} name The name of this label manager.
 *
 */
function AlphabeticLabelManager(name) {
    LabelManager.call(this, name);
}

oop.inherit(AlphabeticLabelManager, LabelManager);

var AlphabeticLabelManagerP = AlphabeticLabelManager.prototype;

var alphabet = "abcdefghijklmnopqrstuvwxyz";
AlphabeticLabelManagerP.allocateLabel = function allocateLabel(id) {
    var label = this._idToLabel[id];
    if (label === undefined) {
        // nextNumber() will start with 1, so we have to subtract.
        var ix = this.nextNumber() - 1;
        var round = Math.floor(ix / 26) + 1;
        var charIx = ix % 26;
        label = alphabet[charIx].repeat(round);
        this._idToLabel[id] = label;
    }

    return label;
};

AlphabeticLabelManagerP._deallocateAllLabels = function _deallocateAllLabels() {
    // Nothing needed.
};

exports.AlphabeticLabelManager = AlphabeticLabelManager;

});

//  LocalWords:  LabelManager jshint MPL overriden allocateLabel
//  LocalWords:  oop Mangalam Dubeau labelman
