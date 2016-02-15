/**
 * @module errors
 * @desc Validation errors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013-2015 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:errors */ function (require, exports, module) {
'use strict';

var oop = require("./oop");
var inherit = oop.inherit;

/**
 * @classdesc The fireEvent methods return an array of objects of this
 * class to notify the caller of errors in the file being validated.
 *
 * @constructor
 *
 * @param {string} msg The error message.
 */
function ValidationError(msg) {
    this.msg = msg;
    // May be useful for debugging:
    // this.stack_trace = new Error().stack;
}

/**
 * @returns {string} The text representation of the error.
 */
ValidationError.prototype.toString = function() { return this.msg; };

/**
 * This method provides the caller with the list of all names that
 * are used in the error message.
 *
 * @returns {Array.<module:name_patterns~Base>} The list of names used in the
 * error message.
 */
ValidationError.prototype.getNames = function () {
    return [];
};

/**
 * <p>This method transforms the ValidationError object to a string
 * but uses the names in the parameter passed to it to format the
 * string.</p>
 *
 * <p>Since salve does not work with namespace prefixes, someone using
 * salve would typically use this method so as to replace the name
 * patterns passed in error messages with qualified names.</p>
 *
 * @param {Array.<string>} names The array of names to use. This
 * should be an array of the same length as that returned by
 * <code>getNames()</code>, with each name replaced with a corresponding string.
 *
 * @returns {string} The object formatted as a string.
 */
ValidationError.prototype.toStringWithNames = function (names) {
    // We do not have names in ValidationError
    return this.msg;
};


/**
 * @classdesc This class serves as a base for all those errors that
 * have only one name involved.
 *
 * @constructor
 * @extends module:patterns~ValidationError
 * @param {string} msg The error message.
 * @param {module:name_patterns~Base} name The name of the XML entity at stake.
 */
function SingleNameError(msg, name) {
    ValidationError.call(this, msg);
    this.name = name;
}
inherit(SingleNameError, ValidationError);

SingleNameError.prototype.toString = function() {
    return this.toStringWithNames([this.name]);
};

SingleNameError.prototype.getNames = function () {
    return [this.name];
};

SingleNameError.prototype.toStringWithNames = function (names) {
    return this.msg + ": " + names[0];
};


/**
 * @classdesc Error returned when an attribute name is invalid.
 *
 * @constructor
 * @extends module:patterns~SingleNameError
 * @param {string} msg The error message.
 * @param {module:name_patterns~Base} name The name of the attribute at stake.
 */
function AttributeNameError() {
    SingleNameError.apply(this, arguments);
}
inherit(AttributeNameError, SingleNameError);

/**
 * @classdesc Error returned when an attribute value is invalid.
 *
 * @constructor
 * @extends module:patterns~SingleNameError
 * @param {string} msg The error message.
 * @param {module:name_patterns~Base} name The name of the attribute at stake.
 */
function AttributeValueError() {
    SingleNameError.apply(this, arguments);
}
inherit(AttributeValueError, SingleNameError);

/**
 * @classdesc Error returned when an element is invalid.
 *
 * @constructor
 * @extends module:patterns~SingleNameError
 * @param {string} msg The error message.
 * @param {module:name_patterns~Base} name The name of the element at stake.
 */
function ElementNameError() {
    SingleNameError.apply(this, arguments);
}
inherit(ElementNameError, SingleNameError);

/**
 * @classdesc Error returned when choice was not satisfied.
 *
 * @constructor
 * @extends module:patterns~ValidationError
 * @param {Array.<module:name_patterns~Base>} names_a The name of the first
 * XML entities at stake.
 * @param {Array.<module:name_patterns~Base>} names_b The name of the second
 * XML entities at stake.
 */
function ChoiceError(names_a, names_b) {
    ValidationError.call(this, "");
    this.names_a = names_a;
    this.names_b = names_b;
}
inherit(ChoiceError, ValidationError);

ChoiceError.prototype.toString = function() {
    return this.toStringWithNames(this.names_a.concat(this.names_b));
};

ChoiceError.prototype.getNames = function () {
    return this.names_a.concat(this.names_b);
};

ChoiceError.prototype.toStringWithNames = function (names) {
    var first = names.slice(0, this.names_a.length);
    var second = names.slice(this.names_a.length);
    return "must choose either " + first.join(", ") +
        " or " + second.join(", ");
};

exports.ValidationError = ValidationError;
exports.ChoiceError = ChoiceError;
exports.ElementNameError = ElementNameError;
exports.AttributeNameError = AttributeNameError;
exports.AttributeValueError = AttributeValueError;

});
