/**
 * Transformation registry for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import * as salve from "salve";
import { ErrorData } from "salve-dom";

import { DLoc, domtypeguards, domutil, EditorAPI, transformation } from "wed";

const { insertElement, unwrap, wrapInElement } = transformation;
import Transformation = transformation.Transformation;
import TransformationData = transformation.TransformationData;
import NamedTransformationData = transformation.NamedTransformationData;

const { childByClass, indexOf } = domutil;
const { isAttr, isElement } = domtypeguards;

function errFilter(err: ErrorData): boolean {
  const errMsg = err.error.toString();
  return errMsg.lastIndexOf("tag required: ", 0) === 0;
}

/**
 * Perform the autoinsertion algorithm on an element.
 *
 * @param el The element that should be subject to the autoinsertion algorithm.
 *
 * @param editor The editor which owns the element.
 */
function _autoinsert(el: Element, editor: EditorAPI): void {
  // tslint:disable-next-line:no-constant-condition strict-boolean-expressions
  while (true) {
    let errors = editor.validator.getErrorsFor(el);

    errors = errors.filter(errFilter);
    if (errors.length === 0) {
      break;
    }

    const ename = errors[0].error.getNames()[0];
    const names = ename.toArray();
    // If names is null the pattern is not simple and we cannot autoinsert. If
    // there is more than one option, we also cannot autoinsert.
    if (names === null || names.length > 1) {
      break;
    }
    const name = names[0];

    const locations = editor.validator.possibleWhere(
      el, new salve.Event("enterStartTag", name.ns, name.name));

    if (locations.length !== 1) {
      break;
    }

    const mode = editor.modeTree.getMode(el);
    const unresolved =
      mode.getAbsoluteResolver().unresolveName(name.ns, name.name);
    if (unresolved === undefined) {
      throw new Error(`cannot unresolve {${name.ns}}${name.name}`);
    }
    const actions = mode.getContextualActions("insert", unresolved,
                                              el, locations[0]);

    // Don't auto insert if it happens that the operation would be ambiguous
    // (ie. if there is more than one way to insert the element).
    if (actions.length !== 1) {
      break;
    }

    // Don't auto insert if the operation needs input from the user.
    if (actions[0].needsInput) {
      break;
    }

    //
    // We move the caret ourselves rather than using moveCaretTo. In this
    // context, it does not matter because autoinsert is meant to be called by a
    // transformation anyway.
    //
    editor.caretManager.setCaret(el, locations[0]);
    actions[0].execute({ name: unresolved });
  }
}

function executeInsert(editor: EditorAPI, data: NamedTransformationData): void {
  const caret = editor.caretManager.getDataCaret();
  if (caret === undefined) {
    throw new Error("inserting without a defined caret!");
  }

  const mode = editor.modeTree.getMode(caret.node);
  const absoluteResolver = mode.getAbsoluteResolver();
  const ename = absoluteResolver.resolveName(data.name);
  if (ename === undefined) {
    throw new Error(`cannot resolve ${data.name}`);
  }
  const unresolved = editor.validator.unresolveNameAt(caret.node, caret.offset,
                                                      ename.ns, ename.name);
  const el = insertElement(editor.dataUpdater, caret.node,
                           caret.offset, ename.ns, data.name);
  if (unresolved === undefined) {
    // The namespace used by the element has not been defined yet. So we need to
    // define it.
    const prefix = absoluteResolver.prefixFromURI(ename.ns);
    const name = (prefix === "") ? "xmlns" : `xmlns:${prefix}`;
    // The next name is necessarily resolvable so we assert that it is not
    // resolving to undefined.
    const xmlnsURI = absoluteResolver.resolveName("xmlns:q")!.ns;
    editor.dataUpdater.setAttributeNS(el, xmlnsURI, name, ename.ns);
  }

  let caretNode: Node | null = el;
  if (mode.getModeOptions().autoinsert as boolean) {
    _autoinsert(el, editor);

    // Set el to the deepest first child, so that the caret is put in the right
    // position.
    while (caretNode !== null) {
      const child: Node | null = caretNode.firstChild;
      if (child === null) {
        break;
      }
      caretNode = child;
    }
  }
  editor.caretManager.setCaret(caretNode, 0);
}

function executeUnwrap(editor: EditorAPI, data: TransformationData): void {
  const node = data.node;
  if (!isElement(node)) {
    throw new Error("node must be an element");
  }
  const parent = node.parentNode!;
  const index = indexOf(parent.childNodes, node);
  unwrap(editor.dataUpdater, node);
  editor.caretManager.setCaret(parent, index);
}

function executeWrap(editor: EditorAPI, data: NamedTransformationData): void {
  const sel = editor.caretManager.sel;
  if (sel == null) {
    throw new Error("wrap transformation called with undefined range");
  }

  if (sel.collapsed) {
    throw new Error("wrap transformation called with collapsed range");
  }
  const [startCaret, endCaret] = sel.mustAsDataCarets();
  const mode = editor.modeTree.getMode(startCaret.node);
  const ename = mode.getAbsoluteResolver().resolveName(data.name);
  if (ename === undefined) {
    throw new Error(`cannot resolve ${data.name}`);
  }
  const el = wrapInElement(editor.dataUpdater, startCaret.node,
                           startCaret.offset, endCaret.node, endCaret.offset,
                           ename.ns, data.name);
  const parent = el.parentNode!;
  editor.caretManager.setCaret(startCaret.make(parent,
                                  indexOf(parent.childNodes, el) + 1));
}

function executeWrapContent(editor: EditorAPI,
                            data: NamedTransformationData): void {
  const toWrap = data.node;

  if (!isElement(toWrap)) {
    throw new Error("node must be an element");
  }

  const mode = editor.modeTree.getMode(toWrap);
  const ename = mode.getAbsoluteResolver().resolveName(data.name);
  if (ename === undefined) {
    throw new Error(`cannot resolve ${data.name}`);
  }
  wrapInElement(editor.dataUpdater, toWrap, 0, toWrap,
                toWrap.childNodes.length, ename.ns, data.name);
}

function executeDeleteElement(editor: EditorAPI,
                              data: TransformationData): void {
  const node = data.node;

  if (!isElement(node)) {
    throw new Error("node must be an element");
  }

  const parent = node.parentNode!;
  const index = indexOf(parent.childNodes, node);
  const guiLoc = editor.caretManager.fromDataLocation(node, 0) as DLoc;
  // If the node we start with is an Element, then the node in guiLoc is
  // necessarily an Element too.
  if (!(guiLoc.node as Element).classList.contains("_readonly")) {
    editor.dataUpdater.removeNode(node);
    editor.caretManager.setCaret(parent, index);
  }
}

function executeDeleteParent(editor: EditorAPI,
                             data: TransformationData): void {
  const node = data.node;

  if (!isElement(node)) {
    throw new Error("node must be an element");
  }

  const parent = node.parentNode!;
  const index = indexOf(parent.childNodes, node);
  const guiLoc = editor.caretManager.mustFromDataLocation(node, 0);
  // If the node we start with is an Element, then the node in guiLoc is
  // necessarily an Element too.
  if (!(guiLoc.node as Element).classList.contains("_readonly")) {
    editor.dataUpdater.removeNode(node);
    editor.caretManager.setCaret(parent, index);
  }
}

function executeAddAttribute(editor: EditorAPI,
                             data: NamedTransformationData): void {
  const node = data.node;

  if (!isElement(node)) {
    throw new Error("node must be an element");
  }

  const guiLoc = editor.caretManager.mustFromDataLocation(node, 0);
  // If the node we start with is an Element, then the node in guiLoc is
  // necessarily an Element too.
  if (!(guiLoc.node as Element).classList.contains("_readonly")) {
    editor.dataUpdater.setAttribute(node, data.name, "");
    const attr = node.getAttributeNode(data.name);
    editor.caretManager.setCaret(attr, 0);
  }
}

function executeDeleteAttribute(editor: EditorAPI,
                                data: TransformationData): void {
  const node = data.node;

  if (node == null || !isAttr(node)) {
    throw new Error("node must be an attribute");
  }

  const element = node.ownerElement!;
  const caretManager = editor.caretManager;
  const guiOwnerLoc = caretManager.mustFromDataLocation(element, 0);
  // If the node we start with is an Element, then the node in guiOwnerLoc
  // is necessarily an Element too.
  const guiOwner = guiOwnerLoc.node as Element;
  if (!guiOwner.classList.contains("_readonly")) {
    const encoded = node.name;
    const startLabel = childByClass(guiOwner, "__start_label")!;

    // An earlier version of this code relied on the order of attributes in the
    // data tree. However, this order is not consistent from platform to
    // platform. Using the order of attributes in the GUI is
    // consistent. Therefore we go to the GUI to find the next attribute.

    const values = startLabel.getElementsByClassName("_attribute_value");

    // We have to get the parent node because fromDataLocation brings us to the
    // text node that contains the value.
    const guiNode = caretManager.mustFromDataLocation(node, 0).node.parentNode;
    const index = indexOf(values, guiNode!);
    const nextGUIValue = values[index + 1];
    const nextAttr = nextGUIValue != null ?
      editor.toDataNode(nextGUIValue) : null;

    editor.dataUpdater.setAttribute(element, encoded, null);

    // We set the caret inside the next attribute, or if it does not exist,
    // inside the label.
    if (nextAttr !== null) {
      editor.caretManager.setCaret(nextAttr, 0);
    }
    else {
      editor.caretManager.setCaret(
        guiOwner.getElementsByClassName("_element_name")[0], 0);
    }
  }
}

/**
 * @param forEditorAPI The editor for which to create transformations.
 */
export function makeTagTr(forEditor: EditorAPI):
Record<string, Transformation<NamedTransformationData>> {
  const ret: Record<string, Transformation<NamedTransformationData>> =
    Object.create(null);
  ret.insert = new Transformation(forEditor, "insert", "Create new <name>",
                                  "", executeInsert);
  ret.unwrap = new Transformation(forEditor, "unwrap",
                                  "Unwrap the content of this element",
                                  undefined, executeUnwrap);
  ret.wrap = new Transformation(forEditor, "wrap", "Wrap in <name>",
                                undefined, executeWrap);
  ret["wrap-content"] = new Transformation(forEditor, "wrap-content",
                                           "Wrap content in <name>", undefined,
                                           executeWrapContent);
  ret["delete-element"] = new Transformation(forEditor, "delete-element",
                                             "Delete this element", undefined,
                                             executeDeleteElement);
  ret["delete-parent"] = new Transformation(forEditor, "delete-parent",
                                            "Delete <name>", undefined,
                                            executeDeleteParent);
  ret["add-attribute"] = new Transformation(forEditor, "add-attribute",
                                            "Add @<name>", undefined,
                                            executeAddAttribute);
  ret["delete-attribute"] = new Transformation(forEditor, "delete-attribute",
                                               "Delete this attribute",
                                               undefined,
                                               executeDeleteAttribute);
  ret["insert-text"] = new Transformation(
       forEditor, "insert-text",
     "Insert \"<name>\"", undefined,
    (editor: EditorAPI, data: NamedTransformationData) => {
      editor.insertText(data.name);
    });
  ret.split = forEditor.splitNodeTr;

  return ret;
}

//  LocalWords:  TransformationRegistry Mangalam MPL Dubeau autoinsertion ie el
//  LocalWords:  autoinsert enterStartTag moveCaretTo xmlns guiLoc readonly
//  LocalWords:  guiOwnerLoc fromDataLocation
