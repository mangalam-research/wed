/**
 * This module is responsible for validating the document being edited in wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "module", "salve-dom", "./dloc", "./domtypeguards"], function (require, exports, module, salve_dom_1, dloc, domtypeguards_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INCOMPLETE = salve_dom_1.WorkingState.INCOMPLETE;
    exports.WORKING = salve_dom_1.WorkingState.WORKING;
    exports.INVALID = salve_dom_1.WorkingState.INVALID;
    exports.VALID = salve_dom_1.WorkingState.VALID;
    /**
     * A document validator.
     */
    var Validator = (function (_super) {
        __extends(Validator, _super);
        /**
         * @param schema A path to the schema to pass to salve for validation. This is
         * a path that will be interpreted by RequireJS. The schema must have already
         * been prepared for use by salve. See salve's documentation. Or this can be a
         * ``Grammar`` object that has already been produced from ``salve``'s
         * ``constructTree``.
         *
         * @param root The root of the DOM tree to validate. This root contains the
         * document to validate but is not **part** of it.
         *
         * @param modeValidator The mode-specific validator to use.
         */
        function Validator(schema, root, modeValidator) {
            var _this = _super.call(this, schema, root, {
                timeout: 0,
                maxTimespan: 100,
            }) || this;
            _this.modeValidator = modeValidator;
            return _this;
        }
        /**
         * Runs document-wide validation specific to the mode passed to
         * the validator.
         */
        Validator.prototype._runDocumentValidation = function () {
            if (this.modeValidator === undefined) {
                return;
            }
            var errors = this.modeValidator.validateDocument();
            for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                var error = errors_1[_i];
                this._processError(error);
            }
        };
        Validator.prototype.possibleAt = function (container, index, attributes) {
            if (index === void 0) { index = false; }
            if (attributes === void 0) { attributes = false; }
            if (container instanceof dloc.DLoc) {
                if (typeof index !== "boolean") {
                    throw new Error("2nd parameter must be boolean");
                }
                attributes = index;
                index = container.offset;
                container = container.node;
            }
            if (typeof index !== "number") {
                throw new Error("index must be a number");
            }
            return _super.prototype.possibleAt.call(this, container, index, attributes);
        };
        Validator.prototype.speculativelyValidate = function (container, index, toParse) {
            if (container instanceof dloc.DLoc) {
                if (!(domtypeguards_1.isNode(index) || index instanceof Array)) {
                    throw new Error("2nd argument must be a Node or an array of Nodes");
                }
                toParse = index;
                index = container.offset;
                container = container.node;
            }
            if (typeof index !== "number") {
                throw new Error("index must be a number");
            }
            if (toParse === undefined) {
                throw new Error("toParse must be defined");
            }
            return _super.prototype.speculativelyValidate.call(this, container, index, toParse);
        };
        Validator.prototype.speculativelyValidateFragment = function (container, index, toParse) {
            if (container instanceof dloc.DLoc) {
                if ((typeof index === "number") || !domtypeguards_1.isElement(index)) {
                    // It appears as "toParse" to the caller, not "index".
                    throw new Error("toParse is not an element");
                }
                toParse = index;
                index = container.offset;
                container = container.node;
            }
            if (typeof index !== "number") {
                throw new Error("index must be a number");
            }
            if (toParse === undefined) {
                throw new Error("toParse must be defined");
            }
            return _super.prototype.speculativelyValidateFragment.call(this, container, index, toParse);
        };
        return Validator;
    }(salve_dom_1.Validator));
    exports.Validator = Validator;
});
//  LocalWords:  revalidating inspect's leaveContext leaveStartTag el
//  LocalWords:  attributeValue endTag attributeName enterContext DOM
//  LocalWords:  SimpleEventEmitter namespace mixin ProgressState oop
//  LocalWords:  validateUpTo unclosed fireEvent definePrefix xmlns
//  LocalWords:  speculativelyValidate RequireJS enterStartTag MPL
//  LocalWords:  namespaces validator Mangalam Dubeau nextSibling
//  LocalWords:  prev whitespace boolean jquery util

//# sourceMappingURL=validator.js.map
