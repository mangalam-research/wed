/**
 * @module modes/generic/generic_tr
 * @desc Transformation registry for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic_tr */
function (require, exports, module) {
'use strict';

var $ = require("jquery");
var domutil = require("wed/domutil");
var util = require("wed/util");
var Undo = require("wed/wundo").Undo;
var oop = require("wed/oop");

var transformation = require("wed/transformation");
var insertElement = transformation.insertElement;
var makeElement = transformation.makeElement;
var Transformation = transformation.Transformation;
var unwrap = transformation.unwrap;

var _indexOf = Array.prototype.indexOf;

/**
 * @classdesc A transformation registry for the generic mode.
 * @extends module:transformation~TransformationRegistry
 *
 * @constructor
 * @param {module:wed~Editor} editor The editor to which this registry
 * applies.
 */
function Registry(editor) {
    transformation.TransformationRegistry.call(this);
    this.addTagTransformations(
        "insert",
        "*",
        new Transformation(
            editor,
            "Create new <element_name>",
            "",
            "<i class='icon-plus icon-fixed-width'></i>",
            function (editor, node, element_name) {
                var caret = editor.getDataCaret();
                var $new = insertElement(editor.data_updater,
                                         caret[0],
                                         caret[1],
                                         element_name);
                editor.setDataCaret($new.get(0), 0);
            }.bind(this)));

    this.addTagTransformations(
        "unwrap",
        "*",
        new Transformation(
            editor,
            "Unwrap the content of this element",
            undefined,
            "<i class='icon-collapse-top'></i>",
            function (editor, node, element_name) {
                var parent = node.parentNode;
                var index = _indexOf.call(parent.childNodes, node);
                unwrap(editor.data_updater, node);
                editor.setDataCaret(parent, index);
        }));

    this.addTagTransformations(
        "wrap",
        "*",
        new Transformation(
            editor,
            "Wrap in <element_name>",
            undefined,
            "<i class='icon-collapse'></i>",
            function (editor, node, element_name) {
            var range = editor.getSelectionRange();
            if (!range)
                throw new Error("wrap transformation called with " +
                                "undefined range");

            if (range.collapsed)
                throw new Error("wrap transformation called with " +
                                "collapsed range");
            var start_caret = editor.toDataCaret(range.startContainer,
                                                 range.startOffset);
            var end_caret = editor.toDataCaret(range.endContainer,
                                               range.endOffset);
            var $new = transformation.wrapInElement(
                editor.data_updater, start_caret[0], start_caret[1],
                end_caret[0], end_caret[1], element_name);
            var parent = $new.parent()[0];
            editor.clearSelection();
            editor.setDataCaret(
                parent, _indexOf.call(parent.childNodes, $new[0]) + 1);
        }));


    this.addTagTransformations(
        "delete-element",
        "*",
        new Transformation(
            editor,
            "Delete this element",
            undefined,
            "<i class='icon-remove icon-fixed-width'></i>",
            function (editor, node, element_name) {
            var parent = node.parentNode;
            var index = _indexOf.call(parent.childNodes, node);
            editor.data_updater.removeNode(node);
            editor.setDataCaret(parent, index);
        }));

    this.addTagTransformations(
        "delete-parent",
        "*",
        new Transformation(
            editor,
            "Delete <element_name>",
            undefined,
            "<i class='icon-remove icon-fixed-width'></i>",
            function (editor, node, element_name) {
            var parent = node.parentNode;
            var index = _indexOf.call(parent.childNodes, node);
            editor.data_updater.removeNode(node);
            editor.setDataCaret(parent, index);
        }));
}

oop.inherit(Registry, transformation.TransformationRegistry);


exports.Registry = Registry;
});

//  LocalWords:  TransformationRegistry oop wundo util domutil jquery
//  LocalWords:  Mangalam MPL Dubeau
