/**
 * @module transformation
 * @desc Transformation framework.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:transformation */function (require, exports, module) {
"use strict";

var $ = require("jquery");
var util = require("./util");
var sense_refs = require("./refman").sense_refs;
var domutil = require("./domutil");
var Action = require("./action").Action;
var oop = require("./oop");

var _indexOf = Array.prototype.indexOf;

/**
 * @classdesc A registry of transformations. Not all transformations
 * must be in the registry but the registry is what allows wed to find
 * certain types of transformations.
 *
 * @constructor
 */
function TransformationRegistry() {
    this._tag_tr = {
        "insert": {},
        "delete-element": {},
        "delete-parent": {},
        "merge-with-next": {},
        "merge-with-previous": {},
        "swap-with-next": {},
        "swap-with-previous": {},
        "wrap": {},
        "append": {},
        "prepend": {},
        "unwrap": {}
    };
}

/**
 * @param {String} type The type of transformation.
 * @param {String} tag Can be a tag name or "*" to match all tags.
 * @param
 * {module:transformation~Transformation|Array.<module:transformation~Transformation>}
 * tr One or more transformations.
 */
TransformationRegistry.prototype.addTagTransformations = function(type, tag,
                                                                  tr) {
    if (!(tr instanceof Array))
        tr = [tr];

    this._tag_tr[type][tag] = tr;
};

/**
 * Gets transformations from the registry.
 *
 * @param {Array.<String>|String} type The type or types of
 * transformation desired.
 * @param {String} tag Can be a tag name or "*" to match all tags.
 *
 * @returns {Array.<module:transformation~Transformation>} The
 * transformations.
 */
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
 * @classdesc An operation that transforms the data tree.
 * @extends module:action~Action
 *
 * @constructor
 *
 * @param {module:wed~Editor} editor The editor for which this
 * transformation must be created.
 * @param {String} desc The description of this transformation. A
 * transformation's {@link
 * module:transformation~Transformation#getDescriptionFor
 * getDescriptionFor} method will replace "&lt;element_name>" with the
 * name of the element actually being processed. So a string like
 * "Remove &lt;element_name>" would become "Remove foo" when the
 * transformation is called for the element "foo".
 * @param {String} [abbreviated_desc] An abbreviated description of this
 * transformation.
 * @param {String} [icon] An HTML representation of the icon
 * associated with this transformation.
 * @param {module:transformation~Transformation~handler} handler
 * The handler to call when this
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

/**
 * <p>The transformation types that are defined for {@link
 * module:transformation~TransformationRegistry
 * TransformationRegistry} expect the following values for the
 * parameters passed to a handler. For all these types
 * <code>transformation_data</code> is unused.</p>
 *
 * Transformation Type | `node` is | `element_name` is the name of the:
 * ------------------|--------|---------------------------------
 * insert | undefined (we insert at caret position) | element to insert
 * delete-element | element to delete | element to delete
 * delete-parent | element to delete | element to delete
 * wrap | undefined (we wrap the current selection) | wrapping element
 * merge-with-next | element to merge | element to merge
 * merge-with-previous | element to merge | element to merge
 * swap-with-next | element to swap | element to swap
 * swap-with-previous | element to swap | element to swap
 * append | element after which to append | element after which to append
 * prepend | element before which to prepend | element before which to append
 * unwrap | node to unwrap | node to unwrap
 *
 * @callback module:transformation~Transformation~handler
 *
 * @param {module:wed~Editor} editor The editor.
 * @param {Object} transformation_data Data for the
 * transformation. Some fields are reserved by wed, but
 * transformations are free to use additional fields. The following
 * fields are reserved *and* set by wed. **Do not set them yourself.**
 *
 * - ``e``: The JavaScript event that triggered the transformation, if
 *   any.
 *
 * The following fields are reserved but should be set by code which
 * invokes a transformation. See the table above to know what values
 * the built-in types of transformations known to wed expect.
 *
 * - ``node``: The node to operate on.
 *
 * - ``element_name``: The element name of an element to add, remove,
 *   etc.  (Could be different from the name of the ``node``.)
 *
 * - ``move_caret_to``: A position to which the caret is moved before
 *   the transformation is fired. **Wed does this**.
 */

oop.inherit(Transformation, Action);

// Documented by method in parent class.
Transformation.prototype.getDescriptionFor = function (data) {
    return this._desc.replace(/<element_name>/, data.element_name);
};

/**
 * Calls the <code>fireTransformation</code> method on this
 * transformation's editor.
 *
 * @param {Object} data The data object to pass.
 */
Transformation.prototype.execute = function (data) {
    data = data || {};
    this._editor.fireTransformation(this, data);
};

/**
 * Insert an element in a wed data tree.
 *
 * @param {module:tree_updater~TreeUpdater} data_updater A tree
 * updater through which to update the DOM tree.
 * @param {Node} parent Parent of the new node.
 * @param {Integer} index Offset in the parent where to insert the new node.
 * @param {String} name Name of the new element.
 * @param {Object} [attrs] An object whose fields will become
 * attributes for the new element.
 * @param {jQuery|String|Node} [contents] The contents of the new
 * element.
 *
 * @returns {jQuery} The new element.
 */
function insertElement(data_updater, parent, index, name, attrs,
                       contents) {
    var $new = makeElement(name, attrs, contents !== undefined);

    if (contents !== undefined)
        $new.append(contents);

    data_updater.insertAt(parent, index, $new.get(0));
    return $new;
}

/**
 * Makes an element appropriate for a wed data tree.
 *
 * @param {String} name Name of the new element.
 * @param {Object} [attrs] An object whose fields will become
 * attributes for the new element.
 *
 * @returns {jQuery} The new element.
 */
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

/**
 * Wraps a span of text in a new element.
 *
 * @param {module:tree_updater~TreeUpdater} data_updater A tree
 * updater through which to update the DOM tree.
 * @param {Node} node The DOM node where to wrap. Must be a text node.
 * @param {Integer} offset Offset in the node. This parameter
 * specifies where to start wrapping.
 * @param {Integer} end_offset Offset in the node. This parameter
 * specifies where to end wrapping.
 * @param {String} name Name of the wrapping element.
 * @param {Object} [attrs] An object whose fields will become
 * attributes for the new element.
 *
 * @returns {jQuery} The new element.
 */
function wrapTextInElement (data_updater, node, offset, end_offset,
                            name, attrs) {
    var original_text = node.nodeValue;
    var text_to_wrap = node.nodeValue.slice(offset, end_offset);

    data_updater.deleteText(node, offset, text_to_wrap.length);
    var $new_element = makeElement(name, attrs);

    // It is okay to manipulate the DOM directly as long as the DOM
    // tree being manipulated is not *yet* inserted into the data
    // tree. That is the case here.
    $new_element.append(text_to_wrap);

    data_updater.insertAt(node, offset, $new_element.get(0));

    return $new_element;
}

/**
 * Utility function for {@link module:transformation~wrapInElement
 * wrapInElement}.
 *
 * @private
 * @param {module:tree_updater~TreeUpdater} data_updater A tree
 * updater through which to update the DOM tree.
 * @param {Node} container The text node to split.
 * @param {Integer} offset Where to split the node
 *
 * @returns {Array} Returns a caret location marking where the split
 * occurred.
 */
function _wie_splitTextNode(data_updater, container, offset) {
    var parent = container.parentNode;
    var container_offset = _indexOf.call(parent.childNodes, container);
    // The first two cases here just move the start outside of the
    // text node rather than make a split that will create a
    // useless empty text node.
    if (offset === 0)
        offset = container_offset;
    else if (offset >= container.nodeValue.length)
        offset = container_offset + 1;
    else {
        var text = container.nodeValue.slice(offset);
        data_updater.setTextNode(container,
                                 container.nodeValue.slice(0, offset));
        data_updater.insertNodeAt(
            parent, container_offset + 1,
            container.ownerDocument.createTextNode(text));

        offset = container_offset + 1;
    }
    container = parent;
    return [container, offset];
}

/**
 * Wraps a well-formed span in a new element. This span can contain
 * text and element nodes.
 *
 * @param {module:tree_updater~TreeUpdater} data_updater A tree
 * updater through which to update the DOM tree.
 * @param {Node} start_container The node where to start wrapping.
 * @param {Integer} start_offset The offset where to start wrapping.
 * @param {Node} end_container The node where to end wrapping.
 * @param {Integer} end_offset The offset where to end wrapping.
 * @param {String} name The name of the new element.
 * @param {Object} [attrs] An object whose fields will become
 * attributes for the new element.
 *
 * @returns {jQuery} The new element.
 * @throws {Error} If the range is malformed or if there is an
 * internal error.
 */
function wrapInElement (data_updater, start_container, start_offset,
                        end_container, end_offset, name, attrs) {
    if (!domutil.isWellFormedRange({startContainer: start_container,
                                    startOffset: start_offset,
                                    endContainer: end_container,
                                    endOffset: end_offset}))
        throw new Error("malformed range");

    var pair; // damn hoisting
    if (start_container.nodeType === Node.TEXT_NODE) {
        // We already have an algorithm for this case.
        if (start_container === end_container)
            return wrapTextInElement(data_updater, start_container,
                                     start_offset, end_offset,
                                     name, attrs);

        pair = _wie_splitTextNode(data_updater, start_container, start_offset);
        start_container = pair[0];
        start_offset = pair[1];
    }

    if (end_container.nodeType === Node.TEXT_NODE) {
        pair = _wie_splitTextNode(data_updater, end_container, end_offset);
        end_container = pair[0];
        end_offset = pair[1];
    }

    if (start_container !== end_container)
        throw new Error("start_container and end_container are not the same;" +
                        "probably due to an algorithmic mistake");

    var $new_element = makeElement(name, attrs);
    while(--end_offset >= start_offset) {
        var end_node = end_container.childNodes[end_offset];
        data_updater.deleteNode(end_node);
        // Okay to change a tree which is not yet connected to the data tree.
        $new_element.prepend(end_node);
    }

    data_updater.insertAt(start_container, start_offset, $new_element.get(0));

    return $new_element;
}

/**
 * Replaces an element with its contents.
 *
 * @param {module:tree_updater~TreeUpdater} data_updater A tree
 * updater through which to update the DOM tree.
 * @param {Node} node The element to unwrap.
 *
 * @returns {Array.<Node>} The contents of the element.
 */
function unwrap(data_updater, node) {
    var parent = node.parentNode;
    var children = Array.prototype.slice.call(node.childNodes);
    var prev = node.previousSibling;
    var next = node.nextSibling;
    // This does not merge text nodes, which is what we want. We also
    // want to remove it first so that we don't generate so many
    // update events.
    data_updater.deleteNode(node);

    // We want to calculate this index *after* removal.
    var next_ix = next ? _indexOf.call(parent.childNodes, next):
            parent.childNodes.length;

    var last_child = node.lastChild;

    // This also does not merge text nodes.
    while(node.firstChild)
        data_updater.insertNodeAt(parent, next_ix++, node.firstChild);

    // The order of the next two calls is important. We start at the
    // end because going the other way around could cause last_child
    // to leave the DOM tree.

    // Merge possible adjacent text nodes: the last child of the node
    // that was removed in the unwrapping and the node that was after
    // the node that was removed in the unwrapping.
    data_updater.mergeTextNodes(last_child);

    // Merge the possible adjacent text nodes: the one before the
    // start of the children we unwrapped and the first child that was
    // unwrapped.
    data_updater.mergeTextNodes(prev);

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
 * @throws {Error} If the caret is not inside the node or its descendants.
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

/**
 * This function swaps an element with a previous element of the same
 * name. For the operation to go forward, the element must have a
 * previous sibling and this sibling must have the same name as the
 * element being merged.
 *
 * @param {module:wed~Editor} editor The editor on which we are to
 * perform the transformation.
 * @param {Node} node The element to swap with previous.
 */
function swapWithPreviousHomogeneousSibling (editor, node) {
    var prev = node.previousSibling;
    var name = util.getOriginalName(node);
    if ($(prev).is(util.classFromOriginalName(name))) {
        var parent = prev.parentNode;
        editor.data_updater.removeNode(node);
        editor.data_updater.insertBefore(parent, node, prev);
        editor.setDataCaret(parent, _indexOf.call(
            parent.childNodes, node));
    }
}

/**
 * This function swaps an element with a next element of the same
 * name. For the operation to go forward, the element must have a next
 * sibling and this sibling must have the same name as the element
 * being merged.
 *
 * @param {module:wed~Editor} editor The editor on which we are to
 * perform the transformation.
 * @param {Node} node The element to swap with next.
 */
function swapWithNextHomogeneousSibling(editor, node) {
    var next = node.nextSibling;
    if (next)
        swapWithPreviousHomogeneousSibling(editor, next);
}

exports.TransformationRegistry = TransformationRegistry;
exports.Transformation = Transformation;
exports.wrapTextInElement = wrapTextInElement;
exports.wrapInElement = wrapInElement;
exports.insertElement = insertElement;
exports.makeElement = makeElement;
exports.unwrap = unwrap;
exports.splitNode = splitNode;
exports.mergeWithPreviousHomogeneousSibling =
        mergeWithPreviousHomogeneousSibling;
exports.mergeWithNextHomogeneousSibling =
        mergeWithNextHomogeneousSibling;
exports.swapWithPreviousHomogeneousSibling =
        swapWithPreviousHomogeneousSibling;
exports.swapWithNextHomogeneousSibling =
        swapWithNextHomogeneousSibling;
});

//  LocalWords:  concat prepend refman endOffset endContainer DOM oop
//  LocalWords:  startOffset startContainer html Mangalam MPL Dubeau
//  LocalWords:  previousSibling nextSibling insertNodeAt deleteNode
//  LocalWords:  mergeTextNodes lastChild prev deleteText Prepend lt
//  LocalWords:  domutil jquery util jQuery
