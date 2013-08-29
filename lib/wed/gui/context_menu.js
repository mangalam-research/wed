/**
 * @module gui/context_menu
 * @desc Context menus.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:gui/context_menu */ function (require, exports,
                                                       module) {
'use strict';

var $ = require("jquery");
var util = require("../util");
var log = require("../log");
require("bootstrap");

function ContextMenu(document, x, y, max_height, items, dismiss_callback) {
    var $dropdown = $("<div class='dropdown wed-context-menu'>");
    // This fake toggle is required for bootstrap to do its work.
    $dropdown.append($('<a href="#" data-toggle="dropdown"></a>'));
    var $menu = $("<ul tabindex='0' class='dropdown-menu' role='menu'>");
    $dropdown.append($menu);
    // We move the top and left so that we appear under the mouse
    // cursor.  Hackish but it works. If we don't do this, then the
    // mousedown that brought the menu up also registers as a click on
    // the body element and the menu disappears right away.
    $dropdown.css("top", y - 5);
    $dropdown.css("left", x - 5);
    $menu.css("max-height", max_height);

    $menu.append($(items));

    this._click_handler = function () {
        this.dismiss();
        return false;
    }.bind(this);

    this._$body = $("body", document);
    this._$body.prepend($dropdown);
    this._$body.one("click.wed.context-menu", this._click_handler);

    $menu.on("click", function() {
        this.dismiss();
    }.bind(this));
    $menu.dropdown('toggle');

    this._$dropdown = $dropdown;
    this._dismiss_callback = dismiss_callback;
    this._dismissed = false;
}

ContextMenu.prototype.dismiss = function () {
    if (this._dismissed)
        return;

    this._$body.off("click.wed.context-menu", this._click_handler);

    this._$dropdown.remove();
    if (this._dismiss_callback)
        this._dismiss_callback();
    this._dismissed = true;
};

exports.ContextMenu = ContextMenu;

});
