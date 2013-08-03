/**
 * @module exceptions
 * @desc Exceptions for wed.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:exceptions */function (require, exports, module) {
'use strict';

var oop = require("./oop");

/**
 * This exception is thrown when <strong>volutarily</strong> aborting
 * a transformation, like if the user is trying to do something which
 * is not allowed in this context. Only transformations can throw
 * this.
 *
 * @class
 */
function AbortTransformationException () {
    Error.apply(this, arguments);
}

oop.inherit(AbortTransformationException, Error);

exports.AbortTransformationException = AbortTransformationException;

});
