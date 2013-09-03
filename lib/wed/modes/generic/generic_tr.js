define(function (require, exports, module) {
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
                editor.setDataCaret($new.get(0), 0, true);
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
