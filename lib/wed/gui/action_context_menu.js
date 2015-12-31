/**
 * @module gui/action_context_menu
 * @desc Context menus meant to hold actions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:gui/action_context_menu */ function (require, exports,
                                                              module) {
'use strict';

var context_menu = require("./context_menu");
var $ = require("jquery");
var icon = require("./icon");
var oop = require("../oop");
var log = require("../log");
var key_constants = require("../key_constants");
var key = require("../key");
var browsers = require("../browsers");
var util = require("../util");

var Base = context_menu.ContextMenu;
var KINDS = ["add", "delete", "wrap", "unwrap"];
// ``undefined`` is "other kinds".
var KIND_FILTERS = KINDS.concat(undefined);
// Sort order.
var KIND_ORDER = [undefined].concat(KINDS);

var TYPES = ["element", "attribute"];
var TYPE_FILTERS = TYPES.concat(undefined);

/**
 * @classdesc A context menu for displaying actions. This class is
 * designed to know how to sort {@link module:action~Action Action}
 * objects and {@link module:transformation~Transformation
 * Transformation} objects and how to filter them. Even though the
 * names used here suggest that ``Action`` objects are the focus of
 * this class, the fact is that it is really performing its work on
 * ``Transformation`` objects. It does accept ``Action`` as a kind of
 * lame ``Transformation``. So the following description will focus on
 * ``Transformation`` objects rather than ``Action`` objects.
 *
 * Sorting is performed first by the ``kind`` of the
 * ``Transformation`` and then by the text associated with the
 * ``Transformation``. The kinds, in order, are:
 *
 * - other kinds than those listed below,
 *
 * - undefined ``kind``,
 *
 * - ``"add"``,
 *
 * - ``"delete"``,
 *
 * - ``"wrap"``,
 *
 * - ``"unwrap"``,
 *
 * The text associated with the transformation is the text value of
 * the DOM ``Element`` object stored in the ``item`` field of the
 * object given in the ``items`` array passed to the
 * constructor. ``Actions`` are considered to have an undefined ``kind``.
 *
 * Filtering is performed by ``kind`` and on the text of the **element
 * name** associated with a transformation. This class presents to the
 * user a row of buttons that represent graphically the possible
 * filters. Clicking on a button will reduce the list of displayed
 * items only to those elements that correspond to the ``kind`` to
 * which the button corresponds.
 *
 * Typing text (e.g. "foo") will narrow the list of items to the text
 * that the user typed. Let's suppose that ``item`` is successively
 * taking the values in the ``items`` array. The filtering algorithm
 * first checks whether there is a ``item.data.name`` field. If there
 * is, the match is performed against this field. If not, the match is
 * performed against the text of ``item.item``.
 *
 * If the text typed begins with a caret (^), the text will be
 * interpreted as a regular expression.
 *
 * Typing ESCAPE will reset filtering.
 *
 * When no option is focused, typing ENTER will select the first
 * option of the menu.
 *
 * @extends {module:gui/context_menu~ContextMenu}
 * @constructor
 * @param {Document} document The DOM document for which to make this
 * context menu.
 * @param {integer} x Position of the menu. The context menu may
 * ignore this position if the menu would appear off-screen.
 * @param {integer} y Position of the menu.
 * @param {Array.<{action: module:action~Action, item: Element, data: Object}>}
 * items An array of action information in the form of anonymous objects. It
 * is valid to have some items in the array be of the form
 * ``{action: null, item: some_element, data: null}`` to insert arbitrary
 * menu items.
 * @param {Function} dismiss_callback Function to call when the menu
 * is dismissed.
 */
function ContextMenu(document, x, y, items, dismiss_callback) {
    // Sort the items once and for all.
    items.sort(function (a, b) {
        var a_kind = a.action && a.action.kind;
        var b_kind = b.action && b.action.kind;

        if (a_kind !== b_kind) {
            var a_order = KIND_ORDER.indexOf(a_kind);
            var b_order = KIND_ORDER.indexOf(b_kind);

            return a_order - b_order;
        }

        var a_text = a.item.textContent;
        var b_text = b.item.textContent;
        if (a_text === b_text)
            return 0;

        if (a_text < b_text)
            return -1;

        return 1;
    });

    this._action_items = items;
    this._action_kind_filter = null;
    this._action_type_filter = null;
    this._action_text_filter = "";

    // Create the filtering GUI...

    // <li><div><button>... allows us to have this button group
    // inserted in the menu and yet be ignored by Bootstrap's
    // Dropdown class.
    var li = document.createElement("li");
    li.className = "wed-menu-filter";
    li.style.whiteSpace = "nowrap";
    var group_group = document.createElement("div");
    var kind_group = document.createElement("div");
    kind_group.className = "btn-group btn-group-xs";
    var i, limit, child, title;
    for(i = 0, limit = KIND_FILTERS.length; i < limit; ++i) {
        var kind = KIND_FILTERS[i];
        child = document.createElement("button");
        child.className = 'btn btn-default';
        if (kind) {
            child.innerHTML = icon.makeHTML(kind);
            title = 'Show only ' + kind + ' operations.';
        }
        else {
            child.innerHTML = icon.makeHTML("other");
            title = 'Show operations not covered by other filter buttons.';
        }
        $(child).tooltip({
            title: title,
            // If we don't set it to be on the body, then the tooltip
            // will be clipped by the dropdown. However, we then run
            // into the problem that when the dropdown menu is
            // removed, the tooltip may remain displayed.
            container: 'body',
            placement: 'auto top',
            trigger: 'hover'
        });
        $(child).on("click", makeKindHandler(this, kind));
        kind_group.appendChild(child);
    }

    var type_group = document.createElement("div");
    type_group.className = "btn-group btn-group-xs";
    for(i = 0, limit = TYPE_FILTERS.length; i < limit; ++i) {
        var type = TYPE_FILTERS[i];
        child = document.createElement("button");
        child.className = 'btn btn-default';
        if (type) {
            child.innerHTML = icon.makeHTML(type);
            title = 'Show only ' + type + ' operations.';
        }
        else {
            child.innerHTML = icon.makeHTML("other");
            title = 'Show operations not covered by other filter buttons.';
        }
        $(child).tooltip({
            title: title,
            // If we don't set it to be on the body, then the tooltip
            // will be clipped by the dropdown. However, we then run
            // into the problem that when the dropdown menu is
            // removed, the tooltip may remain displayed.
            container: 'body',
            placement: 'auto top',
            trigger: 'hover'
        });
        $(child).on("click", makeTypeHandler(this, type));
        type_group.appendChild(child);
    }


    // Prevent clicks in the group from closing the context menu.
    $(li).on("click", false);
    li.appendChild(group_group);
    group_group.appendChild(kind_group);
    group_group.appendChild(document.createTextNode("\u00a0"));
    group_group.appendChild(type_group);

    var text_input = document.createElement("input");
    text_input.className = "form-control input-sm";
    text_input.setAttribute("placeholder", "Filter choices by text.");
    var text_div = document.createElement("div");
    text_div.appendChild(text_input);
    li.appendChild(text_div);

    var $text_input = $(text_input);
    $text_input.on("input", this._inputChangeHandler.bind(this));
    $text_input.on("keydown", this._inputKeydownHandler.bind(this));
    this._action_filter_item = li;
    this._action_filter_input = text_input;

    // this._$menu is nonexistent at this stage, so we cannot yet add
    // this._action_filter_item to the menu.
    //
    // Call our superclass' constructor first...
    //
    context_menu.ContextMenu.call(this, document, x, y, [], dismiss_callback);
    text_input.focus();
    var $menu = this._$menu;
    $menu.parent().on("hidden.bs.dropdown",
                      log.wrap(function () {
                          // Manually destroy the tooltips so that
                          // they are not left behind.
                          $(text_input).tooltip('destroy');
                          $(kind_group).children().tooltip('destroy');
                      }));
    $menu.on("keydown", this._actionKeydownHandler.bind(this));
    $menu.on("keypress", this._actionKeypressHandler.bind(this));
}

oop.inherit(ContextMenu, Base);

ContextMenu.prototype.handleToggleFocus = function () {
    this._action_filter_input.focus();
};

function makeKindHandler(me, kind) {
    return log.wrap(function (ev) {
        me._action_kind_filter = kind;
        me._render();
    });
}

function makeTypeHandler(me, type) {
    return log.wrap(function (ev) {
        me._action_type_filter = type;
        me._render();
    });
}


var ITEM_SELECTOR = "li:not(.divider):visible a";

ContextMenu.prototype._actionKeydownHandler = log.wrap(function (ev) {
    if (key_constants.ESCAPE.matchesEvent(ev) &&
        (this._action_kind_filter !== null ||
         this._action_type_filter !== null ||
         this._action_text_filter)) {
        this._action_kind_filter = null;
        this._action_type_filter = null;
        this._action_text_filter = "";
        // For some reason, on FF 24, stopping propagation and
        // preventing the default is not enough.
        if (!browsers.FIREFOX_24) {
            this._action_filter_input.value = "";
            this._render();
        }
        else {
            var me = this;
            setTimeout(function () {
                me._action_filter_input.value = "";
                me._render();
            }, 0);
        }
        ev.stopPropagation();
        ev.preventDefault();
        return false;
    }
    return true;
});

var plus = key.makeKey("+");
var minus = key.makeKey("-");
var period = key.makeKey(".");
var comma = key.makeKey(",");
var question = key.makeKey("?");
var less = key.makeKey("<");
var at = key.makeKey("@");
var exclamation = key.makeKey("!");

var KEY_TO_FILTER = [
    {key: plus, filter: 'add', which: "kind"},
    {key: minus, filter: 'delete', which: "kind"},
    {key: comma, filter: 'wrap', which: "kind"},
    {key: period, filter: 'unwrap', which: "kind"},
    {key: question, filter: undefined, which: "kind"},
    {key: less, filter: 'element', which: "type"},
    {key: at, filter: 'attribute', which: "type"},
    {key: exclamation, filter: undefined, which: "type"},
];

ContextMenu.prototype._actionKeypressHandler = log.wrap(function (ev) {
    // If the user has started filtering on text, we don't interpret
    // the key as setting a kind or type filter.
    if (this._action_text_filter)
        return true;

    for(var i = 0, spec; (spec = KEY_TO_FILTER[i]) !== undefined; ++i) {
        var key = spec.key;
        if (key.matchesEvent(ev)) {
            var which_filter = "_action_" + spec.which + "_filter";
            // Don't treat the key specially if the filter is already set.
            if (this[which_filter] !== null)
                continue;
            this[which_filter] = spec.filter;
            this._render();
            ev.stopPropagation();
            ev.preventDefault();
            return false;
        }
    }

    return true;
});

ContextMenu.prototype._inputChangeHandler = log.wrap(function (ev) {
    var previous = this._action_text_filter;
    var newval = ev.target.value;
    // IE11 generates input events when focus is lost/gained. These
    // events do not change anything to the contents of the field so
    // we protect against unnecessary renders a bit of logic here.
    if (previous !== newval) {
        this._action_text_filter = newval;
        this._render();
    }
});

ContextMenu.prototype._inputKeydownHandler = log.wrap(function (ev) {
    if (key_constants.ENTER.matchesEvent(ev)) {
        this._$menu.find(ITEM_SELECTOR).first().focus().click();
        ev.stopPropagation();
        ev.preventDefault();
        return false;
    }

    // Bootstrap 3.3.2 (and probably some versions before this
    // one) introduces a change that prevents these events from
    // being processed by the dropdown menu. We have to manually
    // forward them. See bug report:
    //
    // https://github.com/twbs/bootstrap/issues/15757
    //
    var matches;
    var checks = ["UP_ARROW", "DOWN_ARROW", "ESCAPE"];
    for (var i = 0, check; (check = checks[i]); ++i) {
        var key = key_constants[check];
        if (key.matchesEvent(ev)) {
            matches = key;
            break;
        }
    }

    if (matches) {
        var fake_ev = new $.Event("keydown");
        matches.setEventToMatch(fake_ev);
        this._$menu.trigger(fake_ev);
        // We have to return `false` to make sure it is not mishandled.
        return false;
    }

    return true;
});

ContextMenu.prototype._render = function () {
    var menu = this._menu;
    var action_filter_item = this._action_filter_item;
    var action_kind_filter = this._action_kind_filter;
    var action_type_filter = this._action_type_filter;
    // On IE 10, we don't want to remove and then add back
    // this._action_filter_item on each render because that makes
    // this._action_filter_input lose the focus. Yes, even with the
    // call at the end of _render, IE 10 inexplicably makes the field
    // lose focus **later**.
    while(menu.lastChild && menu.lastChild !== action_filter_item)
        menu.removeChild(menu.lastChild);

    var i, limit, cl, method;
    var child = action_filter_item
            .firstElementChild.firstElementChild.firstElementChild;
    for(i = 0, limit = KIND_FILTERS.length; i < limit; ++i) {
        var kind = KIND_FILTERS[i];
        cl = child.classList;
        method = (action_kind_filter === kind) ? cl.add : cl.remove;
        method.call(cl, "active");
        child = child.nextElementSibling;
    }

    child = action_filter_item
        .firstElementChild.lastElementChild.firstElementChild;
    for(i = 0, limit = TYPE_FILTERS.length; i < limit; ++i) {
        var type = TYPE_FILTERS[i];
        cl = child.classList;
        method = (action_type_filter === type) ? cl.add : cl.remove;
        method.call(cl, "active");
        child = child.nextElementSibling;
    }

    if (!action_filter_item.parentNode)
        menu.appendChild(action_filter_item);
    var items = this._computeActionItemsToDisplay(this._action_items);
    Base.prototype._render.call(this, items);
};

ContextMenu.prototype._computeActionItemsToDisplay = function (items) {
    var kind_filter = this._action_kind_filter;
    var type_filter = this._action_type_filter;
    var text_filter = this._action_text_filter;

    var kindMatch;
    switch(kind_filter) {
    case null:
        kindMatch = function kindMatchAll() { return true; };
        break;
    case undefined:
        kindMatch = function kindMatchNoKind(item) {
            return !item.action || KINDS.indexOf(item.action.kind) === -1;
        };
        break;
    default:
        kindMatch = function kindMatchSome(item) {
            return item.action && item.action.kind === kind_filter;
        };
    }

    var typeMatch;
    switch(type_filter) {
    case null:
        typeMatch = function typeMatchAll() { return true; };
        break;
    case undefined:
        typeMatch = function typeMatchOther(item) {
            return !item.action || TYPES.indexOf(item.action.node_type) === -1;
        };
        break;
    default:
        typeMatch = function typeMatchSome(item) {
            return item.action && item.action.node_type === type_filter;
        };
    }

    var textMatch;
    if (text_filter) {
        if (text_filter[0] === "^") {
            var text_filter_re = RegExp(text_filter);
            textMatch = function textMatchSomeRe(item) {
                var text = (item.data && item.data.name)?
                        item.data.name : item.item.textContent;
                return text_filter_re.test(text);
            };
        }
        else
            textMatch = function textMatchSome(item) {
                var text = (item.data && item.data.name)?
                        item.data.name : item.item.textContent;
                return text.indexOf(text_filter) !== -1;
            };
    }
    else
        textMatch = function textMatchAll() { return true; };

    var ret = [];
    for(var i = 0, item; (item = items[i]) !== undefined; ++i) {
        if (kindMatch(item) && typeMatch(item) && textMatch(item))
            ret.push(item.item);
    }

    return ret;
};

exports.ContextMenu = ContextMenu;

});
