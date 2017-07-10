/**
 * Basic decoration facilities.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as  $ from "jquery";
import * as mergeOptions from "merge-options";
import * as salve from "salve";

import { Action } from "./action";
import { CaretManager } from "./caret-manager";
import { DLoc } from "./dloc";
import { Listener } from "./domlistener";
import { isAttr, isText } from "./domtypeguards";
import * as  domutil from "./domutil";
import { GUIUpdater } from "./gui-updater";
import { ContextMenu } from "./gui/action-context-menu";
import { Transformation, TransformationData } from "./transformation";
import { BeforeInsertNodeAtEvent } from "./tree-updater";
import * as  util from "./util";
import { Validator } from "./validator";

const indexOf = domutil.indexOf;
const closestByClass = domutil.closestByClass;

export interface Editor {
  gui_root: Element;
  data_root: Element;
  max_label_level: number;
  complex_pattern_action: Action<{}>;
  attributes: string;
  validator: Validator;
  caretManager: CaretManager;
  // tslint:disable-next-line:no-any
  mode: any;
  _makeMenuItemForAction(action: Action<{}>, data?: {}): HTMLElement;
  resolver: salve.NameResolver;
  isAttrProtected(name: string, parent: Element): boolean;
  isAttrProtected(node: Node): boolean;
  toDataNode(el: Node): Node | Attr;
  makeDocumentationLink(url: string): HTMLElement;
  getElementTransformationsAt(pos: DLoc, transformationType: string):
  { name: string,
    tr: Transformation<TransformationData> }[];
  // tslint:disable-next-line:no-any
  [key: string]: any;
}

function tryToSetDataCaret(editor: Editor, dataCaret: DLoc): void {
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

interface AttributeHidingSpecs {
  elements: {
    selector: string,
    attributes: (string | { except: string[]})[];
  }[];
}

/**
 * A decorator is responsible for adding decorations to a tree of DOM
 * elements. Decorations are GUI elements.
 */
export class Decorator {
  private _attributeHidingSpecs: AttributeHidingSpecs | null;

  /**
   * @param domlistener The listener that the decorator must use to know when
   * the DOM tree has changed and must be redecorated.
   *
   * @param editor The editor instance for which this decorator was created.
   *
   * @param guiUpdater The updater to use to modify the GUI tree. All
   * modifications to the GUI must go through this updater.
   */
  constructor(protected readonly domlistener: Listener,
              protected readonly editor: Editor,
              protected readonly guiUpdater: GUIUpdater) {}

  /**
   * Request that the decorator add its event handlers to its listener.
   */
  addHandlers(): void {
    this.guiUpdater.events.subscribe((ev) => {
      if (ev.name !== "BeforeInsertNodeAt" || isText(ev.node)) {
        return;
      }

      this.contentEditableHandler(ev);
    });
  }

  /**
   * Start listening to changes to the DOM tree.
   */
  startListening(): void {
    this.domlistener.startListening();
  }

  /**
   * This function adds a separator between each child element of the element
   * passed as ``el``. The function only considers ``._real`` elements.
   *
   * @param el The element to decorate.
   *
   * @param sep A separator.
   */
  listDecorator(el: Element, sep: string | Element): void {
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

  /**
   * Generic handler for setting ``contenteditable`` on nodes included into the
   * tree.
   */
  contentEditableHandler(ev: BeforeInsertNodeAtEvent): void {
    const editAttributes = this.editor.attributes === "edit";
    function mod(el: Element): void {
      // All elements that may get a selection must be focusable to
      // work around issue:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
      el.setAttribute("tabindex", "-1");
      el.setAttribute("contenteditable",
                      String(el.classList.contains("_real") ||
                             (editAttributes &&
                              el.classList.contains("_attribute_value"))));
      let child = el.firstElementChild;
      while (child !== null) {
        mod(child);
        child = child.nextElementSibling;
      }
    }

    // We never call this function with something else than an Element for
    // ev.node.
    mod(ev.node as Element);
  }

  /**
   * Add a start label at the start of an element and an end label at the end.
   *
   * @param root The root of the decorated tree.
   *
   * @param el The element to decorate.
   *
   * @param level The level of the labels for this element.
   *
   * @param preContextHandler An event handler to run when the user invokes a
   * context menu on the start label.
   *
   * @param postContextHandler An event handler to run when the user invokes a
   * context menu on the end label.
   */
  elementDecorator(root: Element, el: Element, level: number,
                   preContextHandler: ((wedEv: JQueryMouseEventObject,
                                        ev: Event) => boolean) | undefined,
                   postContextHandler: ((wedEv: JQueryMouseEventObject,
                                         ev: Event) => boolean) | undefined):
  void {
    if (level > this.editor.max_label_level) {
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

    const attributesHTML = [];
    let hiddenAttributes = false;
    if (this.editor.attributes === "show" ||
        this.editor.attributes === "edit") {
      // include the attributes
      const attributes = util.getOriginalAttributes(el);
      const names = Object.keys(attributes).sort();

      for (const name of names) {
        const hideAttribute = this.mustHideAttribute(el, name);
        if (hideAttribute) {
          hiddenAttributes = true;
        }

        const extra = hideAttribute ? " _shown_when_caret_in_label" : "";

        attributesHTML.push([
          `<span class=\"_phantom _attribute${extra}\">`,
          "<span class=\"_phantom _attribute_name\">", name,
          "</span>=\"<span class=\"_phantom _attribute_value\">",
          domutil.textToHTML(attributes[name]),
          "</span>\"</span>",
        ].join(""));
      }
    }
    const attributesStr = (attributesHTML.length !== 0 ? " " : "") +
      attributesHTML.join(" ");

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
</span>${attributesStr}<span class='_phantom _greater_than'> >&nbsp;</span>`;
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

    // Setup a handler so that clicking one label highlights it and
    // the other label.
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
  mustHideAttribute(el: Element, name: string): boolean {
    const specs = this.attributeHidingSpecs;
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

  private get attributeHidingSpecs(): AttributeHidingSpecs | null {
    if (this._attributeHidingSpecs === undefined) {
      const attributeHiding = this.editor.attributeHiding;
      if (attributeHiding === undefined) {
        // No attribute hiding...
        this._attributeHidingSpecs = null;
      }
      else {
        const method = attributeHiding.method;
        if (method !== "selector") {
          throw new Error(`unknown attribute hiding method: ${method}`);
        }

        const specs: AttributeHidingSpecs = {
          elements: [],
        };

        for (const element of attributeHiding.elements) {
          const copy = mergeOptions({}, element);
          copy.selector = domutil.toGUISelector(copy.selector);
          specs.elements.push(copy);
        }

        this._attributeHidingSpecs = specs;
      }
    }

    return this._attributeHidingSpecs;
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
                               ev: Event): boolean {
    const editor = this.editor;
    let node = wedEv.target as Element;
    const menuItems: {
      action: Action<{}> | null,
      item: Element,
      data?: TransformationData | null,
    }[] = [];
    const mode = editor.mode;
    const doc = node.ownerDocument;
    const atStartToTxt: Record<string, string> = {
      undefined: "",
      true: " before this element",
      false: " after this element",
    };

    function pushItem(data: TransformationData | undefined,
                      tr: Action<{}>, start?: boolean | undefined): void {
      const li = editor._makeMenuItemForAction(tr, data) as Element;
      const a = li.getElementsByTagName("a")[0];
      const text = doc.createTextNode(atStartToTxt[String(start)]);
      a.appendChild(text);
      a.normalize();
      menuItems.push({ action: tr, item: li, data: data });
    }

    function pushItems(data: TransformationData | undefined,
                       trs?: Action<{}>[], start?: boolean | undefined): void {
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
          const unresolved = editor.resolver.unresolveName(name.ns, name.name);
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
        pushItem(undefined, editor.complex_pattern_action);
      }
    }

    const real = closestByClass(node, "_real", editor.gui_root);
    const readonly = real !== null && real.classList.contains("_readonly");

    const attrVal = closestByClass(node, "_attribute_value", editor.gui_root);
    if (attrVal !== null) {
      const dataNode = editor.toDataNode(attrVal) as Attr;
      const treeCaret =
        DLoc.mustMakeDLoc(editor.data_root, dataNode.ownerElement);
      editor.validator.possibleAt(treeCaret, true).forEach((event) => {
        if (event.params[0] !== "attributeName") {
          return;
        }
        const toAddTo = treeCaret.node.childNodes[treeCaret.offset];
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
      const candidate = closestByClass(node, "_real", editor.gui_root);
      if (candidate === null) {
        throw new Error("cannot find real parent");
      }

      node = candidate;

      const topNode = (node.parentNode === editor.gui_root);

      // We first gather the transformations that pertain to the node to which
      // the label belongs.
      const orig = util.getOriginalName(node);

      const docURL = mode.documentationLinkFor(orig);
      if (docURL != null) {
        const li = doc.createElement("li");
        li.appendChild(this.editor.makeDocumentationLink(docURL));
        menuItems.push({ action: null, item: li, data: null });
      }

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

      if (atStart && editor.attributes === "edit") {
        editor.validator.possibleAt(treeCaret, true).forEach((event) => {
            if (event.params[0] !== "attributeName") {
              return;
            }
            const toAddTo = treeCaret.node.childNodes[treeCaret.offset];
            processAttributeNameEvent(event, toAddTo as Element);
          });
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
            pushItem(undefined, tr.tr);
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
                     : undefined,
                     tr.tr);
          }
        }
      }
    }

    // There's no menu to display, so let the event bubble up.
    if (menuItems.length === 0) {
      return true;
    }

    const pos = editor.computeContextMenuPosition(ev);
    editor.displayContextMenu(ContextMenu, pos.left, pos.top, menuItems,
                              readonly);
    return false;
  }
}

//  LocalWords:  sep el focusable lt enterStartTag unclick nbsp li
//  LocalWords:  tabindex listDecorator contenteditable href jQuery
//  LocalWords:  gui domlistener domutil util validator jquery
//  LocalWords:  Mangalam MPL Dubeau
