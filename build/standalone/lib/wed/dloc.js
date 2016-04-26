/**
 * @module dloc
 * @desc Model for DOM locations.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:dloc */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var rangy = require("rangy");
var domutil = require("./domutil");
var isAttr = domutil.isAttr;
var oop = require("./oop");

/**
 * @classdesc ``DLoc`` objects model locations in a DOM tree. Although
 * the current implementation does not enforce this, **these objects
 * are to be treated as immutable**. These objects have ``node`` and
 * ``offset`` properties that are to be interpreted in the same way
 * DOM locations usually are: the ``node`` is the location of a DOM
 * ``Node`` in a DOM tree, and ``offset`` is a location in that
 * node. ``DLoc`` objects are said to have a ``root`` relative to
 * which they are positioned. A root must be marked using {@link
 * module:dloc~markRoot markRoot} before ``DLoc`` objects using this
 * root can be created.
 *
 * A DLoc object can point to an offset inside an Element, inside a
 * Text node or inside an Attr node.
 *
 * Use {@link module:dloc~makeDLoc makeDLoc} to make ``DLoc``
 * objects. Calling this constructor directly is not legal.
 *
 * @class
 * @property {Node} root The root of the DOM tree to which this DLoc applies.
 * @property {Node} node The node of the location.
 * @property {Integer} offset The offset of the location.
 */
function DLoc() {
    throw new Error("use makeDLoc to create DLoc objects");
}

/**
 * Creates a copy of the location.
 *
 * @returns {module:dloc~DLoc} The copy.
 */
DLoc.prototype.clone = function () {
    /* jshint newcap:false */
    return new _DLoc(this.root, this.node, this.offset);
};

/**
 * Make a new location in the same DOM tree as the current one. This
 * is a convenience function that enables avoid having to pass
 * ``root`` around.
 *
 * @param {Node} node
 * @param {Integer} offset
 * @returns {module:dloc~DLoc} The new location.
 */
DLoc.prototype.make = function (node, offset) {
    return makeDLoc(this.root, node, offset);
};

/**
 * Converts the location to an array. This array contains only the node
 * and offset of the location. The root is not included because this
 * method is of use to pass data to functions that work with raw DOM
 * information. These functions do not typically expect a root.
 *
 * @returns {Array} The array contains two elements with the values
 * ``this.node`` and ``this.offset``.
 */
DLoc.prototype.toArray = function () {
    return [this.node, this.offset];
};

/**
 * Make a range from this location. If ``other`` is not specified, the
 * range starts and ends with this location, and the return value is a
 * range. If ``other`` is specified, the range goes from this location
 * to the ``other`` location. If ``other`` comes before ``this``, then
 * the range is "reversed". When ``other`` is specified, the return
 * value is an object (see below). (An undefined value for ``other``
 * is interpreted as an unspecified ``other``.)
 *
 * @param {module:dloc~DLoc} [other] The other location to use.
 *
 * @returns {Range|{range: Range, reversed: Boolean}} The return value
 * is just a range when the method is called without
 * ``other``. Otherwise, it is an object. The ``range`` field is a
 * rangy range. The ``reversed`` field is ``true`` if the range is
 * reversed, that is, if the end comes before the start.
 */
DLoc.prototype.makeRange = function (other) {
    if (isAttr(this.node))
        throw new Error("cannot make range from attribute node");

    if (!other) {
        var range = rangy.createRange(this.node.ownerDocument);
        range.setStart(this.node, this.offset);
        return range;
    }
    else {
        if (isAttr(other.node))
            throw new Error("cannot make range from attribute node");
        return domutil.rangeFromPoints(this.node, this.offset,
                                       other.node, other.offset);
    }
};

/**
 * Verifies whether the ``DLoc`` object points to a valid
 * location. The location is valid if its ``node`` is a child of its
 * ``root`` and if its ``offset`` points inside the range of children
 * of its ``node``.
 *
 * @returns {boolean} Whether the object is valid.
 */
DLoc.prototype.isValid = function () {
    var node = this.node;
    // We do not check that offset is greater than 0 as this would be
    // done while constructing the object.
    return this.root.contains(isAttr(node) ? node.ownerElement : node) &&
        this.offset <= getTestLength(node);
};

function getTestLength(node) {
    var test_length;
    if (isAttr(node)) {
        test_length = node.value.length;
    }
    else {
        switch(node.nodeType) {
        case Node.TEXT_NODE:
            test_length = node.data.length;
            break;
        case Node.ELEMENT_NODE:
            test_length = node.childNodes.length;
            break;
        default:
            throw new Error("unexpected node type");
        }
    }
    return test_length;
}

/**
 * Creates a new ``DLoc`` object with an offset that is valid. It does
 * this by "normalizing" the offset, i.e. by setting the offset to its
 * maximum possible value.
 *
 * @returns {module:dloc~DLoc} The normalized location. This will be
 * ``this``, if it so happens that ``this`` is already valid.
 */
DLoc.prototype.normalizeOffset = function () {
    var node = this.node;

    var test_length = getTestLength(node);
    if (this.offset > test_length)
        return this.make(node, test_length);

    return this;
};


// The real constructor.
function _DLoc (root, node, offset) {
    // The underscore in the name throws off jshint.
    /* jshint validthis: true */
    this.root = root;
    this.node = node;
    this.offset = offset;
}

oop.inherit(_DLoc, DLoc);

/**
 * Makes a location. Before creating locations, you must mark their
 * root using {@link module:dloc~markRoot markRoot}.
 *
 * @param {Node|module:dloc~DLocRoot} root The root of the DOM
 * tree to which this location belongs.
 * @param {Node} node The node of the location.
 * @param {Integer} offset The offset of the location.
 * @param {boolean} normalize Normalize the offset to a valid value.
 * @returns {module:dloc~DLoc} The location.
 * @throws {Error} If ``node`` is not in ``root`` or if ``root`` has
 * not been marked as a root using {@link module:dloc~markRoot
 * markRoot}.
 *
 * @also
 *
 * @param {Node|module:dloc~DLocRoot} root The root of the DOM
 * tree to which this location belongs.
 * @param {Array} loc The ``node`` and ``offset`` pair as an array.
 * @param {boolean} normalize Normalize the offset to a valid value.
 * @returns {module:dloc~DLoc} The location.
 * @throws {Error} If ``node`` is not in ``root`` or if ``root`` has
 * not been marked as a root using {@link module:dloc~markRoot
 * markRoot}.
 */
function makeDLoc(root, node, offset, normalize) {
    if (node instanceof Array) {
        normalize = offset;
        offset = node[1];
        node = node[0];
    }

    if (!node)
        return undefined;

    if (offset < 0) {
        if (normalize)
            offset = 0;
        else
            throw new Error("negative offsets are not allowed");
    }

    if (root instanceof DLocRoot)
        root = root.node;
    else if (!$.data(root, "wed-dloc-root"))
        throw new Error("root has not been marked as a root: " + root);

    if (isAttr(node)) {
        if (!root.contains(node.ownerElement))
            throw new Error("node not in root");
    }
    else if (!root.contains(node))
        throw new Error("node not in root");

    var test_length = getTestLength(node);
    if (offset > test_length) {
        if (normalize)
            offset = test_length;
        else
            throw new Error("offset greater than allowable value");
    }

    /* jshint newcap: false */
    return new _DLoc(root, node, offset);
}

/**
 * Finds the root under which a node resides. Note that in cases where
 * an undefined result is useless, you should use {@link
 * module:dloc~getRoot getRoot} instead.
 *
 * @param {Node} node The node whose root we want.
 * @returns {module:dloc~DLocRoot} The root object, or ``undefined`` if the
 * root can't be found.
 */
function findRoot(node) {
    while(node) {
        var root = $.data(node, "wed-dloc-root");
        if (root)
            return root;
        node = node.parentNode;
    }
    return undefined;
}

/**
 * Gets the root under which a node resides.
 *
 * @param {Node} node The node whose root we want.
 * @returns {module:dloc~DLocRoot} The root node.
 * @throws {Error} If the root cannot be found.
 */
function getRoot(node) {
    var ret = findRoot(node);
    if (!ret)
        throw new Error("no root found");
    return ret;
}

/**
 * @classdesc A class for objects that are used to mark DOM nodes as
 * roots for the purpose of using DLoc objects.
 *
 * @param {Node} node The DOM node to which this object is associated.
 */
function DLocRoot(node) {
    // The underscore in the name throws off jshint.
    /* jshint validthis: true */

    if ($.data(node, "wed-dloc-root"))
        throw new Error("node already marked as root");

    $.data(node, "wed-dloc-root", this);

    this.node = node;
}

/**
 * Converts a node to a path. A path is a string representation of the
 * location of a node relative to the root.
 *
 * @param {Node} node The node for which to construct a path.
 *
 * @returns {string} The path.
 */
DLocRoot.prototype.nodeToPath = function (node) {
    if (node === null || node === undefined)
        throw new Error("invalid node parameter");

    var root = this.node;
    if (root === node)
        return "";

    var check_node = node;
    if (isAttr(node))
        check_node = node.ownerElement;

    if (!root.contains(check_node))
        throw new Error("node is not a descendant of root");

    var ret = [];
    while (node !== root) {
        var parent;
        if (isAttr(node)) {
            parent = node.ownerElement;
            ret.unshift("@" + node.name);
        }
        else {
            var location;
            var offset = 0;
            var i;

            parent = node.parentNode;

            var offset_node = node.previousSibling;
            while(offset_node) {
                var t = offset_node.nodeType;
                if ((t === Node.TEXT_NODE) || (t === Node.ELEMENT_NODE))
                    offset++;
                offset_node = offset_node.previousSibling;
            }

            ret.unshift("" + offset);
        }
        node = parent;
    }

    return ret.join("/");
};

/**
 * This function recovers a DOM node on the basis of a path previously
 * created by {@link module:dloc~DLocRoot#nodeToPath nodeToPath}.
 *
 * @param {string} path The path to interpret.
 *
 * @returns {Node} The node corresponding to the path, or
 * ``null`` if no such node exists.
 * @throws {Error} If given a malformed ``path``.
 */
DLocRoot.prototype.pathToNode = function (path) {
    var root = this.node;

    if (path === "")
        return root;

    var parts = path.split(/\//);
    var parent = root;

    var attribute;
    // Set aside the last part if it is an attribute.
    if (parts[parts.length - 1][0] === "@")
        attribute = parts.pop();

    for(var part_ix = 0, part; (part = parts[part_ix]) !== undefined;
        ++part_ix) {
        if (/^(\d+)$/.test(part)) {
            var index = part >> 0; // Convert to Number.
            var found = null;
            var node = parent.firstChild;
            while(node && !found) {
                var t = node.nodeType;

                if ((t === Node.TEXT_NODE || (t === Node.ELEMENT_NODE)) &&
                    --index < 0)
                    found = node;

                node = node.nextSibling;
            }

            if (!found)
                return null;

            parent = found;
        }
        else
            throw new Error("malformed path expression");
    }

    if (attribute)
        parent = parent.getAttributeNode(attribute.slice(1));

    return parent;
};


exports.makeDLoc = makeDLoc;
exports.DLoc = DLoc;
exports.findRoot = findRoot;
exports.getRoot = getRoot;
exports.DLocRoot = DLocRoot;

});

//  LocalWords:  dloc MPL jquery domutil oop DLoc makeDLoc jshint
//  LocalWords:  newcap validthis
