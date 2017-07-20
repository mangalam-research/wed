/// <reference types="jquery" />
import * as salve from "salve";
import { Action } from "./action";
import { CaretManager } from "./caret-manager";
import { DLoc } from "./dloc";
import { Listener } from "./domlistener";
import { GUIUpdater } from "./gui-updater";
import { Transformation, TransformationData } from "./transformation";
import { BeforeInsertNodeAtEvent } from "./tree-updater";
import { Validator } from "./validator";
export interface Editor {
    gui_root: Element;
    data_root: Element;
    max_label_level: number;
    complex_pattern_action: Action<{}>;
    attributes: string;
    validator: Validator;
    caretManager: CaretManager;
    mode: any;
    _makeMenuItemForAction(action: Action<{}>, data?: {}): HTMLElement;
    resolver: salve.NameResolver;
    isAttrProtected(name: string, parent: Element): boolean;
    isAttrProtected(node: Node): boolean;
    toDataNode(el: Node): Node | Attr;
    makeDocumentationLink(url: string): HTMLElement;
    getElementTransformationsAt(pos: DLoc, transformationType: string): {
        name: string;
        tr: Transformation<TransformationData>;
    }[];
    [key: string]: any;
}
/**
 * A decorator is responsible for adding decorations to a tree of DOM
 * elements. Decorations are GUI elements.
 */
export declare class Decorator {
    protected readonly domlistener: Listener;
    protected readonly editor: Editor;
    protected readonly guiUpdater: GUIUpdater;
    private _attributeHidingSpecs;
    /**
     * @param domlistener The listener that the decorator must use to know when
     * the DOM tree has changed and must be redecorated.
     *
     * @param editor The editor instance for which this decorator was created.
     *
     * @param guiUpdater The updater to use to modify the GUI tree. All
     * modifications to the GUI must go through this updater.
     */
    constructor(domlistener: Listener, editor: Editor, guiUpdater: GUIUpdater);
    /**
     * Request that the decorator add its event handlers to its listener.
     */
    addHandlers(): void;
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
     * Generic handler for setting ``contenteditable`` on nodes included into the
     * tree.
     */
    contentEditableHandler(ev: BeforeInsertNodeAtEvent): void;
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
    mustHideAttribute(el: Element, name: string): boolean;
    private readonly attributeHidingSpecs;
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
    protected contextMenuHandler(atStart: boolean, wedEv: JQueryMouseEventObject, ev: Event): boolean;
}
