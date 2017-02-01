/**
 * @module serializer
 * @desc An XML serializer for platforms that produce erratic results.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed/serializer */function (require, exports, module) {
'use strict';

/**
 * Serialize an XML tree. This serializer implements only as much as
 * wed currently needs. Notably, this does not currently serialize
 * comments, CDATA, or processing instructions.
 *
 * @param {Node} root The root of the document. This node must be an
 * element, a document, or a document fragment. The latter two must
 * have one child element so that the serialization produces a
 * well-formed XML element.
 * @returns {string} The serialized document.
 */
function serialize(root) {
    if (root.nodeType !== Node.ELEMENT_NODE &&
        root.nodeType !== Node.DOCUMENT_NODE &&
        root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)
        throw new  Error("the root node must be an element, a " +
                         "document or a document fragment");

    var out = [];
    _serialize(out, root);

    return out.join('');
}

function serializeDocument(out, node) {
    if (node.childNodes.length > 1)
        throw new Error("cannot serialize a document with more than " +
                        "one child node");

    _serialize(out, node.firstChild);
}

/**
 * Escape characters that cannot be represented literally in XML.
 *
 * @private
 * @param {string} text The text to escape.
 * @param {boolean} is_attr Whether the text is part of an attribute.
 * @returns {string} The escaped text.
 */
function escape(text, is_attr) {
    // Even though the > escape is not *mandatory* in all cases, we
    // still do it everywhere.
    var ret = text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    if (is_attr)
        ret = ret.replace(/"/g, '&quot;');

    return ret;
}

function serializeElement(out, node) {
    out.push("<", node.tagName);

    var attributes = node.attributes;
    for(var i = 0, attr; (attr = attributes[i]); ++i)
        out.push(" ", attr.name, '="', escape(attr.value, true), '"');
    if (!node.childNodes.length)
        out.push("/>");
    else {
        out.push(">");
        var child = node.firstChild;
        while (child) {
            _serialize(out, child);
            child = child.nextSibling;
        }
        out.push("</", node.tagName, ">");
    }
}

function serializeText(out, node) {
    out.push(escape(node.textContent, false));
}

var type_to_handler = {};
type_to_handler[Node.DOCUMENT_NODE] = serializeDocument;
type_to_handler[Node.DOCUMENT_FRAGMENT_NODE] = serializeDocument;
type_to_handler[Node.ELEMENT_NODE] =  serializeElement;
type_to_handler[Node.TEXT_NODE] =  serializeText;

function _serialize(out, node) {
    var handler = type_to_handler[node.nodeType];
    if (!handler)
        throw new Error("can't handle node of type: " + node.nodeType);
    handler(out, node);
}

exports.serialize = serialize;

});
