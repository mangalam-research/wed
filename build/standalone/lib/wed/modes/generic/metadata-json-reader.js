define(["require", "exports", "module", "ajv"], function (require, exports, module, Ajv) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Base class for all JSON readers.
     */
    var MetadataJSONReader = (function () {
        /**
         * @param schema The JSON schema with which to validate the metadata.
         */
        function MetadataJSONReader(schema) {
            this.schema = schema;
        }
        Object.defineProperty(MetadataJSONReader.prototype, "validator", {
            /**
             * A validator that uses [[schema]].
             */
            get: function () {
                if (this._validator === undefined) {
                    var ajv = new Ajv();
                    this._validator = ajv.compile(JSON.parse(this.schema));
                }
                return this._validator;
            },
            enumerable: true,
            configurable: true
        });
        MetadataJSONReader.prototype.read = function (object) {
            this.validate(object);
            return this.convert(object);
        };
        /**
         * Validate the object against [[schema]].
         *
         * @param object The object to validate.
         */
        MetadataJSONReader.prototype.validate = function (object) {
            var validator = this.validator;
            var valid = validator(object);
            if (!valid) {
                if (validator.errors === undefined) {
                    throw new Error("metadata JSON invalid but no errors!");
                }
                var error = new Error("failed to validate");
                // Yes, we cheat. This is not meant to be a full-fledged diagnosis
                // mechanism.
                // tslint:disable-next-line:no-any
                error.jsonErrors = validator.errors;
                throw error;
            }
        };
        return MetadataJSONReader;
    }());
    exports.MetadataJSONReader = MetadataJSONReader;
});

//# sourceMappingURL=metadata-json-reader.js.map
