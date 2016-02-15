/**
 * @module datatypes/errors
 * @desc Errors that can be raised during parsing of types.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:datatypes/errors */
    function (require, exports, module) {
'use strict';

var oop = require("../oop");
var _ = require("lodash");

function ParamError(message) {
    this.message = message;
}

ParamError.prototype.toString = function () {
    return this.message;
};

function ValueError(message) {
    this.message = message;
}

ValueError.prototype.toString = function () {
    return this.message;
};



function ParameterParsingError(location, errors) {
    // This is crap to work around the fact that Error is a terribly
    // badly designed class or prototype or whatever. Unfortunately
    // the stack trace is off...
    var msg = location + ": " +
            _.map(errors,
                  function(x) { return x.toString(); }).join("\n");
    var err = new Error(msg);
    this.errors = errors;
    this.name = "ParameterParsingError";
    this.stack = err.stack;
    this.message = err.message;
}

oop.inherit(ParameterParsingError, Error);

function ValueValidationError(errors) {
    // This is crap to work around the fact that Error is a terribly
    // badly designed class or prototype or whatever. Unfortunately
    // the stack trace is off...
    var msg = _.map(errors,
                    function(x) { return x.toString(); }).join("\n");
    var err = new Error(msg);
    this.errors = errors;
    this.name = "ValueValidationError";
    this.stack = err.stack;
    this.message = err.message;
}

oop.inherit(ValueValidationError, Error);


exports.ParamError = ParamError;
exports.ValueError = ValueError;
exports.ParameterParsingError = ParameterParsingError;
exports.ValueValidationError = ValueValidationError;

});
