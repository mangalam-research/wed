/**
 * Basic decoration facilities.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import $ from "jquery";
import * as salve from "salve";

import { Action } from "./action";
import { DLoc } from "./dloc";
import { DOMListener } from "./domlistener";
import { isAttr } from "./domtypeguards";
import * as  domutil from "./domutil";
import { GUIUpdater } from "./gui-updater";
import { ActionContextMenu, Item } from "./gui/action-context-menu";
import { Mode } from "./mode";
import { DecoratorAPI, EditorAPI } from "./mode-api";
import { TransformationData } from "./transformation";
import * as  util from "./util";

const indexOf = domutil.indexOf;
const closestByClass = domutil.closestByClass;

function tryToSetDataCaret(editor: EditorAPI, dataCaret: DLoc): void {
  try {
    editor.caretManager.setCaret(dataCaret, { textEdit: true });
  }
  catch (e) {
    // Do nothing.
  }
}

function attributeSelectorMatch(selector: string, name: string): boolean {
  return selector === "*" || selector === name;
}

/**
 * A decorator is responsible for adding decorations to a tree of DOM
 * elements. Decorations are GUI elements.
 */
export abstract class Decorator implements DecoratorAPI {
  protected readonly namespaces: Record<string, string>;
  protected readonly domlistener: DOMListener;
  protected readonly guiUpdater: GUIUpdater;

  /**
   * @param domlistener The listener that the decorator must use to know when
   * the DOM tree has changed and must be redecorated.
   *
   * @param editor The editor instance for which this decorator was created.
   *
   * @param guiUpdater The updater to use to modify the GUI tree. All
   * modifications to the GUI must go through this updater.
   */
  constructor(protected readonly mode: Mode,
              protected readonly editor: EditorAPI) {
    this.domlistener = editor.domlistener;
    this.guiUpdater = editor.guiUpdater;
    this.namespaces = mode.getAbsoluteNamespaceMappings();
  }

  /**
   * Request that the decorator add its event handlers to its listener.
   */
  abstract addHandlers(): void;

  /**
   * Start listening to changes to the DOM tree.
   */
  startListening(): void {
    this.domlistener.startListening();
  }

  listDecorator(el: Element, sep: string | Element): void {
    if (this.editor.modeTree.getMode(el) !== this.mode) {
      // The element is not governed by this mode.
      return;
    }

    // We expect to work with a homogeneous list. That is, all children the same
    // element.
    const nameMap: Record<string, number> = Object.create(null);
    let child = el.firstElementChild;
    while (child !== null) {
      if (child.classList.contains("_real")) {
        nameMap[util.getOriginalName(child)] = 1;
      }
      child = child.nextElementSibling;
    }

    const tags = Object.keys(nameMap);
    if (tags.length > 1) {
      throw new Error("calling listDecorator on a non-homogeneous list.");
    }

    if (tags.length === 0) {
      return;
    } // Nothing to work with

    // First drop all children that are separators
    child = el.firstElementChild;
    while (child !== null) {
      // Grab it before the node is removed.
      const next = child.nextElementSibling;
      if (child.hasAttribute("data-wed--separator-for")) {
        this.guiUpdater.removeNode(child);
      }
      child = next;
    }

    const tagName = tags[0];

    // If sep is a string, create an appropriate div.
    let sepNode: Element;
    if (typeof sep === "string") {
      sepNode = el.ownerDocument.createElement("div");
      sepNode.textContent = sep;
    }
    else {
      sepNode = sep;
    }

    sepNode.classList.add("_text");
    sepNode.classList.add("_phantom");
    sepNode.setAttribute("data-wed--separator-for", tagName);

    let first = true;
    child = el.firstElementChild;
    while (child !== null) {
      if (child.classList.contains("_real")) {
        if (!first) {
          this.guiUpdater.insertBefore(el, sepNode.cloneNode(true) as Element,
                                       child);
        }
        else {
          first = false;
        }
      }
      child = child.nextElementSibling;
    }
  }

  elementDecorator(_root: Element, el: Element, level: number,
                   preContextHandler: ((wedEv: JQueryMouseEventObject,
                                        ev: Event) => boolean) | undefined,
                   postContextHandler: ((wedEv: JQueryMouseEventObject,
                                         ev: Event) => boolean) | undefined):
  void {
    if (this.editor.modeTree.getMode(el) !== this.mode) {
      // The element is not governed by this mode.
      return;
    }

    if (level > this.editor.maxLabelLevel) {
      throw new Error(
        `level higher than the maximum set by the mode: ${level}`);
    }

    // Save the caret because the decoration may mess up the GUI caret.
    let dataCaret: DLoc | undefined = this.editor.caretManager.getDataCaret();
    if (dataCaret != null &&
        !(isAttr(dataCaret.node) &&
          dataCaret.node.ownerElement === $.data(el, "wed_mirror_node"))) {
      dataCaret = undefined;
    }

    const dataNode = $.data(el, "wed_mirror_node");
    this.setReadOnly(el, Boolean(this.editor.validator.getNodeProperty(
      dataNode, "PossibleDueToWildcard")));

    const origName = util.getOriginalName(el);
    // _[name]_label is used locally to make the function idempotent.
    let cls = `_${origName}_label`;

    // We must grab a list of nodes to remove before we start removing them
    // because an element that has a placeholder in it is going to lose the
    // placeholder while we are modifying it. This could throw off the scan.
    const toRemove = domutil.childrenByClass(el, cls);
    for (const remove of toRemove) {
      el.removeChild(remove);
    }

    let attributesHTML = "";
    let hiddenAttributes = false;
    const attributeHandling = this.editor.modeTree.getAttributeHandling(el);
    if (attributeHandling === "show" || attributeHandling === "edit") {
      // include the attributes
      const attributes = util.getOriginalAttributes(el);
      const names = Object.keys(attributes).sort();

      for (const name of names) {
        const hideAttribute = this.mustHideAttribute(el, name);
        if (hideAttribute) {
          hiddenAttributes = true;
        }

        const extra = hideAttribute ? " _shown_when_caret_in_label" : "";

        attributesHTML += ` \
<span class="_phantom _attribute${extra}">\
<span class="_phantom _attribute_name">${name}</span>=\
"<span class="_phantom _attribute_value">\
${domutil.textToHTML(attributes[name])}</span>"</span>`;
      }
    }

    const doc = el.ownerDocument;
    cls += ` _label_level_${level}`;

    // Save the cls of the end label here so that we don't further modify it.
    const endCls = cls;

    if (hiddenAttributes) {
      cls += " _autohidden_attributes";
    }
    const pre = doc.createElement("span");
    pre.className = `_gui _phantom __start_label _start_wrapper ${cls} _label`;
    const prePh = doc.createElement("span");
    prePh.className = "_phantom";
    // tslint:disable-next-line:no-inner-html
    prePh.innerHTML = `&nbsp;<span class='_phantom _element_name'>${origName}\
</span>${attributesHTML}<span class='_phantom _greater_than'> >&nbsp;</span>`;
    pre.appendChild(prePh);
    this.guiUpdater.insertNodeAt(el, 0, pre);

    const post = doc.createElement("span");
    post.className = `_gui _phantom __end_label _end_wrapper ${endCls} _label`;
    const postPh = doc.createElement("span");
    postPh.className = "_phantom";
    // tslint:disable-next-line:no-inner-html
    postPh.innerHTML = `<span class='_phantom _less_than'>&nbsp;&lt; </span>\
<span class='_phantom _element_name'>${origName}</span>&nbsp;`;
    post.appendChild(postPh);
    this.guiUpdater.insertBefore(el, post, null);

    // Setup a handler so that clicking one label highlights it and the other
    // label.
    $(pre).on("wed-context-menu",
              preContextHandler !== undefined ? preContextHandler : false);

    $(post).on("wed-context-menu",
               postContextHandler !== undefined ? postContextHandler : false);

    if (dataCaret != null) {
      tryToSetDataCaret(this.editor, dataCaret);
    }
  }

  /**
   * Determine whether an attribute must be hidden. The default implementation
   * calls upon the ``attributes.autohide`` section of the "wed options" that
   * were used by the mode in effect to determine whether an attribute should be
   * hidden or not.
   *
   * @param el The element in the GUI tree that we want to test.
   *
   * @param name The attribute name in "prefix:localName" format where "prefix"
   * is to be understood according to the absolute mapping defined by the mode.
   *
   * @returns ``true`` if the attribute must be hidden. ``false`` otherwise.
   */
  protected mustHideAttribute(el: Element, name: string): boolean {
    const specs = this.editor.modeTree.getAttributeHidingSpecs(el);
    if (specs === null) {
      return false;
    }

    for (const element of specs.elements) {
      if (el.matches(element.selector)) {
        let matches = false;
        for (const attribute of element.attributes) {
          if (typeof attribute === "string") {
            // If we already matched, there's no need to try to match with
            // another selector.
            if (!matches) {
              matches = attributeSelectorMatch(attribute, name);
            }
          }
          else {
            // If we do not match yet, there's no need to try to exclude the
            // attribute.
            if (matches) {
              for (const exception of attribute.except) {
                matches = !attributeSelectorMatch(exception, name);
                // As soon as we stop matching, there's no need to continue
                // checking other exceptions.
                if (!matches) {
                  break;
                }
              }
            }
          }
        }

        // An element selector that matches is terminal.
        return matches;
      }
    }

    return false;
  }

  /**
   * Add or remove the CSS class ``_readonly`` on the basis of the 2nd argument.
   *
   * @param el The element to modify. Must be in the GUI tree.
   *
   * @param readonly Whether the element is readonly or not.
   */
  setReadOnly(el: Element, readonly: boolean): void {
    const cl = el.classList;
    (readonly ? cl.add : cl.remove).call(cl, "_readonly");
  }

  /**
   * Context menu handler for the labels of elements decorated by
   * [[Decorator.elementDecorator]].
   *
   * @param atStart Whether or not this event is for the start label.
   *
   * @param wedEv The DOM event that wed generated to trigger this handler.
   *
   * @param ev The DOM event that wed received.
   *
   * @returns To be interpreted the same way as for all DOM event handlers.
   */
  // tslint:disable-next-line:max-func-body-length
  protected contextMenuHandler(atStart: boolean, wedEv: JQueryMouseEventObject,
                               ev: JQueryEventObject): boolean {
    const editor = this.editor;
    const editingMenuManager = editor.editingMenuManager;
    let node = wedEv.target;
    const menuItems: Item[] = [];
    const mode = editor.modeTree.getMode(node);

    function pushItem(data: TransformationData | null,
                      tr: Action<TransformationData>,
                      start?: boolean): void {
      const li = editingMenuManager.makeMenuItemForAction(tr, data, start);
      menuItems.push({ action: tr, item: li, data: data });
    }

    function pushItems(data: TransformationData | null,
                       trs?: Action<{}>[], start?: boolean): void {
      if (trs === undefined) {
        return;
      }

      for (const tr of trs) {
        pushItem(data, tr, start);
      }
    }

    function processAttributeNameEvent(event: salve.Event,
                                       element: Element): void {
      const namePattern = event.params[1] as salve.Name;
      // The next if line causes tslint to inexplicably raise a failure. I am
      // able to reproduce it with something as small as:
      //
      // import { Name } from "salve";
      //
      // export function func(p: Name): void {
      //   if (p.simple()) {
      //     document.body.textContent = "1";
      //   }
      // }
      //
      // tslint:disable-next-line:strict-boolean-expressions
      if (namePattern.simple()) {
        for (const name of namePattern.toArray()) {
          const unresolved =
            mode.getAbsoluteResolver().unresolveName(name.ns, name.name);
          if (unresolved === undefined) {
            throw new Error("cannot unresolve attribute");
          }

          if (editor.isAttrProtected(unresolved, element)) {
            return;
          }

          pushItems({ name: unresolved, node: element },
                    mode.getContextualActions("add-attribute", unresolved,
                                              element));
        }
      }
      else {
        pushItem(null, editor.complexPatternAction);
      }
    }

    const real = closestByClass(node, "_real", editor.guiRoot);
    const readonly = real !== null && real.classList.contains("_readonly");

    const attrVal = closestByClass(node, "_attribute_value", editor.guiRoot);
    if (attrVal !== null) {
      const dataNode = editor.toDataNode(attrVal) as Attr;
      const treeCaret =
        DLoc.mustMakeDLoc(editor.dataRoot, dataNode.ownerElement);
      const toAddTo = treeCaret.node.childNodes[treeCaret.offset];
      editor.validator.possibleAt(treeCaret, true).forEach((event) => {
        if (event.params[0] !== "attributeName") {
          return;
        }
        processAttributeNameEvent(event, toAddTo as Element);
      });

      const name = dataNode.name;
      if (!editor.isAttrProtected(dataNode)) {
        pushItems({ name: name, node: dataNode },
                  mode.getContextualActions("delete-attribute", name,
                                            dataNode));
      }
    }
    else {
      // We want the first real parent.
      const candidate = closestByClass(node, "_real", editor.guiRoot);
      if (candidate === null) {
        throw new Error("cannot find real parent");
      }

      node = candidate;
      const topNode = (node.parentNode === editor.guiRoot);

      menuItems.push(
        ...editingMenuManager.makeCommonItems(editor.toDataNode(node)!));

      // We first gather the transformations that pertain to the node to which
      // the label belongs.
      const orig = util.getOriginalName(node);

      if (!topNode) {
        pushItems({ node: node, name: orig },
                  mode.getContextualActions(
                    ["unwrap", "delete-element"],
                    orig, $.data(node, "wed_mirror_node"), 0));
      }

      // Then we check what could be done before the node (if the
      // user clicked on an start element label) or after the node
      // (if the user clicked on an end element label).
      const parent = node.parentNode!;
      let index = indexOf(parent.childNodes, node);

      // If we're on the end label, we want the events *after* the node.
      if (!atStart) {
        index++;
      }
      const treeCaret = editor.caretManager.toDataLocation(parent, index);
      if (treeCaret === undefined) {
        throw new Error("cannot get caret");
      }

      if (atStart) {
        const toAddTo = treeCaret.node.childNodes[treeCaret.offset];
        const attributeHandling = editor.modeTree.getAttributeHandling(toAddTo);
        if (attributeHandling === "edit") {
          editor.validator.possibleAt(treeCaret, true).forEach((event) => {
            if (event.params[0] !== "attributeName") {
              return;
            }
            processAttributeNameEvent(event, toAddTo as Element);
          });
        }
      }

      if (!topNode) {
        for (const tr of editor.getElementTransformationsAt(treeCaret,
                                                            "insert")) {
          if (tr.name !== undefined) {
            // Regular case: we have a real transformation.
            pushItem({ name: tr.name, moveCaretTo: treeCaret }, tr.tr, atStart);
          }
          else {
            // It is an action rather than a transformation.
            pushItem(null, tr.tr);
          }
        }

        if (atStart) {
          // Move to inside the element and get the get the wrap-content
          // possibilities.
          const caretInside =
            treeCaret.make(treeCaret.node.childNodes[treeCaret.offset], 0);
          for (const tr of editor.getElementTransformationsAt(caretInside,
                                                              "wrap-content")) {
            pushItem(tr.name !== undefined ? { name: tr.name, node: node }
                     : null,
                     tr.tr);
          }
        }
      }
    }

    // There's no menu to display, so let the event bubble up.
    if (menuItems.length === 0) {
      return true;
    }

    editingMenuManager.setupContextMenu(ActionContextMenu, menuItems, readonly,
                                        ev);
    return false;
  }
}

//  LocalWords:  attributeName unresolve func tslint readonly localName endCls
//  LocalWords:  PossibleDueToWildcard Dubeau MPL Mangalam attributesHTML util
//  LocalWords:  jquery validator domutil domlistener gui autohidden jQuery cls
//  LocalWords:  listDecorator origName li nbsp lt el sep
