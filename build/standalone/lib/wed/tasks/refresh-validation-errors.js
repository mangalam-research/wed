define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This task refreshes the position of the validation error markers on the
     * screen.
     */
    var RefreshValidationErrors = /** @class */ (function () {
        function RefreshValidationErrors(controller) {
            this.controller = controller;
        }
        RefreshValidationErrors.prototype.reset = function () {
            this.errors = this.controller.copyErrorList();
            this.resumeAt = 0;
        };
        RefreshValidationErrors.prototype.cycle = function () {
            var ix = this.resumeAt;
            // The figure of 20 is arbitrary.
            var thisMax = Math.min(this.errors.length, this.resumeAt + 20);
            var errors = this.errors;
            while (ix < thisMax) {
                var error = errors[ix];
                // We work only on those that already have a marker.
                if (error.marker != null) {
                    this.controller.processError(error);
                }
                ix++;
            }
            this.resumeAt = ix;
            return ix < errors.length;
        };
        return RefreshValidationErrors;
    }());
    exports.RefreshValidationErrors = RefreshValidationErrors;
});
//  LocalWords:  MPL
//# sourceMappingURL=refresh-validation-errors.js.map