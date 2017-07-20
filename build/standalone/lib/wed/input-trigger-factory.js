/**
 * Functions to create input triggers according to some common patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "./domtypeguards", "./domutil", "./input-trigger", "./transformation"], function (require, exports, module, domtypeguards_1, domutil, input_trigger_1, transformation) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A transformation handler for a node splitting transformation.
     *
     * @param editor The editor which invoked the transformation.
     *
     * @param data The key that is splitting the element.
     *
     * @throws {Error} If the data passed is incorrect.
     */
    function splitNodeOn(editor, data) {
        var node = data.node;
        var sep = data.sep;
        if (typeof sep !== "string" || sep.length !== 1) {
            throw new Error("transformation invoked with incorrect data");
        }
        var modified = true;
        while (modified) {
            modified = false;
            var textNodes = [];
            var child = node.firstChild;
            while (child !== null) {
                if (domtypeguards_1.isText(child)) {
                    textNodes.push(child);
                }
                child = child.nextSibling;
            }
            for (var i = 0; !modified && i < textNodes.length; ++i) {
                var text = textNodes[i];
                var offset = text.data.indexOf(sep);
                if (node.firstChild === text && offset === 0) {
                    // We just drop the separator
                    editor.data_updater.deleteText(text, offset, 1);
                    modified = true;
                }
                else if (node.lastChild === text && offset !== -1 &&
                    offset === text.length - 1) {
                    // Just drop the separator
                    editor.data_updater.deleteText(text, text.length - 1, 1);
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
        // Find the deepest location at the start of the last element.
        editor.caretManager.setCaret(domutil.firstDescendantOrSelf(node), 0);
    }
    /**
     * Makes an input trigger that splits and merges consecutive elements.
     *
     * @param editor The editor for which to create the input trigger.
     *
     * @param elementName A CSS selector that determines which element we want to
     * split or merge. For instance, to operate on all paragraphs, this parameter
     * could be ``"p"``.
     *
     * @param splitKey The key which splits the element.
     *
     * @param mergeWithPreviousKey The key which merges the element with its
     * previous sibling.
     *
     * @param mergeWithNextKey The key which merges the element with its next
     * sibling.
     *
     * @returns The input trigger.
     */
    function makeSplitMergeInputTrigger(editor, elementName, splitKey, mergeWithPreviousKey, mergeWithNextKey) {
        var splitNodeOnTr = new transformation.Transformation(editor, "split", "Split node on character", splitNodeOn);
        var ret = new input_trigger_1.InputTrigger(editor, elementName);
        ret.addKeyHandler(splitKey, function (eventType, el, ev) {
            if (ev !== undefined) {
                ev.stopImmediatePropagation();
                ev.preventDefault();
            }
            if (eventType === "keypress" || eventType === "keydown") {
                editor.fireTransformation(editor.split_node_tr, { node: el });
            }
            else {
                editor.fireTransformation(splitNodeOnTr, { node: el, sep: String.fromCharCode(splitKey.which) });
            }
        });
        ret.addKeyHandler(mergeWithPreviousKey, function (eventType, el, ev) {
            var caret = editor.caretManager.getDataCaret();
            if (caret == null) {
                return;
            }
            // Fire it only if it the caret is at the start of the element we are
            // listening on and can't go back.
            if ((caret.offset === 0) &&
                (caret.node === el ||
                    (domtypeguards_1.isText(caret.node) && caret.node === el.firstChild))) {
                if (ev !== undefined) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                }
                editor.fireTransformation(editor.merge_with_previous_homogeneous_sibling_tr, { node: el, name: el.tagName });
            }
        });
        ret.addKeyHandler(mergeWithNextKey, function (eventType, el, ev) {
            var caret = editor.caretManager.getDataCaret();
            if (caret == null) {
                return;
            }
            // Fire it only if it the caret is at the end of the element we are
            // listening on and can't actually delete text.
            if ((caret.node === el && caret.offset === el.childNodes.length) ||
                (domtypeguards_1.isText(caret.node) &&
                    caret.node === el.lastChild &&
                    caret.offset === el.lastChild.length)) {
                if (ev !== undefined) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                }
                editor.fireTransformation(editor.merge_with_next_homogeneous_sibling_tr, { node: el, name: el.tagName });
            }
        });
        return ret;
    }
    exports.makeSplitMergeInputTrigger = makeSplitMergeInputTrigger;
});
//  LocalWords:  Mangalam MPL Dubeau lastChild deleteText domutil
//  LocalWords:  keypress keydown util
//  LocalWords:  InputTrigger

//# sourceMappingURL=input-trigger-factory.js.map
