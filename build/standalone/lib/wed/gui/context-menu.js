/**
 * Context menus.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "jquery", "../domutil", "bootstrap"], function (require, exports, $, domutil) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A context menu GUI element.
     */
    var ContextMenu = /** @class */ (function () {
        /**
         * @param document The DOM document for which to make this
         * context menu.
         *
         * @param x Position of the menu. The context menu may ignore this position if
         * the menu would appear off-screen.
         *
         * @param y Position of the menu.
         *
         * @param items The items to show in the menu. These should be list items
         * containing links appropriately formatted for a menu.
         *
         * @param dismissCallback Function to call when the menu is dismissed.
         *
         * @param immediateDisplay If true, will call ``render`` from the constructor.
         */
        function ContextMenu(document, x, y, items, dismissCallback, immediateDisplay) {
            if (immediateDisplay === void 0) { immediateDisplay = true; }
            this.dismissCallback = dismissCallback;
            this.dismissed = false;
            var dropdown = this.dropdown = document.createElement("div");
            dropdown.className = "dropdown wed-context-menu";
            // tslint:disable-next-line:no-inner-html
            dropdown.innerHTML =
                // This fake toggle is required for bootstrap to do its work.
                "<a href='#' data-toggle='dropdown'></a>" +
                    "<ul class='dropdown-menu' role='menu'></ul>";
            // We move the top and left so that we appear under the mouse cursor.
            // Hackish, but it works. If we don't do this, then the mousedown that
            // brought the menu up also registers as a click on the body element and the
            // menu disappears right away.  (It would be nice to have a more general
            // solution some day.)
            x -= 5;
            y -= 5;
            dropdown.style.top = y + "px";
            dropdown.style.left = x + "px";
            this.x = x;
            this.y = y;
            var menu = this.menu = dropdown.lastElementChild;
            var $menu = this.$menu = $(menu);
            var toggle = this.toggle = dropdown.firstElementChild;
            var $toggle = this.$toggle = $(toggle);
            var backdrop = this.backdrop = document.createElement("div");
            backdrop.className = "wed-context-menu-backdrop";
            $(backdrop).click(this.backdropClickHandler.bind(this));
            $menu.on("click", this.contentsClickHandler.bind(this));
            // Bootstrap may dispatch clicks onto the toggle. We must catch them.
            $toggle.on("click", this.contentsClickHandler.bind(this));
            $menu.on("mousedown", function (ev) {
                ev.stopPropagation();
            });
            $(dropdown).on("contextmenu mouseup", false);
            var body = document.body;
            body.insertBefore(dropdown, body.firstChild);
            body.insertBefore(backdrop, body.firstChild);
            if (immediateDisplay) {
                this.display(items);
            }
        }
        ContextMenu.prototype.display = function (items) {
            var dropdown = this.dropdown;
            var $toggle = $(dropdown.firstElementChild);
            this.render(items);
            var $menu = this.$menu;
            var menu = this.menu;
            var document = dropdown.ownerDocument;
            var x = this.x;
            var y = this.y;
            // Verify if we're going to run off screen. If so, then modify our position
            // to be inside the screen.
            var width = $menu.outerWidth();
            var winWidth = $(document.defaultView).width();
            // The x value that would put the menu just against the side of the window
            // is width - winWidth. If x is less than it, then x is the value we want,
            // but we don't want less than 0.
            dropdown.style.left = Math.max(0, Math.min(x, winWidth - width)) + "px";
            menu.style.maxWidth = winWidth + "px";
            // Adjust height so that we can see about 5 lines.
            var fiveLines = Number($menu.css("line-height").replace("px", "")) * 5;
            var winHeight = $(document.defaultView).height();
            var maxHeight = winHeight - y;
            if (maxHeight < fiveLines) {
                y -= fiveLines - maxHeight;
                maxHeight = fiveLines;
            }
            dropdown.style.top = y + "px";
            menu.style.maxHeight = maxHeight + "px";
            $toggle.focus(this.handleToggleFocus.bind(this));
            $toggle.dropdown("toggle");
            //
            // What is going on here? When Bootstrap detects that touch events are
            // supported, it assumes it is on a mobile device (which is a false
            // assumption) and adds a backdrop to its dropdowns so as to be able to
            // close it if the user "clicks" outside the dropdown. This messes up our
            // own handling of the same scenario. To prevent this issue, we remove any
            // backdrop added by Bootstrap. (It may be possible to keep both backdrops
            // around but it would just complicate the code needlessly.)
            //
            // Note that we cannot rely on Bootstrap's backdrop, generally, because, as
            // mentioned already, it won't be added for non-mobile platforms. However,
            // we *always* need to detect clicks outside our menu, on all platforms.
            //
            var bootstrapBackdrop = domutil.childByClass(dropdown, "dropdown-backdrop");
            if (bootstrapBackdrop !== null) {
                dropdown.removeChild(bootstrapBackdrop);
            }
        };
        /**
         * Event handler for focus events on the toggle. Bootstrap focuses the toggle
         * when the dropdown is shown. This can cause problems on some platforms if
         * the dropdown is meant to have a descendant focused. (IE in particular
         * grants focus asynchronously.) This method can be used to focus the proper
         * element.
         */
        ContextMenu.prototype.handleToggleFocus = function () {
            // Default does nothing.
        };
        /**
         * Event handler for clicks on the contents. Dismissed the menu.
         */
        ContextMenu.prototype.contentsClickHandler = function (ev) {
            this.dismiss();
            ev.stopPropagation();
            ev.preventDefault();
            return false;
        };
        /**
         * Event handler for clicks on the backdrop. Dismisses the menu.
         * @private
         */
        ContextMenu.prototype.backdropClickHandler = function () {
            this.dismiss();
            return false;
        };
        /**
         * Subclasses can override this to customize what is shown to the user. For
         * instance, subclasses could accept a list of items which is more complex
         * than DOM ``Element`` objects. Or could include in the list shown to the
         * user some additional GUI elements.
         *
         * @param items The list of items that should make up the menu.
         */
        ContextMenu.prototype.render = function (items) {
            this.$menu.append(items);
        };
        /**
         * Dismisses the menu.
         */
        ContextMenu.prototype.dismiss = function () {
            if (this.dismissed) {
                return;
            }
            this.$menu.dropdown("toggle");
            if (this.dropdown.parentNode !== null) {
                this.dropdown.parentNode.removeChild(this.dropdown);
            }
            if (this.backdrop.parentNode !== null) {
                this.backdrop.parentNode.removeChild(this.backdrop);
            }
            if (this.dismissCallback !== undefined) {
                this.dismissCallback();
            }
            this.dismissed = true;
        };
        return ContextMenu;
    }());
    exports.ContextMenu = ContextMenu;
});
//  LocalWords:  contextmenu mousedown dropdown tabindex href gui MPL px
//  LocalWords:  Mangalam Dubeau ul jQuery Prepend util jquery mouseup winWidth
//  LocalWords:  dropdowns
//# sourceMappingURL=context-menu.js.map