/**
 * @module gui/typeahead_popup
 * @desc Support for a typeahead field that pop up in the editing pane.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2015 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:gui/typeahead_popup */ function (require, exports,
                                                          module) {
var $ = require("jquery");
var domutil = require("../domutil");
var log = require("../log");
var key_constants = require("../key_constants");
require("bootstrap");
require("typeahead");

/**
 * @typedef TypeaheadPopupOptions
 * @type Object
 * @property {Object} options Corresponds to the ``options`` parameter
 * of Twitter Typeahead.
 * @property {Array.<Object>} datasets Corresponds to the ``datasets``
 * parameter of Twitter Typeahead.
 */

/**
 * @classdesc A typeahead popup GUI element.
 *
 * @constructor
 * @param {Document} document The DOM document for which to make this
 * popup.
 * @param {integer} x Position of popup. The popup may ignore the
 * position if it would overflow off the screen or not have enough
 * space to reasonably show the choices for typing ahead.
 * @param {integer} y Position of popup.
 * @param {string} placeholder The placeholder text to use.
 * @param {module:gui/typeahead_popup~TypeaheadPopupOptions} options
 * The options to pass to the unerlying Twitter Typeahead menu.
 * @param {Function} dismiss_callback Function to call when the popup
 * is dismissed.
 */
function TypeaheadPopup(document, x, y, placeholder, options,
                        dismiss_callback) {
    var doc = document;
    var ta_wrapper = domutil.htmlToElements(
        '<div class="wed-typeahead-popup">' +
            '<input class="typeahead form-control" type="text">' +
            '<span class="spinner">' +
            '<i class="fa fa-spinner fa-spin"></i>' +
            '</span></div>', doc)[0];
    var ta = ta_wrapper.firstElementChild;
    ta.setAttribute("placeholder", placeholder);

    this._ta_wrapper = ta_wrapper;
    this._dismiss_callback = dismiss_callback;
    this._dismissed = false;

    this._backdrop = document.createElement("div");
    this._backdrop.className = "wed-typeahead-popup-backdrop";

    $(this._backdrop).click(this._backdrop_click_handler.bind(this));

    ta_wrapper.style.width = "300px";
    ta_wrapper.style.left = x + "px";
    ta_wrapper.style.top = y + "px";

    var $ta = $(ta);
    this._ta = ta;
    this._$ta = $ta;

    var args = [options.options];
    if (options.datasets && options.datasets.length > 0)
        args = args.concat(options.datasets);
    $ta.typeahead.apply($ta, args);

    $ta.on("keydown", this._keydownHandler.bind(this));
    $ta.on("typeahead:selected", this._selectedHandler.bind(this));

    var body = doc.body;
    body.insertBefore(ta_wrapper, body.firstChild);
    body.insertBefore(this._backdrop, body.firstChild);

    // Verify if we're going to run off screen. If so, then modify our
    // position to be inside the screen.
    var width = ta_wrapper.offsetWidth;
    var win_width = document.defaultView.innerWidth;

    // The x value that would put the menu just against the side of
    // the window is width - win_width. If x is less than it, then x
    // is the value we want, but we don't want less than 0.
    ta_wrapper.style.left = Math.max(0, Math.min(x, win_width - width)) + "px";
    ta_wrapper.style.maxWidth = win_width + "px";

    var win_height = document.defaultView.innerHeight;
    var max_height = win_height - y;
    ta_wrapper.style.maxHeight = max_height + "px";

    var dropdown = ta_wrapper.getElementsByClassName("tt-dropdown-menu")[0];
    var $dropdown = $(dropdown);

    // Yep, we forcibly display it here because the next computations
    // depend on the dropdown being visible.
    var old_display = dropdown.style.display;
    dropdown.style.display = "block";

    // We arbitrarily want to show at least five lines of
    // information. (Which may or may not translate to 4 choices. This
    // is not the goal. The goal is just to show a reasonable amount
    // of information.)
    var five_lines = Number(
        $dropdown.css("line-height").replace('px', '')) * 5;

    var dropdown_pos = dropdown.getBoundingClientRect();
    var dropdown_max_height = win_height - dropdown_pos.top;
    if (dropdown_max_height < five_lines) {
        // Less than 5 lines: we need to move up.
        y -= five_lines - dropdown_max_height;
        dropdown_max_height = five_lines;
        ta_wrapper.style.top = y + "px";
    }

    dropdown.style.maxHeight = dropdown_max_height + "px";

    // Restore it. It was probably hidden.
    dropdown.style.display = old_display;

    // Work around a stupid issue with typeahead. The problem is that
    // **hovering** over a choice makes it so that the choice is
    // considered to be the one to be selected when ENTER is
    // pressed. This can lead to inconsistent behavior from browser to
    // browser. (It certainly messed up testing.)
    $dropdown.off("mouseenter.tt", ".tt-suggestion");
    $dropdown.off("mouseleave.tt", ".tt-suggestion");

    // Prevent clicks from propagating up.
    $dropdown.on("click", false);
    ta.focus();

    // Typeahead will consider itself "activated" once it is
    // focused. On most platforms the focus above is delivered right
    // away. However, on IE the focus event is sent to elements
    // asynchronously. Which means that the typeahead could become
    // "activated" much later than the end of this constructor. For
    // our purposes we want the typeahead to be activated right
    // away. So we unfortunately break through into private bits of
    // the typeahead code.
    var tt = $.data(ta, "ttTypeahead");
    tt.isActivated = true;
}

/**
 * Dismisses the popup. Calls the callback that was passed when the
 * popup was created, if any.
 *
 * @param {object|undefined} obj This should be the object selected by
 * the user, if any. This will be passed to the ``dismiss_callback``
 * that was passed when the popup was created, if any. If you call
 * this method directly and want a selection to occur, take care to
 * use an object which is from the data set passed in the ``options``
 * parameter that was used when the popup was created. The value
 * ``undefined`` means no object was selected.
 */
TypeaheadPopup.prototype.dismiss = function (obj) {
    if (this._dismissed)
        return;

    var ta_wrapper = this._ta_wrapper;
    if (ta_wrapper && ta_wrapper.parentNode)
        ta_wrapper.parentNode.removeChild(ta_wrapper);

    var backdrop = this._backdrop;
    if (backdrop && backdrop.parentNode)
        backdrop.parentNode.removeChild(backdrop);

    if (this._dismiss_callback)
        this._dismiss_callback(obj);
    this._dismissed = true;
};

/**
 * Event handler for clicks on the backdrop. Dismisses the menu.
 */
TypeaheadPopup.prototype._backdrop_click_handler = log.wrap(function () {
    this.dismiss();
    return false;
});

/**
 * Event handler for keydown events on the popup. The default
 * implementation is to dismiss the popup if escape is pressed.
 */
TypeaheadPopup.prototype._keydownHandler = log.wrap(function (ev) {
    if (key_constants.ESCAPE.matchesEvent(ev)) {
        this.dismiss();
        return false;
    }
});


/**
 * Event handler for typeahead:selected events. The default
 * implementation is to dismiss the popup.
 */
TypeaheadPopup.prototype._selectedHandler = log.wrap(function (ev, obj) {
    this.dismiss(obj);
});

/**
 * Hide the spinner that was created to indicate that the data is
 * being loaded.
 */
TypeaheadPopup.prototype.hideSpinner = function () {
    this._ta_wrapper.getElementsByClassName("spinner")[0].style.display =
        "none";
};

/**
 * Set the value in the input field of the typeahead. This also
 * updates the suggestions.
 *
 * @param {string} value The new value.
 */
TypeaheadPopup.prototype.setValue = function (value) {
    this._$ta.typeahead('val', value);
};

exports.TypeaheadPopup = TypeaheadPopup;

});
