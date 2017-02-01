/**
 * @module convert
 * @desc Convertion from XML to HTML.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:convert */function (require, exports, module) {
'use strict';

function ancestorNamespaceValue(node, name) {
    var parent = node.parentNode;
    if (!parent || parent.nodeType === Node.DOCUMENT_NODE ||
        parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE)
        return undefined;

    var val = parent.getAttribute(name);
    if (val !== null)
        return val;

    return ancestorNamespaceValue(parent, name);
}

function toHTMLTree(doc, node) {
    var ret;
    switch(node.nodeType) {
    case Node.ELEMENT_NODE:
        ret = doc.createElement("div");
        ret.className =  node.tagName + " _real";
        //
        // We encode attributes here in the following way:
        //
        // 1. A sequence of three dashes or more gains a dash. So three
        // dashes becomes 4, 4 becomes 5, etc.
        //
        // 2. A colon (which should be present only to mark the prefix)
        // becomes a sequence of three dashes.
        //
        for(var i = 0, attr; (attr = node.attributes[i]); ++i) {
            var namespace = (attr.name === "xmlns" ||
                             attr.name.lastIndexOf("xmlns:", 0) === 0);

            // Don't do anything for namespace attributes that don't
            // actually change the namespace.
            if (namespace &&
                (attr.value === ancestorNamespaceValue(node, attr.name)))
                continue;

            var attr_name = "data-wed-" + attr.name.replace(/--(-+)/, "---$1")
                    .replace(":", "---");

            ret.setAttribute(attr_name, attr.value);
        }

        var child = node.firstChild;
        while (child) {
            var new_child = toHTMLTree(doc, child);
            if (new_child)
                ret.appendChild(new_child);
            child = child.nextSibling;
        }
        break;
    case Node.TEXT_NODE:
        ret = document.createTextNode(node.data);
        break;
    default:
        throw new Error("unhandled node type: " + node.nodeType);
    }

    return ret;
}

exports.toHTMLTree = toHTMLTree;

});
