define(["require", "exports", "module", "./domtypeguards", "./domutil"], function (require, exports, module, domtypeguards_1, domutil) {
    /**
     * The base types for modes.
     *
     * @author Louis-Dominique Dubeau
     * @license MPL 2.0
     * @copyright Mangalam Research Center for Buddhist Languages
     */
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A mode for wed should be implemented as a module which exports a
     * class derived from this class.
     *
     *
     */
    var BaseMode = (function () {
        /**
         * @param editor The editor with which the mode is being associated.
         *
         * @param options The options for the mode. Each mode defines
         * what fields this object contains.
         */
        function BaseMode(editor, options) {
            this.editor = editor;
            this.options = options;
            this.wedOptions = {
                metadata: {
                    name: "Base Mode (you should not be using this)",
                    description: "The base mode. You should not be using it directly.",
                    authors: ["Louis-Dominique Dubeau"],
                    license: "MPL 2.0",
                    copyright: "Mangalam Research Center for Buddhist Languages",
                },
                label_levels: {
                    max: 1,
                    initial: 1,
                },
            };
        }
        /**
         * Gets the mode options. The returned object should be considered frozen. You
         * may inspect it, not modify it.
         */
        BaseMode.prototype.getModeOptions = function () {
            return this.options;
        };
        /**
         * Gets the options that the mode wants wed to use with this mode.
         *
         * @returns The options. Callers are not allowed to modify the value returned.
         */
        BaseMode.prototype.getWedOptions = function () {
            return this.wedOptions;
        };
        /**
         * @returns The base implementation returns an empty array.
         */
        BaseMode.prototype.getStylesheets = function () {
            return [];
        };
        BaseMode.prototype.nodesAroundEditableContents = function (element) {
            var start = null;
            var startIx;
            var end = null;
            var endIx;
            var child = element.firstChild;
            var childIx = 0;
            while (child !== null) {
                if (domtypeguards_1.isElement(child)) {
                    if (child.classList.contains("_start_wrapper")) {
                        startIx = childIx;
                        start = child;
                    }
                    if (child.classList.contains("_end_wrapper")) {
                        endIx = childIx;
                        end = child;
                        // We want the first end_wrapper we hit. There is no need to continue.
                        break;
                    }
                }
                child = child.nextSibling;
                childIx++;
            }
            if (startIx !== undefined && endIx !== undefined && endIx <= startIx) {
                throw new Error("end wrapper element unexpectedly appears before " +
                    "start wrapper element, or is also a start wrapper " +
                    "element");
            }
            return [start, end];
        };
        BaseMode.prototype.makePlaceholderFor = function (element) {
            return domutil.makePlaceholder();
        };
        /**
         * While this API provides for the case where descriptions have not been
         * loaded yet or cannot be loaded, this class does not allow such eventuality
         * to occur. Derived classes could allow it.
         *
         * @returns This default implementation always returns ``undefined``.
         */
        BaseMode.prototype.shortDescriptionFor = function (name) {
            return undefined;
        };
        /**
         * While this API provides for the case such URL have not been loaded
         * yet or cannot be loaded, this class does not allow such eventuality
         * to occur. Derived classes could allow it.
         *
         * @returns The default implementation always returns ``undefined``.
         */
        BaseMode.prototype.documentationLinkFor = function (name) {
            return undefined;
        };
        /**
         * @returns ``undefined``. The default implementation has no mode-specific
         * checks and thus not return a validator.
         */
        BaseMode.prototype.getValidator = function () {
            return undefined;
        };
        /**
         * The default implementation returns an empty array.
         */
        BaseMode.prototype.getAttributeCompletions = function (attribute) {
            return [];
        };
        return BaseMode;
    }());
    exports.BaseMode = BaseMode;
});
//  LocalWords:  RequireJS stylesheets subarrays overriden html MPL
//  LocalWords:  Mangalam Dubeau domutil

//# sourceMappingURL=mode.js.map
