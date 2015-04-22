/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013-2015 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed */function (require, exports, module) {
'use strict';

//
// We already have domutil and util so why this module? It combines
// those functions that are really part of wed but are not meant to be
// used outside the Editor class itself. domutil is meant to encompass
// those functions that could be used in other contexts and are about
// the DOM. util is meant to encompass those functions that do not
// depend on having a browser available.
//

var makeDLoc = require("./dloc").makeDLoc;
var domutil = require("./domutil");
var closestByClass = domutil.closestByClass;

var _indexOf = Array.prototype.indexOf;

function boundaryXY(boundary) {
    var node = boundary.node;
    var offset = boundary.offset;
    var node_type = node.nodeType;

    // The node is empty ...
    if (((node_type === Node.ELEMENT_NODE) && (node.childNodes.length === 0)) ||
        ((node_type === Node.TEXT_NODE) && (node.length === 0))) {
        var parent = node.parentNode;
        return boundaryXY(makeDLoc(boundary.root,
                                   parent,
                                   _indexOf.call(parent.childNodes, node)));
    }

    var range = node.ownerDocument.createRange();
    var rect;
    if (((node_type === Node.ELEMENT_NODE) &&
         (offset < node.childNodes.length)) ||
        ((node_type === Node.TEXT_NODE) && (offset < node.length))) {
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        rect = range.getBoundingClientRect();
        return {left: rect.left, top: rect.top};
    }

    // If it is not empty, and offset is at the end of the
    // contents, then there must be something *before* the point
    // indicated by offset. Get a rectangle around that and return
    // the right side as the left value.
    range.setStart(node, offset - 1);
    range.setEnd(node, offset);
    rect = range.getBoundingClientRect();
    // Yep, we use the right side...
    return {left: rect.right, top: rect.top};
}

exports.boundaryXY = boundaryXY;

function getAttrValueNode(attr_val) {
    if (!attr_val.classList ||
        !attr_val.classList.contains("_attribute_value"))
        throw new Error("getAttrValueNode operates only on attribute values");

    var ret = attr_val;

    var child = attr_val.firstChild;
    if (child) {
        while(child && child.nodeType !== Node.TEXT_NODE)
            child = child.nextSibling;

        if (child)
            ret = child;
    }

    return ret;
}

exports.getAttrValueNode = getAttrValueNode;

function cut(editor, data) {
    var range = editor._getDOMSelectionRange();
    if (!domutil.isWellFormedRange(range))
        throw new Error("malformed range");

    var start_caret = editor.toDataLocation(range.startContainer,
                                            range.startOffset);
    var end_caret = editor.toDataLocation(range.endContainer, range.endOffset);
    while(editor._cut_buffer.firstChild)
        editor._cut_buffer.removeChild(editor._cut_buffer.firstChild);
    if (start_caret.node instanceof editor.my_window.Attr) {
        var attr = start_caret.node;
        if (attr !== end_caret.node)
            throw new Error("attribute selection that does not start " +
                            "and end in the same attribute");
        var removed_text = attr.value.slice(start_caret.offset,
                                            end_caret.offset);
        editor._spliceAttribute(
            closestByClass(editor.fromDataLocation(start_caret).node,
                           "_attribute_value", range.startContainer),
            start_caret.offset,
            end_caret.offset - start_caret.offset, '');
        editor._cut_buffer.textContent = removed_text;
    }
    else {
        var cut_ret = editor.data_updater.cut(start_caret, end_caret);
        var nodes = cut_ret[1];
        var parser = new editor.my_window.DOMParser();
        var doc = parser.parseFromString("<div></div>", "text/xml");
        for(var i = 0, limit = nodes.length; i < limit; ++i)
            doc.firstChild.appendChild(nodes[i]);
        editor._cut_buffer.textContent = doc.firstChild.innerHTML;
        editor.setDataCaret(cut_ret[0]);
    }

    range = editor.my_window.document.createRange();
    var container = editor._cut_buffer;
    range.setStart(container, 0);
    range.setEnd(container,  container.childNodes.length);
    var sel = editor.my_window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // We've set the range to the cut buffer, which is what we want
    // for the cut operation to work. However, the focus is also set
    // to the cut buffer but once the cut is done we want the focus to
    // be back to our caret, so...
    setTimeout(function () {
        editor._focusInputField();
    }, 0);
}

exports.cut = cut;

function paste(editor, data) {
    var to_paste = data.to_paste;
    var data_clone = to_paste.cloneNode(true);
    var caret = editor.getDataCaret();
    var new_caret, ret;

    // Handle the case where we are pasting only text.
    if (to_paste.childNodes.length === 1 &&
        to_paste.firstChild.nodeType === Node.TEXT_NODE) {
        if (caret.node.nodeType === Node.ATTRIBUTE_NODE) {
            var gui_caret = editor.getGUICaret();
            editor._spliceAttribute(
                closestByClass(gui_caret.node, "_attribute_value",
                               gui_caret.node),
                gui_caret.offset, 0,
                to_paste.firstChild.data);
        }
        else {
            ret = editor.data_updater.insertText(
                caret, to_paste.firstChild.data);
            // In the first case, the node that contained the caret
            // was modified to contain the text. In the 2nd case, a
            // new node was created **or** the text that contains the
            // text is a child of the original node.
            new_caret = ((ret[0] === ret[1]) &&
                         (ret[1] === caret.node)) ?
                caret.make(caret.node,
                           caret.offset + to_paste.firstChild.length) :
                caret.make(ret[1], ret[1].length);
        }
    }
    else {
        var frag = document.createDocumentFragment();
        while(to_paste.firstChild)
            frag.appendChild(to_paste.firstChild);
        switch(caret.node.nodeType) {
        case Node.TEXT_NODE:
            var parent = caret.node.parentNode;
            ret = editor.data_updater.insertIntoText(caret, frag);
            new_caret = ret[1];
            break;
        case Node.ELEMENT_NODE:
            var child = caret.node.childNodes[caret.offset];
            var after =  child ? child.nextSibling : null;
            editor.data_updater.insertBefore(caret.node, frag, child);
            new_caret = caret.make(caret.node,
                                   after ? _indexOf.call(caret.node.childNodes,
                                                         after) :
                                   caret.node.childNodes.length);
            break;
        default:
            throw new Error("unexpected node type: " + caret.node.nodeType);
        }
    }
    if (new_caret) {
        editor.setDataCaret(new_caret);
        caret = new_caret;
    }
    editor.$gui_root.trigger('wed-post-paste', [data.e, caret, data_clone]);
}

exports.paste = paste;

});
