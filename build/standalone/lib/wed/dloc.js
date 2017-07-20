define(["require", "exports", "module", "jquery", "rangy", "./domtypeguards", "./domutil"], function (require, exports, module, $, rangy, domtypeguards_1, domutil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A class for objects that are used to mark DOM nodes as roots for the purpose
     * of using DLoc objects.
     */
    var DLocRoot = (function () {
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
            var checkNode = node;
            if (domtypeguards_1.isAttr(node)) {
                checkNode = node.ownerElement;
            }
            if (!root.contains(checkNode)) {
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
    var DLoc = (function () {
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
            if (domtypeguards_1.isAttr(node)) {
                if (!root.contains(node.ownerElement)) {
                    throw new Error("node not in root");
                }
            }
            else if (!root.contains(node)) {
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
});
//  LocalWords:  dloc MPL jquery domutil oop DLoc makeDLoc jshint
//  LocalWords:  newcap validthis

//# sourceMappingURL=dloc.js.map
