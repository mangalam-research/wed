/**
 * Keys that wed uses, as constants.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "./browsers", "./key"], function (require, exports, browsers_1, key) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    key = __importStar(key);
    // A few constants are named by their key.
    exports.LEFT_ARROW = key.makeKey(37, false);
    exports.UP_ARROW = key.makeKey(38, false);
    exports.RIGHT_ARROW = key.makeKey(39, false);
    exports.DOWN_ARROW = key.makeKey(40, false);
    exports.BACKSPACE = key.makeKey(8, false);
    exports.DELETE = key.makeKey(46, false);
    exports.ENTER = key.makeKey(13, false);
    exports.SPACE = key.makeKey(32, false);
    exports.ESCAPE = key.makeKey(27, false);
    // Others are named by the function they perform.
    exports.SAVE = key.makeCtrlEqKey("S", false);
    exports.UNDO = key.makeCtrlEqKey("Z", false);
    exports.REDO = key.makeCtrlEqKey("Y", false);
    exports.COPY = key.makeCtrlEqKey("C", false);
    exports.CUT = key.makeCtrlEqKey("X", false);
    exports.PASTE = key.makeCtrlEqKey("V", false);
    exports.DEVELOPMENT = key.makeCtrlEqKey(192, false); // Cmd or Ctrl-`
    exports.QUICKSEARCH_FORWARD = key.makeCtrlEqKey("F", false);
    exports.QUICKSEARCH_BACKWARDS = key.makeCtrlEqKey("B", false);
    exports.SEARCH_FORWARD = key.makeCtrlEqKey("F", true);
    exports.SEARCH_BACKWARDS = key.makeCtrlEqKey("B", true);
    exports.CONTEXTUAL_MENU = key.makeCtrlEqKey(191, false); // Cmd or Ctrl-/
    exports.REPLACEMENT_MENU = key.makeCtrlEqKey(191, true); // Cmd or Ctrl-?
    exports.LOWER_LABEL_VISIBILITY = browsers_1.OSX ? key.NULL_KEY : key.makeCtrlKey(219, false); // Ctrl-[
    exports.INCREASE_LABEL_VISIBILITY = browsers_1.OSX ? key.NULL_KEY : key.makeCtrlKey(221, false); // Ctrl-]
});
//  LocalWords:  Mangalam MPL Dubeau Ctrl
//# sourceMappingURL=key-constants.js.map