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
define(["require", "exports", "module", "./layer"], function (require, exports, module, layer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A layer that manages carets.
     */
    var CaretLayer = (function (_super) {
        __extends(CaretLayer, _super);
        function CaretLayer(manager, el) {
            var _this = _super.call(this, manager, el) || this;
            _this.$el = $(el);
            _this.$el.on("mousedown click contextmenu", _this.caretLayerMouseHandler.bind(_this));
            return _this;
        }
        CaretLayer.prototype.caretLayerMouseHandler = function (e) {
            if (e.type === "mousedown") {
                this.$el.on("mousemove", this.caretLayerMouseHandler.bind(this));
                this.$el.one("mouseup", this.caretLayerMouseHandler.bind(this));
            }
            var elAtMouse = this.manager.elementAtPointUnderLayers(e.clientX, e.clientY);
            if (elAtMouse !== undefined) {
                var newE = $.Event(e.type, e);
                newE.target = elAtMouse;
                // tslint:disable-next-line:no-any
                newE.toElement = elAtMouse;
                $(elAtMouse).trigger(newE);
                if (e.type === "mouseup") {
                    this.$el.off("mousemove");
                }
            }
            e.preventDefault();
            e.stopPropagation();
        };
        return CaretLayer;
    }(layer_1.Layer));
    exports.CaretLayer = CaretLayer;
});

//# sourceMappingURL=caret-layer.js.map
