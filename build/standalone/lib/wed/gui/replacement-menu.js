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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "jquery", "./context-menu"], function (require, exports, jquery_1, context_menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    jquery_1 = __importDefault(jquery_1);
    /**
     * A menu for displaying replacement values.
     */
    var ReplacementMenu = /** @class */ (function (_super) {
        __extends(ReplacementMenu, _super);
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
         * @param items An array of possible replacement values.
         *
         * @param dismissCallback Function to call when the menu is dismissed.
         */
        function ReplacementMenu(editor, document, x, y, items, dismissCallback) {
            var _this = _super.call(this, document, x, y, [], function () {
                dismissCallback(_this.selected);
            }, false) || this;
            _this.replacementItems = items;
            _this.editor = editor;
            _this.dropdown.classList.add("wed-replacement-menu");
            _this.display([]);
            return _this;
        }
        ReplacementMenu.prototype.render = function () {
            var _this = this;
            var items = [];
            var doc = this.editor.doc;
            var _loop_1 = function (item) {
                var li = doc.createElement("li");
                // tslint:disable-next-line:no-inner-html
                li.innerHTML = "<a href='#'></a>";
                li.lastChild.textContent = item;
                items.push(li);
                jquery_1.default(li).click(item, function () {
                    _this.selected = item;
                    _this.dismiss();
                });
            };
            for (var _i = 0, _a = this.replacementItems; _i < _a.length; _i++) {
                var item = _a[_i];
                _loop_1(item);
            }
            _super.prototype.render.call(this, items);
        };
        ReplacementMenu.prototype.dismiss = function () {
            if (this.dismissed) {
                return;
            }
            _super.prototype.dismiss.call(this);
        };
        return ReplacementMenu;
    }(context_menu_1.ContextMenu));
    exports.ReplacementMenu = ReplacementMenu;
});
//  LocalWords:  MPL li href
//# sourceMappingURL=replacement-menu.js.map