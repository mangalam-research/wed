define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This task processes the new validation errors that have not been processed
     * yet.
     */
    var ProcessValidationErrors = /** @class */ (function () {
        function ProcessValidationErrors(controller) {
            this.controller = controller;
            this.errors = [];
        }
        ProcessValidationErrors.prototype.reset = function () {
            this.errors = this.controller.copyErrorList();
        };
        ProcessValidationErrors.prototype.cycle = function () {
            var controller = this.controller;
            var errors = this.errors;
            if (errors.length === 0) {
                return false;
            }
            // The figure in the next line is arbitrary.
            var count = Math.min(errors.length, 30);
            var items = [];
            var markers = [];
            var ix = 0;
            while (count !== 0) {
                count--;
                var error = errors[ix];
                if (controller.processError(error)) {
                    errors.splice(ix, 1);
                    var item = error.item;
                    if (item === undefined) {
                        throw new Error("there should be an item");
                    }
                    items.push(item);
                    var marker = error.marker;
                    // There may be no marker set.
                    if (marker != null) {
                        markers.push(marker);
                    }
                }
                else {
                    ++ix;
                }
            }
            controller.appendItems(items);
            controller.appendMarkers(markers);
            return errors.length !== 0;
        };
        return ProcessValidationErrors;
    }());
    exports.ProcessValidationErrors = ProcessValidationErrors;
});
//  LocalWords:  MPL
//# sourceMappingURL=process-validation-errors.js.map