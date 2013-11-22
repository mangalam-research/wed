/**
 * @module input_trigger_factory
 * @desc Functions to create input triggers according to some common patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:input_trigger_factory */
function (require, exports, module) {
'use strict';

var key_constants = require("./key_constants");
var input_trigger = require("./input_trigger");
var util = require("./util");
var jqutil = require("./jqutil");
var $ = require("jquery");
var domutil = require("./domutil");
var transformation = require("./transformation");

/**
 * Makes an input trigger that splits and merges consecutive elements.
 * memberof module:input_trigger_factory
 * @param {module:wed~Editor} editor The editor for which to create
 * the input trigger.
 * @param {string} element_name A jQuery selector that determines
 * which element we want to split or merge. For instance, to operate
 * on all paragraphs, this parameter could be <code>"p"</code>.
 * @param {module:key~Key} split_key The key which splits the element.
 * @param {module:key~Key} merge_with_previous_key The key which
 * merges the element with its previous sibling.
 * @param {module:key~Key} merge_with_next_key The key which merges
 * the element with its next sibling.
 * @returns {module:input_trigger~InputTrigger} The input trigger.
 */
exports.makeSplitMergeInputTrigger = function makeSplitMergeInputTrigger(editor, element_name, split_key,
                                    merge_with_previous_key,
                                    merge_with_next_key) {


    var split_node_on_tr = new transformation.Transformation(
        editor, "Split node on character", split_node_on);

    var ret = new input_trigger.InputTrigger(editor, element_name);
    ret.addKeyHandler(
        split_key,
        function (type, $el, ev) {
        if (ev) {
            ev.stopImmediatePropagation();
            ev.preventDefault();
        }
        if (type === "keypress" ||
            type === "keydown")
            editor.fireTransformation(editor.split_node_tr,
                                      {node: $el.get(0)});
        else
            editor.fireTransformation(
                split_node_on_tr,
                {node: $el.get(0),
                 sep: String.fromCharCode(split_key.which)});
    });

    ret.addKeyHandler(
        merge_with_previous_key,
        function (type, $el, ev) {
        var caret = editor.getDataCaret();

        if (!caret)
            return;

        // Fire it only if it the caret is at the start of the element
        // we are listening on and can't go back.
        if ((caret[1] === 0) &&
            (caret[0] === $el.get(0) ||
             (caret[0].nodeType === Node.TEXT_NODE &&
              caret[0] === $el.get(0).childNodes[0]))) {
            if (ev) {
                ev.stopImmediatePropagation();
                ev.preventDefault();
            }
            editor.fireTransformation(
                editor.merge_with_previous_homogeneous_sibling_tr,
                {node: $el.get(0), element_name: $el.get(0).tagName});
        }
    });

    ret.addKeyHandler(
        merge_with_next_key,
        function (type, $el, ev) {
        var caret = editor.getDataCaret();

        if (!caret)
            return;

        // Fire it only if it the caret is at the end of the element
        // we are listening on and can't actually delete text.
        if ((caret[0] === $el.get(0) &&
             caret[1] === $el.get(0).childNodes.length) ||
            (caret[0].nodeType === Node.TEXT_NODE &&
             caret[0] === $el.get(0).lastChild &&
             caret[1] === $el.get(0).lastChild.nodeValue.length)) {
            if (ev) {
                ev.stopImmediatePropagation();
                ev.preventDefault();
            }
            editor.fireTransformation(
                editor.merge_with_next_homogeneous_sibling_tr,
                $el.get(0));
        }
    });
    return ret;
}

/**
 * A transformation handler for a node splitting transformation.
 *
 * @private
 * @param {module:wed~Editor} editor The editor which invoked the
 * transformation.
 * @param {string} data The key that is splitting the element.
 * @throws {Error} If the data passed is incorrect.
 */
function split_node_on(editor, data) {
    var node = data.node;
    var sep = data.sep;
    if (typeof(sep) !== "string" || sep.length !== 1)
        throw new Error("transformation invoked with incorrect data");
    var modified = true;
    while(modified) {
        modified = false;
        var $node = $(node);
        var text_nodes = $node.contents().filter(jqutil.textFilter).toArray();
        for (var i = 0; !modified && i < text_nodes.length; ++i) {
            var text = text_nodes[i];
            var offset = text.nodeValue.indexOf(sep);
            if (node.firstChild === text && offset === 0) {
                // We just drop the separator
                editor.data_updater.deleteText(text, offset, 1);
                modified = true;
            }
            else if (node.lastChild === text &&
                     offset !== -1 &&
                     offset === text.nodeValue.length - 1) {
                // Just drop the separator
                editor.data_updater.deleteText(text,
                                               text.nodeValue.length - 1, 1);
                modified = true;
            }
            else if (offset !== -1) {
                var pair = editor.data_updater.splitAt(node, [text, offset]);
                // Continue with the 2nd half of the split
                node = pair[1];
                modified = true;
            }
        }
    }
    // Find the deepest location at the start of the last
    // element.
    editor.setDataCaret(domutil.firstDescendantOrSelf(node), 0);
}

//exports.makeSplitMergeInputTrigger = makeSplitMergeInputTrigger;

});

//  LocalWords:  Mangalam MPL Dubeau lastChild deleteText domutil
//  LocalWords:  keypress keydown jquery jqutil util jQuery
//  LocalWords:  InputTrigger
