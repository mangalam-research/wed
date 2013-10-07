/**
 * @module gui/context_menu
 * @desc Context menus.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
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

    this._$backdrop = $('<div class="wed-context-menu-backdrop"/>');

    this._$body = $("body", document);
    this._$body.prepend($dropdown);
    this._$body.prepend(this._$backdrop);
    this._$backdrop.click("mousedown", this._click_handler);

    $menu.on("click", function(ev) {
        this.dismiss();
        ev.stopPropagation();
        ev.preventDefault();
        return false;
    }.bind(this));

    $menu.on("mousedown", function(ev) {
        ev.stopPropagation();
    }.bind(this));

    $menu.on("contextmenu", false);
    $menu.dropdown('toggle');

    this._$dropdown = $dropdown;
    this._dismiss_callback = dismiss_callback;
    this._dismissed = false;
}

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


//  LocalWords:  domutil jquery util whitespace pathToNode nodeToPath
//  LocalWords:  contenteditable abcd abfoocd cd insertIntoText lt
//  LocalWords:  Prepend deleteText jQuery getSelectionRange prev
//  LocalWords:  lastChild makeCutFunction deleteNode mergeTextNodes
//  LocalWords:  jshint validthis insertNodeAt insertFragAt versa

//  LocalWords:  domlistener jquery findandself lt ul li nextSibling
//  LocalWords:  MutationObserver previousSibling jQuery LocalWords
// LocalWords:  Dubeau MPL Mangalam jquery validator util domutil oop
// LocalWords:  domlistener wundo jqutil gui onerror mixins html DOM
// LocalWords:  jQuery href sb nav ul li navlist errorlist namespaces
// LocalWords:  contenteditable Ok Ctrl listDecorator tabindex nbsp
// LocalWords:  unclick enterStartTag unlinks startContainer dropdown
// LocalWords:  startOffset endContainer endOffset mousedown
