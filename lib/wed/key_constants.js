/**
 * @module key_constants
 * @desc Keys that wed uses, as constants.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:key_constants */ function (require, exports, module) {
'use strict';

var key = require("./key");

exports.CTRL_S = key.makeCtrlKey("S");
exports.CTRL_Z = key.makeCtrlKey("Z");
exports.CTRL_Y = key.makeCtrlKey("Y");
exports.CTRL_C = key.makeCtrlKey("C");
exports.CTRL_X = key.makeCtrlKey("X");
exports.CTRL_FORWARD_SLASH = key.makeCtrlKey(191);
exports.CTRL_PERIOD = key.makeCtrlKey(190);
exports.CTRL_BACKQUOTE = key.makeCtrlKey(192);
exports.LEFT_ARROW = key.makeKey(37, false);
exports.RIGHT_ARROW = key.makeKey(39, false);
exports.BACKSPACE = key.makeKey(8, false);
exports.DELETE = key.makeKey(46, false);
exports.ENTER = key.makeKey(13, false);
exports.SPACE = key.makeKey(32, false);
exports.ESCAPE = key.makeKey(27, false);

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
