define(function (require, exports, module) {
'use strict';

var $ = require("jquery");
var domutil = require("wed/domutil");
var util = require("wed/util");

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
            return insertElement(editor, 
                                 caret[0], 
                                 caret[1], 
                                 element_name); 
        }));

tr.addTagTransformations(
    "unwrap", 
    "*",
    new Transformation(
        "Unwrap",
        function (editor, node, element_name) {
            unwrap(node);
        }));

                             

exports.tr = tr;
});
