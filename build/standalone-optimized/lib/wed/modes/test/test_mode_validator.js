/**
 * @module modes/test/test_mode_validator
 * @desc A mode for testing.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/test/test_mode_validator*/
function (require, exports, module) {
'use strict';

var oop = require("wed/oop");
var ModeValidator = require("wed/mode_validator").ModeValidator;
var ValidationError = require("salve/validate").ValidationError;

function Validator(gui_root, data_root) {
    ModeValidator.call(this, gui_root, data_root);
}

oop.inherit(Validator, ModeValidator);

Validator.prototype.validateDocument = function () {
    return [{
        error: new ValidationError("Test"),
        node: this._data_root,
        index: 0
    }];
};

exports.Validator = Validator;

});
