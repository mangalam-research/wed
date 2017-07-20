/// <reference types="jquery" />
import { Key } from "./key";
export declare type Editor = any;
/**
 * @param eventType The type of event being processed.
 *
 * @param element A DOM element in the **data tree** that was modified or had
 * the caret when the keydown event happened.
 *
 * @param event The jQuery event in question.
 */
export declare type KeyHandler = (eventType: "keypress" | "keydown" | "paste", el: Element, event: JQueryKeyEventObject) => void;
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
export declare class InputTrigger {
    private readonly editor;
    private readonly selector;
    private readonly guiSelector;
    private readonly keyToHandler;
    private readonly textInputKeyToHandler;
    /**
     * @param editor The editor to which this InputTrigger belongs.
     *
     * @param selector This is a CSS selector. The object created by this
     * constructor will listen to events that pertain only to DOM nodes matching
     * this selector. The form this selector can take is constrained by the limits
     * imposed by [["domutil".toGUISelector]]
     */
    constructor(editor: Editor, selector: string);
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
    addKeyHandler(key: Key, handler: KeyHandler): void;
    /**
     * Handles ``keydown`` events.
     *
     * @param wedEvent The DOM event wed generated to trigger this handler.
     *
     * @param e The original DOM event that wed received.
     */
    private keydownHandler(wedEvent, e);
    /**
     * Handles ``keypress`` events.
     *
     * @param wedEvent The DOM event wed generated to trigger this handler.
     *
     * @param e The original DOM event that wed received.
     */
    private keypressHandler(wedEvent, e);
    /**
     * Handles ``paste`` events.
     *
     * @param wedEvent The DOM event wed generated to trigger this handler.
     *
     * @param e The original DOM event that wed received.
     *
     * @param caret The data caret.
     *
     * @param data The data that the user wants to insert.
     */
    private pasteHandler(wedEvent, e, caret, data);
}
