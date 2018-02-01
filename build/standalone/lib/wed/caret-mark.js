/**
 * This module implements the "caret mark". The "caret mark" is the graphical
 * indicator showing the position of the caret.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "jquery", "./domtypeguards", "./wed-util"], function (require, exports, $, domtypeguards_1, wed_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The "caret mark" is the graphical indicator
     * showing the position of the caret.
     */
    var CaretMark = /** @class */ (function () {
        /**
         * @param manager The caret manager that holds this marker.
         *
         * @param doc The document in which the caret is located.
         *
         * @param layer The layer that holds the caret.
         *
         * @param inputField The input field element that ought to be moved with the
         * caret.
         *
         * @param scroller The scroller element that contains the editor document for
         * which we are managing a caret.
         */
        function CaretMark(manager, doc, layer, inputField, scroller) {
            this.manager = manager;
            this.layer = layer;
            this.inputField = inputField;
            this.scroller = scroller;
            this.suspended = 0;
            this.pendingRefresh = false;
            var el = this.el = doc.createElement("span");
            el.className = "_wed_caret";
            el.setAttribute("contenteditable", "false");
            el.textContent = " ";
            var dummy = this.dummy = doc.createElement("span");
            dummy.textContent = "\u00A0";
            dummy.style.height = "100%";
            dummy.style.width = "1px";
            dummy.style.maxWidth = "1px";
            this.$dummy = $(dummy);
            this.boundRefresh = this.refresh.bind(this);
        }
        /**
         * Suspend refreshing the caret. Calling this function multiple times
         * increases the suspension count. [[resume]] must be called an equal number
         * of times before refreshes are resumed.
         */
        CaretMark.prototype.suspend = function () {
            this.suspended++;
        };
        /**
         * Resume refreshing the caret. This must be called the same number of times
         * [[suspend]] was called before refreshing is actually resumed.
         *
         * This function checks whether anything called [[refresh]] while refreshing
         * was suspended, and if so will call [[refresh]] as soon as refreshing is
         * resumed.
         */
        CaretMark.prototype.resume = function () {
            this.suspended--;
            if (this.suspended < 0) {
                throw new Error("too many calls to resume");
            }
            if (this.pendingRefresh) {
                this.refresh();
                this.pendingRefresh = false;
            }
        };
        /**
         * Refreshes the caret position on screen. If refreshing has been suspended,
         * it records that a refresh was requested but does not actually refresh the
         * caret.
         */
        CaretMark.prototype.refresh = function () {
            if (this.suspended > 0) {
                this.pendingRefresh = true;
                return;
            }
            var el = this.el;
            var caret = this.manager.caret;
            if (caret == null) {
                // We do not remove the fake caret from the DOM here because seeing
                // the caret position when the user is doing work outside the editing
                // pane is useful.
                return;
            }
            var boundary = wed_util_1.boundaryXY(caret);
            var grPosition = this.scroller.getBoundingClientRect();
            var top = boundary.top - grPosition.top + this.scroller.scrollTop;
            var left = boundary.left - grPosition.left + this.scroller.scrollLeft;
            var node = caret.node;
            var heightNode = domtypeguards_1.isElement(node) ? node : node.parentNode;
            var height = getComputedStyle(heightNode).lineHeight;
            var topStr = top + "px";
            var leftStr = left + "px";
            el.style.top = topStr;
            el.style.left = leftStr;
            el.style.height = height;
            el.style.maxHeight = height;
            el.style.minHeight = height;
            // If the fake caret has been removed from the DOM, reinsert it.
            if (el.parentNode === null) {
                this.layer.append(this.el);
            }
            var inputField = this.inputField;
            if (Number(inputField.style.zIndex) > 0) {
                inputField.style.top = topStr;
                inputField.style.left = leftStr;
            }
            else {
                inputField.style.top = "";
                inputField.style.left = "";
            }
        };
        /**
         * @returns The coordinates of the caret marker relative to the scroller.
         */
        CaretMark.prototype.getPositionFromScroller = function () {
            // This function may be called when the caret layer is invisible. So we
            // can't rely on offset. Fortunately, the CSS values are what we want, so...
            var el = this.el;
            // Given our usage scenario, left and top cannot be null.
            var pos = {
                left: Number(el.style.left.replace("px", "")),
                top: Number(el.style.top.replace("px", "")),
            };
            if (isNaN(pos.left) || isNaN(pos.top)) {
                throw new Error("NAN for left or top");
            }
            return pos;
        };
        Object.defineProperty(CaretMark.prototype, "inDOM", {
            /**
             * @returns True if the caret is in the DOM tree, false otherwise.
             */
            get: function () {
                return this.el.parentNode !== null;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Scroll the mark into view.
         */
        CaretMark.prototype.scrollIntoView = function () {
            var pos = this.getPositionFromScroller();
            var rect = this.getBoundingClientRect();
            this.scroller.scrollIntoView(pos.left, pos.top, pos.left + rect.width, pos.top + rect.height);
        };
        /**
         * @returns The bounding client rectangle of the DOM element associated with
         * this marker.
         */
        CaretMark.prototype.getBoundingClientRect = function () {
            return this.el.getBoundingClientRect();
        };
        return CaretMark;
    }());
    exports.CaretMark = CaretMark;
});
//  LocalWords:  MPL scroller contenteditable px
//# sourceMappingURL=caret-mark.js.map