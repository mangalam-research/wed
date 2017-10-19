define(["require", "exports", "module", "./domutil"], function (require, exports, module, domutil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var cache = new WeakMap();
    /**
     * A "GUI selector" is a CSS selector apt to be used in the GUI tree.
     */
    var GUISelector = /** @class */ (function () {
        /**
         * @param value The value that the selector holds.
         */
        function GUISelector(value) {
            var existing = cache.get(value);
            if (existing !== undefined) {
                return existing;
            }
            this.value = value;
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
         * are the same as for [["domutil".toGUISelector]].
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
        return GUISelector;
    }());
    exports.GUISelector = GUISelector;
});
//  LocalWords:  MPL

//# sourceMappingURL=gui-selector.js.map
