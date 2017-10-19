define(["require", "exports", "module", "lodash", "./object-check"], function (require, exports, module, _, object_check_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var template = {
        tooltips: false,
    };
    /**
     * A model for preferences. The preferences stored in this object must be
     * serializable as JSON. The class itself does not enforce this, so callers must
     * be careful.
     */
    var Preferences = /** @class */ (function () {
        /**
         * @param {Object} [initial={}] The initial preferences.
         * @throws {Error} If there is any error in the preferences.
         */
        function Preferences(initial) {
            if (initial === undefined) {
                // Custom code here to avoid a pointless call to ``._extend``.
                this.prefs = Object.create(null);
                this._validatePrefs(this.prefs);
                return;
            }
            this._validatePrefs(initial);
            this.prefs = _.extend(Object.create(null), initial);
        }
        /**
         * Validates a set of preferences.
         *
         * @param prefs The preferences to validate.
         * @throws {Error} If there is any error in the preferences.
         */
        Preferences.prototype._validatePrefs = function (prefs) {
            var result = object_check_1.check(template, prefs);
            // This is not the place to provide diagnosis for the end user: fail hard if
            // something is wrong.
            if (result.missing !== undefined) {
                throw new Error("missing option: " + result.missing[0]);
            }
            if (result.extra !== undefined) {
                throw new Error("extra option: " + result.extra[0]);
            }
        };
        /**
         * Gets a preference value.
         *
         * @param name The preference to get. This name may be hierarchical:
         * ``"foo.bar"`` would get the value of ``"bar"`` in ``"foo"``.
         *
         * @returns The value of the preference. If the preference does not exist, the
         * value is ``undefined``.
         *
         * @throws {Error} If ``name`` is malformed.
         */
        // tslint:disable-next-line:no-reserved-keywords no-any
        Preferences.prototype.get = function (name) {
            var parts = name.split(".");
            var ix = 0;
            // tslint:disable-next-line:no-any
            var it = this.prefs;
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
         * Sets a preference value. This method fails hard if the value added to the
         * preferences object is invalid somehow, but it fails *after* modifying the
         * preferences. This method is **not** meant to validate user input.
         *
         * @param name The preference to get. This name may be hierarchical:
         * ``"foo.bar"`` would get the value of ``"bar"`` in ``"foo"``.
         *
         * @param value The value to set the preference to.
         *
         * @throws {Error} If ``name`` is malformed, if any part of the name does not
         * exist, or if the resulting preference objects is invalid.
         */
        // tslint:disable-next-line:no-reserved-keywords no-any
        Preferences.prototype.set = function (name, value) {
            var parts = name.split(".");
            var ix = 0;
            // tslint:disable-next-line:no-any
            var it = this.prefs;
            while (ix < parts.length - 1) {
                var part = parts[ix];
                if (part === "") {
                    throw new Error("empty part in " + name);
                }
                it = it[part];
                if (it === undefined) {
                    // tslint:disable-next-line:no-any
                    it = it[part] = Object.create(null);
                }
                ++ix;
            }
            it[parts[ix]] = value;
            this._validatePrefs(this.prefs);
        };
        return Preferences;
    }());
    exports.Preferences = Preferences;
});
//  LocalWords:  wed's MPL

//# sourceMappingURL=preferences.js.map
