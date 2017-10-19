/// <reference types="jquery" />
import { Listener } from "./domlistener";
import { GUIUpdater } from "./gui-updater";
import { Mode } from "./mode";
import { Editor } from "./wed";
/**
 * A decorator is responsible for adding decorations to a tree of DOM
 * elements. Decorations are GUI elements.
 */
export declare abstract class Decorator {
    protected readonly mode: Mode;
    protected readonly editor: Editor;
    protected readonly namespaces: Record<string, string>;
    protected readonly domlistener: Listener;
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
    constructor(mode: Mode, editor: Editor);
    /**
     * Request that the decorator add its event handlers to its listener.
     */
    abstract addHandlers(): void;
    /**
     * Start listening to changes to the DOM tree.
     */
    startListening(): void;
    /**
     * This function adds a separator between each child element of the element
     * passed as ``el``. The function only considers ``._real`` elements.
     *
     * @param el The element to decorate.
     *
     * @param sep A separator.
     */
    listDecorator(el: Element, sep: string | Element): void;
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
    elementDecorator(root: Element, el: Element, level: number, preContextHandler: ((wedEv: JQueryMouseEventObject, ev: Event) => boolean) | undefined, postContextHandler: ((wedEv: JQueryMouseEventObject, ev: Event) => boolean) | undefined): void;
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
    protected mustHideAttribute(el: Element, name: string): boolean;
    /**
     * Add or remove the CSS class ``_readonly`` on the basis of the 2nd argument.
     *
     * @param el The element to modify. Must be in the GUI tree.
     *
     * @param readonly Whether the element is readonly or not.
     */
    setReadOnly(el: Element, readonly: boolean): void;
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
    protected contextMenuHandler(atStart: boolean, wedEv: JQueryMouseEventObject, ev: JQueryEventObject): boolean;
}
