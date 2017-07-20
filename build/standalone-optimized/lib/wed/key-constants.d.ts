/**
 * Keys that wed uses, as constants.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as key from "./key";
export declare const CTRLEQ_S: key.Key;
export declare const CTRLEQ_Z: key.Key;
export declare const CTRLEQ_Y: key.Key;
export declare const CTRLEQ_C: key.Key;
export declare const CTRLEQ_X: key.Key;
export declare const CTRLEQ_V: key.Key;
export declare const CTRLEQ_FORWARD_SLASH: key.Key;
export declare const CTRLEQ_PERIOD: key.Key;
export declare const CTRLEQ_BACKQUOTE: key.Key;
export declare const CTRLEQ_OPEN_BRACKET: key.Key;
export declare const CTRLEQ_CLOSE_BRACKET: key.Key;
export declare const LEFT_ARROW: key.Key;
export declare const UP_ARROW: key.Key;
export declare const RIGHT_ARROW: key.Key;
export declare const DOWN_ARROW: key.Key;
export declare const BACKSPACE: key.Key;
export declare const DELETE: key.Key;
export declare const ENTER: key.Key;
export declare const SPACE: key.Key;
export declare const ESCAPE: key.Key;
/**
 * These are the keys that appear to be regular text input keys because they do
 * not have any modifiers set, but which do not actually **insert**
 * text. Modifying this array will result in erratic code.
 */
export declare const EDITING_KEYS: ReadonlyArray<key.Key>;
