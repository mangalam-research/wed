/**
 * Module implementing the basic functionality for input triggers.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import $ from "jquery";

import { DLoc } from "./dloc";
import { isText } from "./domtypeguards";
import { closest } from "./domutil";
import { GUISelector } from "./gui-selector";
import { Key } from "./key";
import { Mode } from "./mode";
import { EditorAPI } from "./mode-api";

/**
 * @param eventType The type of event being processed.
 *
 * @param element A DOM element in the **data tree** that was modified or had
 * the caret when the keydown event happened.
 *
 * @param event The jQuery event in question.
 */
export type KeyHandler = (eventType: "keypress" | "keydown" | "paste",
                          el: Element,
                          event: JQueryKeyEventObject) => void;

/**
 * An InputTrigger listens to keyboard events and to DOM changes that insert
 * text into an element. The object has to listen to both types of events
 * because:
 *
 * - Listening only to keyboard events would miss modifications to the DOM tree
 *   that happen programmatically.
 *
 * - Listening only to DOM changes would not trap keyboard events that do not
 *   **inherently** modify the DOM tree like a backspace key hit at the start of
 *   an element.
 *
 * The portion of InputTrigger objects that handle keyboard events attaches
 * itself to the editor to which the InputTrigger belongs in such a way that
 * allows for suppressing the generic handling of such events. See
 * [[addKeyHandler]] for more information.
 */
export class InputTrigger {
  // This is a map of all keys to their handlers.
  private readonly keyToHandler: Map<Key, KeyHandler[]> = new Map();
  private readonly textInputKeyToHandler: Map<Key, KeyHandler[]> = new Map();

  /**
   * @param editor The editor to which this ``InputTrigger`` belongs.
   *
   * @param mode The mode for which this ``InputTrigger`` is being created.
   *
   * @param selector This is a CSS selector which must be fit to be used in the
   * GUI tree. (For instance by being the output of
   * [["wed/domutil".toGUISelector]].)
   */
  constructor(private readonly editor: EditorAPI,
              private readonly mode: Mode,
              private readonly selector: GUISelector) {
    // This is a map of keys that are actually text keys to their handlers. This
    // map is in effect a submap of _key_to_handler. We want this for speed,
    // because otherwise each text change event would require that the
    // InputTrigger filter out all those keys that we don't care about. The keys
    // that are "text input" keys are those that actually modify DOM text. So
    // things like cursor movement keys or ENTER, BACKSPACE, or control keys do
    // not appear *in* text and so are excluded from this map.

    editor.$guiRoot.on("wed-post-paste", this.pasteHandler.bind(this));

    // Implementation note: getting keydown events to get fired on random HTML
    // elements is finicky. For one thing, the element needs to be focusable,
    // which is false for most elements unless tabindex is set. Even with
    // tabindex set, browsers don't seem to consistently emit the events on the
    // elements we want. An initial implementation attempted to set the keydown
    // handler with $root.on("keydown", this._selector, ...) but this was not
    // reliable. So we listen to all keydown events on $root and in the handler
    // we filter out what we don't care about. More expensive but works
    // reliably.
    editor.$guiRoot.on("wed-input-trigger-keydown",
                       this.keydownHandler.bind(this));
    editor.$guiRoot.on("wed-input-trigger-keypress",
                       this.keypressHandler.bind(this));
  }

  /**
   * Adds a key handler to the object.
   *
   * The handler is called once per event. This means for instance that if a
   * paste event introduces the text "a;b;c" and we are listening for ";", the
   * handler will be called once, even though two ";" are added. It is up to the
   * handler to detect that ";" has been added more than once.
   *
   * Handlers that wish to stop further processing or prevent the browser's
   * default processing of an event must call the appropriate method on the
   * ``event`` object.
   *
   * Although it is possible to add multiple handlers for the same key to the
   * same ``InputTrigger`` object, the ``InputTrigger`` class does not define
   * how one handler could prevent another handler from executing. Calling the
   * methods on the ``event`` object does not in any way affect how an
   * ``InputTrigger`` calls its handlers. However, as stated above, these
   * methods can prevent further propagation of the JavaScript
   * event. Consequently, if more than one handler should handle the same key on
   * the same ``InputTrigger`` object, these handlers should either deal with
   * orthogonal concerns (e.g. one modifies the data DOM tree and the other does
   * logging), or provide their own mechanism to determine whether one can
   * prevent the other from executing.
   *
   * @param key The key we are interested in.
   *
   * @param handler The handler that will process events related to that key.
   */
  addKeyHandler(key: Key, handler: KeyHandler): void {
    let handlers = this.keyToHandler.get(key);
    if (handlers === undefined) {
      handlers = [];
      this.keyToHandler.set(key, handlers);
    }

    handlers.push(handler);

    // We could get here due to keys that are actually not text (e.g. ENTER,
    // BACKSPACE).
    if (key.anyModifier() || !key.keypress) {
      return;
    }

    // We share the handlers array between the two maps.
    if (!this.textInputKeyToHandler.has(key)) {
      this.textInputKeyToHandler.set(key, handlers);
    }
  }

  private getNodeOfInterest(): Element | null{
    const caret = this.editor.caretManager.getDataCaret(true);

    if (caret == null) {
      return null;
    }

    if (this.editor.modeTree.getMode(caret.node) !== this.mode) {
      // Outside our jurisdiction.
      return null;
    }

    // We transit through the GUI tree to perform our match because CSS
    // selectors cannot operate on XML namespace prefixes (or, at the time of
    // writing, on XML namespaces, period).
    const dataNode = isText(caret.node) ? caret.node.parentNode : caret.node;
    const guiNode = $.data(dataNode as Element, "wed_mirror_node");

    return closest(guiNode, this.selector.value, this.editor.guiRoot);
  }

  /**
   * Handles ``keydown`` events.
   *
   * @param _wedEvent The DOM event wed generated to trigger this handler.
   *
   * @param e The original DOM event that wed received.
   */
  private keydownHandler(_wedEvent: Event, e: JQueryKeyEventObject): void {
    const nodeOfInterest = this.getNodeOfInterest();
    if (nodeOfInterest === null) {
      return;
    }

    const dataNode = $.data(nodeOfInterest, "wed_mirror_node");
    this.keyToHandler.forEach((handlers: KeyHandler[], key: Key) => {
      if (key.matchesEvent(e)) {
        for (const handler of handlers) {
          handler("keydown", dataNode, e);
        }
      }
    });
  }

  /**
   * Handles ``keypress`` events.
   *
   * @param _wedEvent The DOM event wed generated to trigger this handler.
   *
   * @param e The original DOM event that wed received.
   */
  private keypressHandler(_wedEvent: Event, e: JQueryKeyEventObject): void {
    const nodeOfInterest = this.getNodeOfInterest();
    if (nodeOfInterest === null) {
      return;
    }

    const dataNode = $.data(nodeOfInterest, "wed_mirror_node");
    this.keyToHandler.forEach((handlers: KeyHandler[], key: Key) => {
      if (key.matchesEvent(e)) {
        for (const handler of handlers) {
          handler("keypress", dataNode, e);
        }
      }
    });
  }

  /**
   * Handles ``paste`` events.
   *
   * @param _wedEvent The DOM event wed generated to trigger this handler.
   *
   * @param e The original DOM event that wed received.
   *
   * @param caret The data caret.
   *
   * @param data The data that the user wants to insert.
   */
  private pasteHandler(_wedEvent: Event, e: JQueryKeyEventObject, caret: DLoc,
                       data: Element): void {
    if (this.editor.undoingOrRedoing()) {
      return;
    }

    const text: Text[] = [];
    let child = data.firstChild;
    while (child !== null) {
      if (isText(child)) {
        text.push(child);
      }
      child = child.nextSibling;
    }

    if (text.length === 0) {
      return;
    }

    if (this.editor.modeTree.getMode(caret.node) !== this.mode) {
      // Outside our jurisdiction.
      return;
    }

    // We transit through the GUI tree to perform our match because CSS
    // selectors cannot operate on XML namespace prefixes (or, at the time of
    // writing, on XML namespaces, period).
    const nodeOfInterest = (isText(caret.node) ?
                            caret.node.parentNode! : caret.node) as Element;
    const guiNode = $.data(nodeOfInterest, "wed_mirror_node");

    if (closest(guiNode, this.selector.value, this.editor.guiRoot) === null) {
      return;
    }

    this.textInputKeyToHandler.forEach((handlers: KeyHandler[], key: Key) => {
      // We care only about text input
      if (key.anyModifier()) {
        return;
      }
      const ch = String.fromCharCode(key.which);

      for (const node of text) {
        // Skip those that are not in the tree anymore.
        if (node.parentNode !== null && node.data.indexOf(ch) > -1) {
          for (const handler of handlers) {
            handler("paste", nodeOfInterest, e);
          }
        }
      }
    });
  }
}

//  LocalWords:  InputTrigger keydown tabindex keypress submap jQuery focusable
//  LocalWords:  Dubeau MPL Mangalam gui html DOM
