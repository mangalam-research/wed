/**
 * Model for a GUI root.
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
define(["require", "exports", "module", "./dloc", "./domtypeguards", "./domutil", "./util"], function (require, exports, module, dloc_1, domtypeguards_1, domutil_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Raised if an attribute could not be found when converting a path to a node.
     */
    var AttributeNotFound = (function (_super) {
        __extends(AttributeNotFound, _super);
        function AttributeNotFound(message) {
            var _this = _super.call(this, message) || this;
            util_1.fixPrototype(_this, AttributeNotFound);
            return _this;
        }
        return AttributeNotFound;
    }(Error));
    exports.AttributeNotFound = AttributeNotFound;
    /**
     * Count the number of relevant nodes in the ``_phantom_wrap``.
     *
     * @param top The top _phantom_wrap to consider.
     */
    function countInPhantomWrap(top) {
        if (!domtypeguards_1.isElement(top) || !top.classList.contains("_phantom_wrap")) {
            throw new Error("the node should be a _phantom_wrap element");
        }
        var count = 0;
        var child = top.firstChild;
        while (child !== null) {
            if (domtypeguards_1.isElement(child)) {
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
    function findInPhantomWrap(top, index) {
        if (!domtypeguards_1.isElement(top) || !top.classList.contains("_phantom_wrap")) {
            throw new Error("the node should be a _phantom_wrap element");
        }
        var originalIndex = index;
        var found = null;
        var child = top.firstChild;
        while (found === null && child !== null) {
            if (domtypeguards_1.isElement(child)) {
                if (child.classList.contains("_phantom_wrap")) {
                    var result = findInPhantomWrap(child, index);
                    if (result.found !== null) {
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
     * This is a DLocRoot class customized for use to mark the root of the GUI tree.
     */
    var GUIRoot = (function (_super) {
        __extends(GUIRoot, _super);
        function GUIRoot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Converts a node to a path suitable to be used by the
         * [["dloc".DLocRoot.pathToNode]] method so long as the root used is the one
         * for the data tree corresponding to the GUI tree to which this object
         * belongs.
         *
         * @param node The node for which to construct a path.
         *
         * @returns The path.
         */
        GUIRoot.prototype.nodeToPath = function (node) {
            var root = this.node;
            if (domutil_1.closestByClass(node, "_placeholder", root) !== null) {
                throw new Error("cannot provide path to node because it is a placeholder node");
            }
            if (root === node) {
                return "";
            }
            if (!root.contains(node)) {
                throw new Error("node is not a descendant of root");
            }
            var ret = [];
            while (node !== root) {
                var parent_1 = void 0;
                if (domtypeguards_1.isElement(node) &&
                    !node.matches("._real, ._phantom_wrap, ._attribute_value")) {
                    throw new Error("only nodes of class ._real, ._phantom_wrap, and " +
                        "._attribute_value are supported");
                }
                var attrVal = domutil_1.closestByClass(node, "_attribute_value", root);
                if (attrVal !== null) {
                    var child = domutil_1.siblingByClass(attrVal, "_attribute_name");
                    if (child === null) {
                        throw new Error("no attribute name found");
                    }
                    ret.unshift("@" + child.textContent);
                    parent_1 = domutil_1.closestByClass(attrVal, "_real", root);
                    if (parent_1 === null) {
                        throw new Error("attribute is detached from real element");
                    }
                }
                else {
                    parent_1 = node.parentNode;
                    if (parent_1 === null) {
                        throw new Error("detached node");
                    }
                    var offset = 0;
                    var location_1 = domutil_1.indexOf(parent_1.childNodes, node);
                    for (var i = 0; i < location_1; ++i) {
                        var child = parent_1.childNodes[i];
                        if (domtypeguards_1.isText(child) ||
                            (domtypeguards_1.isElement(child) && child.classList.contains("_real"))) {
                            offset++;
                        }
                        else if (domtypeguards_1.isElement(child) &&
                            child.classList.contains("_phantom_wrap")) {
                            offset += countInPhantomWrap(child);
                        }
                    }
                    // Parent could be a document if it is not an element.
                    if (!domtypeguards_1.isElement(parent_1) || !parent_1.classList.contains("_phantom_wrap")) {
                        ret.unshift(String(offset));
                    }
                }
                node = parent_1;
            }
            return ret.join("/");
        };
        /**
         * This function recovers a DOM node on the basis of a path previously created
         * by [["dloc".DLocRoot.nodeToPath]] provided that the root from which the
         * path was obtained is on the data tree which corresponds to the GUI tree
         * that this root was created for.
         *
         * @param path The path to interpret.
         *
         * @returns The node corresponding to the path, or ``null`` if no such node
         * exists.
         *
         * @throws {Error} If given a malformed ``path``.
         */
        GUIRoot.prototype.pathToNode = function (path) {
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
            var found = null;
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
                var match = /^(\d+)$/.exec(part);
                if (match !== null) {
                    found = null;
                    var index = parseInt(match[1]);
                    for (var i = 0; found === null && (i < parent.childNodes.length); i++) {
                        var node = parent.childNodes[i];
                        if ((domtypeguards_1.isText(node) ||
                            (domtypeguards_1.isElement(node) && node.classList.contains("_real"))) &&
                            --index < 0) {
                            found = node;
                        }
                        else if (domtypeguards_1.isElement(node) &&
                            node.classList.contains("_phantom_wrap")) {
                            var result = findInPhantomWrap(node, index);
                            if (result.found !== null) {
                                found = result.found;
                            }
                            index -= result.count;
                        }
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
            if (attribute !== undefined) {
                var name_1 = attribute.slice(1);
                if (!domtypeguards_1.isElement(parent)) {
                    throw new Error("looking for attribute on something which is not an element");
                }
                var attrs = parent.getElementsByClassName("_attribute_name");
                found = null;
                for (var aix = 0; aix < attrs.length; ++aix) {
                    var attr = attrs[aix];
                    if (attr.textContent === name_1) {
                        found = attr;
                        break;
                    }
                }
                if (found === null) {
                    throw new AttributeNotFound("could not find attribute with name: " + name_1);
                }
                parent = domutil_1.siblingByClass(found, "_attribute_value");
            }
            return parent;
        };
        return GUIRoot;
    }(dloc_1.DLocRoot));
    exports.GUIRoot = GUIRoot;
});

//# sourceMappingURL=guiroot.js.map
