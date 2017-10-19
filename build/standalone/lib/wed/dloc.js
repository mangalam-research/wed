define(["require", "exports", "module", "jquery", "rangy", "./domtypeguards", "./domutil"], function (require, exports, module, $, rangy, domtypeguards_1, domutil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A class for objects that are used to mark DOM nodes as roots for the purpose
     * of using DLoc objects.
     */
    var DLocRoot = /** @class */ (function () {
        /**
         * @param el The element to which this object is associated.
         */
        function DLocRoot(node) {
            this.node = node;
            if ($.data(node, "wed-dloc-root") != null) {
                throw new Error("node already marked as root");
            }
            $.data(node, "wed-dloc-root", this);
        }
        /**
         * Converts a node to a path. A path is a string representation of the
         * location of a node relative to the root.
         *
         * @param node The node for which to construct a path.
         *
         * @returns The path.
         */
        DLocRoot.prototype.nodeToPath = function (node) {
            if (node == null) {
                throw new Error("invalid node parameter");
            }
            var root = this.node;
            if (root === node) {
                return "";
            }
            if (!domutil_1.contains(root, node)) {
                throw new Error("node is not a descendant of root");
            }
            var ret = [];
            while (node !== root) {
                var parent_1 = void 0;
                if (domtypeguards_1.isAttr(node)) {
                    parent_1 = node.ownerElement;
                    ret.unshift("@" + node.name);
                }
                else {
                    var offset = 0;
                    parent_1 = node.parentNode;
                    var offsetNode = node.previousSibling;
                    while (offsetNode !== null) {
                        var t = offsetNode.nodeType;
                        if ((t === Node.TEXT_NODE) || (t === Node.ELEMENT_NODE)) {
                            offset++;
                        }
                        offsetNode = offsetNode.previousSibling;
                    }
                    ret.unshift(String(offset));
                }
                // We checked whether the node is contained by root so we should never run
                // into a null parent.
                node = parent_1;
            }
            return ret.join("/");
        };
        /**
         * This function recovers a DOM node on the basis of a path previously created
         * by [[nodeToPath]].
         *
         * @param path The path to interpret.
         *
         * @returns The node corresponding to the path, or ``null`` if no such node
         * exists.
         *
         * @throws {Error} If given a malformed ``path``.
         */
        DLocRoot.prototype.pathToNode = function (path) {
            var root = this.node;
            if (path === "") {
                return root;
            }
            var parts = path.split(/\//);
            var parent = root;
            var attribute;
            // Set aside the last part if it is an attribute.
            if (parts[parts.length - 1][0] === "@") {
                attribute = parts.pop();
            }
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
                if (/^(\d+)$/.test(part)) {
                    var index = parseInt(part);
                    var found = null;
                    var node = parent.firstChild;
                    while (node !== null && found === null) {
                        var t = node.nodeType;
                        if ((t === Node.TEXT_NODE || (t === Node.ELEMENT_NODE)) &&
                            --index < 0) {
                            found = node;
                        }
                        node = node.nextSibling;
                    }
                    if (found === null) {
                        return null;
                    }
                    parent = found;
                }
                else {
                    throw new Error("malformed path expression");
                }
            }
            if (attribute === undefined) {
                return parent;
            }
            if (!domtypeguards_1.isElement(parent)) {
                throw new Error("parent must be an element since we are looking for an attribute");
            }
            return parent.getAttributeNode(attribute.slice(1));
        };
        return DLocRoot;
    }());
    exports.DLocRoot = DLocRoot;
    function getTestLength(node) {
        var testLength;
        if (domtypeguards_1.isAttr(node)) {
            testLength = node.value.length;
        }
        else {
            switch (node.nodeType) {
                case Node.TEXT_NODE:
                    testLength = node.data.length;
                    break;
                case Node.DOCUMENT_NODE:
                case Node.ELEMENT_NODE:
                    testLength = node.childNodes.length;
                    break;
                default:
                    throw new Error("unexpected node type");
            }
        }
        return testLength;
    }
    /**
     * Compare two locations that have already been determined to be in a
     * parent-child relation. **Important: the relationship must have been formally
     * tested *before* calling this function.**
     *
     * @returns -1 if ``parent`` is before ``child``, 1 otherwise.
     */
    function parentChildCompare(parentNode, parentOffset, childNode) {
        // Find which child of parent is or contains the other node.
        var curChild = parentNode.firstChild;
        var ix = 0;
        while (curChild !== null) {
            if (curChild.contains(childNode)) {
                break;
            }
            ix++;
            curChild = curChild.nextSibling;
        }
        // This is ``<= 0`` and not just ``< 0`` because if our offset points exactly
        // to the child we found, then parent location is necessarily before the child
        // location.
        return (parentOffset - ix) <= 0 ? -1 : 1;
    }
    /**
     * ``DLoc`` objects model locations in a DOM tree. Although the current
     * implementation does not enforce this, **these objects are to be treated as
     * immutable**. These objects have ``node`` and ``offset`` properties that are
     * to be interpreted in the same way DOM locations usually are: the ``node`` is
     * the location of a DOM ``Node`` in a DOM tree (or an attribute), and
     * ``offset`` is a location in that node. ``DLoc`` objects are said to have a
     * ``root`` relative to which they are positioned.
     *
     * A DLoc object can point to an offset inside an ``Element``, inside a ``Text``
     * node or inside an ``Attr``.
     *
     * Use [[makeDLoc]] to make ``DLoc`` objects. Calling this constructor directly
     * is not legal.
     *
     */
    var DLoc = /** @class */ (function () {
        /**
         * @param root The root of the DOM tree to which this DLoc applies.
         *
         * @param node The node of the location.
         *
         * @param offset The offset of the location.
         */
        function DLoc(root, node, offset) {
            this.root = root;
            this.node = node;
            this.offset = offset;
        }
        Object.defineProperty(DLoc.prototype, "pointedNode", {
            /**
             * This is the node to which this location points. For locations pointing to
             * attributes and text nodes, that's the same as [[node]]. For locations
             * pointing to an element, that's the child to which the ``node, offset`` pair
             * points. Since this pair may point after the last child of an element, the
             * child obtained may be ``undefined``.
             */
            get: function () {
                if (domtypeguards_1.isElement(this.node)) {
                    return this.node.childNodes[this.offset];
                }
                return this.node;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Creates a copy of the location.
         */
        DLoc.prototype.clone = function () {
            return new DLoc(this.root, this.node, this.offset);
        };
        DLoc.makeDLoc = function (root, node, offset, normalize) {
            if (node instanceof Array) {
                normalize = offset;
                _a = node, node = _a[0], offset = _a[1];
            }
            if (normalize === undefined) {
                normalize = false;
            }
            if (node == null) {
                return undefined;
            }
            if (offset === undefined) {
                var parent_2 = node.parentNode;
                if (parent_2 === null) {
                    throw new Error("trying to get parent of a detached node");
                }
                offset = domutil_1.indexOf(parent_2.childNodes, node);
                node = parent_2;
            }
            else {
                if (typeof offset !== "number") {
                    throw new Error("offset is not a number, somehow");
                }
                if (offset < 0) {
                    if (normalize) {
                        offset = 0;
                    }
                    else {
                        throw new Error("negative offsets are not allowed");
                    }
                }
            }
            if (root instanceof DLocRoot) {
                root = root.node;
            }
            else if ($.data(root, "wed-dloc-root") == null) {
                throw new Error("root has not been marked as a root");
            }
            if (!domutil_1.contains(root, node)) {
                throw new Error("node not in root");
            }
            var testLength = getTestLength(node);
            if (offset > testLength) {
                if (normalize) {
                    offset = testLength;
                }
                else {
                    throw new Error("offset greater than allowable value");
                }
            }
            return new DLoc(root, node, offset);
            var _a;
        };
        DLoc.mustMakeDLoc = function (root, node, offset, normalize) {
            var nodeToCheck = node;
            if (nodeToCheck instanceof Array) {
                nodeToCheck = nodeToCheck[0];
            }
            if (nodeToCheck == null) {
                throw new Error("called mustMakeDLoc with an absent node");
            }
            return this.makeDLoc.apply(this, arguments);
        };
        DLoc.prototype.make = function (node, offset) {
            if (node instanceof Array) {
                return DLoc.mustMakeDLoc(this.root, node);
            }
            if (offset !== undefined && typeof offset !== "number") {
                throw new Error("if the 1st argument is a node, the 2nd must be a number or undefined");
            }
            return DLoc.mustMakeDLoc(this.root, node, offset);
        };
        /**
         * Make a new location with the same node as the current location but with a
         * new offset.
         *
         * @param offset The offset of the new location.
         *
         * @returns The new location.
         */
        DLoc.prototype.makeWithOffset = function (offset) {
            if (offset === this.offset) {
                return this;
            }
            return this.make(this.node, offset);
        };
        /**
         * Make a new location. Let's define "current node" as the node of the current
         * location. The new location points to the current node. (The offset of the
         * current location is effectively ignored.) That is, the new location has for
         * node the parent node of the current node, and for offset the offset of the
         * current node in its parent.
         *
         * @returns The location in the parent, as described above.
         *
         * @throws {Error} If the current node has no parent.
         */
        DLoc.prototype.getLocationInParent = function () {
            var node = this.node;
            var parent = node.parentNode;
            if (parent === null) {
                throw new Error("trying to get parent of a detached node");
            }
            return this.make(parent, domutil_1.indexOf(parent.childNodes, node));
        };
        /**
         * Same as [[getLocationInParent]] except that the location points *after* the
         * current node.
         *
         * @returns The location in the parent, as described above.
         *
         * @throws {Error} If the current node has no parent.
         */
        DLoc.prototype.getLocationAfterInParent = function () {
            var node = this.node;
            var parent = node.parentNode;
            if (parent === null) {
                throw new Error("trying to get parent of a detached node");
            }
            return this.make(parent, domutil_1.indexOf(parent.childNodes, node) + 1);
        };
        /**
         * Converts the location to an array. This array contains only the node and
         * offset of the location. The root is not included because this method is of
         * use to pass data to functions that work with raw DOM information. These
         * functions do not typically expect a root.
         *
         * @returns The node and offset pair.
         */
        DLoc.prototype.toArray = function () {
            return [this.node, this.offset];
        };
        DLoc.prototype.makeRange = function (other) {
            if (domtypeguards_1.isAttr(this.node)) {
                throw new Error("cannot make range from attribute node");
            }
            if (!this.isValid()) {
                return undefined;
            }
            if (other === undefined) {
                var range = rangy.createRange(this.node.ownerDocument);
                range.setStart(this.node, this.offset);
                return range;
            }
            if (domtypeguards_1.isAttr(other.node)) {
                throw new Error("cannot make range from attribute node");
            }
            if (!other.isValid()) {
                return undefined;
            }
            return domutil_1.rangeFromPoints(this.node, this.offset, other.node, other.offset);
        };
        /**
         * Make a range from this location. If ``other`` is not specified, the range
         * starts and ends with this location. If ``other`` is specified, the range
         * goes from this location to the ``other`` location.
         *
         * @param other The other location to use.
         *
         * @returns The range.
         */
        DLoc.prototype.makeDLocRange = function (other) {
            if (!this.isValid()) {
                return undefined;
            }
            if (other === undefined) {
                // tslint:disable-next-line:no-use-before-declare
                return new DLocRange(this, this);
            }
            if (!other.isValid()) {
                return undefined;
            }
            // tslint:disable-next-line:no-use-before-declare
            return new DLocRange(this, other);
        };
        /**
         * Like [[makeDLocRange]] but throws if it cannot make a range, rather than
         * return ``undefined``.
         */
        DLoc.prototype.mustMakeDLocRange = function (other) {
            var ret = other !== undefined ?
                this.makeDLocRange(other) : this.makeDLocRange();
            if (ret === undefined) {
                throw new Error("cannot make a range");
            }
            return ret;
        };
        /**
         * Verifies whether the ``DLoc`` object points to a valid location. The
         * location is valid if its ``node`` is a child of its ``root`` and if its
         * ``offset`` points inside the range of children of its ``node``.
         *
         * @returns {boolean} Whether the object is valid.
         */
        DLoc.prototype.isValid = function () {
            var node = this.node;
            // We do not check that offset is greater than 0 as this would be
            // done while constructing the object.
            return this.root.contains(domtypeguards_1.isAttr(node) ? node.ownerElement : node) &&
                this.offset <= getTestLength(node);
        };
        /**
         * Creates a new ``DLoc`` object with an offset that is valid. It does this by
         * "normalizing" the offset, i.e. by setting the offset to its maximum
         * possible value.
         *
         * @returns The normalized location. This will be ``this``, if it so happens
         * that ``this`` is already valid.
         */
        DLoc.prototype.normalizeOffset = function () {
            var node = this.node;
            var testLength = getTestLength(node);
            if (this.offset > testLength) {
                return this.make(node, testLength);
            }
            return this;
        };
        /**
         * @returns Whether ``this`` and ``other`` are equal. They are equal if they
         * are the same object or if they point to the same location.
         */
        DLoc.prototype.equals = function (other) {
            if (other == null) {
                return false;
            }
            return this === other ||
                (this.node === other.node) &&
                    (this.offset === other.offset);
        };
        /**
         * Compare two locations. Note that for attribute ordering, this class
         * arbitrarily decides that the order of two attributes on the same element is
         * the same as the order of their ``name`` fields as if they were sorted in an
         * array with ``Array.prototype.sort()``. This differs from how
         * ``Node.compareDocumentPosition`` determines the order of attributes. We
         * want something stable, which is not implementation dependent. In all other
         * cases, the nodes are compared in the same way
         * ``Node.compareDocumentPosition`` does.
         *
         * @param other The other location to compare this one with.
         *
         * @returns ``0`` if the locations are the same. ``-1`` if this location comes
         * first. ``1`` if the other location comes first.
         *
         * @throws {Error} If the nodes are disconnected.
         */
        DLoc.prototype.compare = function (other) {
            if (this.equals(other)) {
                return 0;
            }
            var _a = this, thisNode = _a.node, thisOffset = _a.offset;
            var otherNode = other.node, otherOffset = other.offset;
            // We need to handle attributes specially, because
            // ``compareDocumentPosition`` does not work reliably with attribute nodes.
            if (domtypeguards_1.isAttr(thisNode)) {
                if (domtypeguards_1.isAttr(otherNode)) {
                    // We do not want an implementation-specific order when we compare
                    // attributes. So we perform our own test.
                    if (thisNode.ownerElement === otherNode.ownerElement) {
                        // It is not clear what the default comparison function is, so create
                        // a temporary array and sort.
                        var names = [thisNode.name, otherNode.name].sort();
                        // 0 is not a possible value here because it is not possible for
                        // thisNode.name to equal otherNode.name.
                        return names[0] === thisNode.name ? -1 : 1;
                    }
                }
                var owner = thisNode.ownerElement;
                if (owner === other.pointedNode) {
                    // This location points into an attribute that belongs to the node
                    // that other points to. So this is later than other.
                    return 1;
                }
                // If we get here we'll rely on ``compareDocumentPosition`` but using the
                // position of the element that has the attribute.
                thisNode = owner.parentNode;
                thisOffset = domutil_1.indexOf(thisNode.childNodes, owner);
            }
            if (domtypeguards_1.isAttr(otherNode)) {
                var owner = otherNode.ownerElement;
                if (owner === this.pointedNode) {
                    // The other location points into an attribute that belongs to the node
                    // that this location points to. So this is earlier than other.
                    return -1;
                }
                // If we get here we'll rely on ``compareDocumentPosition`` but using the
                // position of the element that has the attribute.
                otherNode = owner.parentNode;
                otherOffset = domutil_1.indexOf(otherNode.childNodes, owner);
            }
            if (thisNode === otherNode) {
                var d = thisOffset - otherOffset;
                if (d === 0) {
                    return 0;
                }
                return d < 0 ? -1 : 1;
            }
            var comparison = thisNode.compareDocumentPosition(otherNode);
            // tslint:disable:no-bitwise
            if ((comparison & Node.DOCUMENT_POSITION_DISCONNECTED) !== 0) {
                throw new Error("cannot compare disconnected nodes");
            }
            if ((comparison & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0) {
                return parentChildCompare(thisNode, thisOffset, otherNode);
            }
            if ((comparison & Node.DOCUMENT_POSITION_CONTAINS) !== 0) {
                return parentChildCompare(otherNode, otherOffset, thisNode) < 0 ? 1 : -1;
            }
            if ((comparison & Node.DOCUMENT_POSITION_PRECEDING) !== 0) {
                return 1;
            }
            if ((comparison & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) {
                return -1;
            }
            // tslint:enable:no-bitwise
            throw new Error("neither preceding nor following: this should not happen");
        };
        return DLoc;
    }());
    exports.DLoc = DLoc;
    /**
     * Finds the root under which a node resides. Note that in cases where an
     * undefined result is useless, you should use [[getRoot]] instead.
     *
     * @param node The node whose root we want.
     *
     * @returns The root object, or ``undefined`` if the root can't be found.
     */
    function findRoot(node) {
        while (node != null) {
            if (domtypeguards_1.isElement(node) || domtypeguards_1.isDocument(node)) {
                var root = $.data(node, "wed-dloc-root");
                if (root != null) {
                    return root;
                }
            }
            node = node.parentNode;
        }
        return undefined;
    }
    exports.findRoot = findRoot;
    /**
     * Gets the root under which a node resides.
     *
     * @param node The node whose root we want.
     *
     * @returns The root node.
     *
     * @throws {Error} If the root cannot be found.
     */
    function getRoot(node) {
        var ret = findRoot(node);
        if (ret == null) {
            throw new Error("no root found");
        }
        return ret;
    }
    exports.getRoot = getRoot;
    /**
     * Represents a range spanning locations indicated by two [[DLoc]] objects.
     * Though this is not enforced at the VM level, objects of this class are to be
     * considered immutable.
     */
    var DLocRange = /** @class */ (function () {
        /**
         * @param start The start of the range.
         * @param end The end of the range.
         */
        function DLocRange(start, end) {
            this.start = start;
            this.end = end;
            if (start.root !== end.root) {
                throw new Error("the start and end must be in the same document");
            }
        }
        Object.defineProperty(DLocRange.prototype, "collapsed", {
            /** Whether this range is collapsed. */
            get: function () {
                return this.start.equals(this.end);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Make a DOM range.
         *
         * @returns The range. Or ``undefined`` if either the start or end are not
         * pointing to valid positions.
         *
         * @throws {Error} If trying to make a range from an attribute node. DOM
         * ranges can only point into elements or text nodes.
         */
        DLocRange.prototype.makeDOMRange = function () {
            if (domtypeguards_1.isAttr(this.start.node)) {
                throw new Error("cannot make range from attribute node");
            }
            if (!this.start.isValid()) {
                return undefined;
            }
            if (domtypeguards_1.isAttr(this.end.node)) {
                throw new Error("cannot make range from attribute node");
            }
            if (!this.end.isValid()) {
                return undefined;
            }
            return domutil_1.rangeFromPoints(this.start.node, this.start.offset, this.end.node, this.end.offset).range;
        };
        /**
         * Same as [[makeDOMRange]] but throws instead of returning ``undefined``.
         */
        DLocRange.prototype.mustMakeDOMRange = function () {
            var ret = this.makeDOMRange();
            if (ret === undefined) {
                throw new Error("cannot make a range");
            }
            return ret;
        };
        /**
         * @returns Whether ``this`` and ``other`` are equal. They are equal if they
         * are the same object or if they have equal start and ends.
         */
        DLocRange.prototype.equals = function (other) {
            if (other == null) {
                return false;
            }
            return this === other ||
                (this.start.equals(other.start) && this.end.equals(other.end));
        };
        /**
         * @returns Whether the two endpoints of the range are valid.
         */
        DLocRange.prototype.isValid = function () {
            return this.start.isValid() && this.end.isValid();
        };
        /**
         * @param loc The location to test.
         *
         * @returns Whether a location is within the range.
         */
        DLocRange.prototype.contains = function (loc) {
            var startTest = this.start.compare(loc);
            var endTest = this.end.compare(loc);
            // Reversed ranges are valid. So one end must be lower or equal to loc, and
            // the other end must be greater or equal to loc. The following test ensures
            // this. (If both are -1, then the result is > 0, and if both are 1, then
            // then result > 0.)
            return startTest * endTest <= 0;
        };
        return DLocRange;
    }());
    exports.DLocRange = DLocRange;
});
//  LocalWords:  makeDLoc DLoc domutil jquery MPL dloc mustMakeDLoc nd thisNode
//  LocalWords:  otherNode compareDocumentPosition makeDOMRange

//# sourceMappingURL=dloc.js.map
