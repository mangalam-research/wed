/**
 * Keys that wed uses, as constants.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { OSX } from "./browsers";
import * as key from "./key";

// A few constants are named by their key.
export const LEFT_ARROW = key.makeKey(37, false);
export const UP_ARROW = key.makeKey(38, false);
export const RIGHT_ARROW = key.makeKey(39, false);
export const DOWN_ARROW = key.makeKey(40, false);
export const BACKSPACE = key.makeKey(8, false);
export const DELETE = key.makeKey(46, false);
export const ENTER = key.makeKey(13, false);
export const SPACE = key.makeKey(32, false);
export const ESCAPE = key.makeKey(27, false);

// Others are named by the function they perform.
export const SAVE = key.makeCtrlEqKey("S", false);
export const UNDO = key.makeCtrlEqKey("Z", false);
export const REDO = key.makeCtrlEqKey("Y", false);
export const COPY = key.makeCtrlEqKey("C", false);
export const CUT = key.makeCtrlEqKey("X", false);
export const PASTE = key.makeCtrlEqKey("V", false);
export const DEVELOPMENT = key.makeCtrlEqKey(192, false); // Cmd or Ctrl-`
export const QUICKSEARCH_FORWARD = key.makeCtrlEqKey("F", false);
export const QUICKSEARCH_BACKWARDS = key.makeCtrlEqKey("B", false);
export const SEARCH_FORWARD = key.makeCtrlEqKey("F", true);
export const SEARCH_BACKWARDS = key.makeCtrlEqKey("B", true);
export const CONTEXTUAL_MENU = key.makeCtrlEqKey(191, false); // Cmd or Ctrl-/
export const REPLACEMENT_MENU = key.makeCtrlEqKey(191, true); // Cmd or Ctrl-?
export const LOWER_LABEL_VISIBILITY =
  OSX ? key.NULL_KEY : key.makeCtrlKey(219, false); // Ctrl-[
export const INCREASE_LABEL_VISIBILITY =
  OSX ? key.NULL_KEY : key.makeCtrlKey(221, false); // Ctrl-]

//  LocalWords:  Mangalam MPL Dubeau Ctrl
