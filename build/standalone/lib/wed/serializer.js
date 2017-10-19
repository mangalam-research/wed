/**
 * An XML serializer for platforms that produce erratic results.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Escape characters that cannot be represented literally in XML.
     *
     * @private
     *
     * @param text The text to escape.
     *
     * @param isAttr Whether the text is part of an attribute.
     *
     * @returns The escaped text.
     */
    function escape(text, isAttr) {
        // Even though the > escape is not *mandatory* in all cases, we still do it
        // everywhere.
        var ret = text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        if (isAttr) {
            ret = ret.replace(/"/g, "&quot;");
        }
        return ret;
    }
    function serializeDocument(out, node) {
        if (node.childNodes.length > 1) {
            throw new Error("cannot serialize a document with more than " +
                "one child node");
        }
        if (node.firstChild === null) {
            throw new Error("cannot serialize an empty document");
        }
        _serialize(out, node.firstChild);
    }
    function serializeElement(out, node) {
        out.push("<", node.tagName);
        var attributes = node.attributes;
        for (var i = 0; i < attributes.length; ++i) {
            var attr = attributes[i];
            out.push(" ", attr.name, "=\"", escape(attr.value, true), "\"");
        }
        if (node.childNodes.length === 0) {
            out.push("/>");
        }
        else {
            out.push(">");
            var child = node.firstChild;
            while (child !== null) {
                _serialize(out, child);
                child = child.nextSibling;
            }
            out.push("</", node.tagName, ">");
        }
    }
    function serializeText(out, node) {
        out.push(escape(node.textContent, false));
    }
    var typeToHandler = Object.create(null);
    typeToHandler[Node.DOCUMENT_NODE] = serializeDocument;
    typeToHandler[Node.DOCUMENT_FRAGMENT_NODE] = serializeDocument;
    typeToHandler[Node.ELEMENT_NODE] = serializeElement;
    typeToHandler[Node.TEXT_NODE] = serializeText;
    function _serialize(out, node) {
        var handler = typeToHandler[node.nodeType];
        if (handler === undefined) {
            throw new Error("can't handle node of type: " + node.nodeType);
        }
        handler(out, node);
    }
    /**
     * Serialize an XML tree. This serializer implements only as much as wed
     * currently needs. Notably, this does not currently serialize comments, CDATA,
     * or processing instructions.
     *
     * @param root The root of the document.
     *
     * @returns The serialized document.
     */
    function serialize(root) {
        var out = [];
        _serialize(out, root);
        return out.join("");
    }
    exports.serialize = serialize;
});
//  LocalWords:  MPL lt nodeType CDATA

//# sourceMappingURL=serializer.js.map
