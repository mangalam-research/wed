/**
 * @module input_trigger_factory
 * @desc Functions to create input triggers according to some common patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:input_trigger_factory */ function f(require, exports) {
  "use strict";

  var input_trigger = require("./input_trigger");
  var domutil = require("./domutil");
  var transformation = require("./transformation");

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
    if (typeof (sep) !== "string" || sep.length !== 1) {
      throw new Error("transformation invoked with incorrect data");
    }
    var modified = true;
    while (modified) {
      modified = false;
      var text_nodes = [];
      var child = node.firstChild;
      while (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          text_nodes.push(child);
        }
        child = child.nextSibling;
      }

      for (var i = 0; !modified && i < text_nodes.length; ++i) {
        var text = text_nodes[i];
        var offset = text.data.indexOf(sep);
        if (node.firstChild === text && offset === 0) {
          // We just drop the separator
          editor.data_updater.deleteText(text, offset, 1);
          modified = true;
        }
        else if (node.lastChild === text &&
                 offset !== -1 &&
                 offset === text.length - 1) {
          // Just drop the separator
          editor.data_updater.deleteText(text,
                                         text.length - 1, 1);
          modified = true;
        }
        else if (offset !== -1) {
          var pair = editor.data_updater.splitAt(node, text, offset);
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

  /**
   * Makes an input trigger that splits and merges consecutive elements.
   * @param {module:wed~Editor} editor The editor for which to create
   * the input trigger.
   * @param {string} element_name A CSS selector that determines
   * which element we want to split or merge. For instance, to operate
   * on all paragraphs, this parameter could be <code>"p"</code>.
   * @param {module:key~Key} split_key The key which splits the element.
   * @param {module:key~Key} merge_with_previous_key The key which
   * merges the element with its previous sibling.
   * @param {module:key~Key} merge_with_next_key The key which merges
   * the element with its next sibling.
   * @returns {module:input_trigger~InputTrigger} The input trigger.
   */
  function makeSplitMergeInputTrigger(editor, element_name, split_key,
                                      merge_with_previous_key,
                                      merge_with_next_key) {
    var split_node_on_tr = new transformation.Transformation(
      editor, "split", "Split node on character", split_node_on);

    var ret = new input_trigger.InputTrigger(editor, element_name);
    ret.addKeyHandler(
      split_key,
      function splitHandler(type, el, ev) {
        if (ev) {
          ev.stopImmediatePropagation();
          ev.preventDefault();
        }
        if (type === "keypress" ||
            type === "keydown") {
          editor.fireTransformation(editor.split_node_tr, { node: el });
        }
        else {
          editor.fireTransformation(
            split_node_on_tr,
            { node: el, sep: String.fromCharCode(split_key.which) });
        }
      });

    ret.addKeyHandler(
      merge_with_previous_key,
      function mergeWithPreviousHandler(type, el, ev) {
        var caret = editor.getDataCaret();

        if (!caret) {
          return;
        }

        // Fire it only if it the caret is at the start of the element
        // we are listening on and can't go back.
        if ((caret.offset === 0) &&
            (caret.node === el ||
             (caret.node.nodeType === Node.TEXT_NODE &&
              caret.node === el.firstChild))) {
          if (ev) {
            ev.stopImmediatePropagation();
            ev.preventDefault();
          }
          editor.fireTransformation(
            editor.merge_with_previous_homogeneous_sibling_tr,
            { node: el, name: el.tagName });
        }
      });

    ret.addKeyHandler(
      merge_with_next_key,
      function mergeWithNextHandler(type, el, ev) {
        var caret = editor.getDataCaret();

        if (!caret) {
          return;
        }

        // Fire it only if it the caret is at the end of the element
        // we are listening on and can't actually delete text.
        if ((caret.node === el && caret.offset === el.childNodes.length) ||
            (caret.node.nodeType === Node.TEXT_NODE &&
             caret.node === el.lastChild &&
             caret.offset === el.lastChild.length)) {
          if (ev) {
            ev.stopImmediatePropagation();
            ev.preventDefault();
          }
          editor.fireTransformation(
            editor.merge_with_next_homogeneous_sibling_tr,
            { node: el, name: el.tagName });
        }
      });
    return ret;
  }


  exports.makeSplitMergeInputTrigger = makeSplitMergeInputTrigger;
});

//  LocalWords:  Mangalam MPL Dubeau lastChild deleteText domutil
//  LocalWords:  keypress keydown util
//  LocalWords:  InputTrigger
