/**
 * @module key_constants
 * @desc Keys that wed uses, as constants.
 * @author Louis-Dominique Dubeau
 */
define(/** module:key_constants */ function (require, exports, module) {
'use strict';

var key = require("./key");

exports.CTRL_Z = key.makeCtrlKey("Z");
exports.CTRL_Y = key.makeCtrlKey("Y");
exports.CTRL_FORWARD_SLASH = key.makeCtrlKey("/");
exports.LEFT_ARROW = key.makeKey(37);
exports.RIGHT_ARROW = key.makeKey(39);
exports.BACKSPACE = key.makeKey(8);
exports.DELETE = key.makeKey(46);
exports.ENTER = key.makeKey(13);

/**
 * These are the keys that appear to be regular text input keys
 * because they do not have any modifiers set but which do not
 * actually <strong>insert</strong> text. Modifying this array will
 * result in erratic code.
 */
exports.EDITING_KEYS = [
    exports.LEFT_ARROW,
    exports.RIGHT_ARROW,
    exports.BACKSPACE,
    exports.DELETE,
    exports.ENTER
];

});
