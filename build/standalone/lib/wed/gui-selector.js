define(["require", "exports", "./domutil"], function (require, exports, domutil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A "GUI selector" is a CSS selector apt to be used in the GUI tree.
     */
    var GUISelector = /** @class */ (function () {
        /**
         * @param value The value that the selector holds.
         */
        function GUISelector(value) {
            this.value = value;
            var existing = GUISelector.__cache[value];
            if (existing !== undefined) {
                return existing;
            }
            GUISelector.__cache[value] = this;
        }
        /**
         * Make a GUI selector from a CSS selector, as-is.
         *
         * @param selector The value that the selector will hold.
         */
        GUISelector.makeVerbatim = function (selector) {
            return new GUISelector(selector);
        };
        /**
         * Make a GUI selector from a data selector. The limitations on the selector
         * are the same as for [["wed/domutil".toGUISelector]].
         *
         * @param selector A selector fit for selecting in the data tree.
         *
         * @param namespaces The namespace mappings to use to convert prefixes in the
         * selector.
         *
         * @returns A [[GUISelector]] corresponding to the parameters used.
         */
        GUISelector.fromDataSelector = function (selector, namespaces) {
            return new GUISelector(domutil_1.toGUISelector(selector, namespaces));
        };
        // tslint:disable-next-line:variable-name
        GUISelector.__cache = Object.create(null);
        return GUISelector;
    }());
    exports.GUISelector = GUISelector;
});
//  LocalWords:  MPL
//# sourceMappingURL=gui-selector.js.map