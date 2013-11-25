/**
 * @module key
 * @desc Module implementing an class that describes keyboard keys.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:key */ function (require, exports, module) {
'use strict';

var id = 0;

/**
 * @classdesc <p>Client code should use the convenience functions
 * provided by this module to create keys rather than use this
 * constructor directly.</p>
 *
 * <p>One and only one instance of a Key object exists per set of
 * parameters used for its construction. So if <code>a = new Key(1, 2,
 * 3)</code> and <code>b = new Key(1, 2, 3)</code> then <code>a ===
 * b</code> is true. The last three parameters are normalized to
 * boolean values, so <code>new Key(1, 2, 3)</code> is the same as
 * <code>new Key(1, 2, 3, false, false, false)</code>.</p>
 *
 * <p>Key objects should be considered immutable. Modifying them after
 * their creation is likely to cause code to execute erratically.</p>
 *
 * @constructor
 * @param {string|number} which This parameter can be a string of
 * length one which contains the character for which we want to create
 * a Key. If a number, it is the character code of the key.
 * @param {boolean} [keypress=true] Whether this key is meant to be
 * used for keypress events rather than keyup and keydown.
 * @param {number} [keyCode=which] The key code of the key.
 * @param {number} [charCode=0] The character code of the key.
 * @param {boolean} [ctrlKey=false] Whether this key requires the Ctrl key
 * held.
 * @param {boolean} [altKey=false] Whether this key requires the Alt key
 * held.
 * @param {boolean} [metaKey=false] Whether this key requires the meta key
 * held.
 * @returns {module:key~Key} The key created.
 */
function Key(which, keypress, keyCode, charCode, ctrlKey, altKey, metaKey) {
    // Normalize values
    keypress = !!keypress;
    ctrlKey = !!ctrlKey;
    altKey = !!altKey;
    metaKey = !!metaKey;

    // Some separator is necessary because otherwise there would be no
    // way to distinguish (1, 23, 4, ...) from (12, 3, 4, ...) or (1,
    // 2, 34, ...).
    var key = [which, keyCode, charCode, ctrlKey, altKey, metaKey,
               keypress].join(",");

    // Ensure we have only one of each key created.
    var cached = Key.__cache[key];
    if (cached !== undefined)
        return cached;

    this.which = which;
    this.keyCode = keyCode;
    this.charCode = charCode;
    this.ctrlKey = ctrlKey;
    this.altKey = altKey;
    this.metaKey = metaKey;
    this.keypress = keypress;

    this.hash_key = key;
    this._id = id++;

    Key.__cache[key] = this;

    return this;
}
Key.__cache = {};

/**
 * This method compares the key object to an event object. The event
 * object should have been generated for a keyboard event. This method
 * does not check the type of object.
 *
 * @param ev A jQuery or DOM event object.
 * @returns {boolean} True if the key object matches the event, false
 * otherwise.
 */
Key.prototype.matchesEvent = function(ev) {
    return ev.which === this.which &&
        ev.keyCode === this.keyCode &&
        ev.charCode === this.charCode &&
        ev.ctrlKey === this.ctrlKey &&
        ev.altKey === this.altKey &&
        ev.metaKey === this.metaKey &&
        (this.keypress ? (ev.type === "keypress") :
         ((ev.type === "keydown") || (ev.type === "keyup")));
};

/**
 * Sets an event object so that it matches this key. If this is not a
 * keypress event, the event type will be set to keydown. The caller
 * can set it to keyup as needed.
 *
 * @param ev A jQuery or DOM event object. This object is modified by
 * the method.
 */
Key.prototype.setEventToMatch = function(ev) {
    ev.which = this.which;
    ev.keyCode = this.keyCode;
    ev.charCode = this.charCode;
    ev.ctrlKey = this.ctrlKey;
    ev.altKey = this.altKey;
    ev.metaKey = this.metaKey;
    if (this.keypress)
        ev.type = "keypress";
    else
        ev.type = "keydown";
};


/**
 * The uniqueness of the return value this method returns is
 * guaranteed only per module instance, which generally translates to
 * "per JavaScript execution context". For instance, if this code is
 * loaded in two different browser pages, the module will be
 * instantiated once per page and the return values for Key objects
 * that were created with the same parameters might differ. So if
 * these two pages communicate with one another they cannot use the
 * return value of this method to identify objects.
 *
 * @returns A hash value that uniquely identifies the object. The
 * value should be considered to be opaque.
 */
Key.prototype.hash = function() {
    return this._id;
};

/**
 * @returns {boolean} True if any modifiers are turned on for this
 * key. False otherwise. Shift is not considered a modifier for our
 * purposes.
 */
Key.prototype.anyModifier = function () {
    return this.ctrlKey || this.altKey || this.metaKey;
};

/**
 * This function creates a key object which represents a control
 * character (a character typed while Ctrl is held).
 *
 *
 * @param {string|number} ch This parameter can be a string of
 * length one which contains the character for which we want to create
 * a Key. If a number, it is the character code of the key.
 * @returns {module:key~Key} The key created.
 */
function makeCtrlKey(ch) {
    return makeKey(ch, false, undefined, undefined, true, false, false);
}

/**
 * This function creates a key object.
 *
 * @param {string|number} which This parameter can be a string of
 * length one which contains the character for which we want to create
 * a Key. If a number, it is the character code of the key.
 * @param {boolean} [keypress=true] Whether this key is meant to be
 * used for keypress events rather than keyup and keydown.
 * @param {number} [keyCode=which] The key code of the key.
 * @param {number} [charCode=0] The character code of the key.
 * @param {boolean} [ctrlKey=false] Whether this key requires the Ctrl key
 * held.
 * @param {boolean} [altKey=false] Whether this key requires the Alt key
 * held.
 * @param {boolean} [metaKey=false] Whether this key requires the meta key
 * held.
 * @returns {module:key~Key} The key created.
 * @throws {Error} If <code>which</code> is not a single character string or
 * a number.
 */
function makeKey(which, keypress, keyCode, charCode, ctrlKey, altKey, metaKey) {
    if (typeof(which) === "string") {
        if (which.length !== 1)
            throw new Error("when the first parameter is a string, "+
                            "a one-character string is required");
        which = which.charCodeAt(0);
    }
    else if (typeof (which) !== "number")
        throw new Error("the first parameter must be a string or number");

    if (keypress === undefined)
        keypress = true;
    else
        keypress = !!keypress;

    if (keyCode === undefined || keyCode === null)
        keyCode = which;

    if (charCode === undefined || charCode === null)
        charCode = keypress ? which : 0;

    // Normalize
    ctrlKey = !!ctrlKey;
    altKey = !!altKey;
    metaKey = !!metaKey;

    return new Key(which, keypress, keyCode, charCode, ctrlKey, altKey,
                   metaKey);
}

exports.makeKey = makeKey;
exports.makeCtrlKey = makeCtrlKey;
exports.Key = Key;

});

//  LocalWords:  metaKey altKey ctrlKey charcode keyCode param keyup
//  LocalWords:  Ctrl DOM Mangalam MPL Dubeau boolean keypress jquery
//  LocalWords:  keydown jQuery
