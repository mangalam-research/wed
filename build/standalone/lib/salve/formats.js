/**
 * @module formats
 * @desc This module contains data and utilities to work with the
 * schema format that salve uses natively.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:formats */ function (require, exports, module) {
'use strict';

var util = require("./util");
var inherit = require("./oop").inherit;
var patterns = require("./patterns");
var pro = patterns.__protected;

//
// MODIFICATIONS TO THIS TABLE MUST BE REFLECTED IN rng-to-js.xsl
//
var name_to_constructor = {
    // Array = 0 is hard-coded elsewhere in the conversion code so don't
    // change it.
    0: Array,
    Empty: pro.Empty,
    1: pro.Empty,
    Data: pro.Data,
    2: pro.Data,
    List: pro.List,
    3: pro.List,
    Param: pro.Param,
    4: pro.Param,
    Value: pro.Value,
    5: pro.Value,
    NotAllowed: pro.NotAllowed,
    6: pro.NotAllowed,
    Text: pro.Text,
    7: pro.Text,
    Ref: pro.Ref,
    8: pro.Ref,
    OneOrMore: pro.OneOrMore,
    9: pro.OneOrMore,
    Choice: pro.Choice,
    10: pro.Choice,
    Group: pro.Group,
    11: pro.Group,
    Attribute: pro.Attribute,
    12: pro.Attribute,
    Element: pro.Element,
    13: pro.Element,
    Define: pro.Define,
    14: pro.Define,
    Grammar: pro.Grammar,
    15: pro.Grammar,
    EName: pro.EName,
    16: pro.EName
};


//
// MODIFICATIONS TO THESE VARIABLES MUST BE REFLECTED IN rng-to-js.xsl
//

// This is a bit field
var OPTION_NO_PATHS = 1;
// var OPTION_WHATEVER = 2;
// var OPTION_WHATEVER_PLUS_1 = 4;
// etc...


/**
 * Resolves an array according to format V0. For each element, if the
 * element is an array, it is resolved. If the element is an object,
 * then the object is constructed. Otherwise, the element remains as
 * is.
 *
 * @private
 * @param {Array} arr The array to resolve.
 */
function _resolveArray(arr) {
    for (var el_ix = 0, el; (el = arr[el_ix]) !== undefined; el_ix++) {
        if (el instanceof Array)
            _resolveArray(el);
        else if (typeof el === "object")
            arr[el_ix] = _constructObject(el);
        // else leave as is
    }
}

/**
 * Applies a constructor.
 *
 * @private
 * @param {Function} ctor The constructor to apply.
 * @param {Array} args The arguments to pass to the constructor.
 * @returns {Object} An object created by the constructor.
 */
function _applyConstructor(ctor, args) {
    var new_obj = Object.create(ctor.prototype);
    var ctor_ret = ctor.apply(new_obj, args);

    // Some constructors return a value; make sure to use it!
    return ctor_ret !== undefined ? ctor_ret: new_obj;
}

/**
 * Constructs an object according to format V0. In effect, converts
 * the Object created from the JSON representation to a JavaScript
 * Object of the proper class.
 *
 * @private
 * @param {Object} obj The object read from the JSON string.
 * @returns {Object} An object of the proper class.
 * @throws {Error} If the object is malformed, or has a type unknown
 * to salve.
 */
function _constructObject(obj) {
    var type = obj.type;
    if (type === undefined)
        throw new Error("object without type: " + obj);

    var ctor = name_to_constructor[type];
    if (ctor === undefined)
        throw new Error("undefined type: " + type);

    // It is possible to have objects without argument list.
    var args = obj.args;
    if (args !== undefined)
        _resolveArray(args);

    return _applyConstructor(ctor, args);
}

/**
 * A class for walking the JSON object representing a schema.
 *
 * @private
 * @constructor
 * @param {Object} options The options object from the file that
 * contains the schema.
 */
function V1JSONWalker(options) {
    this.options = options;
}

/**
 * Walks a V1 representation of a JavaScript object.
 *
 * @private
 * @param {Array} array The array representing the object.
 * @throws {Error} If the object is malformed.
 * @returns {Object} The return value of {@link
 * module:formats~V1JSONWalker#_processObject _processObject}.
 */
V1JSONWalker.prototype.walkObject = function(array) {
    if (array.length < 1)
        throw new Error("array too small to contain object");

    var type = array[0];
    if (type === undefined)
        throw new Error("object without type: " + util.inspec(array));

    var ctor = name_to_constructor[type];
    if (ctor === undefined)
        throw new Error("undefined type: " + type);

    if (ctor === Array)
        throw new Error("trying to build array with _constructObjectV1");

    var add_path = (this.options & OPTION_NO_PATHS) && ctor !== pro.EName;

    var args;
    if (array.length > 1) {
        args = array.slice(1);
        if (add_path)
            args.unshift("");
        args.unshift(0);
        args = this._processArrayForCtor(args);
    }
    else if (add_path)
        args = [""];
    else
        args = [];

    return this._processObject(array, ctor, args);
};

/**
 * Processes an object. Derived classes will want to override this
 * method to perform their work.
 *
 * @param {Array} array The object represented as an array.
 * @param {Function} ctor The object's constructor.
 * @param {Array} args The arguments that should be passed to the
 * constructor.
 * @returns {Object|undefined} If the <code>V1JSONWalker</code>
 * instance is meant to convert the JSON data, then this method should
 * return an Object. If the <code>V1JSONWalker</code> instance is
 * meant to check the JSON data, then it should return
 * <code>undefined</code>.
 */
V1JSONWalker.prototype._processObject = function(array, ctor, args) {
    return undefined; // Do nothing
};

/**
 * Process an array so that it can be used by a constructor.
 *
 * @private
 * @param {Array} arr The array to resolve.
 * @throws {Error} If the array is malformed.
 * @returns {Array} The processed array.
 */
V1JSONWalker.prototype._processArrayForCtor = function (arr) {
    // Drop the array type indicator.
    return this._walkArray(arr).slice(1);
};


/**
 * Resolve an array according to format V1. For each element, if the
 * element is an array, it is resolved. If the element is an object,
 * then the object is constructed. Otherwise, the element remains as
 * is.
 *
 * @private
 * @param {Array} arr The array to resolve.
 * @throws {Error} If the array is malformed.
 * @returns {Array} The processed array.
 */
V1JSONWalker.prototype._processArray = function (arr) {
    // Drop the array type indicator.
    return this._walkArray(arr).slice(1);
};

V1JSONWalker.prototype._walkArray = function (arr) {
    if (arr[0] !== 0)
        throw new Error("array type not 0, but " + arr[0] +
                        " for array " + arr);

    var ret = [0];
    for (var el_ix = 1, el; (el = arr[el_ix]) !== undefined; el_ix++) {
        if (el instanceof Array) {
            if (el[0] !== 0)
                ret.push(this.walkObject(el));
            else
                ret.push(this._processArray(el));
        }
        else
            ret.push(el);
    }
    return ret;
};

/**
 * A JSON walker that constructs a pattern tree as it walks the JSON
 * object.
 *
 * @private
 * @extends module:formats~V1JSONWalker
 */
function V1Constructor() {
    V1JSONWalker.apply(this, arguments);
}
inherit(V1Constructor, V1JSONWalker);

V1Constructor.prototype._processObject = function (array, ctor, args) {
    return _applyConstructor(ctor, args);
};

//
// MODIFICATIONS TO THIS FUNCTION MUST BE REFLECTED IN rng-to-js.xsl
//
/**
 * Constructs a tree of patterns from a JSON representation of a RNG
 * schema. This representation must have been created by simplifying
 * the original RNG and then converting it with the
 * <code>rng-to-js.xsl</code> transformation provided with salve.
 *
 * @param {String} code The JSON representation.
 * @throws {Error} When the version of the JSON representation is not
 * supported.
 * @returns {module:validate~Pattern} The tree.
 */
function constructTree(code) {
    var parsed = JSON.parse(code);
    if (typeof(parsed) === 'object' && !parsed.v) {
        return _constructObject(parsed);
    }
    else {
        var version = parsed.v;
        var options = parsed.o;
        if (version === 1)
            return new V1Constructor(options).walkObject(parsed.d, options);
        else
            throw new Error("unknown version: " + version);
    }
}

exports.constructTree = constructTree;

//
// Exports which are meant for other modules internal to salve.
//
// DO NOT USE THIS OUTSIDE SALVE! THIS EXPORT MAY CHANGE AT ANY TIME!
// YOU'VE BEEN WARNED!
//
exports.__protected = {
    V1JSONWalker: V1JSONWalker,
    name_to_constructor: name_to_constructor,
    OPTION_NO_PATHS: OPTION_NO_PATHS
};

});

//  LocalWords:  MPL util oop rng js xsl JSON constructObjectV
//  LocalWords:  JSONWalker RNG
