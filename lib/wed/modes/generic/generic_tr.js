/**
 * @module modes/generic/generic_tr
 * @desc Transformation registry for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic_tr */
function (require, exports, module) {
'use strict';

var validate = require("salve/validate");
var dloc = require("wed/dloc");
var icon = require("wed/gui/icon");
var util = require("wed/util");

var transformation = require("wed/transformation");
var insertElement = transformation.insertElement;
var Transformation = transformation.Transformation;
var unwrap = transformation.unwrap;

var _indexOf = Array.prototype.indexOf;

/**
 * @param {module:wed~Editor} editor The editor for which to create
 * transformations.
 */
function makeTagTr(editor) {
    var ret = {};
    ret.insert =
        new Transformation(
            editor,
            "insert",
            "Create new <name>",
            "",
            function (editor, data) {

            var caret = editor.getDataCaret();
            var ename =
                editor.mode.getAbsoluteResolver().resolveName(data.name);
            var el = insertElement(editor.data_updater, caret.node,
                                   caret.offset, ename.ns, data.name);

            if (editor.mode._options.autoinsert) {
                _autoinsert(el, editor);

                // Set el to the deepest first child, so that the
                // caret is put in the right position.
                while(el) {
                    var child = el.firstChild;
                    if (!child)
                        break;
                    el = child;
                }
            }
            editor.setDataCaret(el, 0);

        });

    ret.unwrap =
        new Transformation(
            editor,
            "unwrap",
            "Unwrap the content of this element",
            undefined,
            function (editor, data) {
                var parent = data.node.parentNode;
                var index = _indexOf.call(parent.childNodes, data.node);
                unwrap(editor.data_updater, data.node);
                editor.setDataCaret(parent, index);
        });

    ret.wrap =
        new Transformation(
            editor,
            "wrap",
            "Wrap in <name>",
            undefined,
            function (editor, data) {
            var range = editor.getSelectionRange();
            if (!range)
                throw new Error("wrap transformation called with " +
                                "undefined range");

            if (range.collapsed)
                throw new Error("wrap transformation called with " +
                                "collapsed range");
            var start_caret = editor.toDataLocation(range.startContainer,
                                                    range.startOffset);
            var end_caret = editor.toDataLocation(range.endContainer,
                                                  range.endOffset);
            var ename =
                editor.mode.getAbsoluteResolver().resolveName(data.name);
            var el = transformation.wrapInElement(
                editor.data_updater, start_caret.node, start_caret.offset,
                end_caret.node, end_caret.offset, ename.ns, data.name);
            var parent = el.parentNode;
            editor.setDataCaret(
                parent, _indexOf.call(parent.childNodes, el) + 1);
        });


    ret["delete-element"] =
        new Transformation(
            editor,
            "delete-element",
            "Delete this element",
            undefined,
            function (editor, data) {
            var parent = data.node.parentNode;
            var index = _indexOf.call(parent.childNodes, data.node);
            editor.data_updater.removeNode(data.node);
            editor.setDataCaret(parent, index);
        });

    ret["delete-parent"] =
        new Transformation(
            editor,
            "delete-parent",
            "Delete <name>",
            undefined,
            function (editor, data) {
            var parent = data.node.parentNode;
            var index = _indexOf.call(parent.childNodes, data.node);
            editor.data_updater.removeNode(data.node);
            editor.setDataCaret(parent, index);
        });

    ret["add-attribute"] =
        new Transformation(
            editor,
            "add-attribute",
            "Add @<name>",
            undefined,
            function (editor, data) {
            var node = data.node;
            var encoded = util.encodeAttrName(data.name);
            editor.data_updater.setAttribute(node, encoded, "");
            var attr = node.getAttributeNode(encoded);
            editor.setDataCaret(attr, 0);
        });

    ret["delete-attribute"] =
        new Transformation(
            editor,
            "delete-attribute",
            "Delete this attribute",
            undefined,
            function (editor, data) {
            var node = data.node;
            var encoded = node.name;
            var element = node.ownerElement;
            var index = _indexOf.call(element.attributes, node);
            editor.data_updater.setAttribute(element, encoded, null);
            // We set the caret inside the next attribute, or if it
            // does not exist, inside the
            var attr = element.attributes[index];
            if (attr)
                editor.setDataCaret(attr, 0);
            else {
                var gui_loc = editor.fromDataLocation(element, 0);
                editor.setGUICaret(
                    gui_loc.node.getElementsByClassName("_element_name")[0], 0);
            }
        });

    ret["insert-text"] =
        new Transformation(
            editor,
            "insert-text",
            'Insert "<name>"',
            undefined,
            function (editor, data) {
            editor.type(data.name);
        });

    return ret;
}

exports.makeTagTr = makeTagTr;

function err_filter(err) {
    var err_msg = err.error.toString();
    return err_msg.lastIndexOf("tag required: ", 0) === 0;
}

/**
 * Perform the autoinsertion algorithm on an element.
 *
 * @param {Node} el The element that should be subject to the
 * autoinsertion algorithm.
 * @param {module:wed~Editor} editor The editor which own the element.
 */
function _autoinsert(el, editor) {
    while(true) {
        var errors = editor.validator.getErrorsFor(el);

        errors = errors.filter(err_filter);
        if (errors.length === 0)
            break;

        var ename = errors[0].error.getNames()[0];

        var locations = editor.validator.possibleWhere(
            el, new validate.Event("enterStartTag", ename.ns, ename.name));

        if (locations.length !== 1)
            break;

        var name = editor.resolver.unresolveName(ename.ns, ename.name);
        var actions = editor.mode.getContextualActions("insert", name,
                                                       el, locations[0]);

        // Don't auto insert if it happens that the operation would be
        // ambiguous (ie. if there is more than one way to insert the
        // element).
        if (actions.length !== 1)
            break;

        // Don't auto insert if the operation needs input from the
        // user.
        if (actions[0].needs_input)
            break;

        //
        // We move the caret ourselves rather than using
        // move_caret_to. In this context, it does not matter because
        // autoinsert is meant to be called by a transformation
        // anyway.
        //
        editor.setDataCaret(dloc.makeDLoc(dloc.getRoot(el), el, locations[0]));
        actions[0].execute({ name: name });
    }
}

});

//  LocalWords:  TransformationRegistry Mangalam MPL Dubeau
