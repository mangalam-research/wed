/**
 * Keys that wed uses, as constants.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as key from "./key";

export const CTRLEQ_S = key.makeCtrlEqKey("S");
export const CTRLEQ_Z = key.makeCtrlEqKey("Z");
export const CTRLEQ_Y = key.makeCtrlEqKey("Y");
export const CTRLEQ_C = key.makeCtrlEqKey("C");
export const CTRLEQ_X = key.makeCtrlEqKey("X");
export const CTRLEQ_V = key.makeCtrlEqKey("V");
export const CTRLEQ_FORWARD_SLASH = key.makeCtrlEqKey(191);
export const CTRLEQ_PERIOD = key.makeCtrlEqKey(190);
export const CTRLEQ_BACKQUOTE = key.makeCtrlEqKey(192);
export const CTRLEQ_OPEN_BRACKET = key.makeCtrlEqKey(219); // Ctrl-[
export const CTRLEQ_CLOSE_BRACKET = key.makeCtrlEqKey(221); // Ctrl-]
export const LEFT_ARROW = key.makeKey(37, false);
export const UP_ARROW = key.makeKey(38, false);
export const RIGHT_ARROW = key.makeKey(39, false);
export const DOWN_ARROW = key.makeKey(40, false);
export const BACKSPACE = key.makeKey(8, false);
export const DELETE = key.makeKey(46, false);
export const ENTER = key.makeKey(13, false);
export const SPACE = key.makeKey(32, false);
export const ESCAPE = key.makeKey(27, false);

/**
 * These are the keys that appear to be regular text input keys because they do
 * not have any modifiers set, but which do not actually **insert**
 * text. Modifying this array will result in erratic code.
 */
export const EDITING_KEYS: ReadonlyArray<key.Key> = [
  LEFT_ARROW,
  RIGHT_ARROW,
  BACKSPACE,
  DELETE,
  ENTER,
];

//  LocalWords:  Mangalam MPL Dubeau Ctrl
