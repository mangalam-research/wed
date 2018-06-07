var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "ajv"], function (require, exports, ajv_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ajv_1 = __importDefault(ajv_1);
    /**
     * Base class for all JSON readers.
     */
    var MetadataJSONReader = /** @class */ (function () {
        /**
         * @param schema The JSON schema with which to validate the metadata.
         */
        function MetadataJSONReader(schema) {
            this.schema = schema;
        }
        Object.defineProperty(MetadataJSONReader.prototype, "validator", {
            /**
             * A validator that uses the schema set for this reader.
             */
            get: function () {
                if (this._validator === undefined) {
                    var ajv = new ajv_1.default();
                    this._validator = ajv.compile(this.schema);
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
         * Validate the object against the schema that was set for this reader.
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
//  LocalWords:  MPL
//# sourceMappingURL=metadata-json-reader.js.map