define(["require", "exports", "module", "../dloc", "../domutil", "../search"], function (require, exports, module, dloc_1, domutil_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Context = search_1.Context;
    exports.Direction = search_1.Direction;
    var Edge;
    (function (Edge) {
        Edge[Edge["START"] = 0] = "START";
        Edge[Edge["END"] = 1] = "END";
    })(Edge || (Edge = {}));
    /**
     * A search-and-replace engine for editor instances. This implements the code
     * that is common to quick searches and more complex searches. This object is
     * responsible for maintaining a search position in the document, and replacing
     * hits as required.
     */
    var SearchReplace = /** @class */ (function () {
        /**
         * @param editor The editor for which we are searching.
         *
         * @param scroller The scroller holding the document.
         */
        function SearchReplace(editor, scroller) {
            this.editor = editor;
            this.scroller = scroller;
            this.lastMatch = null;
            this.caretManager = this.editor.caretManager;
            var sel = this.caretManager.sel;
            var scope = (sel !== undefined && !sel.collapsed) ?
                new dloc_1.DLocRange(sel.anchor, sel.focus) : undefined;
            // If we have a scope, then we had a selection and we want to use the
            // selection's anchor, which is scope.start at this point.
            var start = scope !== undefined ? scope.start : this.caretManager.caret;
            if (start === undefined) {
                throw new Error("search without a caret!");
            }
            this.search = new search_1.Search(this.caretManager, editor.guiRoot, start, scope);
        }
        Object.defineProperty(SearchReplace.prototype, "current", {
            /**
             * The current match. This is ``undefined`` if we have not searched yet.  It
             * is ``null`` if nothing matches.
             */
            get: function () {
                return this.search.current;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SearchReplace.prototype, "canReplace", {
            /**
             * Whether we can replace the current hit. If there is no hit, then this is
             * ``false``. If the hit is somehow collapsed, this is also
             * ``false``. Otherwise, the hit must be a well-formed range.
             */
            get: function () {
                var current = this.search.current;
                if (current == null) {
                    return false;
                }
                if (current.collapsed) {
                    return false;
                }
                return domutil_1.isWellFormedRange(current.mustMakeDOMRange());
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Update the pattern to a new value. Calling this method attempts to update
         * the current hit first, and may move in the direction of the search if
         * updating the current hit is not possible. This updates [[current]].
         *
         * @param value The new pattern value.
         *
         * @param options The search options.
         */
        SearchReplace.prototype.updatePattern = function (value, options) {
            this.search.pattern = value;
            this.search.direction = options.direction;
            this.search.context = options.context;
            this.search.updateCurrent();
            this.updateHighlight();
        };
        /**
         * Find the next hit in the direction of the search. This updates [[current]].
         *
         * @param options The search options.
         */
        SearchReplace.prototype.next = function (options) {
            this.search.direction = options.direction;
            this.search.context = options.context;
            this.search.next();
            this.updateHighlight();
        };
        /**
         * Update the highlight marking the current hit.
         */
        SearchReplace.prototype.updateHighlight = function () {
            this.clearHighlight();
            var match = this.current;
            if (match != null) {
                this.lastMatch = match;
                this.setCaretToMatch();
                var range = match.start.mustMakeDLocRange(match.end);
                var domRange = range.mustMakeDOMRange();
                this.highlight = this.caretManager.highlightRange(range);
                var scRect = this.scroller.getBoundingClientRect();
                var rect = domRange.nativeRange.getBoundingClientRect();
                var leftOffset = this.scroller.scrollLeft - scRect.left;
                var topOffset = this.scroller.scrollTop - scRect.top;
                this.scroller.scrollIntoView(rect.left + leftOffset, rect.top + topOffset, rect.right + leftOffset, rect.bottom + topOffset);
            }
        };
        /**
         * Clear the highlight that this object produced to mark a hit.
         */
        SearchReplace.prototype.clearHighlight = function () {
            if (this.highlight !== undefined) {
                this.highlight.parentNode.removeChild(this.highlight);
                this.highlight = undefined;
            }
        };
        /**
         * Set the caret position to the latest hit we ran into.
         */
        SearchReplace.prototype.setCaretToMatch = function () {
            if (this.lastMatch !== null) {
                var loc = this.getDirectionalEnd(this.lastMatch);
                this.caretManager.setCaret(loc, { focus: false });
            }
        };
        SearchReplace.prototype.getDirectionalEnd = function (range) {
            return this.getDirectionalEdge(range, Edge.END);
        };
        SearchReplace.prototype.getDirectionalStart = function (range) {
            return this.getDirectionalEdge(range, Edge.START);
        };
        SearchReplace.prototype.getDirectionalEdge = function (range, edge) {
            var field;
            var direction = this.search.direction;
            var start = edge === Edge.START;
            switch (direction) {
                case search_1.Direction.FORWARD:
                    field = start ? "start" : "end";
                    break;
                case search_1.Direction.BACKWARDS:
                    field = start ? "end" : "start";
                    break;
                default:
                    var d = direction;
                    throw new Error("unknown direction: " + d);
            }
            return range[field];
        };
        /**
         * Replace the current hit with text.
         *
         * @param value The new text.
         *
         * @throw {Error} When called if [[canReplace]] is false.
         */
        SearchReplace.prototype.replace = function (value) {
            if (!this.canReplace) {
                throw new Error("tried to replace when it is not possible");
            }
            var current = this.current;
            // With the !this.canReplace test above, it is not currently possible to
            // hit this condition.
            if (current == null) {
                throw new Error("no current match");
            }
            var caret = this.getDirectionalStart(current);
            this.caretManager.setCaret(caret, { focus: false });
            this.editor.fireTransformation(this.editor.replaceRangeTr, {
                range: current,
                newText: value,
            });
            this.clearHighlight();
            var caretAfter = this.caretManager.caret;
            if (caretAfter === undefined) {
                throw new Error("no caret after replacement!");
            }
            // We must update the current match because the old range is no longe valid.
            this.search.current = caretAfter.mustMakeDLocRange();
        };
        return SearchReplace;
    }());
    exports.SearchReplace = SearchReplace;
});

//# sourceMappingURL=search-replace.js.map
