var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "bootbox", "jquery", "./interactivity", "./search-replace"], function (require, exports, bootbox, jquery_1, interactivity_1, search_replace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    bootbox = __importStar(bootbox);
    jquery_1 = __importDefault(jquery_1);
    exports.Direction = search_replace_1.Direction;
    var dialogTemplate = "\n<form>\n <div class='form-group'>\n  <label>Search for:</label>\n  <input type='text' name='search' class='form-control'>\n </div>\n <div class='form-group'>\n  <label>Replace with:</label>\n  <input type='text' name='replace' class='form-control'>\n </div>\n <div class='radio'>\n  <span>Direction:</span>\n  <div>\n   <label class='radio-inline'>\n    <input type='radio' name='direction' value='forward'> Forward\n   </label>\n  </div>\n  <div>\n   <label class='radio-inline'>\n    <input type='radio' name='direction' value='backwards'> Backwards\n   </label>\n  <div>\n </div>\n <div class='radio'>\n  <span>Context:</span>\n  <div>\n   <label class='radio-inline'>\n    <input type='radio' name='context' value='text' checked>\n    Only element text\n   </label>\n  </div>\n  <div>\n   <label class='radio-inline'>\n    <input type='radio' name='context' value='attributes'>\n    Only attributes values\n   </label>\n  </div>\n </div>\n</form>";
    /**
     * Brings up a search and replace dialog box to allow the user to search through
     * a document. See the section on "Dialog Search" in the editor's embedded help
     * for details of how it works for users.
     */
    var DialogSearchReplace = /** @class */ (function () {
        /**
         * @param editor The editor for which we are searching.
         *
         * @param scroller The scroller holding the document being searched.
         *
         * @param direction The direction of the search.
         */
        function DialogSearchReplace(editor, scroller, direction) {
            var _this = this;
            this.search = new search_replace_1.SearchReplace(editor, scroller);
            var body = jquery_1.default(dialogTemplate)[0];
            var dialog = this.dialog = bootbox.dialog({
                title: "Search/Replace",
                message: body,
                onEscape: true,
                backdrop: false,
                size: "small",
                buttons: {
                    find: {
                        label: "Find",
                        className: "btn-primary",
                        callback: this.onFind.bind(this),
                    },
                    replaceFind: {
                        label: "Replace and Find",
                        className: "btn-default replace-and-find",
                        callback: this.onReplaceAndFind.bind(this),
                    },
                    replaceAll: {
                        label: "Replace All",
                        className: "btn-default replace-all",
                        callback: this.onReplaceAll.bind(this),
                    },
                    close: {
                        label: "Close",
                    },
                },
            });
            interactivity_1.makeResizable(dialog);
            interactivity_1.makeDraggable(dialog);
            var directionItems = body.elements
                .namedItem("direction");
            this.forwardRadioButton = directionItems[0];
            this.backwardRadioButton = directionItems[1];
            var contextItems = body.elements
                .namedItem("context");
            this.textRadioButton = contextItems[0];
            this.attributeRadioButton = contextItems[1];
            var toCheck;
            switch (direction) {
                case search_replace_1.Direction.FORWARD:
                    toCheck = this.forwardRadioButton;
                    break;
                case search_replace_1.Direction.BACKWARDS:
                    toCheck = this.backwardRadioButton;
                    break;
                default:
                    var d = direction;
                    throw new Error("unknown direction: " + d);
            }
            toCheck.checked = true;
            dialog.on("hidden.bs.modal", function () {
                _this.search.clearHighlight();
                // Return the focus to the editor.
                editor.caretManager.focusInputField();
            });
            var searchField = this.searchField =
                body.elements.namedItem("search");
            var $searchField = jquery_1.default(searchField);
            $searchField.on("input", this.onSearchInput.bind(this));
            var replaceField = this.replaceField =
                body.elements.namedItem("replace");
            var $replaceField = jquery_1.default(replaceField);
            $replaceField.on("input", this.onReplaceInput.bind(this));
            this.replaceButton =
                dialog[0].querySelector(".replace-and-find");
            this.replaceAll =
                dialog[0].querySelector(".replace-all");
            this.updateButtons();
        }
        /**
         * @returns The search option to pass to the search engine, given the user
         * choices.
         */
        DialogSearchReplace.prototype.getSearchOptions = function () {
            var direction;
            if (this.forwardRadioButton.checked) {
                direction = search_replace_1.Direction.FORWARD;
            }
            else if (this.backwardRadioButton.checked) {
                direction = search_replace_1.Direction.BACKWARDS;
            }
            else {
                throw new Error("cannot determine direction");
            }
            var context;
            if (this.textRadioButton.checked) {
                context = search_replace_1.Context.TEXT;
            }
            else if (this.attributeRadioButton.checked) {
                context = search_replace_1.Context.ATTRIBUTE_VALUES;
            }
            else {
                throw new Error("cannot determine context");
            }
            return {
                direction: direction,
                context: context,
            };
        };
        /**
         * Processes clicks on the "Find" button: searches the document and updates
         * the buttons.
         */
        DialogSearchReplace.prototype.onFind = function () {
            this.next();
            this.updateButtons();
            return false;
        };
        /**
         * Updates the disabled status of the buttons depending on how the input
         * elements are set.
         */
        DialogSearchReplace.prototype.updateButtons = function () {
            var fieldFilled = this.replaceField.value !== "";
            this.replaceButton.disabled = !(fieldFilled && this.search.canReplace);
            this.replaceAll.disabled = !fieldFilled;
        };
        /**
         * Processes clicks on the "Replace and Find" button: replaces the current hit
         * and find the next one.
         */
        DialogSearchReplace.prototype.onReplaceAndFind = function () {
            this.replace();
            this.onFind();
            return false;
        };
        /**
         * Processes clicks on the "Replace All" button: replaces all replaceable
         * hits.
         */
        DialogSearchReplace.prototype.onReplaceAll = function () {
            if (this.search.current === undefined) {
                this.onFind();
            }
            while (this.search.current !== null) {
                if (this.search.canReplace) {
                    this.replace();
                }
                this.next();
            }
            this.updateButtons();
            return false;
        };
        /**
         * Replaces the current hit.
         */
        DialogSearchReplace.prototype.replace = function () {
            this.search.replace(this.replaceField.value);
        };
        /**
         * Moves to the next hit in the direction specified by the user.
         */
        DialogSearchReplace.prototype.next = function () {
            this.search.next(this.getSearchOptions());
        };
        /**
         * Processes an ``input`` event on the search field. May change the currently
         * highlighted hit.
         */
        DialogSearchReplace.prototype.onSearchInput = function () {
            var value = this.searchField.value;
            if (value !== this.previousSearchValue) {
                this.previousSearchValue = value;
                this.search.updatePattern(value, this.getSearchOptions());
                this.updateButtons();
            }
        };
        /**
         * Processes an ``input`` event on the replace field. Updates the buttons.
         */
        DialogSearchReplace.prototype.onReplaceInput = function () {
            this.updateButtons();
        };
        return DialogSearchReplace;
    }());
    exports.DialogSearchReplace = DialogSearchReplace;
});
//# sourceMappingURL=dialog-search-replace.js.map