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
define(["require", "exports", "jquery", "../domutil", "../key-constants", "bootstrap", "typeahead"], function (require, exports, jquery_1, domutil, keyConstants) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    jquery_1 = __importDefault(jquery_1);
    domutil = __importStar(domutil);
    keyConstants = __importStar(keyConstants);
    /**
     * A typeahead popup GUI element.
     */
    var TypeaheadPopup = /** @class */ (function () {
        /**
         * @param doc The DOM document for which to make this popup.
         *
         * @param x Position of popup. The popup may ignore the position if it would
         * overflow off the screen or not have enough space to reasonably show the
         * choices for typing ahead.
         *
         * @param y Position of popup.
         *
         * @param width The desired width of the popup. This value may get overridden.
         *
         * @param  placeholder The placeholder text to use.
         *
         * @param options The options to pass to the underlying Twitter Typeahead
         * menu.
         *
         * @param dismissCallback Function to call when the popup is dismissed.
         */
        // tslint:disable-next-line:max-func-body-length
        function TypeaheadPopup(doc, x, y, width, placeholder, options, 
        // tslint:disable-next-line:no-any
        dismissCallback) {
            var _this = this;
            this.dismissed = false;
            var taWrapper = domutil.htmlToElements("<div class=\"wed-typeahead-popup\">\
<input class=\"typeahead form-control\" type=\"text\">\
<span class=\"spinner\"><i class=\"fa fa-spinner fa-spin\"></i></span></div>", doc)[0];
            var ta = taWrapper.firstElementChild;
            ta.setAttribute("placeholder", placeholder);
            this.taWrapper = taWrapper;
            this.dismissCallback = dismissCallback;
            this.backdrop = document.createElement("div");
            this.backdrop.className = "wed-typeahead-popup-backdrop";
            jquery_1.default(this.backdrop).click(function () {
                _this.dismiss();
                return false;
            });
            taWrapper.style.width = width + "px";
            taWrapper.style.left = x + "px";
            taWrapper.style.top = y + "px";
            var $ta = this.$ta = jquery_1.default(ta);
            var args = [options.options];
            if (options.datasets != null && options.datasets.length > 0) {
                args = args.concat(options.datasets);
            }
            $ta.typeahead.apply($ta, args);
            $ta.on("keydown", this._keydownHandler.bind(this));
            $ta.on("typeahead:selected", this._selectedHandler.bind(this));
            var body = doc.body;
            body.insertBefore(taWrapper, body.firstChild);
            body.insertBefore(this.backdrop, body.firstChild);
            // Verify if we're going to run off screen. If so, then modify our position
            // to be inside the screen.
            var actualWidth = taWrapper.offsetWidth;
            var winWidth = doc.defaultView.innerWidth;
            // The x value that would put the menu just against the side of the window
            // is actualWidth - winWidth. If x is less than it, then x is the value we
            // want, but we don't want less than 0.
            taWrapper.style.left = Math.max(0, Math.min(x, winWidth -
                actualWidth)) + "px";
            taWrapper.style.maxWidth = winWidth + "px";
            var winHeight = doc.defaultView.innerHeight;
            var maxHeight = winHeight - y;
            taWrapper.style.maxHeight = maxHeight + "px";
            var dropdown = taWrapper.getElementsByClassName("tt-menu")[0];
            var $dropdown = jquery_1.default(dropdown);
            // Yep, we forcibly display it here because the next computations depend on
            // the dropdown being visible.
            var oldDisplay = dropdown.style.display;
            dropdown.style.display = "block";
            // We arbitrarily want to show at least five lines of information. (Which
            // may or may not translate to 4 choices. This is not the goal. The goal is
            // just to show a reasonable amount of information.)
            var fiveLines = Number($dropdown.css("line-height").replace("px", "")) * 5;
            var dropdownPos = dropdown.getBoundingClientRect();
            var dropdownMaxHeight = winHeight - dropdownPos.top;
            if (dropdownMaxHeight < fiveLines) {
                // Less than 5 lines: we need to move up.
                y -= fiveLines - dropdownMaxHeight;
                dropdownMaxHeight = fiveLines;
                taWrapper.style.top = y + "px";
            }
            dropdown.style.maxHeight = dropdownMaxHeight + "px";
            // Restore it. It was probably hidden.
            dropdown.style.display = oldDisplay;
            // Work around a stupid issue with typeahead. The problem is that
            // **hovering** over a choice makes it so that the choice is considered to
            // be the one to be selected when ENTER is pressed. This can lead to
            // inconsistent behavior from browser to browser. (It certainly messed up
            // testing.)
            $dropdown.off("mouseenter.tt", ".tt-suggestion");
            $dropdown.off("mouseleave.tt", ".tt-suggestion");
            // Prevent clicks from propagating up.
            $dropdown.on("click", false);
            ta.focus();
            // Typeahead will consider itself "activated" once it is focused. On most
            // platforms the focus above is delivered right away. However, on IE the
            // focus event is sent to elements asynchronously. Which means that the
            // typeahead could become "activated" much later than the end of this
            // constructor. For our purposes we want the typeahead to be activated right
            // away. So we unfortunately break through into private bits of the
            // typeahead code.
            var tt = jquery_1.default.data(ta, "ttTypeahead");
            tt.isActivated = true;
            // The default implementation closes the dropdown when the input is
            // unfocused. This is not a particularly good behavior for
            // wed. Unfortunately, the only way to rectify it is to break into the
            // private parts of typeahead.
            tt.input.off("blurred");
            tt._onBlurred = function _onBlurred() {
                this.isActivated = false;
            };
            tt.input.onSync("blurred", tt._onBlurred, tt);
        }
        /**
         * Dismisses the popup. Calls the callback that was passed when the popup was
         * created, if any.
         *
         * @param obj This should be the object selected by the user, if any. This
         * will be passed to the ``dismissCallback`` that was passed when the popup
         * was created, if any. If you call this method directly and want a selection
         * to occur, take care to use an object which is from the data set passed in
         * the ``options`` parameter that was used when the popup was created. The
         * value ``undefined`` means no object was selected.
         */
        // tslint:disable-next-line:no-any
        TypeaheadPopup.prototype.dismiss = function (obj) {
            if (this.dismissed) {
                return;
            }
            var taWrapper = this.taWrapper;
            if (taWrapper !== undefined && taWrapper.parentNode !== null) {
                taWrapper.parentNode.removeChild(taWrapper);
            }
            var backdrop = this.backdrop;
            if (backdrop !== undefined && backdrop.parentNode !== null) {
                backdrop.parentNode.removeChild(backdrop);
            }
            if (this.dismissCallback !== undefined) {
                this.dismissCallback(obj);
            }
            this.dismissed = true;
        };
        /**
         * Event handler for keydown events on the popup. The default implementation
         * is to dismiss the popup if escape is pressed.
         */
        TypeaheadPopup.prototype._keydownHandler = function (ev) {
            if (keyConstants.ESCAPE.matchesEvent(ev)) {
                this.dismiss();
                return false;
            }
            return undefined;
        };
        /**
         * Event handler for typeahead:selected events. The default implementation is
         * to dismiss the popup.
         */
        // tslint:disable-next-line:no-any
        TypeaheadPopup.prototype._selectedHandler = function (_ev, obj) {
            this.dismiss(obj);
        };
        /**
         * Hide the spinner that was created to indicate that the data is being
         * loaded.
         */
        TypeaheadPopup.prototype.hideSpinner = function () {
            this.taWrapper.getElementsByClassName("spinner")[0]
                .style.display = "none";
        };
        /**
         * Set the value in the input field of the typeahead. This also updates the
         * suggestions.
         *
         * @param value The new value.
         */
        TypeaheadPopup.prototype.setValue = function (value) {
            // tslint:disable-next-line:no-any
            this.$ta.typeahead("val", value);
        };
        return TypeaheadPopup;
    }());
    exports.TypeaheadPopup = TypeaheadPopup;
});
//  LocalWords:  typeahead MPL px keydown actualWidth winWidth tt dropdown
//  LocalWords:  dropdownMaxHeight mouseenter mouseleave ttTypeahead
//# sourceMappingURL=typeahead-popup.js.map