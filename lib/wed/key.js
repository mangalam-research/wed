/**
 * @module key
 * @desc Module implementing an class that describes keyboard keys.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:key */ function (require, exports, module) {
'use strict';

var id = 0;

/**
 * <p>Client code should use the convenience functions provided by this
 * module to create keys. Although visible in documentation, this
 * constructor is actually private.</p>
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
 * @class
 */
function Key(which, keyCode, charCode, ctrlKey, altKey, metaKey) {
    // Normalize values
    ctrlKey = !!ctrlKey;
    altKey = !!altKey;
    metaKey = !!metaKey;

    // Some separator is necessary because otherwise there would be no
    // way to distinguish (1, 23, 4, ...) from (12, 3, 4, ...) or (1,
    // 2, 34, ...).
    var key = [which, keyCode, charCode, ctrlKey, altKey, metaKey].join(",");

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
 * @returns {Boolean} True if the key object matches the event, false
 * otherwise.
 */
Key.prototype.matchesEvent = function(ev) {
    return ev.which === this.which &&
        ev.keyCode === this.keyCode &&
        ev.charCode === this.charCode &&
        ev.ctrlKey === this.ctrlKey &&
        ev.altKey === this.altKey &&
        ev.metaKey === this.metaKey;
};

/**
 * The uniqueness of the return value this method returns is
 * guaranteed only per module instance, which generally translates to
 * "per JavaScript execution context". For instance, if this code is
 * loaded in two different browser pages, the module will be
 * instanciated once per page and the return values for Key objects
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
 * @returns {Boolean} True if any modifiers are turned on for this
 * key. False otherwise
 */
Key.prototype.anyModifier = function () {
    return this.ctrlKey || this.altKey || this.metaKey;
};

/**
 * This function creates a key object which represents a control
 * character (a character typed while Ctrl is held).
 *
 * @param {String|Number} ch This parameter can be a string of
 * length one which contains the character for which we want to create
 * a Key. If a number, it is the character code of the key.
 * @returns {module:key~Key} The key created.
 */
function makeCtrlKey(ch) {
    return makeKey(ch, undefined, undefined, true);
}

/**
 * This function creates a key object.
 *
 * @param {String|Number} which This parameter can be a string of
 * length one which contains the character for which we want to create
 * a Key. If a number, it is the character code of the key.
 * @param {Number} [keyCode=which] The key code of the key.
 * @param {Number} [charCode=0] The character code of the key.
 * @param {Boolean} [ctrlKey=false] Whether this key requires the Ctrl key
 * held.
 * @param {Boolean} [altKey=false] Whether this key requires the Alt key
 * held.
 * @param {Boolean} [metaKey=false] Whether this key requires the meta key
 * held.
 * @returns {module:key~Key} The key created.
 */
function makeKey(which, keyCode, charCode, ctrlKey, altKey, metaKey) {
    if (typeof(which) === "string") {
        if (which.length !== 1)
            throw new Error("when the first parameter is a string, "+
                            "a one-character string is required");
        which = which.charCodeAt(0);
    }
    else if (typeof (which) !== "number")
        throw new Error("the first parameter must be a string or number");

    if (keyCode === undefined || keyCode === null)
        keyCode = which;

    if (charCode === undefined || charCode === null)
        charCode = 0;

    // Normalize
    ctrlKey = !!ctrlKey;
    altKey = !!altKey;
    metaKey = !!metaKey;

    return new Key(which, keyCode, charCode, ctrlKey, altKey, metaKey);
}

exports.makeKey = makeKey;
exports.makeCtrlKey = makeCtrlKey;

});
