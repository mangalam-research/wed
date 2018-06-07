var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "interactjs", "../browsers"], function (require, exports, interactjs_1, browsers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    interactjs_1 = __importDefault(interactjs_1);
    browsers = __importStar(browsers);
    /**
     * This records changes in such a way that if any of the changes cannot take
     * effect, then all the changes are "rolled back". It is called pseudo-atomic
     * because it is not really meant to track any changes that do not happen
     * through instances of this class. This is needed because we are changing the
     * size of multiple elements, and beyond a certain "smallness", some elements
     * won't register any change in dimensions (perhaps due to "min-..." styles.
     */
    var PseudoAtomicRectChange = /** @class */ (function () {
        function PseudoAtomicRectChange() {
            this.changes = [];
            this.rolledback = false;
        }
        PseudoAtomicRectChange.prototype.updateElementRect = function (el, dx, dy) {
            // If we've already rolled back, we don't do anything.
            if (this.rolledback) {
                return;
            }
            var rect = el.getBoundingClientRect();
            // This works around a fractional pixel issue in IE. We set the element to
            // the dimensions returned by getBoundingClientRect and then reacquire the
            // dimensions to account for any funny adjustments IE may decide to do.
            if (browsers.MSIE) {
                el.style.width = rect.width + "px";
                el.style.height = rect.height + "px";
                rect = el.getBoundingClientRect();
            }
            var width = rect.width + dx;
            var height = rect.height + dy;
            el.style.width = width + "px";
            el.style.height = height + "px";
            this.changes.push({ el: el, rect: rect });
            var newRect = el.getBoundingClientRect();
            // Check whether the change "took". If not, roll back.
            if (newRect.width !== width || newRect.height !== height) {
                this.rollback();
            }
        };
        PseudoAtomicRectChange.prototype.rollback = function () {
            var changes = this.changes;
            for (var _i = 0, changes_1 = changes; _i < changes_1.length; _i++) {
                var change = changes_1[_i];
                var el = change.el;
                var rect = change.rect;
                el.style.width = rect.width + "px";
                el.style.height = rect.height + "px";
            }
            this.rolledback = true;
        };
        return PseudoAtomicRectChange;
    }());
    /**
     * Make a bootstrap dialog resizable by clicking on its edge.
     *
     * @param $top The top level element of the dialog.
     */
    function makeResizable($top) {
        // We listen to resizestart and resizeend to deal with the following scenario:
        // the user starts resizing the modal, it goes beyond the limits of how big it
        // can be resized, the mouse pointer moves outside the modal window and the
        // user releases the button when the pointer is outside. Without the use of
        // ignoreBackdropClick, this causes the modal to close.
        var content = $top.find(".modal-content")[0];
        var body = $top.find(".modal-body")[0];
        interactjs_1.default(content)
            .resizable({})
            .on("resizestart", function () {
            var modal = $top.data("bs.modal");
            if (modal == null) {
                return; // Deal with edge cases.
            }
            // Prevent modal closure.
            modal.ignoreBackdropClick = true;
        })
            .on("resizeend", function () {
            // We use a setTimeout otherwise we turn ignoreBackdropClick too soon.
            setTimeout(function () {
                var modal = $top.data("bs.modal");
                if (modal == null) {
                    return; // Deal with edge cases.
                }
                modal.ignoreBackdropClick = false;
            }, 0);
        })
            .on("resizemove", function (event) {
            var target = event.target;
            var change = new PseudoAtomicRectChange();
            change.updateElementRect(target, event.dx, event.dy);
            change.updateElementRect(body, event.dx, event.dy);
        });
    }
    exports.makeResizable = makeResizable;
    /**
     * Make a bootstrap dialog draggable by clicking and dragging the header.
     *
     * @param $top The top level element of the dialog.
     */
    function makeDraggable($top) {
        var win = $top[0].ownerDocument.defaultView;
        var header = $top.find(".modal-header")[0];
        var content = $top.find(".modal-content")[0];
        var startLeft;
        var startTop;
        interactjs_1.default(header)
            .draggable({
            restrict: {
                restriction: {
                    left: 0,
                    top: 0,
                    right: win.innerWidth - 10,
                    bottom: win.innerHeight - 10,
                },
            },
        })
            .on("dragstart", function () {
            startLeft = content.offsetLeft;
            startTop = content.offsetTop;
        })
            .on("dragmove", function (event) {
            content.style.left = startLeft + event.clientX - event.clientX0 + "px";
            content.style.top = startTop + event.clientY - event.clientY0 + "px";
        });
    }
    exports.makeDraggable = makeDraggable;
});
//# sourceMappingURL=interactivity.js.map