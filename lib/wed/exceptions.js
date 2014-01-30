/**
 * @module exceptions
 * @desc Exceptions for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:exceptions */function (require, exports, module) {
'use strict';

var oop = require("./oop");

/**
 * @classdesc This exception is thrown when
 * <strong>voluntarily</strong> aborting a transformation, like if the
 * user is trying to do something which is not allowed in this
 * context. Only transformations can throw this.
 * @extends Error
 * @constructor
 */
function AbortTransformationException () {
    Error.apply(this, arguments);
}

oop.inherit(AbortTransformationException, Error);

exports.AbortTransformationException = AbortTransformationException;

});

// LocalWords:  Dubeau MPL Mangalam classdesc
