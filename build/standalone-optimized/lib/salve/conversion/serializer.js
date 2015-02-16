/**
 * @module conversion/serializer
 * @desc Serialization support for trees produced by the {@link
 * module:conversion/parser parser} module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:conversion/serializer */
    function (require, exports, module) {
'use strict';

//
// WARNING: This serializer is *not* meant to be able to handle all
// possible XML under the sun. Don't export this code into another project.
//
// In fact it used only for testing conversion code. We keep it as
// part of the library so that it is available for possible diagnostic
// tools but it is really not meant to be used as part of normal
// salve operations.
//
// In particular, the logic in here is very dependent on how the code
// in its sibling module parser.js constructs a tree of elements.
//

/**
 * Serialize a tree previously produced by {@link
 * module:conversion/parser~Parser}.
 *
 * @param {module:conversion/parser~Element} tree The tree to serialize.
 * @returns {string} The serialized tree.
 */
function serialize(tree) {
    var out = ['<?xml version="1.0"?>\n'];
    _serialize(out, false, "", tree);
    return out.join('');
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

/**
 * Serialize an element and its children, recursively.
 *
 * @private
 * @param {Array.<string>} out The array onto which to push strings
 * that form the final output.
 * @param {boolean} mixed Whether or not the element being converted
 * is in mixed contents.
 * @param {string} cur_indent The current indentation. This is
 * represented as a string of white spaces.
 * @param {module:conversion/parser~Element} el The element to serialize.
 */
function _serialize(out, mixed, cur_indent, el) {
    var node = el.node;
    var keys = Object.keys(node.attributes);

    out.push(cur_indent, "<", node.name);
        var attr_out = [];
    var names = Object.keys(node.attributes);
    names.sort();
    names.forEach(function (name) {
        out.push(" ", name, '="', escape(node.attributes[name].value, true),
                 '"');
    });
    if (el.children.length === 0) {
        out.push("/>");
        if (!mixed)
            out.push("\n");
    }
    else {
        var children_mixed = false;
        for (var i = 0, child; (child = el.children[i]); ++i) {
            if (typeof child === "string") {
                children_mixed = true;
                break;
            }
        }

        out.push(">");
        if (!children_mixed)
            out.push("\n");

        var child_indent = cur_indent + "  ";

        for (i = 0; (child = el.children[i]); ++i) {
            if (typeof child === "string") {
                out.push(escape(child, false));
            }
            else
                _serialize(out, children_mixed, child_indent, child);
        }

        if (!children_mixed)
            out.push(cur_indent);

        out.push("</" + node.name + ">");

        if (!mixed)
            out.push("\n");
    }
}

exports.serialize = serialize;

});
