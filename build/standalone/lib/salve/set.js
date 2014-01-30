/**
 * @module set
 * @desc Naive set implementation.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:set */function (require, exports, module) {
'use strict';

/**
 * @classdesc <p>This is a naive implementation of sets. It stores all
 * elements in an array. All array manipulations are done by searching
 * through the array from start to hit. So when adding a new element
 * to the Set for instance, the add method will scan the whole array,
 * find the element is not there and then add the element at the end
 * of the array. As naive as this implementation is, it has been shown
 * to be faster than {@link module:hashstructs~HashSet HashSet} and
 * when used in the context of this library.</p>
 *
 * <p>Note that Set cannot hold undefined values.</p>
 *
 * @constructor
 *
 * @param {module:set~Set|Array} initial The value to initialize the set
 * with. If a Set, then the new Set will be a clone of the
 * parameter. If an Array, then the new Set will be initialized with
 * the Array. If something else, then the new Set will contain
 * whatever value was passed.
 */
function Set(initial) {
    if (initial !== undefined) {
        if (initial instanceof Set)
            this.b = initial.b.concat([]);
        else if (initial instanceof Array) {
            this.b = [];
            for (var i = 0; i < initial.length; ++i)
                this.add(initial[i]);
        }
        else
            this.b = [initial];
    }
    else
        this.b = [];
}

Set.prototype.b = undefined;

/**
 * Adds a value to the set.
 *
 * @param value The value to add.
 */
Set.prototype.add = function (value) {
    var t = this.b.indexOf(value);
    if (t < 0)
        this.b.push(value);
};

/**
 * Destructively adds the elements of another set to this set.
 *
 * @param {module:set~Set} s The set to add.
 * @throws {Error} If <code>s</code> is not a Set object
 */
Set.prototype.union = function (s) {
    if (s === null || s === undefined)
        return;
    if (!(s instanceof Set))
        throw new Error("union with non-Set");
    var len = s.b.length;
    for (var i = 0; i < len; ++i)
        this.add(s.b[i]);
};

/**
 * Selects a subset of values.
 *
 * @param {Function} f A function that selects values. It is called
 * with each value. If the value happens to be an <code>Array</code>
 * then the function is <emph>applied</emph> to this array. A return
 * value which is truthy includes the value, otherwise the value is
 * excluded.
 * @returns An object of the same class as the object on which the
 * method is called. This object contains only the value selected by
 * the function.
 */
Set.prototype.filter = function (f) {
    var ret = new this.constructor();
    // Yep, we cheat
    ret.b = this.b.filter(f);
    return ret;
};

/**
 * This method works like Array.map but with a provision for
 * eliminating elements from the resulting Set.
 *
 * @param {Function} f This parameter plays the same role as for
 * Array.map. However, when it returns an undefined value, this
 * return value is not added to the Set that will be returned.
 *
 * @returns The new set. This set is of the same class as the original
 * set.
 */
Set.prototype.map = function (f) {
    var ret = new this.constructor();
    for (var i = 0; i < this.b.length; ++i) {
        var result = f(this.b[i]);

        // Undefined is not added.
        if (result !== undefined)
            ret.add(result);
    }
    return ret;
};

/**
 * Applies a function on each value stored in the set.
 *
 * @param {Function} f A function which accepts one parameter. The
 * function will be called on each value.
 */
Set.prototype.forEach = function (f) {
    this.b.forEach(f);
};

/**
 * Converts the set to a string.
 *
 * @returns {string} All the values, joined with ", ".
 */
Set.prototype.toString = function () {
    return this.b.join(", ");
};

/**
 * @returns {integer} The number of values stored.
 */
Set.prototype.size = function () {
    return this.b.length;
};

/**
 * Determines whether or not this set has the parameter passed.
 *
 *
 * @param obj The object which we want to look for.
 *
 * @returns {boolean} True if the object is present, false if not.
 */
Set.prototype.has = function(obj) {
    return this.b.indexOf(obj) >= 0;
};

/**
 * Converts the object on which this method is called to an array.
 *
 * @returns {Array} An array that corresponds to the object.
 *
 */
Set.prototype.toArray = function () {
    return this.b.slice();
};

// End of Set

exports.Set = Set;
});

// LocalWords:  hashstructs HashSet Dubeau MPL Mangalam LocalWords
// LocalWords:  param truthy
