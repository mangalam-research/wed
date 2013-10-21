/**
 * @module input_trigger_factory
 * @desc Functions to create input triggers according to some common patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:input_trigger_factory */ function (require, exports, module) {
'use strict';

var key_constants = require("./key_constants");
var input_trigger = require("./input_trigger");
var util = require("./util");
var jqutil = require("./jqutil");
var $ = require("jquery");
var domutil = require("./domutil");
var transformation = require("./transformation");

/**
 * TBA
 * @param {module:wed~Editor} editor TBA
 * @param {TBA} element_name TBA
 * @param {TBA} split_key TBA
 * @param {TBA} merge_with_previous_key TBA
 * @param {TBA} merge_with_next_key TBA
 * @returns {TBA} TBA
*/
function makeSplitMergeInputTrigger(editor, element_name, split_key,
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
                                      $el.get(0), undefined,
                                      {element_name: $el.get(0).tagName});
        else
            editor.fireTransformation(split_node_on_tr, $el.get(0), undefined,
                                      String.fromCharCode(split_key.which));
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
                $el.get(0), {element_name: $el.get(0).tagName});
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
 * TBA
 *
 * @param {module:wed~Editor} editor TBA
 * @param {Node} node TBA
 * @param {TBA} element_name TBA
 * @param {TBA} data TBA
 * @throws {Error} TBA
*/
function split_node_on(editor, node, element_name, data) {
    if (typeof(data) !== "string" || data.length !== 1)
        throw new Error("transformation invoked with incorrect data");
    var modified = true;
    while(modified) {
        modified = false;
        var $node = $(node);
        var text_nodes = $node.contents().filter(jqutil.textFilter).toArray();
        for (var i = 0; !modified && i < text_nodes.length; ++i) {
            var text = text_nodes[i];
            var offset = text.nodeValue.indexOf(data);
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

exports.makeSplitMergeInputTrigger = makeSplitMergeInputTrigger;

});

//  LocalWords:  InputTrigger jQuery util jqutil jquery hashstructs
//  LocalWords:  keydown tabindex keypress submap focusable

//  LocalWords:  domutil jquery util whitespace pathToNode nodeToPath
//  LocalWords:  contenteditable abcd abfoocd cd insertIntoText lt
//  LocalWords:  Prepend deleteText jQuery getSelectionRange prev
//  LocalWords:  lastChild makeCutFunction deleteNode mergeTextNodes
//  LocalWords:  jshint validthis insertNodeAt insertFragAt versa

//  LocalWords:  domlistener jquery findandself lt ul li nextSibling
//  LocalWords:  MutationObserver previousSibling jQuery LocalWords
// LocalWords:  Dubeau MPL Mangalam jquery validator util domutil oop
// LocalWords:  domlistener wundo jqutil gui onerror mixins html DOM
// LocalWords:  jQuery href sb nav ul li navlist errorlist namespaces
// LocalWords:  contenteditable Ok Ctrl listDecorator tabindex nbsp
// LocalWords:  unclick enterStartTag unlinks startContainer dropdown
// LocalWords:  startOffset endContainer endOffset mousedown
// LocalWords:  setTextNodeValue
