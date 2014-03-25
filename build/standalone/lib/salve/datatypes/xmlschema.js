/**
 * @module datatypes/xmlschema
 * @desc Implementation of the XMLSchema datatypes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:datatypes/builtin */
    function (require, exports, module) {
'use strict';

var _ = require("lodash");
var errors = require("./errors");
var regexp = require("./regexp");
var xmlcharacters = require("./xmlcharacters");

// Whitespace processing.
var PRESERVE = 1;
var REPLACE = 2;
var COLLAPSE = 3;
var xml_Name_re = xmlcharacters.xml_Name_re;
var xml_NCName = xmlcharacters.xml_NCName;
var xml_NCName_re = xmlcharacters.xml_NCName_re;
var xml_Name_Char = xmlcharacters.xml_Name_Char;
var xml_Letter = xmlcharacters.xml_Letter;
var ParamError = errors.ParamError;
var ValueError = errors.ValueError;
var ParameterParsingError = errors.ParameterParsingError;
var ValueValidationError = errors.ValueValidationError;

function failIfNotInteger(value, name) {
    if (value.search(/^\d+$/) !== -1)
        return false;

    return new ParamError(name + " must have an integer value");
}

function failIfNotNonNegativeInteger(value, name) {
    if (!failIfNotInteger(value, name) && Number(value) >= 0)
            return false;

    return new ParamError(name + " must have a non-negative integer value");
}

function failIfNotPositiveInteger(value, name) {
    if (!failIfNotInteger(value, name) && Number(value) > 0)
        return false;

    return new ParamError(name + " must have a positive value");
}

//
// The parameters
//

/**
 * @classdesc This class does not exist as a JavaScript entity. This
 * is a pseudo-class describing the structure that all parameter types
 * used for XML Schema type processing share.
 *
 * @name module:datatypes/xmlschema~Parameter
 * @class
 * @private
 *
 * @property {string} name Name of the parameter.
 * @property {boolean} repeatable Whether it can appear more than once
 * on the same type.
 */

/**
 * Convert the parameter value from a string to a value to be used
 * internally by this code.
 *
 * @method
 * @name module:datatypes/xmlschema~Parameter#convert
 * @param {string} value Value to convert.
 * @returns The converted value.
 */


/**
 * Checks whether a parameter is invalid.
 *
 * @method
 * @name module:datatypes/xmlschema~Parameter#isInvalidParam
 * @param {string} value The parameter value to check. This is the raw
 * string from the schema, not a value converted by {@link
 * module:datatypes/xmlschema~Parameter#convert convert}.
 * @param {string} name The name of the parameter. This allows using
 * generic functions to check on values.
 * @param {string} type The {@link module:datatypes~Datatype
 * Datatype} object for which this parameter is checked.
 * @returns {false|Array.<module:datatypes/errors~ParamError>}
 * ``false`` if there is no problem. Otherwise, an array of errors.
 */

/**
 * Checks whether a value that appears in the XML document being
 * validated is invalid according to this parameter.
 *
 * @method
 * @name module:datatypes/xmlschema~Parameter#isInvalidValue
 * @param {Object} value The value from the XML document. This is the
 * parsed value, converted by {@link
 * module:datatypes~Datatype#parseValue parseValue}.
 * @param param The parameter value. This must be the value obtained
 * from {@link module:datatypes/xmlschema~Parameter#convert convert}.
 * @param {string} type The {@link module:datatypes~Datatype
 * Datatype} object for which this parameter is checked.
 * @returns {false|module:datatypes/errors~ValueError} ``false`` if there is no
 * problem. Otherwise, an error.
 */

var length_p = {
    name: "length",
    repeatable: false,
    convert: Number,
    isInvalidParam: failIfNotNonNegativeInteger,
    isInvalidValue: function (value, param, type) {
        if (type.valueLength(value) === param)
            return false;

        return new ValueError("length of value should be " + param);
    }
};

var minLength_p = {
    name: "minLength",
    repeatable: false,
    convert: Number,
    isInvalidParam: failIfNotNonNegativeInteger,
    isInvalidValue: function (value, param, type) {
        if (type.valueLength(value) >= param)
            return false;

        return new ValueError("length of value should be greater than "+
                              "or equal to " + param);
    }
};

var maxLength_p = {
    name: "maxLength",
    repeatable: false,
    convert: Number,
    isInvalidParam: failIfNotNonNegativeInteger,
    isInvalidValue: function (value, param, type) {
        if (type.valueLength(value) <= param)
            return false;

        return new ValueError("length of value should be less than "+
                              "or equal to " + param);
    }
};

//
// pattern is special. It converts the param value found in the RNG
// file into an object with two fields: ``rng`` and ``internal``. RNG
// is the string value from the RNG file, and ``internal`` is a
// representation internal to salve. We use ``internal`` for
// performing the validation but present ``rng`` to the user. Note
// that if pattern appears multiple times as a parameter, the two
// values are the result of the concatenation of all the instance of
// the pattern parameter. (Why this? Because it would be confusing to
// show the internal value in error messages to the user.)
//

var multi_char_escapes = [
    /\\s/g, "[ \\t\\n\\r]",
    /\\S/g, "[^ \\t\\n\\r]",
    /\\i/g, "[" + xml_Letter + "_:]",
    /\\I/g, "[^" + xml_Letter + "_:]",
    /\\c/g, "[" + xml_Name_Char + "]",
    /\\C/g, "[^" + xml_Name_Char + "]",
    /\\d/g, "\\p{Nd}",
    /\\D/g, "[^\\d]",
    /\\w/g, "[^\\p{P}\\p{Z}\\p{C}]",
    /\\W/g, "[\\p{P}\\p{Z}\\p{C}]"
];

var re_cache = Object.create(null);

var pattern_p = {
    name: "pattern",
    repeatable: "combine",
    convert: function (value) {
        var internal = re_cache[value];
        if (internal === undefined)
            internal = re_cache[value] = regexp.parse(value);
        return {
            rng: value,
            internal: internal
        };
    },
    combine: function (values) {
        return _.map(values, this.convert);
    },
    isInvalidParam: function (value) {
        try {
            this.convert(value);
        }
        catch (ex) {
            // Convert the error into something that makes sense for salve.
            if (ex instanceof regexp.SalveParsingError)
                return new ParamError(ex.message);

            // Rethrow
            throw ex;
        }
        return false;
    },
    isInvalidValue: function (value, param, type) {
        if (param instanceof Array) {
            var failed_on;
            for(var i = 0; !failed_on && i < param.length; ++i)
                if (!param[i].internal.test(value))
                    failed_on = param[i];

            if (!failed_on)
                return false;

            return new ValueError("value does not match the pattern " +
                                  failed_on.rng);
        }

        if (param.internal.test(value))
            return false;

        return new ValueError("value does not match the pattern " + param.rng);
    }
};

var totalDigits_p = {
    name: "totalDigits",
    repeatable: false,
    convert: Number,
    isInvalidParam: failIfNotPositiveInteger,
    isInvalidValue: function (value, param, type) {
        var str = String(Number(value)).replace(/[-+.]/g, '');
        if (str.length > param)
            return new ValueError("value must have at most " + param +
                                  " digits");

        return false;
    }
};

var fractionDigits_p = {
    name: "fractionDigits",
    repeatable: false,
    convert: Number,
    isInvalidParam: failIfNotNonNegativeInteger,
    isInvalidValue: function (value, param, type) {
        var str = String(Number(value)).replace(/^.*\./, '');
        if (str.length > param)
            return new ValueError("value must have at most " + param +
                                  " fraction digits");

        return false;
    }
};

var maxInclusive_p = {
    name: "maxInclusive",
    repeatable: false,
    convert: Number,
    isInvalidParam: function (value, name, type) {
        return type.disallows(value);
    },
    isInvalidValue: function (value, param, type) {
        if (value > param)
            return new ValueError("value must be less than or equal to " +
                                  param);
        return false;
    }
};

var maxExclusive_p = {
    name: "maxExclusive",
    repeatable: false,
    convert: Number,
    isInvalidParam: function (value, name, type) {
        return type.disallows(value);
    },
    isInvalidValue: function (value, param, type) {
        if (value >= param)
            return new ValueError("value must be less than " + param);
        return false;
    }
};

var minInclusive_p = {
    name: "minInclusive",
    repeatable: false,
    convert: Number,
    isInvalidParam: function (value, name, type) {
        return type.disallows(value);
    },
    isInvalidValue: function (value, param, type) {
        if (value < param)
            return new ValueError("value must be greater than or equal to " +
                                  param);
        return false;
    }
};


var minExclusive_p = {
    name: "minExclusive",
    repeatable: false,
    convert: Number,
    isInvalidParam: function (value, name, type) {
        return type.disallows(value);
    },
    isInvalidValue: function (value, param, type) {
        if (value <= param)
            return new ValueError("value must be greater than " + param);
        return false;
    }
};

/**
 * @private
 * @param {string} value The value to process.
 * @param param One of {@link module:datatypes/xmlschema~PRESERVE
 * PRESERVE}, {@link module:datatypes/xmlschema~REPLACE REPLACE} or
 * {@link module:datatypes/xmlschema~COLLAPSE COLLAPSE}.
 * @returns {string} The white-space-processed value. That is, the
 * ``value`` parameter once its white-spaces have been processed
 * according to the parameter passed. See the XML Schema Datatype
 * standard for the meaning.
 */
function whiteSpaceProcessed(value, param) {
    switch(param) {
    case PRESERVE:
        break;
    case REPLACE:
        value = value.replace(/\r\n\t/g, ' ');
        break;
    case COLLAPSE:
        value = value.replace(/\r\n\t/g, ' ').trim().replace(/\s{2,}/g, ' ');
        break;
    default:
        throw new Error("unexpected value: " + param);
    }
    return value;
}

/**
 * @classdesc This class does not exist as a JavaScript entity. This
 * is a pseudo-class describing the structure that all datatype
 * implementations in this module share.
 *
 * @name module:datatypes/xmlschema~Base
 * @extends module:datatypes~Datatype
 * @class
 * @private
 *
 * @property whiteSpaceDefault The default whitespace processing for
 * this type.
 * @property {string} type_error_msg The error message to give if a
 * value is disallowed.
 * @property {Array.<module:datatypes/xmlschema~Parameter>}
 * valid_params Parameters that are valid for this type.
 * @property {Object} param_name_to_obj An object that contains a
 * mapping of parameter names to parameter objects. It is constructed
 * during initialization of the type.
 */

/**
 * Initializes the type. Must be called once before the type is used.
 *
 * @name module:datatypes/xmlschema~Base#init
 * @method
 */

/**
 * Converts a value. It does the strict minimum to convert the value
 * from a string to an internal representation. It is never
 * interchangeable with {@link module:datatypes~Datatype#parseValue
 * parseValue}.
 *
 * @name module:datatypes/xmlschema~Base#convertValue
 * @method
 * @param {string} value The value from the XML document.
 * @param {module:datatypes~Context} context The context of the value
 * in the XML document.
 * @returns An internal representation.
 */

/**
 * Computes the value's length. This may differ from the value's
 * length, as it appears in the XML document it comes from.
 *
 * @name module:datatypes/xmlschema~Base#valueLength
 * @method
 * @param {string} value The value from the XML document.
 * @returns {integer} The length.
 */

/**
 * Determines whether the parameters disallow a value.
 *
 * @name module:datatypes/xmlschema~Base#disallowedByParams
 * @method
 * @param {string} raw The value from the XML document.
 * @param value The internal representation of the value, as returned
 * from {@link module:datatypes/xmlschema~Base#convertValue}.
 * @param params The parameters, as returned from {@link
 * module:datatypes~Datatype#parseParams}.
 * @param context The context, if needed.
 * @returns {false|Array.<module:datatypes/errors~ValueError>}
 * ``false`` if there is no error. Otherwise, an array of errors.
 */

var base = {
    init: function () {
        if (this.valid_params)
            this.param_name_to_obj = _.indexBy(this.valid_params, "name");
        // Initialize this value to the same value one would get is not
        // specifying any parameters on the type.
        this.default_params = this.parseParams();
    },
    whiteSpaceDefault: COLLAPSE,
    convertValue: function (value, context) {
        return whiteSpaceProcessed(value, this.whiteSpaceDefault);
    },
    valueLength: function (value) {
        return value.length;
    },
    parseValue: function (value, context) {
        var errors = this.disallows(value, {}, context);
        if (errors.length)
            throw new ValueValidationError(errors);
        return { value: this.convertValue(value, context) };
    },
    parseParams: function (location, params) {
        var me = this;
        var errors = [];
        var names = {};
        _.each(params, function (x) {
            var name = x.name;

            // Do we know this parameter?
            if (!me.param_name_to_obj.hasOwnProperty(name)) {
                errors.push(new ParamError("unexpected parameter: " + name));
                return;
            }

            var prop = me.param_name_to_obj[name];

            // Is the value valid at all?
            var invalid = prop.isInvalidParam(x.value, name, me);
            if (invalid)
                errors.push(invalid);

            // Is it repeated, and repeatable?
            if (names.hasOwnProperty(name) && !prop.repeatable)
                errors.push(new ParamError("cannot repeat parameter " + name));

            names[name] = true;
        });

        if (errors.length)
            throw new ParameterParsingError(location, errors);

        var ret = Object.create(null);
        _.each(_.groupBy(params, "name"), function (value, key) {
            var prop = me.param_name_to_obj[key];
            if (value.length > 1)
                ret[key] = prop.combine(_.reduceRight(
                    _.pluck(value, "value"),
                    function (a, b) { return a.concat(b); }, []), me);
            else
                ret[key] = ((prop.convert) ? prop.convert(value[0].value, me) :
                            value[0].value);
        });

        // Inter-parameter checks. There's no point is trying to
        // generalize this.

        if (ret.minLength > ret.maxLength)
            errors.push(new ParamError(
                "minLength must be less than or equal to maxLength"));

        if (ret.length !== undefined) {
            if (ret.minLength !== undefined)
                errors.push(new ParamError(
                    "length and minLength cannot appear together"));
            if (ret.maxLength !== undefined)
                errors.push(new ParamError(
                    "length and maxLength cannot appear together"));
        }

        if (ret.maxInclusive !== undefined) {
            if (ret.maxExclusive !== undefined)
                errors.push(new ParamError(
                    "maxInclusive and maxExclusive cannot appear together"));

            // maxInclusive, minExclusive
            if (ret.minExclusive >= ret.maxInclusive)
                errors.push(new ParamError(
                    "minExclusive must be less than maxInclusive"));
        }

        if (ret.minInclusive !== undefined) {
            if (ret.minExclusive !== undefined)
                errors.push(new ParamError(
                    "minInclusive and minExclusive cannot appear together"));

            // maxInclusive, minInclusive
            if (ret.minInclusive > ret.maxInclusive)
                errors.push(new ParamError(
                    "minInclusive must be less than or equal to maxInclusive"));

            // maxExclusive, minInclusive
            if (ret.minInclusive >= ret.maxExclusive)
                errors.push(new ParamError(
                    "minInclusive must be less than maxExclusive"));
        }

        // maxExclusive, minExclusive
        if (ret.minExclusive > ret.maxExclusive)
            errors.push(new ParamError(
                "minExclusive must be less than or equal to maxExclusive"));

        if (errors.length)
            throw new ParameterParsingError(errors);

        return ret;
    },
    disallowedByParams: function (raw, value, params, context) {
        var me = this;
        if (params) {
            var errors = [];
            _.each(Object.keys(params), function (name) {
                var param = me.param_name_to_obj[name];
                var err =
                    param.isInvalidValue(value, params[name], me);
                if (err)
                    errors.push(err);
            });

            if (errors.length)
                return errors;
        }

        return false;
    },
    equal: function (value, schema_value, context) {
        if (schema_value.value === undefined)
            throw Error("it looks like you are trying to use an " +
                        "unparsed value");
        var converted;

        try {
            converted = this.convertValue(value, context);
        }
        catch (ex) {
            // An invalid value cannot be equal.
            if (ex instanceof ValueValidationError)
                return false;
            throw ex;
        }

        return converted === schema_value.value;
    },
    disallows: function (value, params, context) {
        var me = this;
        if (params instanceof Array)
            throw new Error("it looks like you are passing unparsed " +
                            "parameters to disallows");
        else if (!params || Object.keys(params).length === 0)
            // If no params were passed, get the default params.
            params = this.default_params;

        // This must be done against the raw value because the
        // **lexical** space of this type must match this.
        if (this.regexp &&
            !whiteSpaceProcessed(value, COLLAPSE).match(this.regexp))
            return [new ValueError(this.type_error_msg)];


        var converted;
        try {
            converted = this.convertValue(value, context);
        }
        catch (ex) {
            // An invalid value is not allowed.
            if (ex instanceof ValueValidationError)
                return ex.errors;
            throw ex;
        }

        var errors = this.disallowedByParams(value, converted, params, context);
        if (errors.length)
            return errors;

        return false;
    }
};

//
// String family
//

var string = _.extend({}, base, {
    name: "string",
    type_error_msg: "value is not a string",
    whiteSpaceDefault: PRESERVE,
    valid_params: [length_p, minLength_p, maxLength_p, pattern_p],
    needs_context: false,
    regexp: /^.*$/
});

var normalizedString = _.extend({}, string, {
    name: "normalizedString",
    type_error_msg: "string contains a tab, carriage return or newline",
    regexp: /^[^\r\n\t]+$/
});

var token = _.extend({}, normalizedString, {
    name: "token",
    type_error_msg: "not a valid token",
    regexp: /^(?:(?! )(?:(?!   )[^\r\n\t])*[^\r\n\t ])?$/
});

var language = _.extend({}, token, {
    name: "language",
    type_error_msg: "not a valid language identifier",
    regexp: /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/
});

var Name = _.extend({}, token, {
    name: "Name",
    type_error_msg: "not a valid Name",
    regexp: xml_Name_re
});

var NCName = _.extend({}, Name, {
    name: "NCName",
    type_error_msg: "not a valid NCName",
    regexp: xml_NCName_re
});

var xml_NMTOKEN_re = new RegExp("^[" + xml_Name_Char + "]+$");
var NMTOKEN = _.extend({}, token, {
    name: "NMTOKEN",
    type_error_msg: "not a valid NMTOKEN",
    regexp: xml_NMTOKEN_re
});

var xml_NMTOKENS_re = new RegExp("^[" + xml_Name_Char + "]+(?: [" +
                                xml_Name_Char  +"]+)*$");
var NMTOKENS = _.extend({}, NMTOKEN, {
    name: "NMTOKENS",
    type_error_msg: "not a valid NMTOKENS",
    regexp: xml_NMTOKENS_re,
    whiteSpaceDefault: COLLAPSE
});

var ID = _.extend({}, NCName, {
    name: "ID",
    type_error_msg: "not a valid ID"
});

var IDREF = _.extend({}, NCName, {
    name: "IDREF",
    type_error_msg: "not a valid IDREF"
});

var IDREFS_re = new RegExp("^" + xml_NCName + "(?: " + xml_NCName + ")*$");
var IDREFS = _.extend({}, IDREF, {
    name: "IDREFS",
    type_error_msg: "not a valid IDREFS",
    regexp: IDREFS_re,
    whiteSpaceDefault: COLLAPSE
});

var entity = _.extend({}, string, {
    name: "ENTITY",
    type_error_msg: "not a valid ENTITY"
});

var entities = _.extend({}, string, {
    name: "ENTITIES",
    type_error_msg: "not a valid ENTITIES"
});

//
// Decimal family
//

var decimal_pattern = "[-+]?(?!$)\\d*(\\.\\d*)?";
var decimal = _.extend({}, base, {
    name: "decimal",
    type_error_msg: "value not a decimal number",
    regexp: new RegExp("^" + decimal_pattern + "$"),
    whiteSpaceDefault: COLLAPSE,
    convertValue: function (value, context) {
        return Number(base.convertValue(value));
    },
    valid_params: [totalDigits_p, fractionDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p],
    needs_context: false
});

var integer_pattern = "[-+]?\\d+";
var integer = _.extend({}, decimal, {
    name: "integer",
    type_error_msg: "value is not an integer",
    regexp: new RegExp("^" + integer_pattern + "$"),
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p],
    parseParams: function (location, params) {
        var ret = decimal.parseParams(location, params);
        if (this.highest_val !== undefined) {
            if (ret.maxExclusive !== undefined) {
                var me = ret.maxExclusive;
                if (me > this.highest_val)
                    throw new ParameterParsingError(
                        new ParamError("maxExclusive cannot be greater than " +
                                       this.highest_val));
            }
            else if (ret.maxInclusive !== undefined) {
                var mi = ret.maxInclusive;
                if (mi > this.highest_val)
                    throw new ParameterParsingError(
                        new ParamError("maxInclusive cannot be greater than " +
                                       this.highest_val));
            }
            else
                ret.maxInclusive = this.highest_val;
        }

        if (this.lowest_val !== undefined) {
            if (ret.minExclusive !== undefined) {
                var me = ret.minExclusive;
                if (me < this.lowest_val)
                    throw new ParameterParsingError(
                        new ParamError("minExclusive cannot be lower than " +
                                       this.lowest_val));
            }
            else if (ret.minInclusive !== undefined) {
                var mi = ret.minInclusive;
                if (mi < this.lowest_val)
                    throw new ParameterParsingError(
                        new ParamError("minInclusive cannot be lower than " +
                                       this.lowest_val));
            }
            else
                ret.minInclusive = this.lowest_val;
        }

        return ret;
    }
});

var nonPositiveInteger = _.extend({}, integer, {
    name: "nonPositiveInteger",
    type_error_msg: "value is not a nonPositiveInteger",
    regexp: /^\+?0+|-\d+$/,
    highest_val: 0,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});

var negativeInteger = _.extend({}, nonPositiveInteger, {
    name: "negativeInteger",
    type_error_msg: "value is not a negativeInteger",
    regexp: /^-\d+$/,
    highest_val: -1,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});

var nonNegativeInteger = _.extend({}, integer, {
    name: "nonNegativeInteger",
    type_error_msg: "value is not a nonNegativeInteger",
    regexp: /^\+?\d+$/,
    lowest_val: 0,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});

var positiveInteger = _.extend({}, nonNegativeInteger, {
    name: "positiveInteger",
    type_error_msg: "value is not a positiveInteger",
    regexp: /^\+?\d+$/,
    lowest_val: 1,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});


var long_ = _.extend({}, integer, {
    name: "long",
    type_error_msg: "value is not a long",
    highest_val: 9223372036854775807,
    lowest_val: -9223372036854775808,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});

var int_ = _.extend({}, long_, {
    name: "int",
    type_error_msg: "value is not an int",
    highest_val: 2147483647,
    lowest_val: -2147483648
});

var short_ = _.extend({}, int_, {
    name: "short",
    type_error_msg: "value is not a short",
    highest_val: 32767,
    lowest_val: -32768
});

var byte_ = _.extend({}, short_, {
    name: "byte",
    type_error_msg: "value is not a byte",
    highest_val: 127,
    lowest_val: -128
});

var unsignedLong = _.extend({}, nonNegativeInteger, {
    name: "unsignedLong",
    type_error_msg: "value is not an unsignedLong",
    highest_val: 18446744073709551615,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});

var unsignedInt = _.extend({}, unsignedLong, {
    name: "unsignedInt",
    type_error_msg: "value is not an unsignedInt",
    highest_val: 4294967295,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});

var unsignedShort = _.extend({}, unsignedInt, {
    name: "unsignedShort",
    type_error_msg: "value is not an unsignedShort",
    highest_val: 65535,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});

var unsignedByte = _.extend({}, unsignedShort, {
    name: "unsignedShort",
    type_error_msg: "value is not an unsignedByte",
    highest_val: 255,
    valid_params: [totalDigits_p, pattern_p, minExclusive_p,
                   minInclusive_p, maxExclusive_p, maxInclusive_p]
});

var boolean_ = _.extend({}, base, {
    name: "boolean",
    type_error_msg: "not a valid boolean",
    regexp: /^(1|0|true|false)$/,
    valid_params: [pattern_p],
    convertValue: function (value, context) {
        return (value === "1" || value === "true");
    }
});


var B04 = "[AQgw]";
var B16 = "[AEIMQUYcgkosw048]";
var B64 = "[A-Za-z0-9+/]";

var B64S = "(?:" + B64 + " ?)";
var B16S = "(?:" + B16 + " ?)";
var B04S = "(?:" + B04 + " ?)";

var base64Binary_re = new RegExp(
    "^(?:(?:" + B64S + "{4})*(?:(?:" + B64S + "{3}" + B64 + ")|(?:" + B64S +
        "{2}" + B16S + "=)|(?:" + B64S + B04S + "= ?=)))?$");

var base64Binary = _.extend({}, base, {
    name: "base64Binary",
    type_error_msg: "not a valid base64Binary",
    regexp: base64Binary_re,
    valid_params: [length_p, minLength_p, maxLength_p, pattern_p],
    convertValue: function (value, context) {
        // We don't need to actually decode it.
        return value.replace(/\s/g,'');
    },
    valueLength: function (value) {
        // Length of the decoded value.
        return Math.floor(value.replace(/[\s=]/g, '').length * 3 / 4);
    }
});

var hexBinary = _.extend({}, base, {
    name: "hexBinary",
    type_error_msg: "not a valid hexBinary",
    regexp: /^(?:[0-9a-fA-F]{2})*$/,
    valid_params: [length_p, minLength_p, maxLength_p, pattern_p],
    convertValue: function (value, context) {
        return value;
    },
    valueLength: function (value) {
        // Length of the byte list.
        return value.length / 2;
    }
});


var double_re =
        new RegExp("^(?:(?:[-+]?INF)|(?:NaN)|(?:" +
                   decimal_pattern + "(?:[Ee]" + integer_pattern + ")?))$");

var float_ = _.extend({}, base, {
    name: "float",
    type_error_msg: "not a valid float",
    regexp: double_re,
    valid_params: [pattern_p, minInclusive_p, minExclusive_p,
                   maxInclusive_p, maxExclusive_p],
    convertValue: parseFloat
});

var double_ = _.extend({}, base, {
    name: "double",
    type_error_msg: "not a valid double",
    regexp: double_re,
    valid_params: [pattern_p, minInclusive_p, minExclusive_p,
                   maxInclusive_p, maxExclusive_p],
    convertValue: parseFloat
});

var QName = _.extend({}, base, {
    name: "QName",
    type_error_msg: "not a valid QName",
    regexp: new RegExp("^(?:" + xml_NCName + ":)?" + xml_NCName + "$"),
    needs_context: true,
    convertValue: function (value, context) {
        var ret = context.resolver.resolveName(base.convertValue(value));
        if (ret === undefined)
            throw new ValueValidationError(
                [new ValueError("cannot resolve the name " + value)]);
        return "{" + ret.ns + "}" + ret.name;
    },
    valid_params: [pattern_p, length_p, minLength_p, maxLength_p]
});


var NOTATION = _.extend({}, base, {
    name: "NOTATION",
    type_error_msg: "not a valid NOTATION",
    regexp: new RegExp("^(?:" + xml_NCName + ":)?" + xml_NCName + "$"),
    needs_context: true,
    convertValue: function (value, context) {
        var ret = context.resolver.resolveName(base.convertValue(value));
        if (ret === undefined)
            throw new ValueValidationError(
                [new ValueError("cannot resolve the name " + value)]);
        return "{" + ret.ns + "}" + ret.name;
    },
    valid_params: [pattern_p, length_p, minLength_p, maxLength_p]
});

var duration = _.extend({}, base, {
    name: "duration",
    type_error_msg: "not a valid duration",
    regexp: /^-?P(?!$)(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?!$)(?:\d+H)?(?:\d+M)?(?:\d+(\.\d+)?S)?)?$/,
    valid_params: [pattern_p]
});

var year_pattern = "-?(?:[1-9]\\d*)?\\d{4}";
var month_pattern = "[01]\\d";
var dom_pattern = "[0-3]\\d";
var time_pattern = "[012]\\d:[0-5]\\d:[0-5]\\d(?:\\.\\d+)?";
var tz_pattern = "(?:[+-][01]\\d:[0-5]\\d|Z)";
var tz_re = new RegExp(tz_pattern + "$");

function isLeapYear(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) ||
        (year % 400 === 0);
}

var date_grouping_re = new RegExp(
    "^(" + year_pattern + ")-(" + month_pattern + ")-(" +
        dom_pattern + ")T(" + time_pattern + ")(" + tz_pattern + "?)$");

var max_doms = [undefined, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function checkDate(value) {
    // The Date.parse method of JavaScript is not reliable.
    var match = value.match(date_grouping_re);
    if (!match)
        return NaN;

    var year = match[1];
    var leap = isLeapYear(Number(year));
    var month = Number(match[2]);
    if (month === 0 || month > 12)
        return NaN;

    var dom = Number(match[3]);
    var max_dom = max_doms[month];
    if (month === 2 && !leap)
        max_dom = 28;
    if (dom === 0 || dom > max_dom)
        return NaN;

    var time_parts = match[4].split(":");
    var minutes = Number(time_parts[1]);
    if (minutes > 59)
        return NaN;

    var seconds = Number(time_parts[2]);
    if (seconds > 59)
        return NaN;

    // 24 is valid if minutes and seconds are at 0, otherwise 23 is
    // the limit.
    var hours_limit = (!minutes && !seconds) ? 24 : 23;
    if (Number(time_parts[0]) > hours_limit)
        return NaN;

    if (match[5] && match[5] !== "Z") {// We have a TZ
        var tz_parts = match[5].split(":");
        var tz_hours = Number(tz_parts[0].slice(1)); // Slice: skip the sign.
        if (tz_hours > 14)
            return NaN;

        var tz_seconds = Number(tz_parts[1]);
        if (tz_seconds > 59)
            return NaN;

        if (tz_hours === 14 && tz_seconds !== 0)
            return NaN;
    }

    return true;
}

var dateTime = _.extend({}, base, {
    name: "dateTime",
    type_error_msg: "not a valid dateTime",
    regexp: new RegExp("^" + year_pattern + "-" + month_pattern + "-" +
                       dom_pattern + "T" + time_pattern + tz_pattern + "?$"),
    valid_params: [pattern_p],
    disallows: function (value, params, context) {
        var ret = base.disallows.call(this, value, params, context);
        if (ret)
            return ret;

        if (isNaN(checkDate(value)))
            return [new ValueError(this.type_error_msg)];

        return false;
    }
});

var time = _.extend({}, base, {
    name: "time",
    type_error_msg: "not a valid time",
    regexp: new RegExp("^" + time_pattern + tz_pattern + "?$"),
    valid_params: [pattern_p],
    disallows: function (value, params, context) {
        var ret = base.disallows.call(this, value, params, context);
        if (ret)
            return ret;

        // Date does not validate times, so set the date to something
        // fake.
        if (isNaN(checkDate("1901-01-01T" + value)))
            return [new ValueError(this.type_error_msg)];

        return false;
    }
});

var date = _.extend({}, base, {
    name: "date",
    type_error_msg: "not a valid date",
    regexp: new RegExp("^" + year_pattern + "-" + month_pattern + "-" +
                       dom_pattern + tz_pattern + "?$"),
    valid_params: [pattern_p],
    disallows: function (value, params, context) {
        var ret = base.disallows.call(this, value, params, context);
        if (ret)
            return ret;

        // We have to add time for Date() to parse it.
        var match = value.match(tz_re);
        value = (match) ?
            (value.slice(0, match.index) + "T00:00:00" + match[0]):
            (value + "T00:00:00");
        if (isNaN(checkDate(value)))
            return [new ValueError(this.type_error_msg)];

        return false;
    }
});


var gYearMonth = _.extend({}, base, {
    name: "gYearMonth",
    type_error_msg: "not a valid gYearMonth",
    regexp: new RegExp("^" + year_pattern + "-" + month_pattern + tz_pattern +
                       "?$"),
    valid_params: [pattern_p],
    disallows: function (value, params, context) {
        var ret = base.disallows.call(this, value, params, context);
        if (ret)
            return ret;

        // We have to add a day and time for Date() to parse it.
        var match = value.match(tz_re);
        value = (match) ?
            (value.slice(0, match.index) + "-01T00:00:00" + match[0]):
            (value + "-01T00:00:00");
        if (isNaN(checkDate(value)))
            return [new ValueError(this.type_error_msg)];

        return false;
    }
});

var gYear = _.extend({}, base, {
    name: "gYear",
    type_error_msg: "not a valid gYear",
    regexp: new RegExp("^" + year_pattern + tz_pattern +
                       "?$"),
    valid_params: [pattern_p],
    disallows: function (value, params, context) {
        var ret = base.disallows.call(this, value, params, context);
        if (ret)
            return ret;

        // We have to add a month, a day and a time for Date() to parse it.
        var match = value.match(tz_re);
        value = (match) ?
            (value.slice(0, match.index) + "-01-01T00:00:00" + match[0]):
            (value + "-01-01T00:00:00");
        if (isNaN(checkDate(value)))
            return [new ValueError(this.type_error_msg)];

        return false;
    }
});

var gMonthDay = _.extend({}, base, {
    name: "gMonthDay",
    type_error_msg: "not a valid gMonthDay",
    regexp: new RegExp("^" + month_pattern + "-" + dom_pattern + tz_pattern +
                       "?$"),
    valid_params: [pattern_p],
    disallows: function (value, params, context) {
        var ret = base.disallows.call(this, value, params, context);
        if (ret)
            return ret;

        // We have to add a year and a time for Date() to parse it.
        var match = value.match(tz_re);
        value = (match) ?
            (value.slice(0, match.index) + "T00:00:00" + match[0]):
            (value + "T00:00:00");
        // We always add 2000, which is a leap year, so 01-29 won't
        // raise an error.
        if (isNaN(checkDate("2000-" + value)))
            return [new ValueError(this.type_error_msg)];

        return false;
    }
});


var gDay = _.extend({}, base, {
    name: "gDay",
    type_error_msg: "not a valid gDay",
    regexp: new RegExp("^" + dom_pattern + tz_pattern + "?$"),
    valid_params: [pattern_p],
    disallows: function (value, params, context) {
        var ret = base.disallows.call(this, value, params, context);
        if (ret)
            return ret;

        // We have to add a year and a time for Date() to parse it.
        var match = value.match(tz_re);
        value = (match) ?
            (value.slice(0, match.index) + "T00:00:00" + match[0]):
            (value + "T00:00:00");
        // We always add 2000, which is a leap year, so 01-29 won't
        // raise an error.
        if (isNaN(checkDate("2000-01-" + value)))
            return [new ValueError(this.type_error_msg)];

        return false;
    }
});

var gMonth = _.extend({}, base, {
    name: "gMonth",
    type_error_msg: "not a valid gMonth",
    regexp: new RegExp("^" + month_pattern + tz_pattern + "?$"),
    valid_params: [pattern_p],
    disallows: function (value, params, context) {
        var ret = base.disallows.call(this, value, params, context);
        if (ret)
            return ret;

        // We have to add a year and a time for Date() to parse it.
        var match = value.match(tz_re);
        value = (match) ?
            (value.slice(0, match.index) + "-01T00:00:00" + match[0]):
            (value + "-01T00:00:00");
        // We always add 2000, which is a leap year, so 01-29 won't
        // raise an error.
        if (isNaN(checkDate("2000-" + value)))
            return [new ValueError(this.type_error_msg)];

        return false;
    }
});

// Generated from http://jmrware.com/articles/2009/uri_regexp/URI_regex.html
var re_js_rfc3986_URI_reference = /^(?:[A-Za-z][A-Za-z0-9+\-.]*:(?:\/\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\?(?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?(?:\#(?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?|(?:\/\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\-._~!$&'()*+,;=@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\?(?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?(?:\#(?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?)$/;

var anyURI = _.extend({}, base, {
    name: "anyURI",
    type_error_msg: "not a valid anyURI",
    regexp: re_js_rfc3986_URI_reference,
    valid_params: [pattern_p, length_p, minLength_p, maxLength_p]
});


/**
 * The builtin library.
 */
var xmlschema = {
    uri: "http://www.w3.org/2001/XMLSchema-datatypes",
    types: {
        string: string,
        normalizedString: normalizedString,
        token: token,
        language: language,
        Name: Name,
        NCName: NCName,
        NMTOKEN: NMTOKEN,
        NMTOKENS: NMTOKENS,
        ID: ID,
        IDREF: IDREF,
        IDREFS: IDREFS,
        ENTITY: entity,
        ENTITIES: entities,
        decimal: decimal,
        integer: integer,
        nonPositiveInteger: nonPositiveInteger,
        negativeInteger: negativeInteger,
        nonNegativeInteger: nonNegativeInteger,
        positiveInteger: positiveInteger,
        "long": long_,
        "int": int_,
        "short": short_,
        "byte": byte_,
        unsignedLong: unsignedLong,
        unsignedInt: unsignedInt,
        unsignedShort: unsignedShort,
        unsignedByte: unsignedByte,
        "boolean": boolean_,
        base64Binary: base64Binary,
        hexBinary: hexBinary,
        "float": float_,
        "double": double_,
        QName: QName,
        NOTATION: NOTATION,
        duration: duration,
        dateTime: dateTime,
        time: time,
        date: date,
        gYearMonth: gYearMonth,
        gYear: gYear,
        gMonthDay: gMonthDay,
        gDay: gDay,
        gMonth: gMonth,
        anyURI: anyURI
    }
};

_.each(Object.keys(xmlschema.types), function (name) {
    xmlschema.types[name].init();
});

exports.xmlschema = xmlschema;

});
