define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A layer manager allows operating on layers as a group.
     */
    var LayerManager = (function () {
        /**
         * @param doc The DOM document for which this manager exists.
         */
        function LayerManager(doc) {
            this.doc = doc;
            this.layers = [];
        }
        /**
         * Add a layer to the manager. You should not need to do this as layers add
         * themselves at initialization.
         */
        LayerManager.prototype.addLayer = function (layer) {
            this.layers.push(layer);
        };
        /**
         * Temporarily hide the layers. The previous visibility will be restored by
         * [[popVisibility]].
         */
        LayerManager.prototype.hideTemporarily = function () {
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.hideTemporarily();
            }
        };
        /**
         * Undo the hiding that was done with [[hideTemporarily]]. It is an error to
         * call this more than [[hideTemporarily]] was called.
         */
        LayerManager.prototype.popVisibility = function () {
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.popVisibility();
            }
        };
        /**
         * Returns the element under the point, ignoring the editor's layers.
         *
         * @param x The x coordinate.
         *
         * @param y The y coordinate.
         *
         * @returns The element under the point, or ``undefined`` if the point is
         * outside the document.
         */
        LayerManager.prototype.elementAtPointUnderLayers = function (x, y) {
            return this.doc.elementFromPoint(x, y);
        };
        return LayerManager;
    }());
    exports.LayerManager = LayerManager;
});

//# sourceMappingURL=layer-manager.js.map
