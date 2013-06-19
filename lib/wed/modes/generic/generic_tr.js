define(function (require, exports, module) {
'use strict';

var $ = require("jquery");
var domutil = require("wed/domutil");
var util = require("wed/util");
var Undo = require("wed/wundo").Undo;

var transformation = require("wed/transformation");
var insertElement = transformation.insertElement;
var isWellFormedRange = transformation.isWellFormedRange;
var nodePairFromRange = transformation.nodePairFromRange;
var splitTextNode = transformation.splitTextNode;
var makeElement = transformation.makeElement;
var insertIntoText = transformation.insertIntoText;
var Transformation = transformation.Transformation;
var unwrap = transformation.unwrap;

var tr = new transformation.TransformationRegistry();

tr.addTagTransformations(
    "insert",
    "*",
    new Transformation(
        "Create new <element_name>",
        function (editor, node, element_name) {
            var caret = editor.getCaret();
            var $new = insertElement(editor,
                                     caret[0],
                                     caret[1],
                                     element_name);
            editor.setCaret($new.get(0), 0, true);
        }));

tr.addTagTransformations(
    "unwrap",
    "*",
    new Transformation(
        "Unwrap",
        function (editor, node, element_name) {
            var parent = node.parentNode;
            var index = Array.prototype.indexOf.call(parent.childNodes, node);
            unwrap(node);
            editor.setCaret(parent, index);
        }));



exports.tr = tr;
});
