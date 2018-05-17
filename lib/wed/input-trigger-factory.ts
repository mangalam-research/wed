/**
 * Functions to create input triggers according to some common patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { isText } from "./domtypeguards";
import * as domutil from "./domutil";
import { GUISelector } from "./gui-selector";
import { InputTrigger } from "./input-trigger";
import { Key } from "./key";
import { Mode } from "./mode";
import { EditorAPI } from "./mode-api";
import * as transformation from "./transformation";

interface SplitData extends transformation.TransformationData {
  // node is no longer optional.
  node: Node;
  sep: string;
}

/**
 * A transformation handler for a node splitting transformation.
 *
 * @param editor The editor which invoked the transformation.
 *
 * @param data The key that is splitting the element.
 *
 * @throws {Error} If the data passed is incorrect.
 */
function splitNodeOn(editor: EditorAPI, data: SplitData): void {
  let node = data.node;
  const sep = data.sep;
  if (typeof sep !== "string" || sep.length !== 1) {
    throw new Error("transformation invoked with incorrect data");
  }
  let modified = true;
  while (modified) {
    modified = false;
    const textNodes: Text[] = [];
    let child = node.firstChild;
    while (child !== null) {
      if (isText(child)) {
        textNodes.push(child);
      }
      child = child.nextSibling;
    }

    for (let i = 0; !modified && i < textNodes.length; ++i) {
      const text = textNodes[i];
      const offset = text.data.indexOf(sep);
      if (node.firstChild === text && offset === 0) {
        // We just drop the separator
        editor.dataUpdater.deleteText(text, offset, 1);
        modified = true;
      }
      else if (node.lastChild === text && offset !== -1 &&
               offset === text.length - 1) {
        // Just drop the separator
        editor.dataUpdater.deleteText(text, text.length - 1, 1);
        modified = true;
      }
      else if (offset !== -1) {
        const [, end] = editor.dataUpdater.splitAt(node, text, offset);
        // Continue with the 2nd half of the split
        if (end === null) {
          throw new Error("null end; we should not be getting that");
        }
        node = end;
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
 * @param selector A CSS selector that determines which element we want to
 * split or merge. For instance, to operate on all paragraphs, this parameter
 * could be ``"p"``. This selector must be fit to be used in the GUI tree.
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
export function makeSplitMergeInputTrigger(editor: EditorAPI,
                                           mode: Mode,
                                           selector: GUISelector,
                                           splitKey: Key,
                                           mergeWithPreviousKey: Key,
                                           mergeWithNextKey: Key):
InputTrigger {
  const splitNodeOnTr = new transformation.Transformation<SplitData>(
    editor, "split", "Split node on character", splitNodeOn);

  const ret = new InputTrigger(editor, mode, selector);
  ret.addKeyHandler(splitKey, (eventType, el, ev) => {
    if (ev !== undefined) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
    }
    if (eventType === "keypress" || eventType === "keydown") {
      editor.fireTransformation(editor.splitNodeTr, { node: el });
    }
    else {
      editor.fireTransformation(
        splitNodeOnTr, {
          name: el.tagName,
          node: el,
          sep: String.fromCharCode(splitKey.which),
        });
    }
  });

  ret.addKeyHandler(mergeWithPreviousKey, (_eventType, el, ev) => {
    const caret = editor.caretManager.getDataCaret();

    if (caret == null) {
      return;
    }

    // Fire it only if it the caret is at the start of the element we are
    // listening on and can't go back.
    if ((caret.offset === 0) &&
        (caret.node === el ||
         (isText(caret.node) && caret.node === el.firstChild))) {
      if (ev !== undefined) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
      }
      editor.fireTransformation(editor.mergeWithPreviousHomogeneousSiblingTr,
                                { node: el, name: el.tagName });
    }
  });

  ret.addKeyHandler(mergeWithNextKey, (_eventType, el, ev) => {
    const caret = editor.caretManager.getDataCaret();

    if (caret == null) {
      return;
    }

    // Fire it only if it the caret is at the end of the element we are
    // listening on and can't actually delete text.
    if ((caret.node === el && caret.offset === el.childNodes.length) ||
        (isText(caret.node) &&
         caret.node === el.lastChild &&
         caret.offset === (el.lastChild as Text).length)) {
      if (ev !== undefined) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
      }
      editor.fireTransformation(editor.mergeWithNextHomogeneousSiblingTr,
                                { node: el, name: el.tagName });
    }
  });
  return ret;
}

//  LocalWords:  InputTrigger keydown keypress domutil deleteText lastChild MPL
//  LocalWords:  Dubeau Mangalam
