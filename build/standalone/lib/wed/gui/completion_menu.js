/**
 * @module gui/completion_menu
 * @desc Menu for completions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:gui/completion_menu */ function (require, exports,
                                                          module) {
'use strict';

var context_menu = require("./context_menu");
var $ = require("jquery");
var oop = require("../oop");
var log = require("../log");
var key_constants = require("../key_constants");

var Base = context_menu.ContextMenu;

/**
 * @classdesc A menu for displaying completions.
 *
 * @extends {module:gui/context_menu~ContextMenu}
 * @constructor
 * @param {module:wed~Editor} editor The editor for which to create this menu.
 * @param {Document} document The DOM document for which to make this
 * context menu.
 * @param {integer} x Position of the menu. The context menu may
 * ignore this position if the menu would appear off-screen.
 * @param {integer} y Position of the menu.
 * @param {string} prefix The prefix. This is the data which is
 * currently present in the document and that has to be completed.
 * @param {Array.<{string}>} items An array of possible completions.
 * @param {Function} dismiss_callback Function to call when the menu
 * is dismissed.
 */
function CompletionMenu(editor, document, x, y, prefix, items,
                        dismiss_callback) {
    this._completion_prefix = prefix;
    this._completion_items = items;
    this._editor = editor;
    Base.call(this, document, x, y, [], dismiss_callback);
    this._dropdown.classList.add("wed-completion-menu");
    // Remove the data toggle. This will prevent Bootstrap from
    // closing this menu when the body gets the click event.
    if (this._dropdown.firstElementChild.getAttribute("data-toggle"))
        this._dropdown.removeChild(this._dropdown.firstChild);
    // Remove the backdrop. We do not need a backdrop for this kind of
    // GUI item because completion menus are evanescent.
    this._backdrop.parentNode.removeChild(this._backdrop);

    // We need to install our own handler so that we can handle the
    // few keys that ought to be transferred to the menu itself.
    this._bound_completion_keydown_handler =
        this._globalKeydownHandler.bind(this);
    editor.pushGlobalKeydownHandler(this._bound_completion_keydown_handler);

    // We want the user to still be able to type into the document.
    editor._focusInputField();
}

oop.inherit(CompletionMenu, Base);

CompletionMenu.prototype._globalKeydownHandler = function (wed_ev, ev) {
    if (key_constants.ENTER.matchesEvent(ev)) {
        this._$menu.find("li:not(.divider):visible a").first().click();
        return false;
    }
    else if (key_constants.DOWN_ARROW.matchesEvent(ev)) {
        this._$menu.find("li:not(.divider):visible a").first().focus();
        this._$menu.trigger(ev);
        return false;
    } else if (key_constants.ESCAPE.matchesEvent(ev)) {
        this.dismiss();
        return false;
    }
    return true;
};

CompletionMenu.prototype._render = function () {
    var items = [];
    var prefix = this._completion_prefix;
    var editor = this._editor;
    var doc = editor.my_window.document;
    var li;
    function type(ev) {
        editor.type(ev.data);
    }
    for(var i = 0, item; (item = this._completion_items[i]) !== undefined;
        ++i) {
        if (prefix === "") {
            li = doc.createElement("li");
            li.innerHTML = "<a href='#'></a>";
            li.lastChild.textContent = item;
            items.push(li);
            $(li).click(item, type);
        }
        else if (item.lastIndexOf(prefix, 0) === 0) {
            li = doc.createElement("li");
            li.innerHTML = "<a href='#'><b></b></a>";
            var a = li.lastChild;
            a.firstChild.textContent = item.slice(0, prefix.length);
            var tail = item.slice(prefix.length);
            a.appendChild(doc.createTextNode(tail));
            items.push(li);
            $(li).click(tail, type);
        }
    }

    if (items.length === 0)
        this.dismiss();

    if (items.length === 1 && item === prefix)
        this.dismiss();

    Base.prototype._render.call(this, items);
};

CompletionMenu.prototype.dismiss = function () {
    if (this._dismissed)
        return;
    this._editor.popGlobalKeydownHandler(
        this._bound_completion_keydown_handler);
    Base.prototype.dismiss.call(this);
};

exports.CompletionMenu = CompletionMenu;

});
