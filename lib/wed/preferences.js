/**
 * @module preferences
 * @desc A model for wed's preferences.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:preferences */function f(require, exports) {
  "use strict";

  var _ = require("lodash");
  var object_check = require("./object_check");

  var template = {
    tooltips: false,
  };

  /**
   * @classdesc A model for preferences. The preferences stored in this
   * object must be serializable as JSON. The class itself does not
   * enforce this, so callers must be careful.
   *
   * @param {Object} [initial={}] The initial preferences.
   * @throws {Error} If there is any error in the preferences.
   */
  function Preferences(initial) {
    if (!initial) {
      // Custom code here to avoid a pointless call to ``._extend``.
      this._prefs = Object.create(null);
      this._validatePrefs(this._prefs);
      return;
    }

    this._validatePrefs(initial);
    this._prefs = _.extend(Object.create(null), initial);
  }

  /**
   * Validates a set of preferences.
   *
   * @private
   * @param {Object} prefs The preferences to validate.
   * @throws {Error} If there is any error in the preferences.
   */
  Preferences.prototype._validatePrefs = function _validatePrefs(prefs) {
    var check = object_check.check(template, prefs);

    // This is not the place to provide diagnosis for the end user:
    // fail hard if something is wrong.
    if (check.missing) {
      throw new Error("missing option: " + check.missing[0]);
    }

    if (check.extra) {
      throw new Error("extra option: " + check.extra[0]);
    }
  };

  /**
   * Gets a preference value.
   *
   * @param {string} name The preference to get. This name may be
   * hierarchical: ``"foo.bar"`` would get the value of ``"bar"`` in
   * ``"foo"``.
   * @returns The value of the preference. If the preference does not
   * exist, the value is ``undefined``.
   * @throws {Error} If ``name`` is malformed.
   */
  Preferences.prototype.get = function get(name) {
    var parts = name.split(".");
    var ix = 0;

    var it = this._prefs;
    while (ix < parts.length) {
      var part = parts[ix];

      if (part === "") {
        throw new Error("empty part in " + name);
      }

      it = it[part];

      if (it === undefined) {
        return undefined;
      }

      ++ix;
    }

    return it;
  };

  /**
   * Sets a preference value. This method fails hard if the value added
   * to the preferences object is invalid somehow, but it fails *after*
   * modifying the preferences. This method is **not** meant to validate
   * user input.
   *
   * @param {string} name The preference to get. This name may be
   * hierarchical: ``"foo.bar"`` would get the value of ``"bar"`` in
   * ``"foo"``.
   * @param value The value to set the preference to.
   * @throws {Error} If ``name`` is malformed, if any part of the name
   * does not exist, or if the resulting preference objects is invalid.
   */
  Preferences.prototype.set = function set(name, value) {
    var parts = name.split(".");
    var ix = 0;

    var it = this._prefs;
    while (ix < parts.length - 1) {
      var part = parts[ix];

      if (part === "") {
        throw new Error("empty part in " + name);
      }

      it = it[part];

      if (it === undefined) {
        it = it[part] = Object.create(null);
      }
      ++ix;
    }

    it[parts[ix]] = value;

    this._validatePrefs(this._prefs);
  };

  exports.Preferences = Preferences;
});
