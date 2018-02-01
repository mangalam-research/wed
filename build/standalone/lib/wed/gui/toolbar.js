/**
 * A toolbar for editors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "./button"], function (require, exports, button_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A toolbar is a horizontal element which contains a series of buttons from
     * which the user can initiate actions.
     *
     * The toolbar contains buttons for two types of buttons:
     *
     * - Buttons not associated with any specific mode. These are editor-wide
     *   actions that may be set by the application in which the editor instance is
     *   used.
     *
     * - Buttons specific to a mode.
     */
    var Toolbar = /** @class */ (function () {
        function Toolbar() {
            var top = this.top = document.createElement("div");
            this.top.className = "wed-toolbar";
            this.divider = document.createElement("span");
            this.divider.className = "wed-toolbar-divider";
            this.modeSpan = document.createElement("span");
            top.appendChild(this.divider);
            top.appendChild(this.modeSpan);
        }
        /**
         * Add one or more buttons to the toolbar.
         *
         * @param buttons A single button or an array of buttons to add.
         *
         * @param options Parameters affecting how the addition is made.
         */
        Toolbar.prototype.addButton = function (buttons, options) {
            if (options === void 0) { options = {}; }
            if ((buttons instanceof button_1.Button)) {
                buttons = [buttons];
            }
            var prepend = options.prepend === true;
            var right = options.right === true;
            if (prepend && right) {
                throw new Error("cannot use prepend and right at the same time.");
            }
            var top = this.top;
            var frag = top.ownerDocument.createDocumentFragment();
            for (var _i = 0, buttons_1 = buttons; _i < buttons_1.length; _i++) {
                var button = buttons_1[_i];
                if (right) {
                    var wrap = top.ownerDocument.createElement("span");
                    wrap.className = right ? "pull-right" : "";
                    button.render(wrap);
                    frag.appendChild(wrap);
                }
                else {
                    button.render(frag);
                }
            }
            if (right) {
                top.appendChild(frag);
            }
            else {
                top.insertBefore(frag, prepend ? top.firstChild : this.divider);
            }
        };
        /**
         * Set the mode related buttons. This replaces any buttons previously set by
         * this method.
         *
         * @param buttons The buttons to add to the toolbar.
         */
        Toolbar.prototype.setModeButtons = function (buttons) {
            // tslint:disable-next-line:no-inner-html
            this.modeSpan.innerHTML = "";
            for (var _i = 0, buttons_2 = buttons; _i < buttons_2.length; _i++) {
                var button = buttons_2[_i];
                button.render(this.modeSpan);
            }
        };
        return Toolbar;
    }());
    exports.Toolbar = Toolbar;
});
//# sourceMappingURL=toolbar.js.map