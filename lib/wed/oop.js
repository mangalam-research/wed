/**
 * @module oop
 * @desc TBA
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:oop*/function (require, exports, module) {
'use strict';
//
// OOP utilities
//

/**
 * Makes a class inherit from another. After the call the inheritor
 * has a prototype which is a copy of the prototype of the inherited
 * class.
 *
 * @param {Function} inheritor The class that inherits.
 * @param {Function} inherited The class that is inherited.
 *
 */
function inherit(inheritor, inherited) {
    inheritor.prototype = Object.create(inherited.prototype);
    inheritor.prototype.constructor = inheritor;
}

/**
 * TBA
 *
 * @param inheritor TBA
 * @param inherited TBA
 */
function implement(inheritor, inherited) {
    var from = (inherited.prototype !== undefined) ? inherited.prototype
            : inherited;
    for(var f in from)
        inheritor.prototype[f] = from[f];
}

exports.inherit = inherit;
exports.implement = implement;
});

// LocalWords:  oop Dubeau MPL Mangalam
