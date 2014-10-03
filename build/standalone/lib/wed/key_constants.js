/**
 * @module key_constants
 * @desc Keys that wed uses, as constants.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:key_constants */ function (require, exports, module) {
'use strict';

var key = require("./key");

exports.CTRLEQ_S = key.makeCtrlEqKey("S");
exports.CTRLEQ_Z = key.makeCtrlEqKey("Z");
exports.CTRLEQ_Y = key.makeCtrlEqKey("Y");
exports.CTRLEQ_C = key.makeCtrlEqKey("C");
exports.CTRLEQ_X = key.makeCtrlEqKey("X");
exports.CTRLEQ_V = key.makeCtrlEqKey("V");
exports.CTRLEQ_FORWARD_SLASH = key.makeCtrlEqKey(191);
exports.CTRLEQ_PERIOD = key.makeCtrlEqKey(190);
exports.CTRLEQ_BACKQUOTE = key.makeCtrlEqKey(192);
exports.CTRLEQ_OPEN_BRACKET = key.makeCtrlEqKey(219); // Ctrl-[
exports.CTRLEQ_CLOSE_BRACKET = key.makeCtrlEqKey(221); // Ctrl-]
exports.LEFT_ARROW = key.makeKey(37, false);
exports.UP_ARROW = key.makeKey(38, false);
exports.RIGHT_ARROW = key.makeKey(39, false);
exports.DOWN_ARROW = key.makeKey(40, false);
exports.BACKSPACE = key.makeKey(8, false);
exports.DELETE = key.makeKey(46, false);
exports.ENTER = key.makeKey(13, false);
exports.SPACE = key.makeKey(32, false);
exports.ESCAPE = key.makeKey(27, false);

/**
 * These are the keys that appear to be regular text input keys
 * because they do not have any modifiers set, but which do not
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

//  LocalWords:  Mangalam MPL Dubeau
