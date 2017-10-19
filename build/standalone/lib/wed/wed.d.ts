/// <reference types="jquery" />
import "bootstrap";
import { Action } from "./action";
import { CaretManager } from "./caret-manager";
import { DLoc, DLocRange, DLocRoot } from "./dloc";
import * as domlistener from "./domlistener";
import { GUIUpdater } from "./gui-updater";
import { EditingMenuManager } from "./gui/editing-menu-manager";
import { Minibuffer } from "./gui/minibuffer";
import { Modal, Options as ModalOptions } from "./gui/modal";
import { Key } from "./key";
import { Mode } from "./mode";
import { ModeTree } from "./mode-tree";
import { Options } from "./options";
import { Runtime } from "./runtime";
import { Saver } from "./saver";
import { StockModals } from "./stock-modals";
import { Task, TaskRunner } from "./task-runner";
import { Transformation, TransformationData } from "./transformation";
import { TreeUpdater } from "./tree-updater";
import { Undo } from "./undo";
import { ValidationController } from "./validation-controller";
import { Validator } from "./validator";
export declare const version = "0.30.0";
export declare type KeydownHandler = (wedEv: JQueryEventObject, ev: JQueryKeyEventObject) => boolean;
export interface PasteTransformationData extends TransformationData {
    to_paste: Element;
}
export interface ReplaceRangeTransformationData extends TransformationData {
    range: DLocRange;
    newText: string;
    caretAtEnd: boolean;
}
/**
 * The possible targets for some wed operations that generate events. It is
 * currently used to determine where to type keys when calling [[Editor.type]].
 */
export declare enum WedEventTarget {
    /** The default target is the main editing panel. */
    DEFAULT = 0,
    /** Target the minibuffer. */
    MINIBUFFER = 1,
}
/**
 * This is the class to instantiate for editing.
 */
export declare class Editor {
    private _firstValidationComplete;
    private firstValidationCompleteResolve;
    private initializedResolve;
    private modeData;
    private developmentMode;
    private textUndoMaxLength;
    private readonly taskRunners;
    private taskSuspension;
    private readonly normalizeEnteredSpaces;
    private readonly strippedSpaces;
    private readonly replacedSpaces;
    private destroying;
    private destroyed;
    private initialLabelLevel;
    private currentLabelLevel;
    /** A temporary initialization value. */
    private _dataChild;
    private readonly scroller;
    private readonly constrainer;
    private readonly inputField;
    private readonly $inputField;
    private readonly cutBuffer;
    private readonly caretLayer;
    private readonly errorLayer;
    private readonly wedLocationBar;
    private readonly sidebar;
    private readonly validationProgress;
    private readonly validationMessage;
    private readonly caretOwners;
    private readonly clickedLabels;
    private readonly withCaret;
    private readonly $modificationStatus;
    private readonly $saveStatus;
    private readonly $navigationPanel;
    private readonly $navigationList;
    private readonly $excludedFromBlur;
    private readonly errorItemHandlerBound;
    private readonly appender;
    private _undo;
    private undoRecorder;
    private saveStatusInterval;
    private readonly globalKeydownHandlers;
    private updatingPlaceholder;
    private readonly preferences;
    private composing;
    private compositionData;
    private currentTypeahead;
    /** A name for this editor. */
    name: string;
    /** A promise that resolves once the first validation is complete. */
    readonly firstValidationComplete: Promise<Editor>;
    /** A promise that resolves once the editor is initialized. */
    readonly initialized: Promise<Editor>;
    /** The HTMLElement controlled by this editor */
    readonly widget: HTMLElement;
    /** Same as [[widget]] but as a jQuery object. */
    readonly $widget: JQuery;
    /** The &lt;html> element that holds the widget. */
    readonly $frame: JQuery;
    /** The window which holds the widget. */
    readonly window: Window;
    /** The document which holds the widget. */
    readonly doc: Document;
    /** The runtime associated with this editor. */
    readonly runtime: Runtime;
    /** The options used by this editor. */
    readonly options: Options;
    /** The root of the GUI tree. */
    readonly guiRoot: HTMLElement;
    /** Same as [[guiRoot]] but as a jQuery object. */
    readonly $guiRoot: JQuery;
    /** The list of errors in the sidebar. */
    readonly $errorList: JQuery;
    /**
     * The action to perform is a user is trying to do something with a complex
     * pattern.
     */
    readonly complexPatternAction: Action<{}>;
    /** Paste transformation. */
    readonly pasteTr: Transformation<PasteTransformationData>;
    /** Cut transformation. */
    readonly cutTr: Transformation<TransformationData>;
    /** Transformation for splitting nodes. */
    readonly splitNodeTr: Transformation<TransformationData>;
    /** Replace a range with text. */
    readonly replaceRangeTr: Transformation<ReplaceRangeTransformationData>;
    /** The minibuffer for this editor instance. */
    readonly minibuffer: Minibuffer;
    /** The root of the data tree. */
    dataRoot: Document;
    /** Same as [[dataRoot]] but as a jQuery object. */
    $dataRoot: JQuery;
    /** The maximum label level that labels may have. */
    maxLabelLevel: number;
    /** The [[DLocRoot]] object marking the root of the GUI tree. */
    guiDLocRoot: DLocRoot;
    /** The [[DLocRoot]] object marking the root of the data tree. */
    dataDLocRoot: DLocRoot;
    /** The updater through which all data tree manipulations must be made. */
    dataUpdater: TreeUpdater;
    /** The updater through which all GUI tree manipulations must be made. */
    guiUpdater: GUIUpdater;
    /** DOM listener on the GUI tree. */
    domlistener: domlistener.Listener;
    /** The link for the embedded documentation page. */
    docLink: string;
    /** A collection of stock modals. */
    modals: StockModals;
    mergeWithPreviousHomogeneousSiblingTr: Transformation<TransformationData>;
    mergeWithNextHomogeneousSiblingTr: Transformation<TransformationData>;
    modeTree: ModeTree;
    caretManager: CaretManager;
    validator: Validator;
    validationController: ValidationController;
    editingMenuManager: EditingMenuManager;
    saver: Saver;
    constructor(widget: HTMLElement, options: Options | Runtime);
    /**
     * @param tr The transformation to fire.
     *
     * @param data Arbitrary data to be passed to the transformation.
     */
    fireTransformation<T extends TransformationData>(tr: Transformation<T>, data: T): void;
    private _fireTransformation<T>(tr, data);
    /**
     * Enter a state in which all tasks are suspended. It is possible to call this
     * method while the state is already in effect. Its sister method
     * ``exitTaskSuspension`` should be called the same number of times to resume
     * the tasks.
     */
    private enterTaskSuspension();
    /**
     * Exit a state in which all tasks are suspended. For the state to be
     * effectively exited, this method needs to be called the same number of times
     * ``enterTaskSuspension`` was called.
     */
    private exitTaskSuspension();
    /**
     * Unconditionally stop all tasks.
     */
    private stopAllTasks();
    /**
     * Unconditionally resume all tasks.
     */
    private resumeAllTasks();
    /**
     * If we are not in the task suspended state that is entered upon calling
     * ``enterTaskSuspension``, resume the task right away. Otherwise, this is a
     * no-op.
     */
    resumeTaskWhenPossible(task: TaskRunner): void;
    recordUndo(undo: Undo): void;
    undoAll(): void;
    undo(): void;
    redo(): void;
    dumpUndo(): void;
    undoMarker(msg: string): void;
    undoingOrRedoing(): boolean;
    /**
     * Determines whether an attribute is protected. A protected attribute cannot
     * be deleted, added or edited by the user directly.
     *
     * @param attr The attribute to check. If it is an ``Element``, then it must
     * be an ``_attribute_value`` element from the GUI tree. If it is an ``Attr``
     * then it must be an attribute node from the data tree. If a string, then it
     * must be the attribute name as it would appear in the data tree.
     *
     * @param parent If ``attr`` is a string, then ``parent`` must be set to the
     * element for which the attribute would apply.
     *
     * @returns ``true`` if the attribute is protected.
     */
    isAttrProtected(attr: string, parent: Element): boolean;
    isAttrProtected(attr: Attr | Element): boolean;
    /**
     * Saves the document.
     *
     * @returns A promise that resolves when the save operation is done.
     */
    save(): Promise<void>;
    private initiateTextUndo();
    private terminateTextUndo();
    private normalizeEnteredText(text);
    private compensateForAdjacentSpaces(text, caret);
    private insertText(text);
    private spliceAttribute(attrVal, offset, count, add);
    /**
     * @param loc Location where to insert.
     *
     * @returns The placeholder.
     */
    insertTransientPlaceholderAt(loc: DLoc): Element;
    toDataNode(node: Node): Node | Attr | null;
    fromDataNode(node: Node): Node | null;
    private onSaverSaved();
    private onSaverAutosaved();
    private onSaverChanged();
    private onSaverFailed(event);
    nodeToPath(node: Node | Attr): string;
    pathToNode(path: string): Node | Attr | null;
    getModeData(key: string): any;
    setModeData(key: string, value: any): void;
    destroy(): void;
    init(xmlData?: string): Promise<Editor>;
    onModeChange(mode: Mode): Promise<Editor>;
    private postInitialize();
    /**
     * Handler for setting ``contenteditable`` on nodes included into the
     * tree. This handler preforms an initial generic setup that does not need
     * mode-specific information. It sets ``contenteditable`` to true on any real
     * element or any attribute value.
     */
    private initialContentEditableHandler(ev);
    /**
     * Handler for setting ``contenteditable`` on nodes included into the
     * tree. This handler adjusts whether attribute values are editable by using
     * mode-specific data.
     */
    private finalContentEditableHandler(ev);
    private initializeNamespaces();
    /**
     * Creates a new task runner and registers it with the editor so that it is
     * started and stopped by the methods that stop/start all tasks.
     *
     * @param task The task that the runner must run.
     *
     * @returns The new runner.
     */
    newTaskRunner(task: Task): TaskRunner;
    resize(): void;
    private resizeHandler();
    /**
     * Opens a documentation link.
     *
     * @param url The URL to open.
     */
    openDocumentationLink(url: string): void;
    /**
     * Returns the list of element transformations for the location pointed to by
     * the caret.
     *
     * @param treeCaret The location in the document. This must be a data
     * location, not a GUI location.
     *
     * @param types The types of transformations to get.
     *
     * @return An array of objects having the fields ``tr`` which contain the
     * actual transformation and ``name`` which is the unresolved element name for
     * this transformation. It is exceptionally possible to have an item of the
     * list contain ``undefined`` for ``name``.
     */
    getElementTransformationsAt(treeCaret: DLoc, types: string | string[]): {
        tr: Action<{}>;
        name?: string;
    }[];
    private cutHandler(e);
    private pasteHandler(e);
    private keydownHandler(e);
    pushGlobalKeydownHandler(handler: KeydownHandler): void;
    popGlobalKeydownHandler(handler: KeydownHandler): void;
    private globalKeydownHandler(wedEvent, e);
    private keypressHandler(e);
    /**
     * Simulates typing text in the editor.
     *
     * **NOTE**: this function is limited in what it can simulate. The main
     * editing pane is where you get the most support. Other locations offer less
     * support. One good example is the minibuffer. Typing a string into it works
     * fine. Trying to use directional arrows and backspace/delete currently does
     * not work. We'd have to write custom code to handle these cases because it
     * is not possible, as we speak, to write JavaScript code that **entirely**
     * simulates pressing keyboard keys. (JavaScript easily supports sending the
     * events *generated* by hitting the keyboard, but this is not enough.)
     *
     * @param text The text to type in. An array of keys, a string or a single
     * key.
     */
    type(text: string | Key | Key[], where?: WedEventTarget): void;
    private globalKeypressHandler(wedEvent, e);
    private cutSelection();
    private handleKeyInsertingText(e);
    private compositionHandler(ev);
    private inputHandler();
    private mousemoveHandler(e);
    private mousedownHandler(ev);
    private mouseupHandler(ev);
    private mouseoverHandler(ev);
    private mouseoutHandler(ev);
    /**
     * Brings up a typeahead popup.
     *
     * @param x
     * @param y
     * @param width
     * @param placeholder
     * @param options
     * @param dismissCallback
     * @returns The popup that was created.
     */
    displayTypeaheadPopup(x: number, y: number, width: number, placeholder: string, options: any, dismissCallback: (obj?: {
        value: string;
    }) => void): any;
    private refreshSaveStatus();
    private onValidatorStateChange(workingState);
    private onPossibleDueToWildcardChange(node);
    /**
     * Expand the error panel if there is no navigation.
     */
    expandErrorPanelWhenNoNavigation(): void;
    private errorItemHandler(ev);
    /**
     * Sets the list of items to show in the navigation list. This will make the
     * list appear if it was not displayed previously.
     *
     * @param {Node|jQuery|Array.<Node>} items The items to show.
     */
    setNavigationList(items: Node | JQuery | Node[]): void;
    makeModal(options?: ModalOptions): Modal;
    /**
     * Reset the label visibility level to what it was when the editor was first
     * initialized.
     */
    resetLabelVisibilityLevel(): void;
    /**
     * Set the visibility level to a specific value. It is a no-op if it is called
     * with a value that is less than 0 or greater than the maximum level
     * supported, or if the new level is the same as the current level.
     *
     * @param level The new level.
     */
    setLabelVisibilityLevel(level: number): void;
    increaseLabelVisibilityLevel(): void;
    decreaseLabelVisiblityLevel(): void;
    private closeAllTooltips();
    /**
     * Registers elements that are outside wed's editing pane but should be
     * considered to be part of the editor. These would typically be menus or
     * toolbars that a larger application that uses wed for editing adds around
     * the editing pane.
     *
     * @param elements The elements to register.
     */
    excludeFromBlur(elements: JQuery | Element): void;
    /**
     * Finds the location of the character closest to the ``x, y``
     * coordinates. Very often this will be the character whose bounding client
     * rect encloses the coordinates. However, if no such character exists the
     * algorithm will return the closest character. If multiple characters are at
     * the same distance, then the first one found will be returned.
     *
     * @param x The x coordinate in client coordinates.
     *
     * @param y The y coordinate in client coordinates.
     *
     * @returns The location of the boundary character. The value return is
     * ``undefined`` if the coordinates are outside the client or if the element
     * in which the click occurred is not inside the editor pane (a descendant of
     * ``this.guiRoot``).
     */
    private findLocationAt(x, y);
    private findLocationInElementAt(node, x, y, textOk?);
    private pointToCharBoundary(x, y);
    private caretChange(ev);
    private cut();
    private paste(editor, data);
    replaceRange(editor: Editor, data: ReplaceRangeTransformationData): void;
}
