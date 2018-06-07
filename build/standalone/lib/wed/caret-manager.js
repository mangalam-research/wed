var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "jquery", "rxjs", "./browsers", "./caret-mark", "./caret-movement", "./dloc", "./domtypeguards", "./domutil", "./object-check", "./wed-selection", "./wed-util"], function (require, exports, jquery_1, rxjs_1, browsers, caret_mark_1, caretMovement, dloc_1, domtypeguards_1, domutil_1, objectCheck, wed_selection_1, wed_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    jquery_1 = __importDefault(jquery_1);
    browsers = __importStar(browsers);
    caretMovement = __importStar(caretMovement);
    objectCheck = __importStar(objectCheck);
    /**
     * This is the template use with objectCheck to check whether the options passed
     * are correct. Changes to [[SetCaretOptions]] must be reflected here.
     */
    var caretOptionTemplate = {
        textEdit: false,
        focus: false,
    };
    /**
     * Find a previous sibling which is either a text node or a node with the class
     * ``_real``.
     *
     * @param node The element whose sibling we are looking for.
     *
     * @param cl The class to use for matches.
     *
     * @returns The first sibling (searing in reverse document order from ``node``)
     * that matches the class, or ``null`` if nothing matches.
     */
    function previousTextOrReal(node) {
        if (!domtypeguards_1.isElement(node)) {
            return null;
        }
        var child = node.previousSibling;
        while (child !== null &&
            !(domtypeguards_1.isText(child) ||
                (domtypeguards_1.isElement(child) && child.classList.contains("_real")))) {
            child = child.previousSibling;
        }
        return child;
    }
    /**
     * A caret manager maintains and modifies caret and selection positions. It also
     * manages associated GUI elements like the input field. It is also responsible
     * for converting positions in the GUI tree to positions in the data tree and
     * vice-versa.
     *
     * Given wed's notion of parallel data and GUI trees. A caret can either point
     * into the GUI tree or into the data tree. In the following documentation, if
     * the caret is not qualified, then it is a GUI caret.
     *
     * Similarly, a selection can either span a range in the GUI tree or in the data
     * tree. Again, "selection" without qualifier is a GUI selection.
     */
    var CaretManager = /** @class */ (function () {
        /**
         * @param guiRoot The object representing the root of the gui tree.
         *
         * @param dataRoot The object representing the root of the data tree.
         *
         * @param inputField The HTML element that is the input field.
         *
         * @param guiUpdater The GUI updater that is responsible for updating the
         * tree whose root is ``guiRoot``.
         *
         * @param layer The layer that holds the caret.
         *
         * @param scroller The element that scrolls ``guiRoot``.
         *
         * @param modeTree The mode tree from which to get modes.
         */
        function CaretManager(guiRoot, dataRoot, inputField, guiUpdater, layer, scroller, modeTree) {
            var _this = this;
            this.guiRoot = guiRoot;
            this.dataRoot = dataRoot;
            this.inputField = inputField;
            this.guiUpdater = guiUpdater;
            this.layer = layer;
            this.scroller = scroller;
            this.modeTree = modeTree;
            this.selectionStack = [];
            this.mark = new caret_mark_1.CaretMark(this, guiRoot.node.ownerDocument, layer, inputField, scroller);
            var guiRootEl = this.guiRootEl = guiRoot.node;
            this.dataRootEl = dataRoot.node;
            this.doc = guiRootEl.ownerDocument;
            this.win = this.doc.defaultView;
            this.$inputField = jquery_1.default(this.inputField);
            this._events = new rxjs_1.Subject();
            this.events = this._events.asObservable();
            jquery_1.default(this.guiRootEl).on("focus", function (ev) {
                _this.focusInputField();
                ev.preventDefault();
                ev.stopPropagation();
            });
            jquery_1.default(this.win).on("blur.wed", this.onBlur.bind(this));
            jquery_1.default(this.win).on("focus.wed", this.onFocus.bind(this));
        }
        Object.defineProperty(CaretManager.prototype, "caret", {
            /**
             * The raw caret. Use [[getNormalizedCaret]] if you need it normalized.
             *
             * This is synonymous with the focus of the current selection. (`foo.caret ===
             * foo.focus === foo.sel.focus`).
             */
            get: function () {
                return this.focus;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CaretManager.prototype, "sel", {
            /**
             * The current selection.
             */
            get: function () {
                return this._sel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CaretManager.prototype, "focus", {
            /**
             * The focus of the current selection.
             */
            get: function () {
                if (this._sel === undefined) {
                    return undefined;
                }
                return this._sel.focus;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CaretManager.prototype, "anchor", {
            /**
             * The anchor of the current selection.
             */
            get: function () {
                if (this._sel === undefined) {
                    return undefined;
                }
                return this._sel.anchor;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CaretManager.prototype, "range", {
            /**
             * The range formed by the current selection.
             */
            get: function () {
                var info = this.rangeInfo;
                return info !== undefined ? info.range : undefined;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CaretManager.prototype, "rangeInfo", {
            /**
             * A range info object describing the current selection.
             */
            get: function () {
                var sel = this._sel;
                if (sel === undefined) {
                    return undefined;
                }
                return sel.rangeInfo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CaretManager.prototype, "minCaret", {
            get: function () {
                return dloc_1.DLoc.mustMakeDLoc(this.guiRoot, this.guiRootEl, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CaretManager.prototype, "maxCaret", {
            get: function () {
                return dloc_1.DLoc.mustMakeDLoc(this.guiRoot, this.guiRootEl, this.guiRootEl.childNodes.length);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CaretManager.prototype, "docDLocRange", {
            get: function () {
                return new dloc_1.DLocRange(this.minCaret, this.maxCaret);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Get a normalized caret.
         *
         * @returns A normalized caret, or ``undefined`` if there is no caret.
         */
        CaretManager.prototype.getNormalizedCaret = function () {
            var caret = this.caret;
            if (caret === undefined) {
                return caret;
            }
            // The node is not in the root. This could be due to a stale location.
            if (!this.guiRootEl.contains(caret.node)) {
                return undefined;
            }
            if (!caret.isValid()) {
                var newSel = new wed_selection_1.WedSelection(this, this.anchor, caret.normalizeOffset());
                this._sel = newSel;
                caret = newSel.focus;
            }
            var normalized = this._normalizeCaret(caret);
            return normalized == null ? undefined : normalized;
        };
        /**
         * Same as [[getNormalizedCaret]] but must return a location.
         *
         * @throws {Error} If it cannot return a location.
         */
        CaretManager.prototype.mustGetNormalizedCaret = function () {
            var ret = this.getNormalizedCaret();
            if (ret === undefined) {
                throw new Error("cannot get a normalized caret");
            }
            return ret;
        };
        CaretManager.prototype.normalizeToEditableRange = function (loc) {
            if (loc.root !== this.guiRootEl) {
                throw new Error("DLoc object must be for the GUI tree");
            }
            var offset = loc.offset;
            var node = loc.node;
            if (domtypeguards_1.isElement(node)) {
                // Normalize to a range within the editable nodes. We could be outside of
                // them in an element which is empty, for instance.
                var mode = this.modeTree.getMode(node);
                var _a = mode.nodesAroundEditableContents(node), first = _a[0], second = _a[1];
                var firstIndex = first !== null ? domutil_1.indexOf(node.childNodes, first) : -1;
                if (offset <= firstIndex) {
                    offset = firstIndex + 1;
                }
                else {
                    var secondIndex = second !== null ?
                        domutil_1.indexOf(node.childNodes, second) : node.childNodes.length;
                    if (offset >= secondIndex) {
                        offset = secondIndex;
                    }
                }
                return loc.makeWithOffset(offset);
            }
            return loc;
        };
        /**
         * Get the current caret position in the data tree.
         *
         * @param approximate Some GUI locations do not correspond to data
         * locations. Like if the location is in a gui element or phantom text. By
         * default, this method will return undefined in such case. If this parameter
         * is true, then this method will return the closest position.
         *
         * @returns A caret position in the data tree, or ``undefined`` if no such
         * position exists.
         */
        CaretManager.prototype.getDataCaret = function (approximate) {
            var caret = this.getNormalizedCaret();
            if (caret === undefined) {
                return undefined;
            }
            return this.toDataLocation(caret, approximate);
        };
        CaretManager.prototype.fromDataLocation = function (node, offset) {
            if (node instanceof dloc_1.DLoc) {
                offset = node.offset;
                node = node.node;
            }
            if (offset === undefined) {
                throw new Error("offset is undefined");
            }
            var ret = this.guiUpdater.fromDataLocation(node, offset);
            if (ret === null) {
                return undefined;
            }
            var newOffset = ret.offset;
            node = ret.node;
            if (domtypeguards_1.isElement(node)) {
                // Normalize to a range within the editable nodes. We could be outside of
                // them in an element which is empty, for instance.
                var mode = this.modeTree.getMode(node);
                var _a = mode.nodesAroundEditableContents(node), first = _a[0], second = _a[1];
                var firstIndex = (first !== null) ? domutil_1.indexOf(node.childNodes, first) :
                    -1;
                if (newOffset <= firstIndex) {
                    newOffset = firstIndex + 1;
                }
                else {
                    var secondIndex = second !== null ? domutil_1.indexOf(node.childNodes, second) :
                        node.childNodes.length;
                    if (newOffset >= secondIndex) {
                        newOffset = secondIndex;
                    }
                }
                return ret.makeWithOffset(newOffset);
            }
            return ret;
        };
        // @ts-ignore
        CaretManager.prototype.mustFromDataLocation = function (node, offset) {
            var ret = this.fromDataLocation.apply(this, arguments);
            if (ret === undefined) {
                throw new Error("cannot convert to a data location");
            }
            return ret;
        };
        // tslint:disable-next-line:cyclomatic-complexity
        CaretManager.prototype.toDataLocation = function (loc, offset, approximate) {
            if (offset === void 0) { offset = false; }
            if (approximate === void 0) { approximate = false; }
            var node;
            var root;
            if (loc instanceof dloc_1.DLoc) {
                if (typeof offset !== "boolean") {
                    throw new Error("2nd argument must be a boolean");
                }
                approximate = offset;
                (offset = loc.offset, node = loc.node, root = loc.root);
            }
            else {
                node = loc;
            }
            if (typeof offset !== "number") {
                throw new Error("offset must be a number");
            }
            var initialCaret = this.makeCaret(node, offset);
            if (domutil_1.closestByClass(node, "_attribute_value", root) === null) {
                var wrap = domutil_1.closestByClass(node, "_phantom_wrap", root);
                if (wrap !== null) {
                    // We are in a phantom wrap. Set position to the real element being
                    // wrapped. This is not considered to be an "approximation" because
                    // _phantom_wrap elements are considered visual parts of the real
                    // element.
                    initialCaret = this.makeCaret(wrap.getElementsByClassName("_real")[0]);
                }
                else {
                    var topPg = void 0;
                    var check = (domtypeguards_1.isText(node) ? node.parentNode : node);
                    while (check !== null && check !== this.guiRootEl) {
                        if ((check.classList.contains("_phantom") ||
                            check.classList.contains("_gui"))) {
                            // We already know that the caller does not want an approximation.
                            // No point in going on.
                            if (!approximate) {
                                return undefined;
                            }
                            topPg = check;
                        }
                        check = check.parentNode;
                    }
                    if (topPg !== undefined) {
                        initialCaret = this.makeCaret(topPg);
                    }
                }
            }
            var normalized = this._normalizeCaret(initialCaret);
            if (normalized == null) {
                return undefined;
            }
            (node = normalized.node, offset = normalized.offset);
            var dataNode = this.dataRoot.pathToNode(this.guiRoot.nodeToPath(node));
            if (domtypeguards_1.isText(node)) {
                return this.makeCaret(dataNode, offset, true);
            }
            if (offset >= node.childNodes.length) {
                return dataNode === null ? undefined :
                    this.makeCaret(dataNode, dataNode.childNodes.length);
            }
            // If pointing to a node that is not a text node or a real element, we must
            // find the previous text node or real element and return a position which
            // points after it.
            var child = node.childNodes[offset];
            if (domtypeguards_1.isElement(child) && !child.classList.contains("_real")) {
                var found = previousTextOrReal(child);
                if (found === null) {
                    return this.makeCaret(dataNode, 0);
                }
                dataNode = this.dataRoot.pathToNode(this.guiRoot.nodeToPath(found));
                if (dataNode === null) {
                    return undefined;
                }
                var parent_1 = dataNode.parentNode;
                return this.makeCaret(parent_1, domutil_1.indexOf(parent_1.childNodes, dataNode) + 1);
            }
            dataNode = this.dataRoot.pathToNode(this.guiRoot.nodeToPath(child));
            return this.makeCaret(dataNode, domtypeguards_1.isAttr(dataNode) ? offset : undefined);
        };
        /**
         * Modify the passed position so that it if appears inside of a placeholder
         * node, the resulting position is moved out of it.
         *
         * @param loc The location to normalize.
         *
         * @returns The normalized position. If ``undefined`` or ``null`` was passed,
         * then the return value is the same as what was passed.
         */
        CaretManager.prototype._normalizeCaret = function (loc) {
            if (loc == null) {
                return loc;
            }
            var pg = domutil_1.closestByClass(loc.node, "_placeholder", loc.root);
            // If we are in a placeholder: make the caret be the parent of the this
            // node.
            return (pg !== null) ? loc.make(pg) : loc;
        };
        /**
         * Make a caret from a node and offset pair.
         *
         * @param node The node from which to make the caret. The node may be in the
         * GUI tree or the data tree. If ``offset`` is omitted, the resulting location
         * will point to this node (rather than point to some offset *inside* the
         * node.)
         *
         * @param offset The offset into the node.
         *
         * @param normalize Whether to normalize the location. (Note that this is
         * normalization in the [[DLoc]] sense of the term.)
         *
         * @returns A new caret. This will be ``undefined`` if the value passed for
         * ``node`` was undefined or if the node is not in the GUI or data trees.
         */
        CaretManager.prototype.makeCaret = function (node, offset, normalize) {
            if (normalize === void 0) { normalize = false; }
            if (node == null) {
                return undefined;
            }
            var root;
            if (this.guiRootEl.contains(node)) {
                root = this.guiRoot;
            }
            else if (domutil_1.contains(this.dataRootEl, node)) {
                root = this.dataRoot;
            }
            if (root === undefined) {
                return undefined;
            }
            return dloc_1.DLoc.mustMakeDLoc(root, node, offset, normalize);
        };
        CaretManager.prototype.setRange = function (anchorNode, anchorOffset, focusNode, focusOffset) {
            var anchor;
            var focus;
            if (anchorNode instanceof dloc_1.DLoc && anchorOffset instanceof dloc_1.DLoc) {
                anchor = anchorNode;
                focus = anchorOffset;
            }
            else {
                anchor = this.makeCaret(anchorNode, anchorOffset);
                focus = this.makeCaret(focusNode, focusOffset);
            }
            if (anchor === undefined || focus === undefined) {
                throw new Error("must provide both anchor and focus");
            }
            if (anchor.root === this.dataRootEl) {
                anchor = this.fromDataLocation(anchor);
                focus = this.fromDataLocation(focus);
                if (anchor === undefined || focus === undefined) {
                    throw new Error("cannot find GUI anchor and focus");
                }
            }
            var sel = this._sel = new wed_selection_1.WedSelection(this, anchor, focus);
            // This check reduces selection fiddling by an order of magnitude when just
            // straightforwardly selecting one character.
            if (this.prevCaret === undefined || !this.prevCaret.equals(focus)) {
                this.mark.refresh();
                var range = sel.range;
                if (range === undefined) {
                    throw new Error("unable to make a range");
                }
                this._setDOMSelectionRange(range);
            }
            this._caretChange();
        };
        /**
         * Compute a position derived from an arbitrary position. Note that
         * this method is meant to be used for positions in the GUI tree. Computing
         * positions in the data tree requires no special algorithm.
         *
         * This method does not allow movement outside of the GUI tree.
         *
         * @param pos The starting position in the GUI tree.
         *
         * @param direction The direction in which to move.
         *
         * @return The position to the right of the starting position. Or
         * ``undefined`` if the starting position was undefined or if there is no
         * valid position to compute.
         */
        CaretManager.prototype.newPosition = function (pos, direction) {
            return caretMovement.newPosition(pos, direction, this.guiRootEl, this.modeTree);
        };
        /**
         * Compute the position of the current caret if it were moved according to
         * some direction.
         *
         * @param direction The direction in which the caret would be moved.
         *
         * @return The position to the right of the caret position. Or ``undefined``
         * if there is no valid position to compute.
         */
        CaretManager.prototype.newCaretPosition = function (direction) {
            return this.newPosition(this.caret, direction);
        };
        /**
         * Move the caret in a specific direction. The caret may not move if it is
         * not possible to move in the specified direction.
         *
         * @param direction The direction in which to move.
         */
        CaretManager.prototype.move = function (direction, extend) {
            if (extend === void 0) { extend = false; }
            var pos = this.newCaretPosition(direction);
            if (pos === undefined) {
                return;
            }
            if (!extend) {
                this.setCaret(pos);
            }
            else {
                var anchor = this.anchor;
                if (anchor !== undefined) {
                    this.setRange(anchor, pos);
                }
            }
        };
        CaretManager.prototype.setCaret = function (node, offset, options) {
            var loc;
            if (node instanceof dloc_1.DLoc) {
                loc = node;
                if (typeof offset === "number") {
                    throw new Error("2nd argument must be options");
                }
                options = offset;
                offset = undefined;
            }
            else {
                if (offset !== undefined && typeof offset !== "number") {
                    throw new Error("2nd argument must be number");
                }
                var newLoc = this.makeCaret(node, offset);
                if (newLoc === undefined) {
                    return;
                }
                loc = newLoc;
            }
            if (options !== undefined) {
                objectCheck.assertSummarily(caretOptionTemplate, options);
            }
            else {
                options = {};
            }
            this._setGUICaret(loc.root === this.guiRootEl ?
                loc : this.fromDataLocation(loc), options);
        };
        /**
         * Set the caret into a normalized label position. There are only some
         * locations in which it is valid to put the caret inside a label:
         *
         * - The element name.
         *
         * - Inside attribute values.
         *
         * This method is used by DOM event handlers (usually mouse events handlers)
         * to normalize the location of the caret to one of the valid locations listed
         * above.
         *
         * @param target The target of the DOM event that requires moving the caret.
         *
         * @param label The label element that contains ``target``.
         *
         * @param location The location of the event, which is what is normalized by
         * this method.
         */
        CaretManager.prototype.setCaretToLabelPosition = function (target, label, location) {
            var node;
            var offset = 0;
            // Note that in the code that follows, the choice between testing against
            // ``target`` or against ``location.node`` is not arbitrary.
            var attr = domutil_1.closestByClass(target, "_attribute", label);
            if (attr !== null) {
                if (domutil_1.closestByClass(location.node, "_attribute_value", label) !== null) {
                    (node = location.node, offset = location.offset);
                }
                else {
                    node = wed_util_1.getAttrValueNode(attr.getElementsByClassName("_attribute_value")[0]);
                }
            }
            else {
                // Find the element name and put it there.
                node = label.getElementsByClassName("_element_name")[0];
            }
            this.setCaret(node, offset);
        };
        /**
         * Save the current selection (and caret) on an internal selection stack.
         */
        CaretManager.prototype.pushSelection = function () {
            this.selectionStack.push(this._sel);
        };
        /**
         * Pop the last selection that was pushed with ``pushSelection`` and restore
         * the current caret and selection on the basis of the popped value.
         */
        CaretManager.prototype.popSelection = function () {
            this._sel = this.selectionStack.pop();
            this._restoreCaretAndSelection(false);
        };
        /**
         * Pop the last selection that was pushed with ``pushSelection`` but do not
         * restore the current caret and selection from the popped value.
         */
        CaretManager.prototype.popSelectionAndDiscard = function () {
            this.selectionStack.pop();
        };
        /**
         * Restores the caret and selection from the current selection. This is used
         * to deal with situations in which the caret and range may have been
         * "damaged" due to browser operations, changes of state, etc.
         *
         * @param gainingFocus Whether the restoration of the caret and selection is
         * due to regaining focus or not.
         */
        CaretManager.prototype._restoreCaretAndSelection = function (gainingFocus) {
            if (this.caret !== undefined && this.anchor !== undefined &&
                // It is possible that the anchor has been removed after focus was lost
                // so check for it.
                this.guiRootEl.contains(this.anchor.node)) {
                var range = this.range;
                if (range === undefined) {
                    throw new Error("could not make a range");
                }
                this._setDOMSelectionRange(range);
                // We're not selecting anything...
                if (range.collapsed) {
                    this.focusInputField();
                }
                this.mark.refresh();
                this._caretChange({ gainingFocus: gainingFocus });
            }
            else {
                this.clearSelection();
            }
        };
        /**
         * Clear the selection and caret.
         */
        CaretManager.prototype.clearSelection = function () {
            this._sel = undefined;
            this.mark.refresh();
            var sel = this._getDOMSelection();
            if (sel.rangeCount > 0 && this.guiRootEl.contains(sel.focusNode)) {
                sel.removeAllRanges();
            }
            this._caretChange();
        };
        /**
         * Get the current selection from the DOM tree.
         */
        CaretManager.prototype._getDOMSelectionRange = function () {
            var range = domutil_1.getSelectionRange(this.win);
            if (range === undefined) {
                return undefined;
            }
            // Don't return a range outside our editing framework.
            if (!this.guiRootEl.contains(range.startContainer) ||
                !this.guiRootEl.contains(range.endContainer)) {
                return undefined;
            }
            return range;
        };
        /**
         * This function is meant to be used internally to manipulate the DOM
         * selection directly.
         */
        CaretManager.prototype._setDOMSelectionRange = function (range) {
            if (range.collapsed) {
                this._clearDOMSelection();
                return;
            }
            // tslint:disable-next-line:no-suspicious-comment
            // The focusTheNode call is required to work around bug:
            // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
            if (browsers.FIREFOX) {
                domutil_1.focusNode(range.endContainer);
            }
            var sel = this._getDOMSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        };
        /**
         * Sets the caret position in the GUI tree.
         *
         * @param loc The new position.
         *
         * @param options Set of options governing the caret movement.
         */
        CaretManager.prototype._setGUICaret = function (loc, options) {
            var offset = loc.offset;
            var node = loc.node;
            // We accept a location which has for ``node`` a node which is an
            // _attribute_value with an offset. However, this is not an actually valid
            // caret location. So we normalize the location to point inside the text
            // node that contains the data.
            if (domtypeguards_1.isElement(node)) {
                if (node.classList.contains("_attribute_value")) {
                    var attr = wed_util_1.getAttrValueNode(node);
                    if (node !== attr) {
                        node = attr;
                        loc = loc.make(node, offset);
                    }
                }
                // Placeholders attract adjacent carets into them.
                var ph = domutil_1.childByClass(node, "_placeholder");
                if (ph !== null && !ph.classList.contains("_dying")) {
                    node = ph;
                    offset = 0;
                    loc = loc.make(node, offset);
                }
            }
            // Don't update if noop.
            if (this.caret !== undefined &&
                this.anchor === this.caret &&
                this.caret.node === node &&
                this.caret.offset === offset) {
                return;
            }
            // If we do not want to gain focus, we also don't want to take it away
            // from somewhere else, so don't change the DOM.
            if (options.focus !== false) {
                this._clearDOMSelection(true);
            }
            this._sel = new wed_selection_1.WedSelection(this, loc);
            this.mark.refresh();
            if (options.focus !== false) {
                this.focusInputField();
            }
            this._caretChange(options);
        };
        /**
         * Emit a caret change event.
         */
        CaretManager.prototype._caretChange = function (options) {
            if (options === void 0) { options = {}; }
            var prevCaret = this.prevCaret;
            var caret = this.caret;
            var mode = caret !== undefined ?
                this.modeTree.getMode(caret.node) : undefined;
            if (prevCaret === undefined || !prevCaret.equals(caret)) {
                this._events.next({
                    manager: this,
                    caret: caret,
                    mode: mode,
                    prevCaret: prevCaret,
                    prevMode: this.prevMode,
                    options: options,
                });
                this.prevCaret = caret;
                this.prevMode = mode;
            }
        };
        CaretManager.prototype._clearDOMSelection = function (dontFocus) {
            if (dontFocus === void 0) { dontFocus = false; }
            this._getDOMSelection().removeAllRanges();
            // Make sure the focus goes back there.
            if (!dontFocus) {
                this.focusInputField();
            }
        };
        CaretManager.prototype._getDOMSelection = function () {
            return this.win.getSelection();
        };
        /**
         * Focus the field use for input events.  It is used by wed on some occasions
         * where it is needed. Mode authors should never need to call this. If they do
         * find that calling this helps solve a problem they ran into, they probably
         * should file an issue report.
         */
        CaretManager.prototype.focusInputField = function () {
            // The following call was added to satisfy IE 11. The symptom is that when
            // clicking on an element's label **on a fresh window that has never
            // received focus**, it is not possible to move off the label using the
            // keyboard. This issue happens only with IE 11.
            this.win.focus();
            // The call to blur here is here ***only*** to satisfy Chrome 29!
            this.$inputField.blur();
            this.$inputField.focus();
        };
        /**
         * This is called when the editing area is blurred. This is not something you
         * should be calling in a mode's implementation. It is public because other
         * parts of wed need to call it.
         */
        CaretManager.prototype.onBlur = function () {
            if (this.caret === undefined) {
                return;
            }
            this.selAtBlur = this._sel;
            this.$inputField.blur();
            this._sel = undefined;
            this.mark.refresh();
        };
        CaretManager.prototype.onFocus = function () {
            if (this.selAtBlur !== undefined) {
                this._sel = this.selAtBlur;
                this._restoreCaretAndSelection(true);
                this.selAtBlur = undefined;
            }
        };
        CaretManager.prototype.highlightRange = function (range) {
            var domRange = range.mustMakeDOMRange();
            var grPosition = this.scroller.getBoundingClientRect();
            var topOffset = this.scroller.scrollTop - grPosition.top;
            var leftOffset = this.scroller.scrollLeft - grPosition.left;
            var highlight = this.doc.createElement("div");
            for (var _i = 0, _a = Array.from(domRange.getClientRects()); _i < _a.length; _i++) {
                var rect = _a[_i];
                var highlightPart = this.doc.createElement("div");
                highlightPart.className = "_wed_highlight";
                highlightPart.style.top = rect.top + topOffset + "px";
                highlightPart.style.left = rect.left + leftOffset + "px";
                highlightPart.style.height = rect.height + "px";
                highlightPart.style.width = rect.width + "px";
                highlight.appendChild(highlightPart);
            }
            this.layer.append(highlight);
            return highlight;
        };
        /**
         * Dump to the console caret-specific information.
         */
        CaretManager.prototype.dumpCaretInfo = function () {
            var dataCaret = this.getDataCaret();
            /* tslint:disable:no-console */
            if (dataCaret !== undefined) {
                console.log("data caret", dataCaret.node, dataCaret.offset);
            }
            else {
                console.log("no data caret");
            }
            if (this.anchor !== undefined) {
                console.log("selection anchor", this.anchor.node, this.anchor.offset);
            }
            else {
                console.log("no selection anchor");
            }
            var caret = this.caret;
            if (caret !== undefined) {
                var node = caret.node, offset = caret.offset;
                console.log("selection focus", node, offset);
                console.log("selection focus closest real", domutil_1.closestByClass(node, "_real", this.guiRootEl));
                if (domtypeguards_1.isText(node)) {
                    if (offset < node.data.length) {
                        var range = this.doc.createRange();
                        range.setStart(node, offset);
                        range.setEnd(node, offset + 1);
                        var rect = range.getBoundingClientRect();
                        console.log("rectangle around character at caret:", rect);
                    }
                }
            }
            else {
                console.log("no selection focus");
            }
            domutil_1.dumpRange("DOM range: ", this._getDOMSelectionRange());
            console.log("input field location", this.inputField.style.top, this.inputField.style.left);
            console.log("document.activeElement", document.activeElement);
            /* tslint:enable:no-console */
        };
        return CaretManager;
    }());
    exports.CaretManager = CaretManager;
});
//  LocalWords:  MPL wed's DLoc sel setCaret clearDOMSelection rst focusTheNode
//  LocalWords:  bugzilla nd noop activeElement px rect grPosition topOffset
//  LocalWords:  leftOffset
//# sourceMappingURL=caret-manager.js.map