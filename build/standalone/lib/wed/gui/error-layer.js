/**
 * Specialized layer for error markers.
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
define(["require", "exports", "./layer"], function (require, exports, layer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Specialized layer for error markers.
     */
    var ErrorLayer = /** @class */ (function (_super) {
        __extends(ErrorLayer, _super);
        function ErrorLayer(el) {
            var _this = _super.call(this, el) || this;
            _this.el = el;
            return _this;
        }
        ErrorLayer.prototype.select = function (marker) {
            if (marker.parentNode !== this.el) {
                throw new Error("marker is not a child of the layer element");
            }
            this.unselectAll();
            marker.classList.add("selected");
        };
        ErrorLayer.prototype.unselectAll = function () {
            var child = this.el.firstElementChild;
            while (child !== null) {
                child.classList.remove("selected");
                child = child.nextElementSibling;
            }
        };
        return ErrorLayer;
    }(layer_1.Layer));
    exports.ErrorLayer = ErrorLayer;
});
//  LocalWords:  MPL
//# sourceMappingURL=error-layer.js.map