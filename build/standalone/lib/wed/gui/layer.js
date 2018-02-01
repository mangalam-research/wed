/**
 * Layers over the editing area.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This class represents a layer over the editing area. Layers are used to show
     * information that are above (in z order) the edited content.
     */
    var Layer = /** @class */ (function () {
        /**
         * @param el The DOM element which is the layer.
         */
        function Layer(el) {
            this.el = el;
        }
        /**
         * Remove all elements from the layer.
         */
        Layer.prototype.clear = function () {
            var el = this.el;
            while (el.lastChild !== null) {
                el.removeChild(el.lastChild);
            }
        };
        /**
         * Append a child to a layer.
         *
         * @param child The child to append. This could be a document fragment if you
         * want to add multiple nodes at once.
         */
        Layer.prototype.append = function (child) {
            this.el.appendChild(child);
        };
        return Layer;
    }());
    exports.Layer = Layer;
});
//  LocalWords:  MPL
//# sourceMappingURL=layer.js.map