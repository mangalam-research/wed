define(["require", "exports", "./domutil"], function (require, exports, domutil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Represents a selection as wed understands it.
     */
    var WedSelection = /** @class */ (function () {
        /**
         * @param anchor The anchor point of the selection. The anchor is where the
         * selection started. It does not move when the user selects text.
         *
         * @param focus The focus point of the selection. It is the part of the
         * selection that moves when the user selects text. Omitting ``focus`` will
         * result in a collapsed selection.
         */
        function WedSelection(converter, anchor, focus) {
            this.converter = converter;
            this.anchor = anchor;
            this.focus = (focus === undefined) ? anchor : focus;
        }
        Object.defineProperty(WedSelection.prototype, "range", {
            get: function () {
                var rr = this.rangeInfo;
                if (rr === undefined) {
                    return undefined;
                }
                return rr.range;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WedSelection.prototype, "rangeInfo", {
            get: function () {
                return this.anchor.makeRange(this.focus);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WedSelection.prototype, "collapsed", {
            get: function () {
                return this.anchor.equals(this.focus);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WedSelection.prototype, "wellFormed", {
            get: function () {
                var range = this.range;
                if (range === undefined) {
                    return false;
                }
                return domutil_1.isWellFormedRange(range);
            },
            enumerable: true,
            configurable: true
        });
        WedSelection.prototype.asDataCarets = function () {
            var range = this.range;
            if (range === undefined) {
                return undefined;
            }
            var startCaret = this.converter.toDataLocation(range.startContainer, range.startOffset);
            var endCaret = this.converter.toDataLocation(range.endContainer, range.endOffset);
            if (startCaret === undefined || endCaret === undefined) {
                return undefined;
            }
            return [startCaret, endCaret];
        };
        WedSelection.prototype.mustAsDataCarets = function () {
            var ret = this.asDataCarets();
            if (ret === undefined) {
                throw new Error("cannot get the selection as data carets");
            }
            return ret;
        };
        /**
         * @returns Whether the two objects are equal. They are equal if they are the
         * same object or if they have equal focuses (foci?) and equal anchors.
         */
        WedSelection.prototype.equals = function (other) {
            if (other == null) {
                return false;
            }
            return this.focus.equals(other.focus) && this.anchor.equals(other.anchor);
        };
        return WedSelection;
    }());
    exports.WedSelection = WedSelection;
});
//  LocalWords:  MPL foci
//# sourceMappingURL=wed-selection.js.map