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

var transformation = require("wed/transformation");
var insertElement = transformation.insertElement;
var makeElement = transformation.makeElement;
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
            "Create new <element_name>",
            "",
            "<i class='icon-plus icon-fixed-width'></i>",
            function (editor, data) {

            var caret = editor.getDataCaret();
            var $new = insertElement(editor.data_updater,
                                     caret.node,
                                     caret.offset,
                                     data.element_name);


            if (editor.mode._options.autoinsert) {
                _autoinsert($new, editor);

                // Move the caret to the deepest first child.
                var new_ = $new[0];
                while(new_) {
                    var child = new_.firstChild;
                    if (!child)
                        break;
                    new_ = child;
                }
                editor.setDataCaret(new_, 0);
            }
            else
                editor.setDataCaret($new[0], 0);

        });

    ret.unwrap =
        new Transformation(
            editor,
            "Unwrap the content of this element",
            undefined,
            "<i class='icon-collapse-top'></i>",
            function (editor, data) {
                var parent = data.node.parentNode;
                var index = _indexOf.call(parent.childNodes, data.node);
                unwrap(editor.data_updater, data.node);
                editor.setDataCaret(parent, index);
        });

    ret.wrap =
        new Transformation(
            editor,
            "Wrap in <element_name>",
            undefined,
            "<i class='icon-collapse'></i>",
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
            var new_ = transformation.wrapInElement(
                editor.data_updater, start_caret.node, start_caret.offset,
                end_caret.node, end_caret.offset, data.element_name)[0];
            var parent = new_.parentNode;
            editor.clearSelection();
            editor.setDataCaret(
                parent, _indexOf.call(parent.childNodes, new_) + 1);
        });


    ret["delete-element"] =
        new Transformation(
            editor,
            "Delete this element",
            undefined,
            "<i class='icon-remove icon-fixed-width'></i>",
            function (editor, data) {
            var parent = data.node.parentNode;
            var index = _indexOf.call(parent.childNodes, data.node);
            editor.data_updater.removeNode(data.node);
            editor.setDataCaret(parent, index);
        });

    ret["delete-parent"] =
        new Transformation(
            editor,
            "Delete <element_name>",
            undefined,
            "<i class='icon-remove icon-fixed-width'></i>",
            function (editor, data) {
            var parent = data.node.parentNode;
            var index = _indexOf.call(parent.childNodes, data.node);
            editor.data_updater.removeNode(data.node);
            editor.setDataCaret(parent, index);
        });

    return ret;
}

exports.makeTagTr = makeTagTr;

/**
 * Perform the autoinsertion algorithm on an element.
 *
 * @param {jQuery} $new The element that should be subject to the
 * autoinsertion algorithm.
 * @param {module:wed~Editor} editor The editor which own the element.
 */
function _autoinsert($new, editor) {
    while(true) {
        var errors = editor.validator.getErrorsFor($new[0]);

        errors = errors.filter(function (err) {
            var err_msg = err.error.toString();
            return err_msg.lastIndexOf("tag required: ", 0) ===
                0;
        });

        if (errors.length === 0)
            break;

        var ename = errors[0].error.getNames()[0];

        var locations = editor.validator.possibleWhere(
            $new[0],
            new validate.Event("enterStartTag", ename.ns, ename.name));

        if (locations.length !== 1)
            break;

        var name = editor.resolver.unresolveName(ename.ns, ename.name);
        var actions = editor.mode.getContextualActions("insert", name,
                                                       $new[0],
                                                       locations[0]);
        if (actions.length !== 1)
            break;

        if (actions[0].needs_input)
            break;

        //
        // We move the caret ourselves rather than using
        // move_caret_to. In this context, it does not matter because
        // autoinsert is meant to be called by a transformation
        // anyway.
        //
        editor.setDataCaret(dloc.makeDLoc(dloc.getRoot($new), $new,
                                          locations[0]));
        actions[0].execute({
            element_name: name
        });
    }
}

});

//  LocalWords:  TransformationRegistry oop wundo util domutil jquery
//  LocalWords:  Mangalam MPL Dubeau
