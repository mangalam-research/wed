/**
 * @module formats
 * @desc This module contains data and utilities to work with the
 * schema format that salve uses natively.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:formats */ function (require, exports, module) {
'use strict';

var util = require("./util");
var inherit = require("./oop").inherit;
var patterns = require("./patterns");
var pro = patterns.__protected;

//
// MODIFICATIONS TO THIS TABLE MUST BE REFLECTED IN name_to_constructor
//
var code_to_constructor = [
    Array,
    pro.Empty,
    pro.Data,
    pro.List,
    pro.Param,
    pro.Value,
    pro.NotAllowed,
    pro.Text,
    pro.Ref,
    pro.OneOrMore,
    pro.Choice,
    pro.Group,
    pro.Attribute,
    pro.Element,
    pro.Define,
    pro.Grammar,
    pro.EName,
    pro.Interleave
];

//
// MODIFICATIONS TO THIS TABLE MUST BE REFLECTED IN code_to_constructor
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
    16: pro.EName,
    Interleave: pro.Interleave,
    17: pro.Interleave
};

//
// MODIFICATIONS TO THESE VARIABLES MUST BE REFLECTED IN rng-to-js.xsl
//

// This is a bit field
var OPTION_NO_PATHS = 1;
// var OPTION_WHATEVER = 2;
// var OPTION_WHATEVER_PLUS_1 = 4;
// etc...

function OldFormatError() {
    Error.call(this, "your schema file must be recreated with a newer " +
               "version of salve-convert");
}

inherit(OldFormatError, Error);

/**
 * A class for walking the JSON object representing a schema.
 *
 * @private
 * @constructor
 * @param {Object} options The options object from the file that
 * contains the schema.
 */
function V2JSONWalker(options) {
    this.options = options;
}

/**
 * Walks a V2 representation of a JavaScript object.
 *
 * @private
 * @param {Array} array The array representing the object.
 * @throws {Error} If the object is malformed.
 * @returns {Object} The return value of {@link
 * module:formats~V2JSONWalker#_proxcessObject _processObject}.
 */
V2JSONWalker.prototype.walkObject = function(array) {
    var type = array[0];
    var ctor = code_to_constructor[type];
    if (ctor === undefined) {
        if (array.length < 1)
            throw new Error("array too small to contain object");
        throw new Error("undefined type: " + type);
    }

    if (ctor === Array)
        throw new Error("trying to build array with _constructObjectV2");

    var add_path = (this.options & OPTION_NO_PATHS) && ctor !== pro.EName;

    var args;
    if (array.length > 1) {
        args = array.slice(1);
        if (add_path)
            args.unshift(0, "");
        else
            args.unshift(0);
        this._transformArray(args);
    }
    else if (add_path)
        args = [""];
    else
        args = [];

    return this._processObject(ctor, args);
};

/**
 * Processes an object. Derived classes will want to override this
 * method to perform their work.
 *
 * @param {Function} ctor The object's constructor.
 * @param {Array} args The arguments that should be passed to the
 * constructor.
 * @returns {Object|undefined} If the <code>V2JSONWalker</code>
 * instance is meant to convert the JSON data, then this method should
 * return an Object. If the <code>V2JSONWalker</code> instance is
 * meant to check the JSON data, then it should return
 * <code>undefined</code>.
 */
V2JSONWalker.prototype._processObject = function(ctor, args) {
    return undefined; // Do nothing
};

V2JSONWalker.prototype._transformArray = function (arr) {
    if (arr[0] !== 0)
        throw new Error("array type not 0, but " + arr[0] +
                        " for array " + arr);

    arr.splice(0, 1);
    var limit = arr.length;
    for (var el_ix = 0; el_ix < limit; el_ix++) {
        var el = arr[el_ix];

        if (el instanceof Array) {
            if (el[0] !== 0)
                arr[el_ix] = this.walkObject(el);
            else
                this._transformArray(el);
        }
    }
};

/**
 * A JSON walker that constructs a pattern tree as it walks the JSON
 * object.
 *
 * @private
 * @extends module:formats~V2JSONWalker
 */
function V2Constructor() {
    V2JSONWalker.apply(this, arguments);
}
inherit(V2Constructor, V2JSONWalker);

V2Constructor.prototype._processObject = function (ctor, args) {
    if (ctor === pro.Data && args.length >= 4) {
        // Parameters are represented as an array of strings in the
        // file. Transform this array of strings into an array of objects.
        var params = args[3];
        if (params.length % 2 !== 0)
            throw new Error("parameter array length not a multiple of 2");

        var new_params = new Array(params.length / 2);
        for(var i = 0, limit = params.length; i < limit; i += 2)
            new_params[i / 2] = {name: params[i], value: params[i+1]};
        args[3] = new_params;
    }
    var new_obj = Object.create(ctor.prototype);
    var ctor_ret = ctor.apply(new_obj, args);

    // Some constructors return a value; make sure to use it!
    return ctor_ret !== undefined ? ctor_ret: new_obj;

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
 * @param {string} code The JSON representation.
 * @throws {Error} When the version of the JSON representation is not
 * supported.
 * @returns {module:validate~Pattern} The tree.
 */
function constructTree(code) {
    var parsed = JSON.parse(code);
    if (typeof(parsed) === 'object' && !parsed.v)
        throw new OldFormatError(); // version 0

    var version = parsed.v;
    var options = parsed.o;
    if (version === 2)
        return new V2Constructor(options).walkObject(parsed.d, options);
    else
        throw new Error("unknown version: " + version);
}

exports.constructTree = constructTree;

//
// Exports which are meant for other modules internal to salve.
//
// DO NOT USE THIS OUTSIDE SALVE! THIS EXPORT MAY CHANGE AT ANY TIME!
// YOU'VE BEEN WARNED!
//
exports.__protected = {
    V2JSONWalker: V2JSONWalker,
    name_to_constructor: name_to_constructor,
    OPTION_NO_PATHS: OPTION_NO_PATHS
};

});

//  LocalWords:  MPL util oop rng js xsl JSON constructObjectV
//  LocalWords:  JSONWalker RNG
