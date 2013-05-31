/**
 * @module validate
 * @desc RNG-based validator.
 * @author Louis-Dominique Dubeau
 */

define(/** @lends <global> */function (require, exports, module) {
"use strict";

var util = require("./util");
var sense_refs = require("./refman").sense_refs;
var domutil = require("./domutil");

function TransformationRegistry() {
    this._tag_tr = {
        "insert": {},
        "delete": {},
        "merge-with-next": {},
        "merge-with-previous": {},
        "wrap": {},
        "append": {},
        "prepend": {},
        "unwrap": {}
    };
}

(function () {
    /**
     * @param {String} tag Can be a tag name or "*" to match all tags.
     *
     */
    this.addTagTransformations = function(type, tag, tr) {
        if (!(tr instanceof Array))
            tr = [tr];
 
        this._tag_tr[type][tag] = tr;
    };

    this.getTagTransformations = function (type, tag) {
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
}).call(TransformationRegistry.prototype);

/**
 * A "generic" transformation is created by calling the constructor
 * with a desc parameter containing the string
 * "&lt;element_name>". When getDescriptionFor is called, this string
 * is replaced with the actual element name. The handler must take 3
 * parameters (editor, node, element_name). See generic_tr.js for an
 * example.
 *
 * insert, delete and wrap handlers get an undefined node because they
 * must query the editor for caret and selection information.
 *
 * <table border="1"> 
 *
 * <tr><td>name</td><td>node</td><td>element_name</td></tr>
 *
 * <tr><td>insert</td><td>undefined</td><td>element to
 * insert</td></tr>
 *
 * <tr><td>delete</td><td>undefined</td><td>element to
 * delete</td></tr>
 *
 * <tr><td>wrap</td><td>undefined</td><td>wrapping element</td></tr>
 *
 * <tr><td>merge-with-next</td><td>element to merge</td>
 * <td>ditto</td></tr>
 * 
 * <tr><td>merge-with-previous</td><td>element to
 * merge</td><td>ditto</td></tr>
 * 
 * <tr><td>append</td><td>element after which to
 * append</td><td>ditto</td></tr>
 *
 * <tr><td>prepend</td><td>element before which to
 * prepend</td><td>ditto</td></tr>
 * 
 * </table>
 * @constructor
 */
function Transformation(desc, handler) {
    this._desc = desc;
    this.handler = handler;
}

(function () {
    this.getDescriptionFor = function (element_name) {
        return this._desc.replace(/<element_name>/, element_name);
    };
}).call(Transformation.prototype);


function insertElement(editor, parent, index, tag_name, attrs, contents) {
    var $new = makeElement(
        tag_name, 
        attrs,
        contents !== undefined
    );

    if (contents !== undefined)
        $new.append(contents);

    switch(parent.nodeType) {
    case Node.TEXT_NODE:
        insertIntoText(parent, index, $new.get(0));
        break;
    case Node.ELEMENT_NODE:
        if (index >= parent.childNodes.length)
            $(parent).append($new);
        else
            $(parent.childNodes[index]).before($new);
        break;
    default:
        throw new Error("unexpected node type: " + parent.nodeType);
    }
    return $new;
}

function insertIntoText(text_node, index, new_element) {
    var frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode(text_node.nodeValue.slice(0, index)));
    frag.appendChild(new_element);
    frag.appendChild(document.createTextNode(text_node.nodeValue.slice(index)));
    text_node.parentNode.replaceChild(frag, text_node);
}

function nodePairFromRange(range) {
    var start_node;
    switch(range.startContainer.nodeType) {
    case Node.TEXT_NODE:
        start_node = range.startContainer.parentNode;
        break;
    case Node.ELEMENT_NODE:
        start_node = range.startContainer;
        break;
    default:
        throw new Error("unexpected node type: " + range.startContainer.nodeType);
        
    }

    var end_node;
    switch(range.endContainer.nodeType) {
    case Node.TEXT_NODE:
        end_node = range.endContainer.parentNode;
        break;
    case Node.ELEMENT_NODE:
        end_node = range.endContainer;
        break;
    default:
        throw new Error("unexpected node type: " + range.endContainer.nodeType);
    }
    return [start_node, end_node];
}

function isWellFormedRange(range) {
    var pair = nodePairFromRange(range);
    return pair[0] === pair[1];
}


function splitTextNode(text_node, index) {
    var frag = document.createDocumentFragment();
    var prev = document.createTextNode(text_node.nodeValue.slice(0, index));
    frag.appendChild(prev);
    var next = document.createTextNode(text_node.nodeValue.slice(index));
    frag.appendChild(next);
    text_node.parentNode.replaceChild(frag, text_node);
    return [prev, next];
}

function makeElement(name, attrs, empty) {
    var $e = $("<div class='" + name + " _real'>");
    if (attrs !== undefined)
    {
        // Create attributes
        var keys = Object.keys(attrs);
        for(var keys_ix = 0, key; (key = keys[keys_ix++]) !== undefined; ) {
            $e.attr(util.encodeAttrName(key), attrs[key]);
        }
    }
    if (!empty)
        $e.append("<span class='_placeholder'>&nbsp;&nbsp;&nbsp</span>");
    return $e;
}

function wrapTextInElement (node, offset, end_offset, element, attrs) {
    var original_text = node.nodeValue;
    var text_to_wrap = node.nodeValue.slice(offset, end_offset);

    // This effectively splits the text node in two.
    node.nodeValue = node.nodeValue.slice(0, offset);
    $(node).after(original_text.slice(end_offset));

    // Insert the new element
    var $new_element = makeElement(element, attrs, true);
    $new_element.append(text_to_wrap);
    $(node).after($new_element);

    return $new_element;
}

function unwrap(node) {
    var $node = $(node);
    var $parent = $node.parent();
    $node.children().remove('._gui, ._phantom, ._placeholder');
    if (node.childNodes.length === 0) {
        $node.remove();
        if ($parent.get(0).childNodes.length === 0)
            $parent.append("<span class='_placeholder'>&nbsp;&nbsp;&nbsp</span>");    
    }
    else
        $node.replaceWith(node.childNodes);
    
}

exports.TransformationRegistry = TransformationRegistry;
exports.Transformation = Transformation;
exports.wrapTextInElement = wrapTextInElement;
exports.insertElement = insertElement;
exports.isWellFormedRange = isWellFormedRange;
exports.nodePairFromRange = nodePairFromRange;
exports.splitTextNode = splitTextNode;
exports.makeElement = makeElement;
exports.insertIntoText = insertIntoText;
exports.unwrap = unwrap;

});
