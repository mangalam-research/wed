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
 * @param {integer} max_height The maximum height of the menu.
 * @param {Array} items An array of HTML elements. These should be
 * list items containing links appropriately formatted for a menu.
 * @param {Function} dismiss_callback Function to call when the menu
 * is dismissed.
 */
function ContextMenu(document, x, y, max_height, items, dismiss_callback) {
    var $dropdown = $("<div class='dropdown wed-context-menu' " +
                      "style='visibility: hidden'>");
    // This fake toggle is required for bootstrap to do its work.
    $dropdown.append($('<a href="#" data-toggle="dropdown"></a>'));
    var $menu = $("<ul tabindex='0' class='dropdown-menu' role='menu'>");
    $dropdown.append($menu);
    // We move the top and left so that we appear under the mouse
    // cursor.  Hackish, but it works. If we don't do this, then the
    // mousedown that brought the menu up also registers as a click on
    // the body element and the menu disappears right away.  (It would
    // be nice to have a more general solution some day.)
    x -= 5;
    y -= 5;
    $dropdown.css("top", y);
    $dropdown.css("left", x);
    $menu.css("max-height", max_height);

    $menu.append($(items));

    this._$backdrop = $('<div class="wed-context-menu-backdrop"/>');

    this._$body = $("body", document);
    this._$body.prepend($dropdown);
    this._$body.prepend(this._$backdrop);

    // Verify if we're going to run off screen. If so, then modify our
    // position to be inside the screen.
    var width = $menu.outerWidth();
    var win_width = $(document.defaultView).width();
    // The x value that would put the menu just against the side of
    // the window is width - win_width. If x is less than it, then x
    // is the value we want, but we don't want less than 0.
    $dropdown.css("left", Math.max(0, Math.min(x, win_width - width)));
    $menu.css("max-width", win_width);

    // Make it visible
    $dropdown.css("visibility", "");
    this._$backdrop.click(this._backdrop_click_handler.bind(this));

    $menu.on("click", this._contents_click_handler.bind(this));

    $menu.on("mousedown", function(ev) {
        ev.stopPropagation();
    }.bind(this));

    $menu.on("contextmenu", false);
    $menu.dropdown('toggle');

    this._$dropdown = $dropdown;
    this._dismiss_callback = dismiss_callback;
    this._dismissed = false;
}

/**
 * Event handler for clicks on the contents.
 */
ContextMenu.prototype._contents_click_handler = function (ev) {
    this.dismiss();
    ev.stopPropagation();
    ev.preventDefault();
    return false;
};

/**
 * Event handler for clicks on the backdrop.
 */
ContextMenu.prototype._backdrop_click_handler = function () {
    this.dismiss();
    return false;
};



/**
 * Dismisses the menu.
 */
ContextMenu.prototype.dismiss = function () {
    if (this._dismissed)
        return;

    this._$dropdown.remove();
    this._$backdrop.remove();
    if (this._dismiss_callback)
        this._dismiss_callback();
    this._dismissed = true;
};

exports.ContextMenu = ContextMenu;

});

//  LocalWords:  contextmenu mousedown dropdown tabindex href gui MPL
//  LocalWords:  Mangalam Dubeau ul jQuery Prepend util jquery
