/**
 * Keys that wed uses, as constants.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "./key"], function (require, exports, module, key) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CTRLEQ_S = key.makeCtrlEqKey("S", false);
    exports.CTRLEQ_Z = key.makeCtrlEqKey("Z", false);
    exports.CTRLEQ_Y = key.makeCtrlEqKey("Y", false);
    exports.CTRLEQ_C = key.makeCtrlEqKey("C", false);
    exports.CTRLEQ_X = key.makeCtrlEqKey("X", false);
    exports.CTRLEQ_V = key.makeCtrlEqKey("V", false);
    exports.CTRLEQ_F = key.makeCtrlEqKey("F", false);
    exports.CTRLEQ_B = key.makeCtrlEqKey("B", false);
    exports.CTRLEQ_SHIFT_F = key.makeCtrlEqKey("F", true);
    exports.CTRLEQ_SHIFT_B = key.makeCtrlEqKey("B", true);
    exports.CTRLEQ_FORWARD_SLASH = key.makeCtrlEqKey(191, false);
    exports.CTRLEQ_PERIOD = key.makeCtrlEqKey(190, false);
    exports.CTRLEQ_BACKQUOTE = key.makeCtrlEqKey(192, false);
    exports.CTRLEQ_OPEN_BRACKET = key.makeCtrlEqKey(219, false); // Ctrl-[
    exports.CTRLEQ_CLOSE_BRACKET = key.makeCtrlEqKey(221, false); // Ctrl-]
    exports.LEFT_ARROW = key.makeKey(37, false);
    exports.UP_ARROW = key.makeKey(38, false);
    exports.RIGHT_ARROW = key.makeKey(39, false);
    exports.DOWN_ARROW = key.makeKey(40, false);
    exports.BACKSPACE = key.makeKey(8, false);
    exports.DELETE = key.makeKey(46, false);
    exports.ENTER = key.makeKey(13, false);
    exports.SPACE = key.makeKey(32, false);
    exports.ESCAPE = key.makeKey(27, false);
    exports.QUICKSEARCH_FORWARD = exports.CTRLEQ_F;
    exports.QUICKSEARCH_BACKWARDS = exports.CTRLEQ_B;
    exports.SEARCH_FORWARD = exports.CTRLEQ_SHIFT_F;
    exports.SEARCH_BACKWARDS = exports.CTRLEQ_SHIFT_B;
    /**
     * These are the keys that appear to be regular text input keys because they do
     * not have any modifiers set, but which do not actually **insert**
     * text. Modifying this array will result in erratic code.
     */
    exports.EDITING_KEYS = [
        exports.LEFT_ARROW,
        exports.RIGHT_ARROW,
        exports.BACKSPACE,
        exports.DELETE,
        exports.ENTER,
    ];
});
//  LocalWords:  Mangalam MPL Dubeau Ctrl

//# sourceMappingURL=key-constants.js.map
