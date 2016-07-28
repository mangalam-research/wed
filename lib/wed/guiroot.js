/**
 * @module guiroot
 * @desc Model for a GUI root.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014-2015 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:guiroot */function (require, exports, module) {
'use strict';

var oop = require("./oop");
var dloc = require("./dloc");
var util = require("./util");
var domutil = require("./domutil");
var indexOf = domutil.indexOf;
var closestByClass = domutil.closestByClass;

function AttributeNotFound(message) {
    this.message = message;
}

oop.inherit(AttributeNotFound, Error);
AttributeNotFound.prototype.name = "AttributeNotFound";

exports.AttributeNotFound = AttributeNotFound;

/**
 * @classdesc This is a DLocRoot class customized for use to mark the
 * root of the GUI tree.
 *
 * @param {Node} node The DOM node to which this object is associated.
 */
function GUIRoot(node) {
    dloc.DLocRoot.call(this, node);
}

oop.inherit(GUIRoot, dloc.DLocRoot);

/**
 * Count the number of relevant nodes in the _phantom_wrap.
 *
 * @param {Node} top The top _phantom_wrap to consider.
 */
function countInPhantomWrap(top) {
    if (!top.classList ||
        !top.classList.contains("_phantom_wrap")) {
        throw new Error("the node should be a _phantom_wrap element");
    }

    var count = 0;
    var child = top.firstChild;
    while (child) {
        if (child.classList) {
            if (child.classList.contains("_phantom_wrap")) {
                count += countInPhantomWrap(child);
            }
            else if (child.classList.contains("_real")) {
                count += 1;
            }
            else if (child.classList.contains("_phantom")) {
                // Phantoms don't count.
            }
            else {
                throw new Error("unexpected element in _phantom_wrap");
            }
        }
        else if (child.nodeType === Node.TEXT_NODE) {
            // Text nodes also do not count.
        }
        else {
            throw new Error("unexpected node in _phantom_wrap");
        }
        child = child.nextSibling;
    }

    return count;
}

/**
 * Converts a node to a path suitable to be used by the {@link
 * module:dloc~DLocRoot#pathToNode pathToNode} method so long as the
 * root used is the one for the data tree corresponding to the GUI
 * tree to which this object belongs.
 *
 * @param {Node} node The node for which to construct a path.
 *
 * @returns {string} The path.
 */
GUIRoot.prototype.nodeToPath = function (node) {
    var root = this.node;

    if (node === null || node === undefined)
        throw new Error("invalid node parameter");

    if (closestByClass(node, "_placeholder", root))
        throw new Error("cannot provide path to node because it is a "+
                        "placeholder node");

    if (root === node)
        return "";

    if (!root.contains(node))
        throw new Error("node is not a descendant of root");

    var ret = [];
    while (node !== root) {
        var parent, child;
        var location;
        var i;
        var offset = 0;

        if (node.nodeType !== Node.TEXT_NODE &&
            !node.matches("._real, ._phantom_wrap, ._attribute_value"))
            throw new Error("only nodes of class ._real, ._phantom_wrap, and " +
                            "._attribute_value are supported");

        var attr_val = closestByClass(node, "_attribute_value", root);
        if (attr_val) {
            child = domutil.siblingByClass(attr_val, "_attribute_name");
            if (!child)
                throw new Error("no attribute name found");
            ret.unshift("@" + child.textContent);
            parent = closestByClass(attr_val, "_real", root);
        }
        else {
            parent = node.parentNode;
            location = indexOf(parent.childNodes, node);
            for (i = 0; i < location; ++i) {
                child = parent.childNodes[i];
                if ((child.nodeType === Node.TEXT_NODE) ||
                    (child.nodeType === Node.ELEMENT_NODE &&
                     child.classList.contains("_real")))
                    offset++;
                else if ((child.nodeType === Node.ELEMENT_NODE) &&
                         child.classList.contains("_phantom_wrap")) {
                    offset += countInPhantomWrap(child);
                }
            }

            if (!parent.classList.contains("_phantom_wrap")) {
                ret.unshift("" + offset);
            }
        }
        node = parent;
    }

    return ret.join("/");
};

function findInPhantomWrap(top, index) {
    if (!top.classList ||
        !top.classList.contains("_phantom_wrap")) {
        throw new Error("the node should be a _phantom_wrap element");
    }

    var originalIndex = index;
    var found;
    var child = top.firstChild;
    while (!found && child) {
        if (child.classList) {
            if (child.classList.contains("_phantom_wrap")) {
                var result = findInPhantomWrap(child, index);
                if (result.found) {
                    found = result.found;
                }
                index -= result.count;
            }
            else if (child.classList.contains("_real")) {
                index -= 1;
                if (index < 0) {
                    found = child;
                }
            }
            else if (child.classList.contains("_phantom")) {
                // Phantoms don't count.
            }
            else {
                throw new Error("unexpected element in _phantom_wrap");
            }
        }
        else if (child.nodeType === Node.TEXT_NODE) {
            // Text nodes do not count.
        }
        else {
            throw new Error("unexpected node in _phantom_wrap");
        }
        child = child.nextSibling;
    }

    return {
        found: found,
        count: originalIndex - index,
    };
}

/**
 * This function recovers a DOM node on the basis of a path previously
 * created by {@link module:dloc~DLocRoot#nodeToPath nodeToPath}
 * provided that the root from which the path was obtained is on the
 * data tree which corresponds to the GUI tree that this root was
 * created for.
 *
 * @param {string} path The path to interpret.
 *
 * @returns {Node} The node corresponding to the path, or ``null`` if
 * no such node exists.
 * @throws {Error} If given a malformed ``path``.
 */
GUIRoot.prototype.pathToNode = function (path) {
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
        var index;
        var node;
        var match = /^(\d+)$/.exec(part);
        if (match) {
            index = match[1] >> 0; // Convert to Number.
            var found = null;
            for(var i = 0; !found && (i < parent.childNodes.length); i++) {
                node = parent.childNodes[i];
                if ((node.nodeType === Node.TEXT_NODE ||
                     (node.nodeType === Node.ELEMENT_NODE &&
                      node.classList.contains("_real"))) && --index < 0) {
                    found = node;
                }
                else if (node.nodeType === Node.ELEMENT_NODE &&
                      node.classList.contains("_phantom_wrap")) {
                    var result = findInPhantomWrap(node, index);
                    if (result.found) {
                        found = result.found;
                    }
                    index -= result.count;
                }
            }

            if (!found)
                return null;

            parent = found;
        }
        else
            throw new Error("malformed path expression");
    }

    if (attribute) {
        var name = attribute.slice(1);
        var attrs = parent.getElementsByClassName("_attribute_name");
        for (var aix = 0, attr; (attr = attrs[aix]) !== undefined; ++aix)
            if (attr.textContent === name)
                break;
        if (!attr)
            throw new AttributeNotFound(
                "could not find attribute with name: " + name);
        parent = domutil.siblingByClass(attr, "_attribute_value");
    }

    return parent;
};

exports.GUIRoot = GUIRoot;

});
