/**
 * Content scroller.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "rxjs", "../domutil"], function (require, exports, module, rxjs_1, domutil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Content scroller. This object is responsible for scrolling the GUI tree.
     */
    var Scroller = (function () {
        /**
         * @param el The DOM element responsible for scrolling.
         */
        function Scroller(el) {
            var _this = this;
            this.el = el;
            this._events = new rxjs_1.Subject();
            /** This is where you can listen to scrolling events. */
            this.events = this._events.asObservable();
            $(el).on("scroll", function () {
                _this._events.next({ scroller: _this });
            });
        }
        Object.defineProperty(Scroller.prototype, "scrollTop", {
            get: function () {
                return this.el.scrollTop;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scroller.prototype, "scrollLeft", {
            get: function () {
                return this.el.scrollLeft;
            },
            enumerable: true,
            configurable: true
        });
        Scroller.prototype.getBoundingClientRect = function () {
            return this.el.getBoundingClientRect();
        };
        /**
         * Coerce this scroller to a specific height in pixels.
         *
         * @param height The height to which to coerce.
         */
        Scroller.prototype.coerceHeight = function (height) {
            var el = this.el;
            var heightStr = height + "px";
            el.style.maxHeight = heightStr;
            el.style.minHeight = heightStr;
        };
        /**
         * Determine whether a point is inside the DOM element managed by this
         * scroller.
         */
        Scroller.prototype.isPointInside = function (x, y) {
            return domutil_1.pointInContents(this.el, x, y);
        };
        /**
         * Scrolls the window and scroller so that the rectangle is visible to the
         * user. The rectangle coordinates must be relative to the scroller
         * element.
         *
         * This method tries to be the least disruptive it can: it will adjust the
         * scoller and the window *just enough* to show the rectangle.
         */
        Scroller.prototype.scrollIntoView = function (left, top, right, bottom) {
            // Adjust gui_root.
            var el = this.el;
            var vtop = el.scrollTop;
            var vheight = el.clientHeight;
            var vbottom = vtop + vheight;
            if (top < vtop || bottom > vbottom) {
                // Not already in view.
                vtop = top < vtop ? top : bottom - vheight;
                el.scrollTop = vtop;
            }
            var vleft = el.scrollLeft;
            var vwidth = el.clientWidth;
            var vright = vleft + vwidth;
            if (left < vleft || right > vright) {
                // Not already in view.
                vleft = left < vleft ? left : right - vwidth;
                el.scrollLeft = vleft;
            }
            var pos = el.getBoundingClientRect();
            // Compute the coordinates relative to the client.
            left = left - vleft + pos.left;
            right = right - vleft + pos.left;
            top = top - vtop + pos.top;
            bottom = bottom - vtop + pos.top;
            var doc = el.ownerDocument;
            var sheight = doc.body.scrollHeight;
            var swidth = doc.body.scrollWidth;
            var byY = 0;
            if (top < 0 || bottom > sheight) {
                byY = top < 0 ? top : bottom;
            }
            var byX = 0;
            if (left < 0 || right > swidth) {
                byX = left < 0 ? left : right;
            }
            doc.defaultView.scrollBy(byX, byY);
        };
        return Scroller;
    }());
    exports.Scroller = Scroller;
});

//# sourceMappingURL=scroller.js.map
