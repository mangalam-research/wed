/**
 * @module gui/context_menu
 * @desc Context menus.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:gui/context_menu */ function (require, exports,
                                                       module) {
'use strict';

var $ = require("jquery");
var util = require("../util");
var log = require("../log");
require("bootstrap");

/**
 * @classdesc A context menu GUI element.
 *
 * @constructor
 * @param {Document} document The DOM document for which to make this
 * context menu.
 * @param {integer} x Position of the menu. The context menu may
 * ignore this position if the menu would appear off-screen.
 * @param {integer} y Position of the menu.
 * @param {Array.<Element>} items The items to show in the menu. These
 * should be list items containing links appropriately formatted for a
 * menu.
 * @param {Function} dismiss_callback Function to call when the menu
 * is dismissed.
 */
function ContextMenu(document, x, y, items, dismiss_callback) {
    this._dismiss_callback = dismiss_callback;
    this._dismissed = false;

    var dropdown = document.createElement("div");
    dropdown.className = 'dropdown wed-context-menu';
    dropdown.innerHTML =
        //This fake toggle is required for bootstrap to do its work.
        "<a href='#' data-toggle='dropdown'></a>" +
        "<ul tabindex='0' class='dropdown-menu' role='menu'></ul>";
    var menu = dropdown.lastElementChild;
    // We move the top and left so that we appear under the mouse
    // cursor.  Hackish, but it works. If we don't do this, then the
    // mousedown that brought the menu up also registers as a click on
    // the body element and the menu disappears right away.  (It would
    // be nice to have a more general solution some day.)
    x -= 5;
    y -= 5;
    dropdown.style.top = y + "px";
    dropdown.style.left = x + "px";
    var $menu = $(menu);

    /**
     * The DOM ``Element`` that contains the list of menu items. This
     * ``Element`` is an HTML list. It is created at construction of
     * the object and deleted only when the object is destroyed. This
     * is what the {@link module:gui/context_menu~ContextMenu#_render
     * _render} method should populate.
     * @protected
     * @type Element
     */
    this._menu = menu;

    /**
     * The jQuery equivalent of {@link
     * module:gui/context_menu~ContextMenu#_menu _menu}.
     * @protected
     * @type jQuery
     */
    this._$menu = $menu;

    this._dropdown = dropdown;
    this._backdrop = document.createElement("div");
    this._backdrop.className = "wed-context-menu-backdrop";

    $(this._backdrop).click(this._backdrop_click_handler.bind(this));

    $menu.on("click", this._contents_click_handler.bind(this));

    $menu.on("mousedown", function(ev) {
        ev.stopPropagation();
    }.bind(this));

    $menu.on("contextmenu", false);

    var body = document.body;
    body.insertBefore(dropdown, body.firstChild);
    body.insertBefore(this._backdrop, body.firstChild);
    this._render(items);

    // Verify if we're going to run off screen. If so, then modify our
    // position to be inside the screen.
    var width = $menu.outerWidth();
    var win_width = $(document.defaultView).width();
    // The x value that would put the menu just against the side of
    // the window is width - win_width. If x is less than it, then x
    // is the value we want, but we don't want less than 0.
    dropdown.style.left = Math.max(0, Math.min(x, win_width - width)) + "px";
    menu.style.maxWidth = win_width + "px";

    // Adjust height so that we can see about 5 lines.
    var five_lines = Number($menu.css("line-height").replace('px', '')) * 5;

    var height = $menu.outerHeight();
    var win_height = $(document.defaultView).height();
    var max_height = win_height - y;
    if (max_height < five_lines) {
        y -= five_lines - max_height;
        max_height = five_lines;
    }
    dropdown.style.top = y + "px";
    menu.style.maxHeight = max_height + "px";

    $menu.dropdown('toggle');
}

/**
 * Event handler for clicks on the contents. Dismissed the menu.
 * @private
 */
ContextMenu.prototype._contents_click_handler = function (ev) {
    this.dismiss();
    ev.stopPropagation();
    ev.preventDefault();
    return false;
};

/**
 * Event handler for clicks on the backdrop. Dismisses the menu.
 * @private
 */
ContextMenu.prototype._backdrop_click_handler = function () {
    this.dismiss();
    return false;
};

/**
 * Subclasses can override this to customize what is shown to the
 * user. For instance, subclasses could accept a list of items which
 * is more complex than DOM ``Element`` objects. Or could include in
 * the list shown to the user some additional GUI elements.
 *
 * @param {Array.<Element>} items The list of items that should make
 * up the menu.
 * @protected
 */
ContextMenu.prototype._render = function (items) {
    this._$menu.append(items);
};


/**
 * Dismisses the menu.
 */
ContextMenu.prototype.dismiss = function () {
    if (this._dismissed)
        return;

    this._$menu.dropdown('toggle');
    if (this._dropdown && this._dropdown.parentNode)
        this._dropdown.parentNode.removeChild(this._dropdown);
    if (this._backdrop && this._backdrop.parentNode)
        this._backdrop.parentNode.removeChild(this._backdrop);
    if (this._dismiss_callback)
        this._dismiss_callback();
    this._dismissed = true;
};

exports.ContextMenu = ContextMenu;

});

//  LocalWords:  contextmenu mousedown dropdown tabindex href gui MPL
//  LocalWords:  Mangalam Dubeau ul jQuery Prepend util jquery
