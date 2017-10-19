define(["require", "exports", "module", "../key-constants", "./search-replace"], function (require, exports, module, key_constants_1, search_replace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Direction = search_replace_1.Direction;
    /**
     * A quick search interface. The quick search sets the minibuffer to prompt the
     * user for a term and searches through the document in the specified search
     * direction. See the section on "Quick Search" in the editor's embedded help
     * for details of how it works for the user.
     */
    var QuickSearch = /** @class */ (function () {
        /**
         * @param editor The editor for which we are searching.
         *
         * @param scroller The scroller that contains the document.
         *
         * @param direction The direction of the search.
         */
        function QuickSearch(editor, scroller, direction) {
            this.editor = editor;
            this.direction = direction;
            this.search = new search_replace_1.SearchReplace(editor, scroller);
            editor.minibuffer.installClient(this);
            this.updatePrompt();
        }
        /** Update the prompt shown to the user to indicate a new direction. */
        QuickSearch.prototype.updatePrompt = function () {
            this.editor.minibuffer.prompt = (_a = {},
                _a[search_replace_1.Direction.FORWARD] = "Search forward:",
                _a[search_replace_1.Direction.BACKWARDS] = "Search backwards:",
                _a)[this.direction];
            var _a;
        };
        /**
         * The minibuffer calls this function so that the quick search can handle
         * keydown events.
         *
         * @returns ``false`` if the key was handled, ``undefined`` otherwise.
         */
        QuickSearch.prototype.onMinibufferKeydown = function (ev) {
            if (key_constants_1.QUICKSEARCH_FORWARD.matchesEvent(ev)) {
                this.direction = search_replace_1.Direction.FORWARD;
                this.next();
                return false;
            }
            else if (key_constants_1.QUICKSEARCH_BACKWARDS.matchesEvent(ev)) {
                this.direction = search_replace_1.Direction.BACKWARDS;
                this.next();
                return false;
            }
            return undefined;
        };
        /**
         * Get the current search options to pass to the underlying search engine.
         */
        QuickSearch.prototype.getSearchOptions = function () {
            return {
                direction: this.direction,
                context: search_replace_1.Context.TEXT,
            };
        };
        /**
         * Move to the next hit in the direction specified by the user.
         */
        QuickSearch.prototype.next = function () {
            this.updatePrompt();
            this.search.next(this.getSearchOptions());
        };
        /**
         * Called by the minibuffer whenever the text in the minibuffer input changes.
         */
        QuickSearch.prototype.onMinibufferChange = function (ev) {
            this.search.updatePattern(ev.value, this.getSearchOptions());
        };
        /**
         * Called by the minibuffer when the user exits the minibuffer.
         */
        QuickSearch.prototype.onUninstall = function () {
            this.search.clearHighlight();
            this.search.setCaretToMatch();
        };
        return QuickSearch;
    }());
    exports.QuickSearch = QuickSearch;
});

//# sourceMappingURL=quick-search.js.map
