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
 * Makes a class implement a mixin. This means that the prototype
 * fields of the mixin are copied into the class that implements
 * it. The mixin can either be a class (a function with a
 * <code>prototype</code> field) or an mapping of (key, value) pairs.
 *
 * @param {Function} mixes The class that implements the mixin.
 * @param {Function} mixin The mixin to implement.
 *
 */
function implement(mixes, mixin) {
    var from = (mixin.prototype !== undefined) ? mixin.prototype
            : mixin;
    for(var f in from)
        mixes.prototype[f] = from[f];
}

exports.inherit = inherit;
exports.implement = implement;
});

//  LocalWords:  Mangalam MPL Dubeau oop
