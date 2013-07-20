/**
 * @module input_trigger_factory
 * @desc Functions to create input triggers according to some common patterns.
 * @author Louis-Dominique Dubeau
 */
define(/** module:input_trigger */ function (require, exports, module) {
'use strict';

var key_constants = require("./key_constants");
var input_trigger = require("./input_trigger");
var util = require("./util");
var transformation = require("./transformation");

function makeSplitMergeInputTrigger(editor, element_name, split_key,
                                    merge_with_previous_key,
                                    merge_with_next_key) {
    var ret = new input_trigger.InputTrigger(editor, element_name);
    ret.addKeyHandler(
        split_key,
        function (type, $el, ev) {
            // Prevent all further processing.
            if (ev)
                ev.stopImmediatePropagation();
            editor.fireTransformation(transformation.split_node_tr,
                                      $el.get(0));
        });

    ret.addKeyHandler(
        merge_with_previous_key,
        function (type, $el, ev) {
            var caret = editor.getDataCaret();
            // Fire it only if it the caret is at the start of the element
            // we are listening on and can't go back.
            if ((caret[1] === 0) &&
                (caret[0] === $el.get(0) ||
                 (caret[0].nodeType === Node.TEXT_NODE &&
                  caret[0] === $el.get(0).childNodes[0]))) {
                // Prevent all further processing.
                if (ev)
                    ev.stopImmediatePropagation();
                editor.fireTransformation(
                    transformation.merge_with_previous_homogeneous_sibling_tr,
                    $el.get(0));
            }
        });

    ret.addKeyHandler(
        merge_with_next_key,
        function (type, $el, ev) {
            var caret = editor.getDataCaret();
            // Fire it only if it the caret is at the end of the element
            // we are listening on and can't actually delete text.
            if ((caret[0] === $el.get(0) &&
                 caret[1] === $el.get(0).childNodes.length) ||
                (caret[0].nodeType === Node.TEXT_NODE &&
                 caret[0] === $el.get(0).lastChild &&
                 caret[1] === $el.get(0).lastChild.nodeValue.length)) {
                // Prevent all further processing.
                if (ev)
                    ev.stopImmediatePropagation();
                editor.fireTransformation(
                    transformation.merge_with_next_homogeneous_sibling_tr,
                    $el.get(0));
            }
        });
    return ret;
}

exports.makeSplitMergeInputTrigger = makeSplitMergeInputTrigger;

});
