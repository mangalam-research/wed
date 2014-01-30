/**
 * @module guiroot
 * @desc Model for a GUI root.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:guiroot */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var oop = require("./oop");
var dloc = require("./dloc");
var util = require("./util");

var _indexOf = Array.prototype.indexOf;

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

    var $node = $(node);
    if ($node.closest("._placeholder")[0])
        throw new Error("cannot provide path to node because it is a "+
                        "placeholder node");

    if (root === node)
        return "";

    if (!$node.closest(root)[0])
        throw new Error("node is not a descendant of root");

    var ret = [];
    while (node !== root) {
        var parent;
        var location;
        var offset = 0;
        var i;

        if (!$node.is("._real, ._phantom_wrap, ._attribute_value") &&
            node.nodeType !== Node.TEXT_NODE)
            throw new Error("only nodes of class ._real, ._phantom_wrap, and " +
                            "._attribute_value are supported");

        var $attr_val = $node.closest("._attribute_value");
        if ($attr_val.length) {
            ret.unshift("@" + util.encodeAttrName(
                $attr_val.siblings("._attribute_name").text()));
            parent = $attr_val.closest("._real")[0];
        }
        else {
            parent = node.parentNode;
            location = _indexOf.call(parent.childNodes, node);
            for (i = 0; i < location; ++i) {
                if ((parent.childNodes[i].nodeType === Node.TEXT_NODE) ||
                    (parent.childNodes[i].nodeType === Node.ELEMENT_NODE &&
                     $(parent.childNodes[i]).is("._real, ._phantom_wrap")))
                    offset++;
            }

            ret.unshift("" + offset);
        }
        node = parent;
        $node = $(node);
    }

    return ret.join("/");
};

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
                      $(node).is("._real, ._phantom_wrap"))) && --index < 0)
                    found = node;
            }

            if (!found)
                return null;

            parent = found;
        }
        else
            throw new Error("malformed path expression");
    }

    if (attribute) {
        var name = util.decodeAttrName(attribute.slice(1));
        var attr = $(parent).find("._attribute_name").filter(function () {
            return this.textContent === name;
        })[0];
        parent = $(attr).siblings("._attribute_value")[0];
    }

    return parent;
};


exports.GUIRoot = GUIRoot;

});
