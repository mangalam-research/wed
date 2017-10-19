/**
 * Label manager.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Maintains a mapping from HTML element id to labels meaningful to humans. Also
     * keeps a counter that can be used for assigning new ids to elements that don't
     * already have one.
     *
     */
    var LabelManager = /** @class */ (function () {
        /**
         * @param name The name of this label manager. This is a convenience that can
         * be used to produce distinctive error messages, for instance.
         */
        function LabelManager(name) {
            this.name = name;
            /** A mapping of element id to allocated label. */
            this._idToLabel = Object.create(null);
            /**
             * A counter that must be incremented with each new label allocation. This
             * allows the allocation algorithm to know what the next label should be.
             */
            this.labelIndex = 0;
        }
        /**
         * Gets the label associated with an id.
         *
         * @param id The id.
         *
         * @returns The label. The value returned by this method obeys the same rules
         * as that of [[allocateLabel]] with the exception that if a call returned
         * ``undefined`` it may return another value on a subsequent call. (That is,
         * an ``id`` that did not have a label allocated to it may acquire such
         * label.)
         */
        LabelManager.prototype.idToLabel = function (id) {
            return this._idToLabel[id];
        };
        /**
         * Deallocate all mappings between ids and labels. This will reset
         * [[_idToLabel]] to an empty map and [[labelIndex]] to 0.
         */
        LabelManager.prototype.deallocateAll = function () {
            this._idToLabel = Object.create(null);
            this.labelIndex = 0;
            this._deallocateAllLabels();
        };
        /**
         * Gets the next number in the number sequence. This increments
         * [[labelIndex]].
         *
         * @returns The number.
         */
        LabelManager.prototype.nextNumber = function () {
            return ++this.labelIndex;
        };
        return LabelManager;
    }());
    exports.LabelManager = LabelManager;
    var alphabet = "abcdefghijklmnopqrstuvwxyz";
    /**
     * A label manager that associates alphabetical labels to each id given to
     * it. It will associate labels "a", "b", "c", ... up to "z" and then will
     * associate "aa", "bb", "cc", ... up to "zz", and continues repeating
     * characters each time it cycles over the alphabet.
     *
     * @param {string} name The name of this label manager.
     */
    var AlphabeticLabelManager = /** @class */ (function (_super) {
        __extends(AlphabeticLabelManager, _super);
        function AlphabeticLabelManager() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AlphabeticLabelManager.prototype.allocateLabel = function (id) {
            var label = this._idToLabel[id];
            if (label === undefined) {
                // nextNumber() will start with 1, so we have to subtract.
                var ix = this.nextNumber() - 1;
                var round = Math.floor(ix / 26) + 1;
                var charIx = ix % 26;
                label = alphabet[charIx].repeat(round);
                this._idToLabel[id] = label;
            }
            return label;
        };
        // tslint:disable-next-line:no-empty
        AlphabeticLabelManager.prototype._deallocateAllLabels = function () { };
        return AlphabeticLabelManager;
    }(LabelManager));
    exports.AlphabeticLabelManager = AlphabeticLabelManager;
});
//  LocalWords:  LabelManager MPL allocateLabel Mangalam Dubeau

//# sourceMappingURL=labelman.js.map
