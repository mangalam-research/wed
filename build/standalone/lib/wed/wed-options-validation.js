define(["require", "exports", "module", "ajv", "./wed-options-schema.json"], function (require, exports, module, Ajv, wedOptionsSchema) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _wedOptionsValidator;
    function getValidator() {
        if (_wedOptionsValidator === undefined) {
            _wedOptionsValidator = new Ajv().compile(wedOptionsSchema);
        }
        return _wedOptionsValidator;
    }
    /**
     * Validates and normalizes the options to a specific format.
     *
     * @param options The raw options obtained from the mode.
     *
     * @returns The cleaned options if successful. If there were error the return
     * value is an array of error messages.
     */
    function processWedOptions(options) {
        var errors = [];
        var ovalidator = getValidator();
        var valid = ovalidator(options);
        if (!valid) {
            if (ovalidator.errors !== undefined) {
                for (var _i = 0, _a = ovalidator.errors; _i < _a.length; _i++) {
                    var error = _a[_i];
                    errors.push(error.dataPath + " " + error.message);
                }
            }
            return errors;
        }
        var max = options.label_levels.max;
        var initial = options.label_levels.initial;
        // We cannot validate this with a schema.
        if (initial > max) {
            errors.push("label_levels.initial must be <= label_levels.max");
        }
        if (options.attributes === undefined) {
            options.attributes = "hide";
        }
        // Normalize the format of options.attributes.
        if (typeof options.attributes === "string") {
            var tmp = options.attributes;
            // We need the type cast at the end because otherwise TS infers a type of
            // { handling: "hide" | "show" | "edit" }.
            options.attributes = {
                handling: tmp,
            };
        }
        if (errors.length !== 0) {
            return errors;
        }
        return options;
    }
    exports.processWedOptions = processWedOptions;
});
//  LocalWords:  MPL

//# sourceMappingURL=wed-options-validation.js.map
