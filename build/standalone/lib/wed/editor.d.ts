/// <reference types="jquery" />
/// <reference types="bootstrap" />
import "bootstrap";
import { Observable } from "rxjs";
import { Action } from "./action";
import { CaretManager } from "./caret-manager";
import { DLoc, DLocRoot } from "./dloc";
import * as domlistener from "./domlistener";
import * as editorActions from "./editor-actions";
import { GUIUpdater } from "./gui-updater";
import { EditingMenuManager } from "./gui/editing-menu-manager";
import { Minibuffer } from "./gui/minibuffer";
import { Modal, Options as ModalOptions } from "./gui/modal";
import { AddOptions, Toolbar } from "./gui/toolbar";
import { Key } from "./key";
import { EditorAPI, PasteTransformationData, ReplaceRangeTransformationData } from "./mode-api";
import { ModeTree } from "./mode-tree";
import { Options } from "./options";
import { Runtime } from "./runtime";
import { Saver } from "./saver";
import { StockModals } from "./stock-modals";
import { Task, TaskRunner } from "./task-runner";
import { Transformation, TransformationData, TransformationEvent } from "./transformation";
import { TreeUpdater } from "./tree-updater";
import { Undo, UndoEvents } from "./undo";
import { Validator } from "./validator";
export declare const version = "2.0.0";
export declare type KeydownHandler = (wedEv: JQueryEventObject, ev: JQueryKeyEventObject) => boolean;
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
export declare class Editor implements EditorAPI {
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
    private readonly _undo;
    private undoRecorder;
    private saveStatusInterval;
    private readonly globalKeydownHandlers;
    private updatingPlaceholder;
    private readonly preferences;
    private composing;
    private compositionData;
    private validationController;
    private readonly _transformations;
    readonly name: string;
    readonly firstValidationComplete: Promise<Editor>;
    readonly initialized: Promise<Editor>;
    readonly widget: HTMLElement;
    readonly $widget: JQuery;
    readonly $frame: JQuery;
    readonly window: Window;
    readonly doc: Document;
    readonly runtime: Runtime;
    readonly options: Options;
    readonly guiRoot: HTMLElement;
    readonly $guiRoot: JQuery;
    readonly $errorList: JQuery;
    readonly complexPatternAction: Action<{}>;
    readonly pasteTr: Transformation<PasteTransformationData>;
    readonly cutTr: Transformation<TransformationData>;
    readonly splitNodeTr: Transformation<TransformationData>;
    readonly replaceRangeTr: Transformation<ReplaceRangeTransformationData>;
    readonly removeMarkupTr: Transformation<TransformationData>;
    readonly saveAction: Action<{}>;
    readonly decreaseLabelVisibilityLevelAction: Action<{}>;
    readonly increaseLabelVisibilityLevelAction: Action<{}>;
    readonly undoAction: Action<{}>;
    readonly redoAction: Action<{}>;
    readonly toggleAttributeHidingAction: Action<{}>;
    readonly minibuffer: Minibuffer;
    readonly docURL: string;
    readonly transformations: Observable<TransformationEvent>;
    readonly toolbar: Toolbar;
    dataRoot: Document;
    $dataRoot: JQuery;
    maxLabelLevel: number;
    guiDLocRoot: DLocRoot;
    dataDLocRoot: DLocRoot;
    dataUpdater: TreeUpdater;
    guiUpdater: GUIUpdater;
    domlistener: domlistener.DOMListener;
    modals: StockModals;
    mergeWithPreviousHomogeneousSiblingTr: Transformation<TransformationData>;
    mergeWithNextHomogeneousSiblingTr: Transformation<TransformationData>;
    modeTree: ModeTree;
    caretManager: CaretManager;
    validator: Validator;
    editingMenuManager: EditingMenuManager;
    saver: Saver;
    constructor(widget: HTMLElement, options: Options | Runtime);
    readonly undoEvents: Observable<UndoEvents>;
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
    /**
     * Record an undo object in the list of undoable operations.
     *
     * Note that this method also provides the implementation for the restricted
     * method of the same name that allows only [["wed/undo".UndoMarker]] objects.
     *
     * @param undo The object to record.
     */
    recordUndo(undo: Undo): void;
    undoAll(): void;
    undo(): void;
    redo(): void;
    dumpUndo(): void;
    undoingOrRedoing(): boolean;
    isAttrProtected(attr: string, parent: Element): boolean;
    isAttrProtected(attr: Attr | Element): boolean;
    save(): Promise<void>;
    private initiateTextUndo();
    private terminateTextUndo();
    private normalizeEnteredText(text);
    private compensateForAdjacentSpaces(text, caret);
    insertText(text: string): void;
    private spliceAttribute(attrVal, offset, count, add);
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
    private onModeChange(mode);
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
    addToolbarAction(actionClass: editorActions.ActionCtor, options: AddOptions): void;
    /**
     * Creates a new task runner and registers it with the editor so that it is
     * started and stopped by the methods that stop/start all tasks.
     *
     * @param task The task that the runner must run.
     *
     * @returns The new runner.
     */
    newTaskRunner(task: Task): TaskRunner;
    /**
     * Triggers the resizing algorithm.
     */
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
    private globalKeypressHandler(_wedEvent, e);
    private cutSelection();
    private handleKeyInsertingText(e);
    private compositionHandler(ev);
    private inputHandler();
    private mousemoveHandler(e);
    private mousedownHandler(ev);
    private mouseupHandler(ev);
    private mouseoverHandler(ev);
    private mouseoutHandler(ev);
    private refreshSaveStatus();
    private onValidatorStateChange(workingState);
    private onPossibleDueToWildcardChange(node);
    /**
     * Expand the error panel if there is no navigation.
     */
    expandErrorPanelWhenNoNavigation(): void;
    private errorItemHandler(ev);
    setNavigationList(items: Node | JQuery | Node[]): void;
    makeModal(options?: ModalOptions): Modal;
    makeGUITreeTooltip($for: JQuery, options: TooltipOptions): void;
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
    toggleAttributeHiding(): void;
    private closeAllTooltips();
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
    /**
     * Set the location bar to a new location.
     *
     * @param el The element at which the location should point.
     */
    private setLocationTo(el);
    private cut();
    private paste(_editor, data);
    replaceRange(editor: EditorAPI, data: ReplaceRangeTransformationData): void;
}
export { PasteTransformationData, ReplaceRangeTransformationData };
