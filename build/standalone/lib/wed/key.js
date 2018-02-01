/**
 * Module implementing an class that describes keyboard keys.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "./browsers", "jquery"], function (require, exports, browsers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var id = 0;
    // tslint:disable-next-line:completed-docs class-name
    var EITHER_ = /** @class */ (function () {
        function EITHER_() {
        }
        EITHER_.prototype.toString = function () {
            return "EITHER";
        };
        return EITHER_;
    }());
    exports.EITHER_ = EITHER_;
    /**
     * Value meaning "either true or false", by opposition to ``true`` and
     * ``false``.
     */
    exports.EITHER = new EITHER_();
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
    var Key = /** @class */ (function () {
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
        function Key(which, keypress, keyCode, charCode, ctrlKey, altKey, metaKey, shiftKey) {
            if (keypress === void 0) { keypress = true; }
            if (charCode === void 0) { charCode = 0; }
            if (ctrlKey === void 0) { ctrlKey = false; }
            if (altKey === void 0) { altKey = false; }
            if (metaKey === void 0) { metaKey = false; }
            if (shiftKey === void 0) { shiftKey = exports.EITHER; }
            // Some separator is necessary because otherwise there would be no way to
            // distinguish (1, 23, 4, ...) from (12, 3, 4, ...) or (1, 2, 34, ...).
            var key = [which, keyCode, charCode, ctrlKey, altKey, metaKey, shiftKey,
                keypress].join(",");
            // Ensure we have only one of each key created.
            var cached = Key.__cache[key];
            if (cached !== undefined) {
                return cached;
            }
            if (keypress) {
                if (shiftKey !== exports.EITHER) {
                    throw new Error("shiftKey with key presses must be EITHER");
                }
            }
            this.which = which;
            this.keyCode = keyCode;
            this.charCode = charCode;
            this.ctrlKey = ctrlKey;
            this.altKey = altKey;
            this.metaKey = metaKey;
            this.shiftKey = shiftKey;
            this.keypress = keypress;
            this.hashKey = key;
            this.id = id++;
            Key.__cache[key] = this;
        }
        /**
         * This method compares the key object to an event object. The event object
         * should have been generated for a keyboard event. This method does not check
         * the type of object.
         *
         * @param ev A jQuery or DOM event object.
         * @returns True if the key object matches the event, false
         * otherwise.
         */
        Key.prototype.matchesEvent = function (ev) {
            return ev.which === this.which &&
                ev.keyCode === this.keyCode &&
                ev.charCode === this.charCode &&
                ev.ctrlKey === this.ctrlKey &&
                ev.altKey === this.altKey &&
                ev.metaKey === this.metaKey &&
                // If shiftKey is undefined, we don't compare it.
                ((this.shiftKey === exports.EITHER) || (ev.shiftKey === this.shiftKey)) &&
                (this.keypress ? (ev.type === "keypress") :
                    ((ev.type === "keydown") || (ev.type === "keyup")));
        };
        /**
         * Sets an event object so that it matches this key. If this is not a keypress
         * event, the event type will be set to keydown. The caller can set it to
         * keyup as needed.
         *
         * @param ev A jQuery or DOM event object. This object is modified by the
         * method.
         */
        Key.prototype.setEventToMatch = function (ev) {
            // tslint:disable-next-line:no-any
            var asAny = ev;
            asAny.which = this.which;
            asAny.keyCode = this.keyCode;
            asAny.charCode = this.charCode;
            asAny.ctrlKey = this.ctrlKey;
            asAny.altKey = this.altKey;
            asAny.metaKey = this.metaKey;
            if (this.shiftKey !== exports.EITHER) {
                asAny.shiftKey = this.shiftKey;
            }
            if (this.keypress) {
                asAny.type = "keypress";
            }
            else {
                asAny.type = "keydown";
            }
        };
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
        Key.prototype.hash = function () {
            return this.id;
        };
        /**
         * @returns True if any modifiers are turned on for this key. False
         * otherwise. Shift is not considered a modifier for our purposes.
         */
        Key.prototype.anyModifier = function () {
            return this.ctrlKey || this.altKey || this.metaKey;
        };
        // tslint:disable-next-line:variable-name
        Key.__cache = Object.create(null);
        return Key;
    }());
    exports.Key = Key;
    /** This is a [[Key]] that cannot match anything. */
    exports.NULL_KEY = new Key(-1, false, -1);
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
    function makeKey(which, keypress, keyCode, charCode, ctrlKey, altKey, metaKey, shiftKey) {
        if (keypress === void 0) { keypress = true; }
        if (ctrlKey === void 0) { ctrlKey = false; }
        if (altKey === void 0) { altKey = false; }
        if (metaKey === void 0) { metaKey = false; }
        if (shiftKey === void 0) { shiftKey = exports.EITHER; }
        if (typeof (which) === "string") {
            if (which.length !== 1) {
                throw new Error("when the first parameter is a string, " +
                    "a one-character string is required");
            }
            which = which.charCodeAt(0);
        }
        else if (typeof (which) !== "number") {
            throw new Error("the first parameter must be a string or number");
        }
        if (keypress === undefined) {
            keypress = true;
        }
        else {
            keypress = !!keypress;
        }
        if (keyCode == null) {
            keyCode = (keypress && browsers.GECKO) ? 0 : which;
        }
        if (charCode == null) {
            charCode = keypress ? which : 0;
        }
        // Normalize
        ctrlKey = !!ctrlKey;
        altKey = !!altKey;
        metaKey = !!metaKey;
        if (shiftKey !== exports.EITHER) {
            shiftKey = !!shiftKey;
        }
        return new Key(which, keypress, keyCode, charCode, ctrlKey, altKey, metaKey, shiftKey);
    }
    exports.makeKey = makeKey;
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
    function makeCtrlKey(ch, shiftKey) {
        if (shiftKey === void 0) { shiftKey = exports.EITHER; }
        return makeKey(ch, false, undefined, undefined, true, false, false, shiftKey);
    }
    exports.makeCtrlKey = makeCtrlKey;
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
    function makeMetaKey(ch, shiftKey) {
        if (shiftKey === void 0) { shiftKey = exports.EITHER; }
        return makeKey(ch, false, undefined, undefined, false, false, true, shiftKey);
    }
    exports.makeMetaKey = makeMetaKey;
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
    function makeCtrlEqKey(ch, shiftKey) {
        if (shiftKey === void 0) { shiftKey = exports.EITHER; }
        if (!browsers.OSX) {
            return makeCtrlKey(ch, shiftKey);
        }
        // Command === Meta
        return makeMetaKey(ch, shiftKey);
    }
    exports.makeCtrlEqKey = makeCtrlEqKey;
});
//  LocalWords:  jQuery keydown keypress boolean Dubeau MPL Mangalam DOM Ctrl
//  LocalWords:  keyup param keyCode charcode ctrlKey altKey metaKey shiftKey
//# sourceMappingURL=key.js.map