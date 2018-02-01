/**
 * A model for preferences. The preferences stored in this object must be
 * serializable as JSON. The class itself does not enforce this, so callers must
 * be careful.
 */
export declare class Preferences {
    private readonly prefs;
    /**
     * @param initial initial preferences.
     * @throws {Error} If there is any error in the preferences.
     */
    constructor(initial?: {});
    /**
     * Validates a set of preferences.
     *
     * @param prefs The preferences to validate.
     * @throws {Error} If there is any error in the preferences.
     */
    _validatePrefs(prefs: {}): void;
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
    get(name: string): any;
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
    set(name: string, value: any): void;
}
