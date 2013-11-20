/**
 * @module dloc
 * @desc Model for DOM locations.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:dloc */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var rangy = require("rangy");
var domutil = require("./domutil");
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
 * @param {Node|jQuery} node
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
    if (!other) {
        var range = rangy.createRange(this.node.ownerDocument);
        range.setStart(this.node, this.offset);
        return range;
    }
    else
        return domutil.rangeFromPoints(this.node, this.offset,
                                       other.node, other.offset);
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
 * @param {Node|jQuery} root The root of the DOM tree to which this
 * location belongs. If a ``jQuery`` object, the first element of the
 * object is used.
 * @param {Node|jQuery} node The node of the location. If a ``jQuery``
 * object, the first element of the object is used.
 * @param {Integer} offset The offset of the location.
 * @returns {module:dloc~DLoc} The location.
 * @throws {Error} If ``node`` is not in ``root`` or if ``root`` has
 * not been marked as a root using {@link module:dloc~markRoot
 * markRoot}.
 *
 * @also
 *
 * @param {Node|jQuery} root The root of the DOM tree to which this
 * location belongs. If a ``jQuery`` object, the first element of the
 * object is used.
 * @param {Array} loc The ``node`` and ``offset`` pair as an array.
 * @returns {module:dloc~DLoc} The location.
 * @throws {Error} If ``node`` is not in ``root`` or if ``root`` has
 * not been marked as a root using {@link module:dloc~markRoot
 * markRoot}.
 */
function makeDLoc(root, node, offset) {
    if (node instanceof Array) {
        offset = node[1];
        node = node[0];
    }

    if (!node)
        return undefined;

    var $node;
    if (node instanceof $) {
        $node = node;
        node = node[0];
        if (!node)
            return undefined;
    }
    else
        $node = $(node);

    var $root;
    if (root instanceof $) {
        $root = root;
        root = root[0];
    }
    else
        $root = $(root);

    if ($node.closest(root).length === 0)
        throw new Error("node not in root");

    if (!$root.data("wed-dloc-root"))
        throw new Error("root has not been marked as a root: " + root);

    /* jshint newcap: false */
    return new _DLoc(root, node, offset);
}

/**
 * Marks a node as a root for purpose of creating DOM locations.
 *
 * @param {Node|jQuery} node The node to mark.
 */
function markRoot(node) {
    $(node).data("wed-dloc-root", true);
}

/**
 * Finds the root under which a node resides. Note that in cases where
 * an undefined result is useless, you should use {@link
 * module:dloc~getRoot getRoot} instead.
 *
 * @param {Node|jQuery} node The node whose root we want. If a
 * ``jQuery`` object, only the first element in the object will be
 * used.
 * @returns {Node|undefined} The root node, or ``undefined`` if the
 * root can't be found.
 */
function findRoot(node) {
    node = (node instanceof $) ? node[0]: node;
    while(node) {
        if ($(node).data("wed-dloc-root"))
            return node;
        node = node.parentNode;
    }
    return undefined;
}

/**
 * Gets the root under which a node resides.
 *
 * @param {Node|jQuery} node The node whose root we want. If a
 * ``jQuery`` object, only the first element in the object will be
 * used.
 * @returns {Node} The root node.
 * @throws {Error} If the root cannot be found.
 */
function getRoot(node) {
    var ret = findRoot(node);
    if (!ret)
        throw new Error("no root found");
    return ret;
}

exports.markRoot = markRoot;
exports.makeDLoc = makeDLoc;
exports.DLoc = DLoc;
exports.findRoot = findRoot;
exports.getRoot = getRoot;

});

//  LocalWords:  dloc MPL jquery domutil oop DLoc makeDLoc jshint
//  LocalWords:  newcap validthis jQuery
