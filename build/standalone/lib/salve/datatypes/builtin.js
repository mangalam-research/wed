/**
 * @module datatypes/builtin
 * @desc Implementation of the builtin Relax NG datatype library.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:datatypes/builtin */
    function (require, exports, module) {
'use strict';

var _ = require("lodash");
var oop = require("../oop");
var errors = require("./errors");
var ParameterParsingError = errors.ParameterParsingError;
var ParamError = errors.ParamError;
var ValueValidationError = errors.ValueValidationError;

/**
 * Strips leading and trailing space. Normalize all internal spaces to
 * a single space.
 *
 * @private
 *
 * @param {string} value The value whose space we want to normalize.
 * @returns {string} The normalized value.
 */
function normalizeSpace(value) {
    return value.trim().replace(/\s{2,}/g, ' ');
}

var base = {
    parseParams: function (location, params) {
        if (params && params.length > 0) {
            throw new ParameterParsingError(location,
                new ParamError("this type does not accept parameters"));
        }
    },
    parseValue: function (value, context) {
        var errors = this.disallows(value, [], context);
        if (errors.length)
            throw new ValueValidationError(errors);
        return { value: value };
    }
};

var string = _.extend({}, base, {
    equal: function (value, schema_value, context, schema_context) {
        if (schema_value.value === undefined)
            throw Error("it looks like you are trying to use an " +
                        "unparsed value");

        return value === schema_value.value;
    },
    disallows: function (value, params, context) {
        return false;
    },
    regexp: /.*/,
    needs_context: false
});

var token = _.extend({}, base, {
    equal: function (value, schema_value, context) {
        if (schema_value.value === undefined)
            throw Error("it looks like you are trying to use an " +
                        "unparsed value");

        return normalizeSpace(value) === normalizeSpace(schema_value.value);
    },
    disallows: function (value, params, context) {
        // Yep, token allows anything, just like string.
        return false;
    },
    regexp: /.*/,
    needs_context: false
});

/**
 * The builtin library.
 */
var builtin = {
    uri: "",
    types: {
        string: string,
        token: token
    }
};

exports.builtin = builtin;

});
