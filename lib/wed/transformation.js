/**
 * @module transformation
 * @desc Transformation framework.
 * @author Louis-Dominique Dubeau
 */

define(/** @lends module:transformation */function (require, exports, module) {
"use strict";

var $ = require("jquery");
var util = require("./util");
var sense_refs = require("./refman").sense_refs;
var domutil = require("./domutil");
var Action = require("./action").Action;
var oop = require("./oop");

/**
 * The following is true of all transformations stored in this
 * registry. Insert, and wrap handlers get an undefined node because
 * they must query the editor for caret and selection information.
 *
 * <table border="1">
 *
 * <tr><td>type</td><td>node is</td><td>element_name is the name of the</td></tr>
 *
 * <tr><td>insert</td><td>undefined</td><td>element to
 * insert</td></tr>
 *
 * <tr><td>delete-element</td><td>element to delete</td><td>element to delete</td></tr>
 *
 * <tr><td>delete-parent</td><td>element to delete</td><td>element to delete</td></tr>
 *
 * <tr><td>wrap</td><td>undefined</td><td>wrapping element</td></tr>
 *
 * <tr><td>merge-with-next</td><td>element to merge</td>
 * <td>element to merge</td></tr>
 *
 * <tr><td>merge-with-previous</td><td>element to
 * merge</td><td>element to merge</td></tr>
 *
 * <tr><td>append</td><td>element after which to
 * append</td><td>element after which to append</td></tr>
 *
 * <tr><td>prepend</td><td>element before which to
 * prepend</td><td>element before which to append</td></tr>
 *
 * <tr><td>unwrap</td><td>node to unwrap</td><td>node to unwrap</td></tr>
 *
 * </table>
 *
 * @class
 */
function TransformationRegistry() {
    this._tag_tr = {
        "insert": {},
        "delete-element": {},
        "delete-parent": {},
        "merge-with-next": {},
        "merge-with-previous": {},
        "wrap": {},
        "append": {},
        "prepend": {},
        "unwrap": {}
    };
}

/**
 * @param {String} tag Can be a tag name or "*" to match all tags.
 *
 */
TransformationRegistry.prototype.addTagTransformations = function(type, tag,
                                                                  tr) {
    if (!(tr instanceof Array))
        tr = [tr];

    this._tag_tr[type][tag] = tr;
};

TransformationRegistry.prototype.getTagTransformations = function (type, tag) {
    if (!(type instanceof Array))
        type = [type];

    var ret = [];
    for(var ix = 0; ix < type.length; ix++) {
        var val = this._tag_tr[type[ix]][tag];
        // Can't concat undefined
        if (val !== undefined)
            ret = ret.concat(val);

        val = this._tag_tr[type[ix]]["*"];
        if (val !== undefined)
            ret = ret.concat(val);
    }
    return ret;
};

/**
 * @class
 * @param {module:wed~Editor} editor The editor for which this
 * transformation must be created.
 * @param {String} desc The description of this transformation. A
 * transformation's {@link
 * module:transformation~Transformation#getDescriptionFor
 * getDescriptionFor} method will replace "&lt;element_name>" with the
 * name of the element actually being processed. So a string like
 * "Remove &ltelement_name>" would become "Remove foo" when the
 * transformation is called for the element "foo".
 * @param {String} [abbreviated_desc] An abbreviated description of this
 * transformation.
 * @param {String} [icon] An HTML representation of the icon
 * associated with this transformation.
 * @param {Function} handler The handler to call when this
 * transformation is executed.
 */
function Transformation(editor, desc, abbreviated_desc, icon, handler) {
    switch(arguments.length) {
    case 3:
        handler = abbreviated_desc;
        abbreviated_desc = icon = undefined;
        break;
    case 4:
        handler = icon;
        icon = undefined;
        break;
    }
    Action.call(this, editor, desc, abbreviated_desc, icon);
    this.handler = handler;
}

oop.inherit(Transformation, Action);

Transformation.prototype.getDescriptionFor = function (data) {
    return this._desc.replace(/<element_name>/, data.element_name);
};

Transformation.prototype.execute = function (data) {
    data = data || {};
    this._editor.fireTransformation(this, data.node,
                                    data.element_name, data);
};

function insertElement(data_updater, parent, index, tag_name, attrs,
                       contents) {
    var $new = makeElement(
        tag_name,
        attrs,
        contents !== undefined
    );

    if (contents !== undefined)
        $new.append(contents);

    data_updater.insertAt(parent, index, $new.get(0));
    return $new;
}

function makeElement(name, attrs) {
    var $e = $("<div class='" + name + " _real'>");
    if (attrs !== undefined)
    {
        // Create attributes
        var keys = Object.keys(attrs);
        for(var keys_ix = 0, key; (key = keys[keys_ix++]) !== undefined; ) {
            $e.attr(util.encodeAttrName(key), attrs[key]);
        }
    }
    return $e;
}

function wrapTextInElement (data_updater, node, offset, end_offset,
                            element, attrs) {
    var original_text = node.nodeValue;
    var text_to_wrap = node.nodeValue.slice(offset, end_offset);

    data_updater.deleteText(node, offset, text_to_wrap.length);
    // Insert the new element
    var $new_element = makeElement(element, attrs);
    data_updater.insertAt(node, offset, $new_element.get(0));

    return $new_element;
}

function unwrap(data_updater, node) {
    var parent = node.parentNode;
    var children = Array.prototype.slice.call(node.childNodes);
    var prev = node.previousSibling;
    data_updater.insertBefore(parent, node.childNodes,
                              prev || parent.firstChild);
    data_updater.removeNode(node);
    return children;
}

/**
 * This function splits a node at the position of the caret. If the
 * caret is not inside the node or its descendants, an exception is
 * raised.
 *
 * @param {module:wed~Editor} editor The editor on which we are to
 * perform the transformation.
 * @param {Node} node The node to split.
 */
function splitNode(editor, node) {
    var caret = editor.getDataCaret();

    if ($(caret[0]).closest(node).length === 0)
        throw new Error("caret outside node");

    var pair = editor.data_updater.splitAt(node, caret);
    // Find the deepest location at the start of the 2nd
    // element.
    editor.setDataCaret(domutil.firstDescendantOrSelf(pair[1]), 0);
}

/**
 * This function merges an element with a previous element of the same
 * name. For the operation to go forward, the element must have a
 * previous sibling and this sibling must have the same name as the
 * element being merged.
 *
 * @param {module:wed~Editor} editor The editor on which we are to
 * perform the transformation.
 * @param {Node} node The element to merge with previous.
 */
function mergeWithPreviousHomogeneousSibling (editor, node) {
    var $node = $(node);
    var $prev = $node.prev();
    var name = util.getOriginalName(node);
    if ($prev.is(util.classFromOriginalName(name))) {
        // We need to record these to set the caret to a good position.
        var caret_pos = $prev.get(0).childNodes.length;
        var was_text = $prev.get(0).lastChild.nodeType === Node.TEXT_NODE;
        var text_len = (was_text) ?
                $prev.get(0).lastChild.nodeValue.length : 0;

        var prev = $prev.get(0);
        var insertion_point = prev.childNodes.length;
        // Reverse order
        for (var i = node.childNodes.length; i >= 0; --i)
            editor.data_updater.insertAt(prev, insertion_point,
                                         node.childNodes[i]);

        if (was_text)
            editor.setDataCaret($prev.get(0).childNodes[caret_pos - 1],
                                text_len);
        else
            editor.setDataCaret($prev.get(0), caret_pos);
        editor.data_updater.removeNode(node);
    }
}

/**
 * This function merges an element with a next element of the same
 * name. For the operation to go forward, the element must have a
 * next sibling and this sibling must have the same name as the
 * element being merged.
 *
 * @param {module:wed~Editor} editor The editor on which we are to
 * perform the transformation.
 * @param {Node} node The element to merge with next.
 */
function mergeWithNextHomogeneousSibling(editor, node) {
    var $node = $(node);
    var $next = $node.next();
    var name = util.getOriginalName(node);
    if ($next.is(util.classFromOriginalName(name)))
        mergeWithPreviousHomogeneousSibling(editor, $next.get(0));
}

function _moveDataCaretFirst(editor, data_caret, tr, ev) {
    editor.setDataCaret(data_caret);
    tr.bound_handler(ev);
}

/**
 * This is a convenience function which returns a function that,
 * upon execution, will first move the data caret and then execute the
 * transformation passed as a parameter.
 *
 * @param {module:wed~Editor} editor The editor to which this
 * transformation applies.
 * @param {Array} data_caret The caret to which to move.
 * @param {module:transformation~Transformation} tr The transformation
 * to execute.
 * @returns {Function} The function to use.
 */
function moveDataCaretFirst(editor, data_caret, tr) {
    return _moveDataCaretFirst.bind(undefined, editor, data_caret, tr);
}

exports.TransformationRegistry = TransformationRegistry;
exports.Transformation = Transformation;
exports.wrapTextInElement = wrapTextInElement;
exports.insertElement = insertElement;
exports.makeElement = makeElement;
exports.unwrap = unwrap;
exports.splitNode = splitNode;
exports.mergeWithPreviousHomogeneousSibling =
        mergeWithPreviousHomogeneousSibling;
exports.mergeWithNextHomogeneousSibling =
        mergeWithNextHomogeneousSibling;
exports.moveDataCaretFirst = moveDataCaretFirst;
});
