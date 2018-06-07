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
define(["require", "exports", "rxjs"], function (require, exports, rxjs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A simple button that can be clicked.
     */
    var Button = /** @class */ (function () {
        /**
         * @param desc The full description of what the button does. This will be used
         * in the button's tooltip.
         *
         * @param abbreviatedDesc An abbreviated description. This may be used as text
         * inside the button.
         *
         * @param icon An optional icon for the button.
         *
         * @param extraClass Extra classes to add to ``className``.
         */
        function Button(desc, abbreviatedDesc, icon, extraClass) {
            if (icon === void 0) { icon = ""; }
            if (extraClass === void 0) { extraClass = ""; }
            this.desc = desc;
            this.abbreviatedDesc = abbreviatedDesc;
            this.icon = icon;
            this.extraClass = extraClass;
            /**
             * The object on which this class and subclasses may push new events.
             */
            this._events = new rxjs_1.Subject();
            /**
             * The observable on which clients can listen for events.
             */
            this.events = this._events.asObservable();
        }
        Object.defineProperty(Button.prototype, "buttonClassName", {
            /** The class name that [[makeButton]] must use. */
            get: function () {
                var extraClass = this.extraClass;
                if (extraClass !== "") {
                    extraClass = " " + extraClass;
                }
                return "btn btn-default" + extraClass;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "buttonText", {
            /**
             * The text that goes inside a button. This is the abbreviated description, or
             * if unavailable, the long description.
             */
            get: function () {
                // If we don't have an abbreviation, we get the regular description.
                return this.abbreviatedDesc === undefined ?
                    this.desc : this.abbreviatedDesc;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Render the button.
         *
         * @param parent On first render, this parameter must contain the parent DOM
         * element of the button. On later renders, this parameter is ignored.
         *
         */
        Button.prototype.render = function (parent) {
            var position = null;
            if (this.el !== undefined) {
                position = this.el.nextSibling;
                parent = this.el.parentNode;
                var $el = $(this.el);
                $el.remove();
                $el.tooltip("destroy");
            }
            if (parent == null) {
                throw new Error("called first render without a parent");
            }
            var button = this.makeButton(parent.ownerDocument);
            this.el = button;
            parent.insertBefore(button, position);
        };
        /**
         * Create a button, fill its contents, set its tooltip and add the event
         * handlers.
         *
         * @param doc The document in which we are creating the element.
         *
         * @returns The new button.
         */
        Button.prototype.makeButton = function (doc) {
            var button = doc.createElement("button");
            button.className = this.buttonClassName;
            var $button = $(button);
            this.setButtonContent(button);
            this.setButtonTooltip($button);
            this.setButtonEventHandlers($button);
            return button;
        };
        /**
         * Fill the content of the button.
         *
         * @param button The button to fill.
         */
        Button.prototype.setButtonContent = function (button) {
            var icon = this.icon;
            if (icon !== "") {
                // tslint:disable-next-line:no-inner-html
                button.innerHTML = icon;
            }
            else {
                button.textContent = this.buttonText;
            }
        };
        /**
         * Make a tooltip for the button.
         *
         * @param $button The button for which to make a tooltip.
         */
        Button.prototype.setButtonTooltip = function ($button) {
            var desc = this.desc;
            if (this.icon !== "" || this.buttonText !== desc) {
                $button[0].setAttribute("title", desc);
                $button.tooltip({ title: desc,
                    container: "body",
                    placement: "auto",
                    trigger: "hover" });
            }
        };
        /**
         * Set event handlers on the button.
         */
        Button.prototype.setButtonEventHandlers = function ($button) {
            var _this = this;
            $button.click(function () {
                _this._events.next({ name: "Click", button: _this });
                return false;
            });
            // Prevents acquiring the focus.
            $button.mousedown(false);
        };
        return Button;
    }());
    exports.Button = Button;
    /**
     * A button that represents an on/off state.
     */
    var ToggleButton = /** @class */ (function (_super) {
        __extends(ToggleButton, _super);
        /**
         * @param initialyPressed Whether the button is initially pressed.
         *
         * @param desc See [[Button]].
         *
         * @param abbreviatedDesc See [[Button]].
         *
         * @param icon See [[Button]].
         *
         * @param extraClass See [[Button]].
         */
        function ToggleButton(initialyPressed, desc, abbreviatedDesc, icon, extraClass) {
            if (icon === void 0) { icon = ""; }
            if (extraClass === void 0) { extraClass = ""; }
            var _this = _super.call(this, desc, abbreviatedDesc, icon, extraClass) || this;
            _this.desc = desc;
            _this.abbreviatedDesc = abbreviatedDesc;
            _this.icon = icon;
            _this.extraClass = extraClass;
            _this._pressed = initialyPressed;
            _this.events.subscribe(function (event) {
                if (event.name !== "Click" || _this.el === undefined) {
                    return;
                }
                _this._pressed = !_this._pressed;
                _this.render();
            });
            return _this;
        }
        Object.defineProperty(ToggleButton.prototype, "pressed", {
            /**
             * Whether the button is in the pressed state.
             */
            get: function () {
                return this._pressed;
            },
            set: function (value) {
                if (this._pressed === value) {
                    return;
                }
                this._pressed = value;
                if (this.el !== undefined) {
                    this.render();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ToggleButton.prototype, "buttonClassName", {
            get: function () {
                var extraClass = this.extraClass;
                if (extraClass !== "") {
                    extraClass = " " + extraClass;
                }
                return "btn btn-default" + extraClass + (this._pressed ? " active" : "");
            },
            enumerable: true,
            configurable: true
        });
        return ToggleButton;
    }(Button));
    exports.ToggleButton = ToggleButton;
});
//# sourceMappingURL=button.js.map