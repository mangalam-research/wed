define(["require", "exports", "rangy", "./dloc", "./domtypeguards", "./domutil"], function (require, exports, rangy, dloc_1, domtypeguards_1, domutil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** The direction of searches. */
    var Direction;
    (function (Direction) {
        Direction[Direction["FORWARD"] = 0] = "FORWARD";
        Direction[Direction["BACKWARDS"] = 1] = "BACKWARDS";
    })(Direction = exports.Direction || (exports.Direction = {}));
    /** The context for searches. */
    var Context;
    (function (Context) {
        /** Everywhere in a document, including non-editable graphical elements. */
        Context[Context["EVERYWHERE"] = 0] = "EVERYWHERE";
        /** Only element text. */
        Context[Context["TEXT"] = 1] = "TEXT";
        /** Only attribute values. */
        Context[Context["ATTRIBUTE_VALUES"] = 2] = "ATTRIBUTE_VALUES";
    })(Context = exports.Context || (exports.Context = {}));
    function unknownDirection(d) {
        throw new Error("unknown direction: " + d);
    }
    function directionToRangyDirection(direction) {
        // There does not seem to be a way currently to declare this map in a way
        // that will enforce that all directions have a value. :-/
        var ret = (_a = {},
            _a[Direction.FORWARD] = "forward",
            _a[Direction.BACKWARDS] = "backward",
            _a)[direction];
        if (ret === undefined) {
            // We have to cast to never since we're not using the switch exhaustion.
            return unknownDirection(direction);
        }
        return ret;
        var _a;
    }
    function nodeInScope(doc, node, scope) {
        var vrange = doc.createRange();
        vrange.selectNode(node);
        // The range that encompasses the node, must be completely within scope.
        return (vrange.compareBoundaryPoints(Range.START_TO_START, scope) >= 0) &&
            (vrange.compareBoundaryPoints(Range.END_TO_END, scope) <= 0);
    }
    /**
     * This is a utility class that holds a position among a list of elements
     * (representing attributes, in our usage).
     */
    var AttributeValueCursor = /** @class */ (function () {
        /**
         * @param values The values to iterate over.
         *
         * @param direction The direction to iterate over.
         */
        function AttributeValueCursor(values, direction) {
            this.values = values;
            this.direction = direction;
            this.resetToStart();
        }
        /**
         * @param value The index to reset this iterator to.
         */
        AttributeValueCursor.prototype.reset = function (value) {
            this.current = value;
        };
        /**
         * @param value Reset to the start of [[values]]. This will be position 0 for
         * an iterator moving forward. Or the end of [[values]] for an iterator moving
         * backwards.
         */
        AttributeValueCursor.prototype.resetToStart = function () {
            switch (this.direction) {
                case Direction.FORWARD:
                    this.current = 0;
                    break;
                case Direction.BACKWARDS:
                    this.current = this.values.length - 1;
                    break;
                default:
                    return unknownDirection(this.direction);
            }
        };
        Object.defineProperty(AttributeValueCursor.prototype, "hasNext", {
            /**
             * @returns ``true`` if we have not reached the end of the array.
             */
            get: function () {
                switch (this.direction) {
                    case Direction.FORWARD:
                        return this.current < this.values.length;
                    case Direction.BACKWARDS:
                        return this.current >= 0;
                    default:
                        return unknownDirection(this.direction);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AttributeValueCursor.prototype, "next", {
            /**
             * This is the next element in iteration order. Moves the iterator in the
             * direction of travel.
             */
            get: function () {
                var ret = this.values[this.current];
                this.inc();
                return ret;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Moves the iterator in the direction of travel.
         */
        AttributeValueCursor.prototype.inc = function () {
            switch (this.direction) {
                case Direction.FORWARD:
                    this.current++;
                    break;
                case Direction.BACKWARDS:
                    this.current--;
                    break;
                default:
                    return unknownDirection(this.direction);
            }
        };
        return AttributeValueCursor;
    }());
    /**
     * This models a search on the GUI tree. Performing searches directly on the
     * data tree is theoretically possible but fraught with problems. For instance,
     * some data may not be visible to users and so the search in the data tree
     * would have to constantly refer to the GUI tree to determine whether a hit
     * should be shown. Additionally, the order of the data shown in the GUI tree
     * may differ from the order in the data tree.
     */
    var Search = /** @class */ (function () {
        function Search(caretManager, guiRoot, start, scope) {
            this.caretManager = caretManager;
            this.guiRoot = guiRoot;
            this.start = start;
            this._pattern = "";
            /** The direction in which the search moves. */
            this.direction = Direction.FORWARD;
            /** The context for the search. */
            this.context = Context.EVERYWHERE;
            this.root = dloc_1.getRoot(guiRoot);
            this.setScope(scope);
            var realScope = this.scope;
            if (realScope.start.compare(start) > 0 ||
                realScope.end.compare(start) < 0) {
                throw new Error("the scope does not contain the start position");
            }
            this.start = start;
        }
        Object.defineProperty(Search.prototype, "pattern", {
            get: function () {
                return this._pattern;
            },
            set: function (value) {
                this._pattern = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Set the search scope. No result will be returned outside the scope. Setting
         * the scope to ``undefined`` means "search the whole document".
         */
        Search.prototype.setScope = function (range) {
            if (range === undefined) {
                this._scope = undefined;
                return;
            }
            if (!range.isValid()) {
                throw new Error("passed an invalid range");
            }
            var start = range.start, end = range.end;
            if (start.root !== this.root.node) {
                throw new Error("the range does not use the search's root");
            }
            // Since the start and end of a range must share the same root, we don't
            // have to test the end of the range.
            this._scope = start.compare(end) > 0 ?
                // Start is after end, flip them.
                new dloc_1.DLocRange(end, start) :
                // Regular order
                new dloc_1.DLocRange(start, end);
        };
        Object.defineProperty(Search.prototype, "scope", {
            get: function () {
                if (this._scope === undefined) {
                    this._scope = new dloc_1.DLocRange(dloc_1.DLoc.mustMakeDLoc(this.root, this.guiRoot, 0), dloc_1.DLoc.mustMakeDLoc(this.root, this.guiRoot, this.guiRoot.childNodes.length));
                }
                return this._scope;
            },
            enumerable: true,
            configurable: true
        });
        Search.prototype.updateCurrent = function () {
            this._next(true);
        };
        Search.prototype.next = function () {
            this._next(false);
        };
        Search.prototype._next = function (includeCurrent) {
            var ret = null;
            if (this.pattern !== "") {
                var rollPosition = void 0;
                var start = void 0;
                switch (this.direction) {
                    case Direction.FORWARD: {
                        start = this.getForwardSearchStart(includeCurrent);
                        rollPosition = this.scope.start;
                        break;
                    }
                    case Direction.BACKWARDS: {
                        start = this.getBackwardSearchStart(includeCurrent);
                        rollPosition = this.scope.end;
                        break;
                    }
                    default:
                        return unknownDirection(this.direction);
                }
                var hit = this.find(start, this.direction);
                if (hit !== null) {
                    ret = new dloc_1.DLocRange(dloc_1.DLoc.mustMakeDLoc(this.root, hit.startContainer, hit.startOffset), dloc_1.DLoc.mustMakeDLoc(this.root, hit.endContainer, hit.endOffset));
                }
                else {
                    // If we did not get a hit, we roll over on the next search.
                    this.start = rollPosition;
                }
            }
            this.current = ret;
        };
        Search.prototype.find = function (start, direction) {
            if (this.context === Context.ATTRIBUTE_VALUES) {
                return this.findAttributeValue(start, direction);
            }
            return this.findText(start, directionToRangyDirection(direction));
        };
        Search.prototype.findText = function (start, direction) {
            // tslint:disable-next-line:no-any
            var config = rangy.config;
            var range = new rangy.WrappedRange(start.makeRange());
            if (this.context === Context.TEXT) {
                config.customIsCollapsedNode = function (node) {
                    return domtypeguards_1.isElement(node) && node.closest("._phantom") !== null;
                };
            }
            var found = range.findText(this.pattern, {
                withinRange: this.scope.mustMakeDOMRange(),
                direction: direction,
            });
            // There is a bug in Rangy that makes it so that it may sometimes return
            // hits outside the scope. Test for it.
            if (found) {
                var hitStart = dloc_1.DLoc.mustMakeDLoc(this.guiRoot, range.startContainer, range.startOffset);
                if (!this.scope.contains(hitStart)) {
                    found = false;
                }
            }
            config.customIsCollapsedNode = undefined;
            return found ? range.nativeRange : null;
        };
        Search.prototype.findAttributeValue = function (start, direction) {
            // Implement our own logic instead of relying on rangy. We can just move
            // from attribute value to attribute value and checks the values.
            var guiRoot = this.guiRoot;
            var allValues = Array.from(guiRoot.getElementsByClassName("_attribute_value"));
            var caretManager = this.caretManager;
            var valueCursor = new AttributeValueCursor(allValues, direction);
            var attrValue = domutil_1.closestByClass(start.node, "_attribute_value", guiRoot);
            var doc = guiRoot.ownerDocument;
            var scope = this.scope.mustMakeDOMRange();
            if (attrValue === null) {
                // We need to find the next attribute.
                var found = void 0;
                while (valueCursor.hasNext) {
                    var value = valueCursor.next;
                    if (nodeInScope(doc, value, scope) &&
                        // tslint:disable-next-line:no-bitwise
                        ((value.compareDocumentPosition(start.node) &
                            Node.DOCUMENT_POSITION_PRECEDING) !== 0)) {
                        found = value;
                        break;
                    }
                }
                if (found === undefined) {
                    return null;
                }
                start = start.make(found, 0);
            }
            else {
                var index = allValues.indexOf(attrValue);
                if (index === -1) {
                    throw new Error("internal error: cannot find value in array!");
                }
                valueCursor.reset(index);
                valueCursor.inc();
            }
            var dataLoc = caretManager.toDataLocation(start);
            // tslint:disable-next-line:no-constant-condition
            while (true) {
                // Going into the data tree simplifies some of the work here.
                var node = dataLoc.node;
                var index = void 0;
                switch (direction) {
                    case Direction.FORWARD:
                        index = node.value.indexOf(this.pattern, dataLoc.offset);
                        break;
                    case Direction.BACKWARDS:
                        // For a backward search, the hit is not allowed to cross the start
                        // position. (This, by the way, is the same way Emacs operates.)
                        var startOffset = dataLoc.offset - this.pattern.length;
                        index = (startOffset < 0) ?
                            -1 : node.value.lastIndexOf(this.pattern, startOffset);
                        break;
                    default:
                        return unknownDirection(direction);
                }
                if (index !== -1) {
                    var rangeStart = caretManager.mustFromDataLocation(dataLoc.makeWithOffset(index));
                    var rangeEnd = caretManager.mustFromDataLocation(dataLoc.makeWithOffset(index + this.pattern.length));
                    if (this.scope.contains(rangeStart) && this.scope.contains(rangeEnd)) {
                        return new dloc_1.DLocRange(rangeStart, rangeEnd).mustMakeDOMRange();
                    }
                }
                // We did not find a good hit, so continue searching other values.
                var next = null;
                while (next === null && valueCursor.hasNext) {
                    next = valueCursor.next;
                    if (!nodeInScope(doc, next, scope)) {
                        next = null;
                    }
                }
                if (next === null) {
                    return null;
                }
                var dataNext = caretManager.toDataLocation(next, 0);
                switch (direction) {
                    case Direction.FORWARD:
                        break;
                    case Direction.BACKWARDS:
                        dataNext =
                            dataNext.makeWithOffset(dataNext.node.value.length);
                        break;
                    default:
                        return unknownDirection(direction);
                }
                dataLoc = dataNext;
            }
        };
        Search.prototype.getForwardSearchStart = function (includeCurrent) {
            if (this.current != null) {
                return includeCurrent ? this.current.start : this.current.end;
            }
            return this.start;
        };
        Search.prototype.getBackwardSearchStart = function (includeCurrent) {
            var ret;
            if (this.current != null) {
                ret = includeCurrent ? this.prevEnd : this.current.start;
            }
            if (ret === undefined) {
                ret = this.start;
            }
            this.prevEnd = ret;
            return ret;
        };
        return Search;
    }());
    exports.Search = Search;
});
//# sourceMappingURL=search.js.map