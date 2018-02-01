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
define(["require", "exports", "jquery", "../browsers", "../key", "../key-constants", "../transformation", "./context-menu", "./icon"], function (require, exports, $, browsers, keyMod, keyConstants, transformation_1, context_menu_1, icon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KINDS = ["transform", "add", "delete", "wrap", "unwrap"];
    // ``undefined`` is "other kinds".
    var KIND_FILTERS = KINDS.concat(undefined);
    // Sort order.
    var KIND_ORDER = [undefined].concat(KINDS);
    var TYPES = ["element", "attribute"];
    var TYPE_FILTERS = TYPES.concat(undefined);
    var ITEM_SELECTOR = "li:not(.divider):visible a";
    var plus = keyMod.makeKey("+");
    var minus = keyMod.makeKey("-");
    var period = keyMod.makeKey(".");
    var comma = keyMod.makeKey(",");
    var question = keyMod.makeKey("?");
    var less = keyMod.makeKey("<");
    var at = keyMod.makeKey("@");
    var exclamation = keyMod.makeKey("!");
    var KEY_TO_FILTER = [
        { key: plus, filter: "add", which: "kind" },
        { key: minus, filter: "delete", which: "kind" },
        { key: comma, filter: "wrap", which: "kind" },
        { key: period, filter: "unwrap", which: "kind" },
        { key: question, filter: undefined, which: "kind" },
        { key: less, filter: "element", which: "type" },
        { key: at, filter: "attribute", which: "type" },
        { key: exclamation, filter: undefined, which: "type" },
    ];
    function compareItems(a, b) {
        var aKind = (a.action !== null && (a.action instanceof transformation_1.Transformation)) ?
            a.action.kind : undefined;
        var bKind = (b.action !== null && (b.action instanceof transformation_1.Transformation)) ?
            b.action.kind : undefined;
        if (aKind !== bKind) {
            var aOrder = KIND_ORDER.indexOf(aKind);
            var bOrder = KIND_ORDER.indexOf(bKind);
            return aOrder - bOrder;
        }
        var aText = a.item.textContent;
        var bText = b.item.textContent;
        if (aText === bText) {
            return 0;
        }
        if (aText < bText) {
            return -1;
        }
        return 1;
    }
    /**
     * A context menu for displaying actions. This class is designed to know how to
     * sort [["wed/action".Action]] objects and
     * [["wed/transformation".Transformation]] objects and how to filter them. Even
     * though the names used here suggest that ``Action`` objects are the focus of
     * this class, the fact is that it is really performing its work on
     * ``Transformation`` objects. It does accept ``Action`` as a kind of lame
     * ``Transformation``. So the following description will focus on
     * ``Transformation`` objects rather than ``Action`` objects.
     *
     * Sorting is performed first by the ``kind`` of the ``Transformation`` and then
     * by the text associated with the ``Transformation``. The kinds, in order, are:
     *
     * - other kinds than those listed below
     *
     * - undefined ``kind``
     *
     * - ``"add"``
     *
     * - ``"delete"``
     *
     * - ``"wrap"``
     *
     * - ``"unwrap"``
     *
     * The text associated with the transformation is the text value of the DOM
     * ``Element`` object stored in the ``item`` field of the object given in the
     * ``items`` array passed to the constructor. ``Actions`` are considered to have
     * an undefined ``kind``.
     *
     * Filtering is performed by ``kind`` and on the text of the **element name**
     * associated with a transformation. This class presents to the user a row of
     * buttons that represent graphically the possible filters. Clicking on a button
     * will reduce the list of displayed items only to those elements that
     * correspond to the ``kind`` to which the button corresponds.
     *
     * Typing text (e.g. "foo") will narrow the list of items to the text that the
     * user typed. Let's suppose that ``item`` is successively taking the values in
     * the ``items`` array. The filtering algorithm first checks whether there is an
     * ``item.data.name`` field. If there is, the match is performed against this
     * field. If not, the match is performed against the text of ``item.item``.
     *
     * If the text typed begins with a caret (^), the text will be interpreted as a
     * regular expression.
     *
     * Typing ESCAPE will reset filtering.
     *
     * When no option is focused, typing ENTER will select the first option of the
     * menu.
     */
    var ActionContextMenu = /** @class */ (function (_super) {
        __extends(ActionContextMenu, _super);
        /**
         * @param document The DOM document for which to make this context menu.
         *
         * @param x Position of the menu. The context menu may ignore this position if
         * the menu would appear off-screen.
         *
         * @param y Position of the menu.
         *
         * @param items An array of action information in the form of anonymous
         * objects. It is valid to have some items in the array be of the form
         * ``{action: null, item: some_element, data: null}`` to insert arbitrary menu
         * items.
         *
         * @param dismissCallback Function to call when the menu is dismissed.
         */
        function ActionContextMenu(document, x, y, items, dismissCallback) {
            var _this = _super.call(this, document, x, y, [], dismissCallback, false) || this;
            _this.filters = {
                kind: null,
                type: null,
            };
            _this.actionTextFilter = "";
            // Sort the items once and for all.
            items.sort(compareItems);
            _this.actionItems = items;
            // Create the filtering GUI...
            // <li><div><button>... allows us to have this button group inserted in the
            // menu and yet be ignored by Bootstrap's Dropdown class.
            var li = document.createElement("li");
            li.className = "wed-menu-filter";
            li.style.whiteSpace = "nowrap";
            var groupGroup = document.createElement("div");
            var kindGroup = _this.makeKindGroup(document);
            var typeGroup = _this.makeTypeGroup(document);
            // Prevent clicks in the group from closing the context menu.
            $(li).on("click", false);
            li.appendChild(groupGroup);
            groupGroup.appendChild(kindGroup);
            groupGroup.appendChild(document.createTextNode("\u00a0"));
            groupGroup.appendChild(typeGroup);
            var textInput = document.createElement("input");
            textInput.className = "form-control input-sm";
            textInput.setAttribute("placeholder", "Filter choices by text.");
            var textDiv = document.createElement("div");
            textDiv.appendChild(textInput);
            li.appendChild(textDiv);
            var $textInput = $(textInput);
            $textInput.on("input", _this.inputChangeHandler.bind(_this));
            $textInput.on("keydown", _this.inputKeydownHandler.bind(_this));
            _this.actionFilterItem = li;
            _this.actionFilterInput = textInput;
            var $menu = _this.$menu;
            $menu.parent().on("hidden.bs.dropdown", function () {
                // Manually destroy the tooltips so that they are not
                // left behind.
                $(textInput).tooltip("destroy");
                $(kindGroup).children().tooltip("destroy");
            });
            $menu.on("keydown", _this.actionKeydownHandler.bind(_this));
            $menu.on("keypress", _this.actionKeypressHandler.bind(_this));
            _this.display([]);
            textInput.focus();
            return _this;
        }
        ActionContextMenu.prototype.makeKindGroup = function (document) {
            var kindGroup = document.createElement("div");
            kindGroup.className = "btn-group btn-group-xs";
            for (var _i = 0, KIND_FILTERS_1 = KIND_FILTERS; _i < KIND_FILTERS_1.length; _i++) {
                var kind = KIND_FILTERS_1[_i];
                var child = document.createElement("button");
                child.className = "btn btn-default";
                var title = void 0;
                if (kind !== undefined) {
                    // tslint:disable-next-line:no-inner-html
                    child.innerHTML = icon.makeHTML(kind);
                    title = "Show only " + kind + " operations.";
                }
                else {
                    // tslint:disable-next-line:no-inner-html
                    child.innerHTML = icon.makeHTML("other");
                    title = "Show operations not covered by other filter buttons.";
                }
                $(child).tooltip({
                    title: title,
                    // If we don't set it to be on the body, then the tooltip will be
                    // clipped by the dropdown. However, we then run into the problem that
                    // when the dropdown menu is removed, the tooltip may remain displayed.
                    container: "body",
                    placement: "auto top",
                    trigger: "hover",
                });
                $(child).on("click", this.makeKindHandler(kind));
                kindGroup.appendChild(child);
            }
            return kindGroup;
        };
        ActionContextMenu.prototype.makeTypeGroup = function (document) {
            var typeGroup = document.createElement("div");
            typeGroup.className = "btn-group btn-group-xs";
            for (var _i = 0, TYPE_FILTERS_1 = TYPE_FILTERS; _i < TYPE_FILTERS_1.length; _i++) {
                var actionType = TYPE_FILTERS_1[_i];
                var child = document.createElement("button");
                child.className = "btn btn-default";
                var title = void 0;
                if (actionType !== undefined) {
                    // tslint:disable-next-line:no-inner-html
                    child.innerHTML = icon.makeHTML(actionType);
                    title = "Show only " + actionType + " operations.";
                }
                else {
                    // tslint:disable-next-line:no-inner-html
                    child.innerHTML = icon.makeHTML("other");
                    title = "Show operations not covered by other filter buttons.";
                }
                $(child).tooltip({
                    title: title,
                    // If we don't set it to be on the body, then the tooltip will be
                    // clipped by the dropdown. However, we then run into the problem that
                    // when the dropdown menu is removed, the tooltip may remain displayed.
                    container: "body",
                    placement: "auto top",
                    trigger: "hover",
                });
                $(child).on("click", this.makeTypeHandler(actionType));
                typeGroup.appendChild(child);
            }
            return typeGroup;
        };
        ActionContextMenu.prototype.makeKindHandler = function (kind) {
            var _this = this;
            return function () {
                _this.filters.kind = kind;
                _this.render();
            };
        };
        ActionContextMenu.prototype.makeTypeHandler = function (actionType) {
            var _this = this;
            return function () {
                _this.filters.type = actionType;
                _this.render();
            };
        };
        ActionContextMenu.prototype.handleToggleFocus = function () {
            this.actionFilterInput.focus();
        };
        ActionContextMenu.prototype.actionKeydownHandler = function (ev) {
            var _this = this;
            if (keyConstants.ESCAPE.matchesEvent(ev) &&
                (this.filters.kind !== null ||
                    this.filters.type !== null ||
                    this.actionTextFilter !== "")) {
                this.filters.kind = null;
                this.filters.type = null;
                this.actionTextFilter = "";
                // For some reason, on FF 24, stopping propagation and
                // preventing the default is not enough.
                if (!browsers.FIREFOX_24) {
                    this.actionFilterInput.value = "";
                    this.render();
                }
                else {
                    setTimeout(function () {
                        _this.actionFilterInput.value = "";
                        _this.render();
                    }, 0);
                }
                ev.stopPropagation();
                ev.preventDefault();
                return false;
            }
            return true;
        };
        ActionContextMenu.prototype.actionKeypressHandler = function (ev) {
            // If the user has started filtering on text, we don't interpret
            // the key as setting a kind or type filter.
            if (this.actionTextFilter !== "") {
                return true;
            }
            for (var _i = 0, KEY_TO_FILTER_1 = KEY_TO_FILTER; _i < KEY_TO_FILTER_1.length; _i++) {
                var spec = KEY_TO_FILTER_1[_i];
                var key = spec.key;
                if (key.matchesEvent(ev)) {
                    var whichFilter = spec.which;
                    // Don't treat the key specially if the filter is already set.
                    if (this.filters[whichFilter] !== null) {
                        continue;
                    }
                    this.filters[whichFilter] = spec.filter;
                    this.render();
                    ev.stopPropagation();
                    ev.preventDefault();
                    return false;
                }
            }
            return true;
        };
        ActionContextMenu.prototype.inputChangeHandler = function (ev) {
            var previous = this.actionTextFilter;
            var newval = ev.target.value;
            // IE11 generates input events when focus is lost/gained. These
            // events do not change anything to the contents of the field so
            // we protect against unnecessary renders a bit of logic here.
            if (previous !== newval) {
                this.actionTextFilter = newval;
                this.render();
            }
        };
        ActionContextMenu.prototype.inputKeydownHandler = function (ev) {
            if (keyConstants.ENTER.matchesEvent(ev)) {
                this.$menu.find(ITEM_SELECTOR).first().focus().click();
                ev.stopPropagation();
                ev.preventDefault();
                return false;
            }
            // Bootstrap 3.3.2 (and probably some versions before this one) introduces a
            // change that prevents these events from being processed by the dropdown
            // menu. We have to manually forward them. See bug report:
            //
            // https://github.com/twbs/bootstrap/issues/15757
            //
            var matches;
            for (var _i = 0, _a = ["UP_ARROW", "DOWN_ARROW", "ESCAPE"]; _i < _a.length; _i++) {
                var check = _a[_i];
                // tslint:disable-next-line:no-any
                var key = keyConstants[check];
                if (key.matchesEvent(ev)) {
                    matches = key;
                    break;
                }
            }
            if (matches !== undefined) {
                var fakeEv = new $.Event("keydown");
                matches.setEventToMatch(fakeEv);
                // We have to pass the event to ``actionKeypressHandler`` so that it can
                // act in the same way as if the event had been directly on the menu. If
                // ``actionKeypressHandler`` does not handle it, then pass it on to the
                // toggle. We forward to the toggle because that's how Bootstrap normally
                // works.
                if (this.actionKeydownHandler(fakeEv) !== false) {
                    this.$toggle.trigger(fakeEv);
                }
                // We have to return `false` to make sure it is not mishandled.
                return false;
            }
            return true;
        };
        ActionContextMenu.prototype.render = function () {
            var menu = this.menu;
            var actionFilterItem = this.actionFilterItem;
            var actionKindFilter = this.filters.kind;
            var actionTypeFilter = this.filters.type;
            // On IE 10, we don't want to remove and then add back this.actionFilterItem
            // on each render because that makes this.actionFilterInput lose the
            // focus. Yes, even with the call at the end of _render, IE 10 inexplicably
            // makes the field lose focus **later**.
            while (menu.lastChild !== null && menu.lastChild !== actionFilterItem) {
                menu.removeChild(menu.lastChild);
            }
            var child = actionFilterItem
                .firstElementChild.firstElementChild.firstElementChild;
            for (var _i = 0, KIND_FILTERS_2 = KIND_FILTERS; _i < KIND_FILTERS_2.length; _i++) {
                var kind = KIND_FILTERS_2[_i];
                var cl = child.classList;
                var method = (actionKindFilter === kind) ? cl.add : cl.remove;
                method.call(cl, "active");
                child = child.nextElementSibling;
            }
            child = actionFilterItem
                .firstElementChild.lastElementChild.firstElementChild;
            for (var _a = 0, TYPE_FILTERS_2 = TYPE_FILTERS; _a < TYPE_FILTERS_2.length; _a++) {
                var actionType = TYPE_FILTERS_2[_a];
                var cl = child.classList;
                var method = (actionTypeFilter === actionType) ? cl.add : cl.remove;
                method.call(cl, "active");
                child = child.nextElementSibling;
            }
            if (actionFilterItem.parentNode === null) {
                menu.appendChild(actionFilterItem);
            }
            var items = this.computeActionItemsToDisplay(this.actionItems);
            _super.prototype.render.call(this, items);
        };
        ActionContextMenu.prototype.computeActionItemsToDisplay = function (items) {
            var kindFilter = this.filters.kind;
            var typeFilter = this.filters.type;
            var textFilter = this.actionTextFilter;
            var kindMatch;
            switch (kindFilter) {
                case null:
                    kindMatch = function () { return true; };
                    break;
                case undefined:
                    kindMatch = function (item) { return !(item.action instanceof transformation_1.Transformation) ||
                        KINDS.indexOf(item.action.kind) === -1; };
                    break;
                default:
                    kindMatch = function (item) { return (item.action instanceof transformation_1.Transformation) &&
                        item.action.kind === kindFilter; };
            }
            var typeMatch;
            switch (typeFilter) {
                case null:
                    typeMatch = function () { return true; };
                    break;
                case undefined:
                    typeMatch = function (item) { return !(item.action instanceof transformation_1.Transformation) ||
                        TYPES.indexOf(item.action.nodeType) === -1; };
                    break;
                default:
                    typeMatch = function (item) { return (item.action instanceof transformation_1.Transformation) &&
                        item.action.nodeType === typeFilter; };
            }
            var textMatch;
            if (textFilter !== "") {
                if (textFilter[0] === "^") {
                    var textFilterRe_1 = RegExp(textFilter);
                    textMatch = function (item) {
                        var text = (item.data !== null && item.data.name !== undefined) ?
                            item.data.name : item.item.textContent;
                        return textFilterRe_1.test(text);
                    };
                }
                else {
                    textMatch = function (item) {
                        var text = (item.data !== null && item.data.name !== undefined) ?
                            item.data.name : item.item.textContent;
                        return text.indexOf(textFilter) !== -1;
                    };
                }
            }
            else {
                textMatch = function () { return true; };
            }
            var ret = [];
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                if (kindMatch(item) && typeMatch(item) && textMatch(item)) {
                    ret.push(item.item);
                }
            }
            return ret;
        };
        return ActionContextMenu;
    }(context_menu_1.ContextMenu));
    exports.ActionContextMenu = ActionContextMenu;
});
//  LocalWords:  MPL li Dropdown nowrap sm keydown tooltips keypress btn xs
//  LocalWords:  tooltip dropdown actionType actionFilterItem actionFilterInput
//  LocalWords:  actionKeypressHandler
//# sourceMappingURL=action-context-menu.js.map