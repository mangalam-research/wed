/**
 * Transformations for MMWPA mode.
 * @author Louis-Dominique Dubeau
 */

import { isElement, isText } from "wed/domtypeguards";
import { AbortTransformationException } from "wed/exceptions";
import { TransformationData } from "wed/transformation";

// tslint:disable:no-any
type Editor = any;

const NUMBER_SENTENCE_MODAL_KEY = "btw_mode.btw_tr.number_sentence_modal";
function getNumberSentenceModal(editor: Editor): any {
  let removeMixedModal: any = editor.getModeData(NUMBER_SENTENCE_MODAL_KEY);
  if (removeMixedModal != null) {
    return removeMixedModal;
  }

  removeMixedModal = editor.makeModal();
  removeMixedModal.setTitle("Invalid");
  removeMixedModal.addButton("Ok", true);
  editor.setModeData(NUMBER_SENTENCE_MODAL_KEY, removeMixedModal);

  return removeMixedModal;
}

export function numberSentences(editor: Editor,
                                data: TransformationData): void {
  const node = data.node as Element;
  let child = node.firstChild;
  let error = null;
  while (child !== null) {
    if (isText(child)) {
      if (child.data.trim() !== "") {
        error = `there is text outside of a sentence: ${child.data}`;
        break;
      }
    }
    else if (isElement(child)) {
      if (child.tagName !== "s") {
        error = `there is an element outside of a sentence: ${child.outerHTML}`;
        break;
      }
    }
    else {
      throw new Error(`unknown type of child: ${child.nodeType}`);
    }
    child = child.nextSibling;
  }

  if (error !== null) {
    const modal = getNumberSentenceModal(editor);
    modal.setBody(`<p>The sentences cannot be numbered because ${error}.</p>`);
    throw new AbortTransformationException("cit content is invalid");
  }

  let id = 1;
  child = node.firstChild;
  while (child !== null) {
    if (isElement(child)) {
      editor.data_updater.setAttribute(child, "id", id++);
    }
    child = child.nextSibling;
  }
}

export function numberWords(editor: Editor, data: TransformationData): void {
  const node = data.node as Element;
  let child = node.firstChild;
  let error = null;

  while (child !== null) {
    if (isText(child)) {
      if (child.data.trim() !== "") {
        error = `there is text outside of a word: ${child.data}`;
        break;
      }
    }
    else if (isElement(child)) {
      if (child.tagName !== "word") {
        error = `there is a foreign element: ${child.outerHTML}`;
        break;
      }
      else if (child.getAttribute("id") !== null) {
        error = `there is a word with number ${child.getAttribute("id")}`;
      }
    }
    else {
      throw new Error(`unknown type of child: ${child.nodeType}`);
    }
    child = child.nextSibling;
  }

  if (error !== null) {
    const modal = getNumberSentenceModal(editor);
    modal.setBody(`<p>The words cannot be numbered because ${error}.</p>`);
    throw new AbortTransformationException("sentence content is invalid");
  }

  let id = 1;
  child = node.firstChild;
  while (child !== null) {
    if (isElement(child)) {
      editor.data_updater.setAttribute(child, "id", id++);
    }
    child = child.nextSibling;
  }
}

export function unnumberWords(editor: Editor, data: TransformationData): void {
  const node = data.node as Element;
  let child = node.firstChild;

  child = node.firstChild;
  while (child !== null) {
    if (isElement(child) && child.tagName === "word") {
      editor.data_updater.setAttribute(child, "id", null);
    }
    child = child.nextSibling;
  }
}
