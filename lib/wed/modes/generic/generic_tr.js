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

var $ = require("jquery");
var domutil = require("wed/domutil");
var util = require("wed/util");
var Undo = require("wed/wundo").Undo;
var oop = require("wed/oop");
var validate = require("salve/validate");
var dloc = require("wed/dloc");

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
            function (editor, data) {

            var caret = editor.getDataCaret();
            var $new = insertElement(editor.data_updater,
                                     caret.node,
                                     caret.offset,
                                     data.element_name);


            var $container =  (editor.mode._options.autoinsert) ?
                _fillRecursively($new, editor) : $new;

            editor.setDataCaret($container[0], 0);

            }.bind(this)));

    this.addTagTransformations(
        "unwrap",
        "*",
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
        }));

    this.addTagTransformations(
        "wrap",
        "*",
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
            var $new = transformation.wrapInElement(
                editor.data_updater, start_caret.node, start_caret.offset,
                end_caret.node, end_caret.offset, data.element_name);
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
            function (editor, data) {
            var parent = data.node.parentNode;
            var index = _indexOf.call(parent.childNodes, data.node);
            editor.data_updater.removeNode(data.node);
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
            function (editor, data) {
            var parent = data.node.parentNode;
            var index = _indexOf.call(parent.childNodes, data.node);
            editor.data_updater.removeNode(data.node);
            editor.setDataCaret(parent, index);
        }));
}

function _fillRecursively($new, editor) {
    var $ret = $new;

    var first = true;

    while(true) {
        var errors = editor.validator.getErrorsFor($new[0]);

        errors = errors.filter(function (err) {
            var err_msg = err.error.toString();
            return err_msg.lastIndexOf("tag required: ", 0) ===
                0;
        });

        if (errors.length !== 1)
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

        actions[0].execute({
            move_caret_to: dloc.makeDLoc(dloc.getRoot($new), $new,
                                         locations[0]),
            element_name: name
        });

        var $child = $($new[0].childNodes[locations[0]]);

        // var $child = insertElement(
        //     editor.data_updater,
        //     $new[0],
        //     locations[0],
        //     name);

        var $container = _fillRecursively($child, editor);

        if (first) {
            $ret = $container;
            first = false;
        }
    }

    return $ret;
}

oop.inherit(Registry, transformation.TransformationRegistry);


exports.Registry = Registry;
});

//  LocalWords:  TransformationRegistry oop wundo util domutil jquery
//  LocalWords:  Mangalam MPL Dubeau
