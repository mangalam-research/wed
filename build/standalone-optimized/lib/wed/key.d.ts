/// <reference types="jquery" />
/**
 * Module implementing an class that describes keyboard keys.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import "jquery";
export declare class EITHER_ {
    toString(): string;
}
/**
 * Value meaning "either true or false", by opposition to ``true`` and
 * ``false``.
 */
export declare const EITHER: EITHER_;
export declare type TriValued = boolean | typeof EITHER;
/**
 * One and only one instance of a Key object exists per set of parameters used
 * for its construction. So if ``a = new Key(1, 2, 3)`` and ``b = new Key(1, 2,
 * 3)`` then ``a === b`` is true. The last three parameters are normalized to
 * boolean values, so ``new Key(1, 2, 3)`` is the same as ``new Key(1, 2, 3,
 * false, false, false)``.
 *
 * Key objects should be considered immutable. Modifying them after their
 * creation is likely to cause code to execute erratically.
 *
 * A note on the handling of the shift key. For key presses, we do not care
 * whether shift was held or not when the key was pressed. It does not matter to
 * us whether the user types the letter A because "Shift-a" was pressed or
 * because the user was in caps lock mode and pressed "a". Conversely,
 * ``keydown`` and ``keyup`` events concern themselves with Shift. We do want to
 * distinguish Ctrl-A and Ctrl-Shift-A. (Yes, we use the capital A for both:
 * browsers report that the key "A" was pressed whether Shift was held or not.)
 */
export declare class Key {
    static __cache: Record<string, Key>;
    readonly which: number;
    readonly keyCode: number;
    readonly charCode: number;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: TriValued;
    readonly keypress: boolean;
    readonly hashKey: string;
    private readonly id;
    /**
     * Client code should use the convenience functions provided by this module to
     * create keys rather than use this constructor directly.
     *
     * @param which The character code of the key.
     *
     * @param keypress Whether this key is meant to be used for keypress events
     * rather than keyup and keydown.
     *
     * @param keyCode The key code of the key.
     *
     * @param charCode The character code of the key.
     *
     * @param ctrlKey Whether this key requires the Ctrl key held.
     *
     * @param altKey Whether this key requires the Alt key held.
     *
     * @param metaKey Whether this key requires the meta key held.
     *
     * @param shiftKey Whether this key requires the shift key held. It is invalid
     * to use this parameter if ``keypress`` is ``true``. When ``keypress`` is
     * ``false``, an unspecified value here means ``false``.
     */
    constructor(which: number, keypress: boolean | undefined, keyCode: number, charCode?: number, ctrlKey?: boolean, altKey?: boolean, metaKey?: boolean, shiftKey?: TriValued);
    /**
     * This method compares the key object to an event object. The event object
     * should have been generated for a keyboard event. This method does not check
     * the type of object.
     *
     * @param ev A jQuery or DOM event object.
     * @returns True if the key object matches the event, false
     * otherwise.
     */
    matchesEvent(ev: KeyboardEvent | JQueryKeyEventObject): boolean;
    /**
     * Sets an event object so that it matches this key. If this is not a keypress
     * event, the event type will be set to keydown. The caller can set it to
     * keyup as needed.
     *
     * @param ev A jQuery or DOM event object. This object is modified by the
     * method.
     */
    setEventToMatch(ev: KeyboardEvent | JQueryKeyEventObject): void;
    /**
     * The uniqueness of the return value this method returns is guaranteed only
     * per module instance, which generally translates to "per JavaScript
     * execution context". For instance, if this code is loaded in two different
     * browser pages, the module will be instantiated once per page and the return
     * values for Key objects that were created with the same parameters might
     * differ. So if these two pages communicate with one another they cannot use
     * the return value of this method to identify objects.
     *
     * @returns A hash value that uniquely identifies the object. The value should
     * be considered to be opaque.
     */
    hash(): number;
    /**
     * @returns True if any modifiers are turned on for this key. False
     * otherwise. Shift is not considered a modifier for our purposes.
     */
    anyModifier(): boolean;
}
/** This is a [[Key]] that cannot match anything. */
export declare const NULL_KEY: Key;
/**
 * This function creates a key object.
 *
 * @param which This parameter can be a string of length one which contains the
 * character for which we want to create a Key. If a number, it is the character
 * code of the key.
 *
 * @param keypress Whether this key is meant to be used for keypress events
 * rather than keyup and keydown.
 *
 * @param keyCode The key code of the key.
 *
 * @param charCode The character code of the key.
 *
 * @param ctrlKey Whether this key requires the Ctrl key held.
 *
 * @param altKey Whether this key requires the Alt key held.
 *
 * @param metaKey Whether this key requires the meta key held.
 *
 * @param shiftKey Whether this key requires the shift key held. It is invalid
 * to use this parameter if ``keypress`` is ``true``.
 *
 * @returns The key created.
 *
 * @throws {Error} If ``which`` is not a single character string or a number.
 */
export declare function makeKey(which: string | number, keypress?: boolean, keyCode?: number, charCode?: number, ctrlKey?: boolean, altKey?: boolean, metaKey?: boolean, shiftKey?: TriValued): Key;
/**
 * This function creates a key object which represents a control character (a
 * character typed while Ctrl is held).
 *
 * @param ch This parameter can be a string of length one which contains the
 * character for which we want to create a Key. If a number, it is the character
 * code of the key.
 *
 * @param shiftKey Whether this is a Ctrl-Shift sequence or not.
 *
 * @returns The key created.
 */
export declare function makeCtrlKey(ch: string | number, shiftKey?: TriValued): Key;
/**
 * This function creates a key object which represents a meta character (a
 * character typed while Meta is held).
 *
 * @param ch This parameter can be a string of length one which contains the
 * character for which we want to create a Key. If a number, it is the character
 * code of the key.
 *
 * @param shiftKey Whether this is a Meta-Shift sequence or not.
 *
 * @returns The key created.
 */
export declare function makeMetaKey(ch: string | number, shiftKey?: TriValued): Key;
/**
 * This function creates a key object which represents a "control equivalent"
 * character. A "control equivalent" is equivalent to a control key on all
 * platforms, except in OS X where it is equivalent to a command key. That is if
 * one makes a "control equivalent" with the character "X", then on all
 * platforms it would be equivalent to hitting Ctrl-X, except in OS X where it
 * is equivalent to hitting Command-X.
 *
 * @param ch This parameter can be a string of length one which contains the
 * character for which we want to create a Key. If a number, it is the character
 * code of the key.
 *
 * @param shiftKey Whether this is a [...]-Shift sequence or not.
 *
 * @returns The key created.
 */
export declare function makeCtrlEqKey(ch: string | number, shiftKey?: TriValued): Key;
