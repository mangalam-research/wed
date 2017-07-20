/**
 * Convertion from XML to HTML.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "./domtypeguards"], function (require, exports, module, domtypeguards_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ancestorNamespaceValue(node, name) {
        var parent = node.parentNode;
        if (!domtypeguards_1.isElement(parent)) {
            return undefined;
        }
        var val = parent.getAttribute(name);
        return (val !== null) ? val : ancestorNamespaceValue(parent, name);
    }
    function toHTMLTree(doc, node) {
        var ret;
        if (domtypeguards_1.isElement(node)) {
            ret = doc.createElement("div");
            ret.className = node.tagName + " _real";
            //
            // We encode attributes here in the following way:
            //
            // 1. A sequence of three dashes or more gains a dash. So three dashes
            // becomes 4, 4 becomes 5, etc.
            //
            // 2. A colon (which should be present only to mark the prefix) becomes a
            // sequence of three dashes.
            //
            for (var i = 0; i < node.attributes.length; ++i) {
                var attr = node.attributes[i];
                var ns = (attr.name === "xmlns" ||
                    attr.name.lastIndexOf("xmlns:", 0) === 0);
                // Don't do anything for namespace attributes that don't actually change
                // the namespace.
                if (ns && (attr.value === ancestorNamespaceValue(node, attr.name))) {
                    continue;
                }
                // tslint:disable-next-line:prefer-template
                var attrName = "data-wed-" + attr.name.replace(/--(-+)/, "---$1")
                    .replace(":", "---");
                ret.setAttribute(attrName, attr.value);
            }
            var child = node.firstChild;
            while (child !== null) {
                ret.appendChild(toHTMLTree(doc, child));
                child = child.nextSibling;
            }
        }
        else if (domtypeguards_1.isText(node)) {
            ret = document.createTextNode(node.data);
        }
        else {
            throw new Error("unhandled node type: " + node.nodeType);
        }
        return ret;
    }
    exports.toHTMLTree = toHTMLTree;
});

//# sourceMappingURL=convert.js.map
