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
define(["require", "exports", "jquery", "../key-constants", "./context-menu"], function (require, exports, $, keyConstants, context_menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A menu for displaying completions.
     */
    var CompletionMenu = /** @class */ (function (_super) {
        __extends(CompletionMenu, _super);
        /**
         * @param editor The editor for which to create this menu.
         *
         * @param document The DOM document for which to make this context menu.
         *
         * @param x Position of the menu. The context menu may ignore this position if
         * the menu would appear off-screen.
         *
         * @param y Position of the menu.
         *
         * @param prefix The prefix. This is the data which is currently present in
         * the document and that has to be completed.
         *
         * @param items An array of possible completions.
         *
         * @param dismissCallback Function to call when the menu is dismissed.
         */
        function CompletionMenu(editor, document, x, y, prefix, items, dismissCallback) {
            var _this = _super.call(this, document, x, y, [], dismissCallback, false) || this;
            _this._focused = false;
            _this.completionPrefix = prefix;
            _this.completionItems = items;
            _this.editor = editor;
            _this.dropdown.classList.add("wed-completion-menu");
            // Remove the data toggle. This will prevent Bootstrap from closing this
            // menu when the body gets the click event.
            if (_this.dropdown.firstElementChild.getAttribute("data-toggle") !== null) {
                _this.dropdown.removeChild(_this.dropdown.firstChild);
            }
            // Remove the backdrop. We do not need a backdrop for this kind of GUI item
            // because completion menus are evanescent.
            _this.backdrop.parentNode.removeChild(_this.backdrop);
            // We need to install our own handler so that we can handle the few keys
            // that ought to be transferred to the menu itself. Remember that the focus
            // remains in the editing pane. So the editing pane, rather than the menu,
            // gets the key events.
            _this.boundCompletionKeydownHandler =
                _this.globalKeydownHandler.bind(_this);
            editor.pushGlobalKeydownHandler(_this.boundCompletionKeydownHandler);
            // We want the user to still be able to type into the document.
            editor.caretManager.focusInputField();
            _this.display([]);
            return _this;
        }
        Object.defineProperty(CompletionMenu.prototype, "focused", {
            /** Whether the completion menu has been focused. */
            get: function () {
                return this._focused;
            },
            enumerable: true,
            configurable: true
        });
        CompletionMenu.prototype.globalKeydownHandler = function (wedEv, ev) {
            if (keyConstants.ENTER.matchesEvent(ev)) {
                this.$menu.find("li:not(.divider):visible a").first().click();
                return false;
            }
            else if (keyConstants.DOWN_ARROW.matchesEvent(ev)) {
                this._focused = true;
                this.$menu.find("li:not(.divider):visible a").first().focus();
                this.$menu.trigger(ev);
                return false;
            }
            else if (keyConstants.ESCAPE.matchesEvent(ev)) {
                this.dismiss();
                return false;
            }
            return true;
        };
        CompletionMenu.prototype.render = function () {
            var editor = this.editor;
            var items = [];
            var prefix = this.completionPrefix;
            var doc = editor.doc;
            function typeData(ev) {
                editor.type(ev.data);
            }
            for (var _i = 0, _a = this.completionItems; _i < _a.length; _i++) {
                var item = _a[_i];
                if (prefix === "") {
                    var li = doc.createElement("li");
                    // tslint:disable-next-line:no-inner-html
                    li.innerHTML = "<a href='#'></a>";
                    li.lastChild.textContent = item;
                    items.push(li);
                    $(li).click(item, typeData);
                }
                else if (item.lastIndexOf(prefix, 0) === 0) {
                    var li = doc.createElement("li");
                    // tslint:disable-next-line:no-inner-html
                    li.innerHTML = "<a href='#'><b></b></a>";
                    var a = li.lastChild;
                    a.firstChild.textContent = item.slice(0, prefix.length);
                    var tail = item.slice(prefix.length);
                    a.appendChild(doc.createTextNode(tail));
                    items.push(li);
                    $(li).click(tail, typeData);
                }
            }
            if (items.length === 0) {
                this.dismiss();
            }
            if (items.length === 1 && this.completionItems[0] === prefix) {
                this.dismiss();
            }
            _super.prototype.render.call(this, items);
        };
        CompletionMenu.prototype.dismiss = function () {
            if (this.dismissed) {
                return;
            }
            this.editor.popGlobalKeydownHandler(this.boundCompletionKeydownHandler);
            _super.prototype.dismiss.call(this);
        };
        return CompletionMenu;
    }(context_menu_1.ContextMenu));
    exports.CompletionMenu = CompletionMenu;
});
//  LocalWords:  MPL li href
//# sourceMappingURL=completion-menu.js.map