/**
 * The editor.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import Ajv from "ajv";
import "bootstrap";
import $ from "jquery";
import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import * as salve from "salve";
import { ParsingError, safeParse, WorkingState,
         WorkingStateData } from "salve-dom";

import { Action } from "./action";
import { CaretChange, CaretManager } from "./caret-manager";
import * as caretMovement from "./caret-movement";
import { Clipboard, containsClipboardAttributeCollection } from "./clipboard";
import { DLoc, DLocRoot } from "./dloc";
import * as domlistener from "./domlistener";
import { isAttr, isElement, isText } from "./domtypeguards";
import * as domutil from "./domutil";
// tslint:disable-next-line:no-duplicate-imports
import { closest, closestByClass, htmlToElements, indexOf } from "./domutil";
import * as editorActions from "./editor-actions";
import { AbortTransformationException } from "./exceptions";
import { GUIUpdater } from "./gui-updater";
import { GUIValidationError } from "./gui-validation-error";
import { DialogSearchReplace } from "./gui/dialog-search-replace";
import { EditingMenuManager } from "./gui/editing-menu-manager";
import { ErrorLayer } from "./gui/error-layer";
import * as icon from "./gui/icon";
import { Layer } from "./gui/layer";
import { Minibuffer } from "./gui/minibuffer";
import { Modal, Options as ModalOptions } from "./gui/modal";
import { notify } from "./gui/notify";
import { Direction, QuickSearch } from "./gui/quick-search";
import { Scroller } from "./gui/scroller";
import { AddOptions, Toolbar } from "./gui/toolbar";
import { tooltip } from "./gui/tooltip";
import { AttributeNotFound, GUIRoot } from "./guiroot";
import { Key, makeKey } from "./key";
import * as keyConstants from "./key-constants";
import * as log from "./log";
import { Mode } from "./mode";
import { CutUnitTransformationData, EditorAPI , PasteTransformationData,
         ReplaceRangeTransformationData } from "./mode-api";
import { ModeTree } from "./mode-tree";
import * as onbeforeunload from "./onbeforeunload";
import * as onerror from "./onerror";
import { Options } from "./options";
import * as optionsSchema from "./options-schema.json";
import * as preferences from "./preferences";
import { Runtime } from "./runtime";
import { FailedEvent, SaveKind, Saver, SaverConstructor } from "./saver";
import { SelectionMode, SelectionModeChange } from "./selection-mode";
import { StockModals } from "./stock-modals";
import { Task, TaskRunner } from "./task-runner";
import { insertElement, mergeWithNextHomogeneousSibling,
         mergeWithPreviousHomogeneousSibling, removeMarkup, splitNode,
         Transformation, TransformationData, TransformationEvent,
         TransformationEventSubject } from "./transformation";
import { BeforeInsertNodeAtEvent, TreeUpdater } from "./tree-updater";
import { Undo, UndoEvents, UndoList } from "./undo";
import { UndoRecorder } from "./undo-recorder";
import * as util from "./util";
import { ErrorItemHandler,
         ValidationController } from "./validation-controller";
import { Validator } from "./validator";
import { boundaryXY, getGUINodeIfExists } from "./wed-util";
import * as wundo from "./wundo";

export const version = "3.0.1";

export type KeydownHandler = (wedEv: JQueryEventObject,
                              ev: JQueryKeyEventObject) => boolean;

// We don't put this in keyConstants because ESCAPE_KEYPRESS should never be
// seen elsewhere.
const ESCAPE_KEYPRESS = makeKey(27);

function filterSaveEvents(name: string, ev: { name: string }): boolean {
  return ev.name === name;
}

/**
 * An action for bringing up the complex pattern modal.
 */
class ComplexPatternAction extends Action<{}> {
  private _modal: Modal | undefined;

  get modal(): Modal {
    if (this._modal === undefined) {
      const modal = this._modal = this.editor.makeModal();
      modal.setTitle("Complex Name Pattern Encountered");
      modal.setBody(
        "<p>The schema contains here a complex name pattern modal. While wed \
has no problem validating such cases. It does not currently have facilities to \
add elements or attributes that match such patterns. You can continue editing \
your document but you will not be able to take advantage of the possibilities \
provided by the complex pattern here.</p>");
      modal.addButton("Ok", true);
    }
    return this._modal;
  }

  execute(): void {
    this.modal.modal();
  }
}

interface InsertTextTransformationData extends TransformationData {
  text: string;
}

interface DeleteCharTransformationData extends TransformationData {
  key: Key;
}

/**
 * The possible targets for some wed operations that generate events. It is
 * currently used to determine where to type keys when calling [[Editor.type]].
 */
export enum WedEventTarget {
  /** The default target is the main editing panel. */
  DEFAULT,
  /** Target the minibuffer. */
  MINIBUFFER,
}

enum ClipboardEventHandling {
  /** Set the DOM clipboard to the internal clipboard. */
  SET_CLIPBOARD,

  /** Let the browser handle the event. */
  PASS_TO_BROWSER,

  /** Swallow the event: neither wed, nor the browser do anything. */
  NOOP,
}

const FRAMEWORK_TEMPLATE = "\
<div class='row'>\
 <div class='toolbar'></div>\
 <div class='wed-frame col-sm-push-2 col-lg-10 col-md-10 col-sm-10'>\
  <div class='row'>\
   <div class='progress'>\
    <span></span>\
    <div class='wed-validation-progress progress-bar' style='width: 0%'></div>\
   </div>\
  </div>\
  <div class='row'>\
   <div class='wed-document-constrainer'>\
    <input class='wed-comp-field' type='text'></input>\
    <div class='wed-scroller'>\
     <div class='wed-caret-layer'></div>\
     <div class='wed-error-layer'></div>\
     <div class='wed-document'><span class='root-here'></span></div>\
    </div>\
   </div>\
   <div class='wed-minibuffer'></div>\
   <div class='wed-location-bar'>@&nbsp;<span>&nbsp;</span></div>\
  </div>\
 </div>\
 <div class='wed-sidebar col-sm-pull-10 col-lg-2 col-md-2 col-sm-2'>\
  <div class='wed-save-and-modification-status'>\
   <span class='wed-modification-status label label-success' \
         title='Modification status'>\
    <i class='fa fa-asterisk'></i>\
   </span>\
   <span class='wed-save-status label label-default'>\
    <i class='fa fa-cloud-upload'></i> <span></span>\
   </span>\
  </div>\
  <div id='sidebar-panel' class='panel-group wed-sidebar-panel'>\
   <div class='panel panel-info wed-navigation-panel'>\
    <div class='panel-heading'>\
     <div class='panel-title'>\
      <a class='accordion-toggle' data-toggle='collapse' \
         data-parent='#sidebar-panel' href='#sb-nav-collapse'>Navigation</a>\
     </div>\
    </div>\
   <div id='sb-nav-collapse' data-parent='#sidebar-panel' \
        class='panel-collapse collapse in'>\
     <div id='sb-nav' class='panel-body'>\
      <ul id='navlist' class='nav nav-list'>\
       <li class='inactive'>A list of navigation links will appear here</li>\
      </ul>\
     </div>\
    </div>\
   </div>\
   <div class='panel panel-danger'>\
    <div class='panel-heading'>\
     <div class='panel-title'>\
      <a class='accordion-toggle' data-toggle='collapse'\
         data-parent='#sidebar-panel' href='#sb-errors-collapse'>Errors</a>\
     </div>\
    </div>\
    <div id='sb-errors-collapse' data-parent='#sidebar-panel'\
         class='panel-collapse collapse'>\
     <div id='sb-errors' class='panel-body'>\
      <ul id='sb-errorlist' class='nav nav-list wed-errorlist'>\
       <li class='inactive'></li>\
      </ul>\
     </div>\
    </div>\
   </div>\
  </div>\
 </div>\
</div>";

/**
 * This is the class to instantiate for editing.
 */
export class Editor implements EditorAPI {
  private _firstValidationComplete: boolean = false;
  private firstValidationCompleteResolve!: (value: Editor) => void;
  private initializedResolve!: (value: Editor) => void;
  // tslint:disable-next-line:no-any
  private modeData: any = {};
  private developmentMode: boolean = false;
  private textUndoMaxLength: number = 10;
  private readonly taskRunners: TaskRunner[] = [];
  private taskSuspension: number = 0;
  private clipboardAdd: boolean = false;
  // We may want to make this configurable in the future.
  private readonly normalizeEnteredSpaces: boolean = true;
  private readonly strippedSpaces: RegExp = /\u200B/g;
  private readonly replacedSpaces: RegExp = /\s+/g;
  private destroyed: boolean = false;
  private initialLabelLevel: number = 0;
  private currentLabelLevel: number = 0;
  /** A temporary initialization value. */
  private _dataChild: Element | undefined;
  private readonly scroller: Scroller;
  private readonly constrainer: HTMLElement;
  private readonly inputField: HTMLInputElement;
  private readonly $inputField: JQuery;
  private readonly clipboard: Clipboard;
  private readonly caretLayer: Layer;
  private readonly errorLayer: ErrorLayer;
  private readonly wedLocationBar: HTMLElement;
  private readonly sidebar: HTMLElement;
  private readonly validationProgress: HTMLElement;
  private readonly validationMessage: HTMLElement;
  private readonly caretOwners: NodeListOf<Element>;
  private readonly clickedLabels: NodeListOf<Element>;
  private readonly withCaret: NodeListOf<Element>;
  private readonly $modificationStatus: JQuery;
  private readonly $saveStatus: JQuery;
  private readonly $navigationPanel: JQuery;
  private readonly $navigationList: JQuery;
  private readonly $excludedFromBlur: JQuery;
  private readonly errorItemHandlerBound: ErrorItemHandler;
  private readonly appender: log4javascript.AjaxAppender | undefined;
  private readonly _undo: UndoList;
  private readonly insertTextTr: Transformation<InsertTextTransformationData>;
  private readonly deleteCharTr: Transformation<DeleteCharTransformationData>;
  private _selectionMode: SelectionMode = SelectionMode.SPAN;
  private undoRecorder!: UndoRecorder;
  private saveStatusInterval: number | undefined;
  private readonly globalKeydownHandlers: KeydownHandler[] = [];
  private updatingPlaceholder: number = 0;
  private readonly preferences: preferences.Preferences;
  private composing: boolean = false;
  private compositionData: {
    // tslint:disable-next-line:no-any
    data: any;
    startCaret: DLoc | undefined;
  } | undefined;
  private validationController!: ValidationController;
  private readonly _transformations: TransformationEventSubject =
    new TransformationEventSubject();
  private readonly _selectionModeChanges: Subject<SelectionModeChange> =
    new Subject();

  readonly name: string = "";
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
  readonly pasteUnitTr: Transformation<PasteTransformationData>;
  readonly cutTr: Transformation<TransformationData>;
  readonly cutUnitTr: Transformation<CutUnitTransformationData>;
  readonly deleteSelectionTr: Transformation<TransformationData>;
  readonly splitNodeTr: Transformation<TransformationData>;
  readonly replaceRangeTr: Transformation<ReplaceRangeTransformationData>;
  readonly removeMarkupTr: Transformation<TransformationData>;
  readonly saveAction: Action<{}> =
    new editorActions.Save(this);
  readonly decreaseLabelVisibilityLevelAction: Action<{}> =
    new editorActions.DecreaseLabelVisibilityLevel(this);
  readonly increaseLabelVisibilityLevelAction: Action<{}> =
    new editorActions.IncreaseLabelVisibilityLevel(this);
  readonly undoAction: Action<{}> =
    new editorActions.Undo(this);
  readonly redoAction: Action<{}> =
    new editorActions.Redo(this);
  readonly toggleAttributeHidingAction: Action<{}> =
    new editorActions.ToggleAttributeHiding(this);
  readonly setSelectionModeToSpan: Action<{}> =
    new editorActions.SetSelectionMode(this, "span",
                                       icon.makeHTML("spanSelectionMode"),
                                       SelectionMode.SPAN);
  readonly setSelectionModeToUnit: Action<{}> =
    new editorActions.SetSelectionMode(this, "unit",
                                       icon.makeHTML("unitSelectionMode"),
                                       SelectionMode.UNIT);
  readonly minibuffer: Minibuffer;
  readonly docURL: string;
  readonly transformations: Observable<TransformationEvent> =
    this._transformations.asObservable();
  readonly selectionModeChanges: Observable<SelectionModeChange> =
    this._selectionModeChanges.asObservable();
  readonly toolbar: Toolbar;
  dataRoot!: Document;
  $dataRoot!: JQuery;
  maxLabelLevel: number = 0;
  guiDLocRoot!: DLocRoot;
  dataDLocRoot!: DLocRoot;
  dataUpdater!: TreeUpdater;
  guiUpdater!: GUIUpdater;
  domlistener!: domlistener.DOMListener;
  modals: StockModals;

  mergeWithPreviousHomogeneousSiblingTr: Transformation<TransformationData>;

  mergeWithNextHomogeneousSiblingTr: Transformation<TransformationData>;

  modeTree!: ModeTree;

  caretManager!: CaretManager;

  validator!: Validator;

  editingMenuManager!: EditingMenuManager;

  saver!: Saver;

  // tslint:disable-next-line:max-func-body-length
  constructor(widget: HTMLElement, options: Options | Runtime) {
    // tslint:disable-next-line:promise-must-complete
    this.firstValidationComplete = new Promise((resolve) => {
      this.firstValidationCompleteResolve = resolve;
    });

    // tslint:disable-next-line:promise-must-complete
    this.initialized = new Promise((resolve) => {
      this.initializedResolve = resolve;
    });

    onerror.editors.push(this);

    this.widget = widget;
    this.$widget = $(this.widget);

    // We could be loaded in a frame in which case we should not alter anything
    // outside our frame.
    this.$frame = $(closest(this.widget, "html"));
    const doc = this.doc = this.$frame[0].ownerDocument;
    this.window = doc.defaultView;
    // It is possible to pass a runtime as "options" but if the user passed
    // actual options, then make a runtime from them.
    this.runtime = (options instanceof Runtime) ? options :
      new Runtime(options);
    options = this.runtime.options;

    this.modals = new StockModals(this);

    // ignore_module_config allows us to completely ignore the module config. In
    // some case, it may be difficult to just override individual values.
    // tslint:disable-next-line:no-any strict-boolean-expressions
    if ((options as any).ignore_module_config) {
      console.warn("the option ignore_module_config is no longer useful");
    }

    const ajv = new Ajv();
    const optionsValidator = ajv.compile(optionsSchema);

    if (!optionsValidator(options)) {
      // tslint:disable-next-line:prefer-template
      throw new Error("the options passed to wed are not valid: " +
                      ajv.errorsText(optionsValidator.errors!, {
                        dataVar: "options",
                      }));
    }

    if (options.ajaxlog !== undefined) {
      this.appender = log.addURL(options.ajaxlog.url, options.ajaxlog.headers);
    }

    this.name = options.name !== undefined ? options.name : "";
    this.options = options;

    const docURL = this.options.docURL;
    this.docURL = docURL == null ? "./doc/index.html" : docURL;

    this.preferences = new preferences.Preferences({
      tooltips: true,
    });

    // This structure will wrap around the document to be edited.
    //
    // We duplicate data-parent on the toggles and on the collapsible
    // elements due to a bug in Bootstrap 3.0.0. See
    // https://github.com/twbs/bootstrap/issues/9933.
    //
    const framework = htmlToElements(FRAMEWORK_TEMPLATE, doc)[0] as HTMLElement;

    //
    // Grab all the references we need while framework does not yet contain the
    // document to be edited. (Faster!)
    //

    const guiRoot = this.guiRoot =
      framework.getElementsByClassName("wed-document")[0] as HTMLElement;
    this.$guiRoot = $(guiRoot);
    this.scroller =
      new Scroller(
        framework.getElementsByClassName("wed-scroller")[0] as HTMLElement);

    this.constrainer =
      framework
      .getElementsByClassName("wed-document-constrainer")[0] as HTMLElement;

    const toolbar = this.toolbar = new Toolbar();
    const toolbarPlaceholder = framework.getElementsByClassName("toolbar")[0];
    toolbarPlaceholder.parentNode!.insertBefore(toolbar.top,
                                                toolbarPlaceholder);
    toolbarPlaceholder.parentNode!.removeChild(toolbarPlaceholder);

    this.inputField =
      framework.getElementsByClassName("wed-comp-field")[0] as HTMLInputElement;
    this.$inputField = $(this.inputField);
    this.clipboard = new Clipboard();

    this.caretLayer = new Layer(
      framework.getElementsByClassName("wed-caret-layer")[0] as HTMLElement);
    this.errorLayer = new ErrorLayer(
      framework.getElementsByClassName("wed-error-layer")[0] as HTMLElement);

    this.wedLocationBar =
      framework.getElementsByClassName("wed-location-bar")[0] as HTMLElement;

    this.minibuffer = new Minibuffer(
      framework.getElementsByClassName("wed-minibuffer")[0] as HTMLElement);

    const sidebar = this.sidebar =
      framework.getElementsByClassName("wed-sidebar")[0] as HTMLElement;

    this.validationProgress =
      framework
      .getElementsByClassName("wed-validation-progress")[0] as HTMLElement;
    this.validationMessage =
      this.validationProgress.previousElementSibling as HTMLElement;

    // Insert the framework and put the document in its proper place.
    const rootPlaceholder = framework.getElementsByClassName("root-here")[0];

    if (this.widget.firstChild !== null) {
      // tslint:disable-next-line:no-any
      if (!(this.widget.firstChild instanceof (this.window as any).Element)) {
        throw new Error("the data is populated with DOM elements constructed " +
                        "from another window");
      }

      rootPlaceholder.parentNode!.insertBefore(this.widget.firstChild,
                                               rootPlaceholder);
    }
    rootPlaceholder.parentNode!.removeChild(rootPlaceholder);
    this.widget.appendChild(framework);

    this.caretOwners = guiRoot.getElementsByClassName("_owns_caret");
    this.clickedLabels = guiRoot.getElementsByClassName("_label_clicked");
    this.withCaret = guiRoot.getElementsByClassName("_with_caret");

    this.$modificationStatus =
      $(sidebar.getElementsByClassName("wed-modification-status")[0]);
    this.$saveStatus =
      $(sidebar.getElementsByClassName("wed-save-status")[0]);

    this.$navigationPanel =
      $(sidebar.getElementsByClassName("wed-navigation-panel")[0]);
    this.$navigationPanel.css("display", "none");

    this.$navigationList = $(doc.getElementById("navlist"));
    this.$errorList = $(doc.getElementById("sb-errorlist"));
    this.$excludedFromBlur = $();
    this.errorItemHandlerBound = this.errorItemHandler.bind(this);
    this._undo = new UndoList();

    this.complexPatternAction = new ComplexPatternAction(
      this, "Complex name pattern", undefined, icon.makeHTML("exclamation"),
      true);

    this.pasteTr = new Transformation(this, "add", "Paste",
                                      this.paste.bind(this));
    this.pasteUnitTr = new Transformation(this, "add", "Paste Unit",
                                          this.pasteUnit.bind(this));
    this.cutTr = new Transformation(this, "delete", "Cut", this.cut.bind(this));
    this.cutUnitTr = new Transformation(this, "delete", "Cut Unit",
                                        this.cutUnit.bind(this));
    this.deleteSelectionTr =
      new Transformation(this, "delete", "Delete Selection",
                         this._deleteSelection.bind(this));

    this.replaceRangeTr =
      new Transformation(
        this, "transform", "Replace Range", this.replaceRange.bind(this));

    this.splitNodeTr =
      new Transformation(this, "split", "Split <name>",
                         (editor, data) => {
                           splitNode(editor, data.node!);
                         });

    this.insertTextTr = new Transformation<InsertTextTransformationData>(
      this, "add", "Insert text", this._insertText.bind(this),
      {
        treatAsTextInput: true,
      });
    this.deleteCharTr = new Transformation<DeleteCharTransformationData>(
      this, "delete", "Insert text", this._deleteChar.bind(this),
      {
        treatAsTextInput: true,
      });

    this.mergeWithPreviousHomogeneousSiblingTr =
      new Transformation(
        this, "merge-with-previous", "Merge <name> with previous",
        (editor, data) => {
          mergeWithPreviousHomogeneousSibling(editor, data.node as Element);
        });

    this.mergeWithNextHomogeneousSiblingTr =
      new Transformation(
        this, "merge-with-next", "Merge <name> with next",
        (editor, data) => {
          mergeWithNextHomogeneousSibling(editor, data.node as Element);
        });

    this.removeMarkupTr =
      new Transformation(this, "delete", "Remove mixed-content markup",
                         removeMarkup, {
                           abbreviatedDesc: "Remove mixed-content markup",
                           iconHtml: "<i class='fa fa-eraser'></i>",
                           needsInput: true,
                         });

    toolbar.addButton([this.saveAction.makeButton(),
                       this.undoAction.makeButton(),
                       this.redoAction.makeButton(),
                       this.decreaseLabelVisibilityLevelAction.makeButton(),
                       this.increaseLabelVisibilityLevelAction.makeButton(),
                       this.removeMarkupTr.makeButton(),
                       this.toggleAttributeHidingAction.makeButton(),
                       this.setSelectionModeToSpan.makeButton(),
                       this.setSelectionModeToUnit.makeButton()]);

    // Setup the cleanup code.
    $(this.window).on("unload.wed", { editor: this }, (e) => {
      e.data.editor.destroy();
    });

    $(this.window).on("popstate.wed", () => {
      if (document.location.hash === "") {
        this.guiRoot.scrollTop = 0;
      }
    });
  }

  get undoEvents(): Observable<UndoEvents> {
    return this._undo.events;
  }

  get selectionMode(): SelectionMode {
    return this._selectionMode;
  }

  set selectionMode(value: SelectionMode) {
    const different = this._selectionMode !== value;
    if (different) {
      this.caretManager.collapseSelection();
      this._selectionMode = value;
      this._selectionModeChanges.next({ name: "SelectionModeChange", value });
    }
  }

  fireTransformation<T extends TransformationData>(tr: Transformation<T>,
                                                   data: T): void {
    // This is necessary because our context menu saves/restores the selection
    // using rangy. If we move on without this call, then the transformation
    // could destroy the markers that rangy put in and rangy will complain.
    this.editingMenuManager.dismiss();
    let currentGroup = this._undo.getGroup();
    let textUndo: wundo.UndoGroup | undefined;
    if (tr.treatAsTextInput) {
      textUndo = this.initiateTextUndo();
    }
    else if (currentGroup instanceof wundo.TextUndoGroup) {
      this._undo.endGroup();
    }

    const newGroup = new wundo.UndoGroup(`Undo ${tr.getDescriptionFor(data)}`,
                                         this);
    this._undo.startGroup(newGroup);
    this.caretManager.mark.suspend();
    this.enterTaskSuspension();
    try {
      try {
        // We've separated the core of the work into a another method so that it
        // can be optimized.
        this._fireTransformation(tr, data);
      }
      catch (ex) {
        // We want to log it before we attempt to do anything else.
        if (!(ex instanceof AbortTransformationException)) {
          log.handle(ex);
        }
        throw ex;
      }
      finally {
        if (textUndo !== undefined) {
          textUndo.recordCaretAfter();
        }
        // It is possible for a transformation to create new subgroups without
        // going through fireTransformation. So we terminate all groups until
        // the last one we terminated is the one we created.
        do {
          currentGroup = this._undo.getGroup();
          this._undo.endGroup();
        } while (currentGroup !== newGroup);
      }
    }
    catch (ex) {
      this.undo();
      if (!(ex instanceof AbortTransformationException)) {
        throw ex;
      }
    }
    finally {
      this.caretManager.mark.resume();
      this.exitTaskSuspension();
      this.validationController.refreshErrors();
    }
  }

  private _fireTransformation<T extends TransformationData>(
    tr: Transformation<T>,
    data: T): void {
    const node = data.node;
    if (node !== undefined) {
      // Convert the gui node to a data node
      if (this.guiRoot.contains(node)) {
        const dataNode = this.toDataNode(node);
        data.node = dataNode === null ? undefined : dataNode;
      }
      else {
        if (!domutil.contains(this.dataRoot, node)) {
          throw new Error("node is neither in the gui tree nor the data tree");
        }
      }
    }

    const caret = data.moveCaretTo;
    if (caret !== undefined) {
      this.caretManager.setCaret(caret);
    }

    if (this.caretManager.caret === undefined) {
      throw new Error("transformation applied with undefined caret.");
    }

    const start =
      new TransformationEvent("StartTransformation",
                              tr as Transformation<TransformationData>);
    this._transformations.next(start);
    start.throwIfAborted();

    tr.handler(this, data);
    const end =
      new TransformationEvent("EndTransformation",
                              tr as Transformation<TransformationData>);
    this._transformations.next(end);
    end.throwIfAborted();
  }

  /**
   * Enter a state in which all tasks are suspended. It is possible to call this
   * method while the state is already in effect. Its sister method
   * ``exitTaskSuspension`` should be called the same number of times to resume
   * the tasks.
   */
  private enterTaskSuspension(): void {
    if (this.taskSuspension === 0) {
      this.stopAllTasks();
    }
    this.taskSuspension++;
  }

  /**
   * Exit a state in which all tasks are suspended. For the state to be
   * effectively exited, this method needs to be called the same number of times
   * ``enterTaskSuspension`` was called.
   */
  private exitTaskSuspension(): void {
    this.taskSuspension--;
    if (this.taskSuspension < 0) {
      throw new Error("exitTaskSuspension underflow");
    }
    if (this.taskSuspension === 0) {
      this.resumeAllTasks();
    }
  }

  /**
   * Unconditionally stop all tasks.
   */
  private stopAllTasks(): void {
    for (const runner of this.taskRunners) {
      runner.stop();
    }

    this.validationController.stop();
  }

  /**
   * Unconditionally resume all tasks.
   */
  private resumeAllTasks(): void {
    for (const runner of this.taskRunners) {
      runner.resume();
    }

    // The validator is a special case. And yes, ``start`` is the correct method
    // to call on it.
    this.validationController.resume();
  }

  /**
   * If we are not in the task suspended state that is entered upon calling
   * ``enterTaskSuspension``, resume the task right away. Otherwise, this is a
   * no-op.
   */
  resumeTaskWhenPossible(task: TaskRunner): void {
    if (this.taskSuspension === 0) {
      task.resume();
    }
  }

  /**
   * Record an undo object in the list of undoable operations.
   *
   * Note that this method also provides the implementation for the restricted
   * method of the same name that allows only [["wed/undo".UndoMarker]] objects.
   *
   * @param undo The object to record.
   */
  recordUndo(undo: Undo): void {
    this._undo.record(undo);
  }

  undoAll(): void {
    while (this._undo.canUndo()) {
      this.undo();
    }
  }

  undo(): void {
    // We need to replicate to some extent how fireTransformation inhibits
    // functions and reinstates them.
    this.caretManager.mark.suspend();
    this.enterTaskSuspension();

    this.undoRecorder.suppressRecording(true);
    this._undo.undo();
    this.undoRecorder.suppressRecording(false);

    this.caretManager.mark.resume();
    this.exitTaskSuspension();
  }

  redo(): void {
    // We need to replicate to some extent how fireTransformation inhibits
    // functions and reinstates them.
    this.caretManager.mark.suspend();
    this.enterTaskSuspension();

    this.undoRecorder.suppressRecording(true);
    this._undo.redo();
    this.undoRecorder.suppressRecording(false);

    this.caretManager.mark.resume();
    this.exitTaskSuspension();
  }

  dumpUndo(): void {
    // tslint:disable-next-line:no-console
    console.log(this._undo.toString());
  }

  undoingOrRedoing(): boolean {
    return this._undo.undoingOrRedoing();
  }

  isAttrProtected(attr: string, parent: Element): boolean;
  isAttrProtected(attr: Attr | Element): boolean;
  isAttrProtected(attr: Attr | Element | string, parent?: Element): boolean {
    let name;
    if (typeof attr === "string") {
      name = attr;
      if (parent === undefined) {
        throw new Error("must specify a parent");
      }
    }
    else if (isAttr(attr)) {
      name = attr.name;
    }
    else if (isElement(attr)) {
      name = domutil.siblingByClass(attr, "_attribute_name")!.textContent!;
    }
    else {
      throw new Error("unexpected value for attr");
    }

    return (name === "xmlns" || name.lastIndexOf("xmlns:", 0) === 0);
  }

  save(): Promise<void> {
    return this.saver.save();
  }

  private initiateTextUndo(): wundo.UndoGroup {
    // Handle undo information
    let currentGroup = this._undo.getGroup();
    if (currentGroup === undefined ||
        !(currentGroup instanceof wundo.TextUndoGroup)) {
      currentGroup = new wundo.TextUndoGroup("text", this, this._undo,
                                             this.textUndoMaxLength);
      this._undo.startGroup(currentGroup);
    }

    return currentGroup as wundo.UndoGroup;
  }

  private terminateTextUndo(): void {
    const currentGroup = this._undo.getGroup();
    if (currentGroup instanceof wundo.TextUndoGroup) {
      this._undo.endGroup();
    }
  }

  private normalizeEnteredText(text: string): string {
    if (!this.normalizeEnteredSpaces) {
      return text;
    }

    return text.replace(this.strippedSpaces, "")
      .replace(this.replacedSpaces, " ");
  }

  private compensateForAdjacentSpaces(text: string, caret: DLoc): string {
    if (!this.normalizeEnteredSpaces) {
      return text;
    }

    const arCaret = caret.toArray();
    // If there is previous text and the previous text
    // is a space, then we need to prevent a double
    // space.
    if (text[0] === " " &&
        domutil.getCharacterImmediatelyBefore(arCaret) === " ") {
      text = text.slice(1);
    }

    // Same with the text that comes after.
    if (text.length > 0 && text[text.length - 1] === " " &&
        domutil.getCharacterImmediatelyAt(arCaret) === " ") {
      text = text.slice(-1);
    }

    return text;
  }

  insertText(text: string): void {
    // We remove zero-width spaces.
    text = this.normalizeEnteredText(text);

    if (text === "" || this.caretManager.caret === undefined) {
      return;
    }

    this.fireTransformation<InsertTextTransformationData>(this.insertTextTr,
                                                          { text });
  }

  private _insertText(_editor: EditorAPI,
                      data: InsertTextTransformationData): void {
    this.closeAllTooltips();

    const { caretManager } = this;
    let caret = caretManager.caret;
    if (caret === undefined) {
      return;
    }

    let { text } = data;
    const el = closestByClass(caret.node, "_real", this.guiRoot);
    // We do not operate on elements that are readonly.
    if (el === null || el.classList.contains("_readonly")) {
      return;
    }

    const attrVal = closestByClass(caret.node, "_attribute_value",
                                   this.guiRoot);
    if (attrVal === null) {
      caret = caretManager.getDataCaret()!;
      text = this.compensateForAdjacentSpaces(text, caret);
      if (text === "") {
        return;
      }

      const { caret: newCaret } = this.dataUpdater.insertText(caret, text);
      caretManager.setCaret(newCaret, { textEdit: true });
    }
    else {
      // Modifying an attribute...
      this.spliceAttribute(attrVal as HTMLElement, caret.offset, 0, text);
    }
  }

  /**
   * Delete a single character of text at caret.
   *
   * @param key The keyboard key that performs the deletion.
   *
   * @returns Whether a character was deleted.
   */
  private deleteChar(key: Key): void {
    this.fireTransformation<DeleteCharTransformationData>(this.deleteCharTr,
                                                          { key });
  }

  private _deleteChar(_editor: EditorAPI,
                      data: DeleteCharTransformationData): void {
    const { key } = data;
    const { caretManager } = this;
    let caret = caretManager.getDataCaret()!;
    switch (key) {
      case keyConstants.BACKSPACE: {
        // If the container is not a text node, we may still be just behind a
        // text node from which we can delete. Handle this.
        if (!isText(caret.node)) {
          const last = caret.node.childNodes[caret.offset - 1];
          // tslint:disable-next-line:no-any
          const length: number | undefined = (last as any).length;
          caret = caret.make(last, length);

          if (!isText(caret.node)) {
            return;
          }
        }

        // At start of text, nothing to delete.
        if (caret.offset === 0) {
          return;
        }

        caret = caret.makeWithOffset(caret.offset - 1);
        break;
      }
      case keyConstants.DELETE: {
        // If the container is not a text node, we may still be just AT a text
        // node from which we can delete. Handle this.
        if (!isText(caret.node)) {
          caret = caret.make(caret.node.childNodes[caret.offset], 0);
          if (!isText(caret.node)) {
            return;
          }
        }

        break;
      }
      default:
        throw new Error(`cannot handle deleting with key ${key}`);
    }

    // We need to grab the parent and offset before we do the transformation,
    // because the node may be removed from its tree.
    const parent = caret.node.parentNode!;
    const offset = indexOf(parent.childNodes, caret.node);
    this.dataUpdater.deleteText(caret, 1);
    // Don't set the caret inside a node that has been deleted.
    if (caret.node.parentNode !== null) {
      caretManager.setCaret(caret, { textEdit: true });
    }
    else {
      caretManager.setCaret(parent, offset, { textEdit: true });
    }
  }

  private spliceAttribute(attrVal: HTMLElement, offset: number, count: number,
                          add: string): void {
    if (offset < 0) {
      return;
    }

    // We ignore changes to protected attributes.
    if (this.isAttrProtected(attrVal)) {
      return;
    }

    // We ignore changes to non-editable attributes.
    if (this.modeTree.getAttributeHandling(attrVal) !== "edit") {
      return;
    }

    let val = (this.toDataNode(attrVal) as Attr).value;
    if (offset > val.length) {
      return;
    }

    if (offset === val.length && count > 0) {
      return;
    }

    if (this.normalizeEnteredSpaces) {
      if (add[0] === " " && val[offset - 1] === " ") {
        add = add.slice(1);
      }

      if (add[add.length - 1] === " " && val[offset + count] === " ") {
        add = add.slice(-1);
      }
    }

    val = val.slice(0, offset) + add + val.slice(offset + count);
    offset += add.length;
    const dataReal =
      $.data(closestByClass(attrVal, "_real")!, "wed_mirror_node");
    const guiPath = this.nodeToPath(attrVal);
    const name =
      domutil.siblingByClass(attrVal, "_attribute_name")!.textContent!;
    const mode = this.modeTree.getMode(attrVal);
    const resolved = mode.getAbsoluteResolver().resolveName(name, true);
    if (resolved === undefined) {
      throw new Error(`cannot resolve ${name}`);
    }
    this.dataUpdater.setAttributeNS(dataReal, resolved.ns, resolved.name,
                                    val);
    // Redecoration of the attribute's element may have destroyed our old
    // attrVal node. Refetch. And after redecoration, the attribute value
    // element may not have a child. Not only that, but the attribute may no
    // longer be shown at all.
    let moveTo;
    try {
      moveTo = this.pathToNode(guiPath)!;
      if (moveTo.firstChild !== null) {
        moveTo = moveTo.firstChild;
      }
    }
    catch (ex) {
      if (!(ex instanceof AttributeNotFound)) {
        throw ex;
      }
    }

    // We don't have an attribute to go back to. Go back to the element that
    // held the attribute.
    if (moveTo == null) {
      moveTo = dataReal;
      offset = 0;
    }

    this.caretManager.setCaret(moveTo, offset, { textEdit: true });
  }

  insertTransientPlaceholderAt(loc: DLoc): Element {
    const ph =
      // tslint:disable-next-line:no-jquery-raw-elements
      $("<span class='_placeholder _transient'> </span>",
        loc.node.ownerDocument)[0];
    this.guiUpdater.insertNodeAt(loc, ph);
    return ph;
  }

  toDataNode(node: Node): Node | Attr | null {
    if (isElement(node)) {
      const ret = $.data(node, "wed_mirror_node");
      // We can bypass the whole pathToNode, nodeToPath thing.
      if (ret != null) {
        return ret;
      }
    }

    return this.dataUpdater.pathToNode(this.nodeToPath(node));
  }

  fromDataNode(node: Node): Node | null {
    if (isElement(node)) {
      const ret = $.data(node, "wed_mirror_node");
      // We can bypass the whole pathToNode, nodeToPath thing.
      if (ret != null) {
        return ret;
      }
    }

    return this.pathToNode(this.dataUpdater.nodeToPath(node));
  }

  private onSaverSaved(): void {
    notify("Saved", { type: "success" });
    this.refreshSaveStatus();
  }

  private onSaverAutosaved(): void {
    notify("Autosaved", { type: "success" });
    this.refreshSaveStatus();
  }

  private onSaverChanged(): void {
    this.refreshSaveStatus();
  }

  private onSaverFailed(event: FailedEvent): void {
    this.refreshSaveStatus();
    const error = event.error;
    if (error.type === "too_old") {
      // Reload when the modal is dismissed.
      this.modals.getModal("tooOld").modal(
        this.window.location.reload.bind(this.window.location));
    }
    else if (error.type === "save_disconnected") {
      this.modals.getModal("disconnect").modal(() => {
        // tslint:disable-next-line:no-floating-promises
        this.save();
      });
    }
    else if (error.type === "save_edited") {
      this.modals.getModal("editedByOther").modal(() => {
        this.window.location.reload();
      });
    }
    else {
      notify(`Failed to save!\n${error.msg}`, { type: "danger" });
    }
  }

  nodeToPath(node: Node | Attr): string {
    return this.guiDLocRoot.nodeToPath(node);
  }

  pathToNode(path: string): Node | Attr | null {
    return this.guiDLocRoot.pathToNode(path);
  }

  // tslint:disable-next-line:no-any
  getModeData(key: string): any {
    return this.modeData[key];
  }

  // tslint:disable-next-line:no-any
  setModeData(key: string, value: any): void {
    this.modeData[key] = value;
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    const myIndex = onerror.editors.indexOf(this);
    if (myIndex >= 0) {
      onerror.editors.splice(myIndex, 1);
    }

    //
    // This is imperfect, but the goal here is to do as much work as possible,
    // even if things have not been initialized fully.
    //
    // The last recorded exception will be rethrown at the end.
    //

    // Turn off autosaving.
    if (this.saver !== undefined) {
      this.saver.setAutosaveInterval(0);
    }

    if (this.saveStatusInterval !== undefined) {
      clearInterval(this.saveStatusInterval);
    }

    try {
      if (this.validationController !== undefined) {
        this.validationController.terminate();
      }
    }
    catch (ex) {
      log.unhandled(ex);
    }

    if (this.taskRunners !== undefined) {
      for (const runner of this.taskRunners) {
        try {
          runner.stop();
        }
        catch (ex) {
          log.unhandled(ex);
        }
      }
    }

    try {
      if (this.domlistener !== undefined) {
        this.domlistener.stopListening();
        this.domlistener.clearPending();
      }
    }
    catch (ex) {
      log.unhandled(ex);
    }

    if (this.editingMenuManager !== undefined) {
      this.editingMenuManager.dismiss();
    }

    // These ought to prevent jQuery leaks.
    try {
      this.$widget.empty();
      this.$frame.find("*").off(".wed");
      // This will also remove handlers on the window.
      $(this.window).off(".wed");
    }
    catch (ex) {
      log.unhandled(ex);
    }

    // Trash our variables: this will likely cause immediate failure if the
    // object is used again.
    for (const key of Object.keys(this)) {
      // tslint:disable-next-line:no-any
      delete (this as any)[key];
    }

    if (this.appender !== undefined) {
      log.removeAppender(this.appender);
    }

    // ... but keep these two. Calling destroy over and over is okay.
    this.destroyed = true;
    // tslint:disable-next-line:no-empty
    this.destroy = function fakeDestroy(): void {};
  }

  async init(xmlData?: string): Promise<Editor> {
    const parser = new this.window.DOMParser();
    if (xmlData !== undefined && xmlData !== "") {
      this.dataRoot = parser.parseFromString(xmlData, "text/xml");
      this._dataChild = this.dataRoot.firstChild as Element;
    }
    else {
      this.dataRoot = parser.parseFromString("<div></div>", "text/xml");
      this._dataChild = undefined;
    }
    this.dataRoot.removeChild(this.dataRoot.firstChild!);

    // $dataRoot is the document we are editing, $guiRoot will become decorated
    // with all kinds of HTML elements so we keep the two separate.
    this.$dataRoot = $(this.dataRoot);

    this.guiDLocRoot = new GUIRoot(this.guiRoot);
    this.dataDLocRoot = new DLocRoot(this.dataRoot);

    this.dataUpdater = new TreeUpdater(this.dataRoot);
    this.guiUpdater = new GUIUpdater(this.guiRoot, this.dataUpdater);
    this.undoRecorder = new UndoRecorder(this, this.dataUpdater);

    this.guiUpdater.events.subscribe((ev) => {
      switch (ev.name) {
      case "BeforeInsertNodeAt":
        if (isElement(ev.node)) {
          this.newContentHandler(ev);
        }
        break;
      default:
      }
    });

    // This is a workaround for a problem in Bootstrap >= 3.0.0 <= 3.2.0. When
    // removing a Node that has an tooltip associated with it and the trigger is
    // delayed, a timeout is started which may timeout *after* the Node and its
    // tooltip are removed from the DOM. This causes a crash.
    //
    // All versions >= 3.0.0 also suffer from leaving the tooltip up if the Node
    // associated with it is deleted from the DOM. This does not cause a crash
    // but must be dealt with to avoid leaving orphan tooltips around.
    //
    this.guiUpdater.events.subscribe((ev) => {
      if (ev.name !== "BeforeDeleteNode") {
        return;
      }

      const { node } = ev;
      if (isElement(node)) {
        this.guiUpdater.removeTooltips(node);
      }
    });

    this.domlistener = new domlistener.DOMListener(this.guiRoot,
                                                   this.guiUpdater);

    this.modeTree = new ModeTree(this, this.options.mode);

    await this.modeTree.init();
    return this.onModeChange(this.modeTree.getMode(this.guiRoot));
  }

  private async onModeChange(mode: Mode): Promise<Editor> {
    // We purposely do not raise an error here so that calls to destroy can be
    // done as early as possible. It aborts the initialization sequence without
    // causing an error.
    if (this.destroyed) {
      return this;
    }

    this.maxLabelLevel = this.modeTree.getMaxLabelLevel();
    this.initialLabelLevel = this.modeTree.getInitialLabelLevel();
    this.currentLabelLevel = this.initialLabelLevel;

    const styles = this.modeTree.getStylesheets();
    const $head = this.$frame.children("head");
    for (const style of styles) {
      $head.append(`<link rel="stylesheet" href="${style}" type="text/css" />`);
    }

    this.guiRoot.setAttribute("tabindex", "-1");
    this.$guiRoot.focus();

    this.caretManager = new CaretManager(
      this.guiDLocRoot,
      this.dataDLocRoot,
      this.inputField,
      this.guiUpdater,
      this.caretLayer,
      this.scroller,
      this.modeTree);
    this.editingMenuManager = new EditingMenuManager(this);
    this.caretManager.events.subscribe(this.caretChange.bind(this));
    this.resizeHandler();

    let schema: salve.Grammar;
    const schemaOption = this.options.schema;
    if (schemaOption instanceof salve.Grammar) {
      schema = schemaOption;
    }
    else if (typeof schemaOption === "string") {
      const schemaText = await this.runtime.resolveToString(schemaOption);
      schema = salve.constructTree(schemaText);
    }
    else {
      throw new Error("unexpected value for schema");
    }

    this.validator = new Validator(schema, this.dataRoot,
                                   this.modeTree.getValidators());
    this.validator.events.addEventListener(
      "state-update", this.onValidatorStateChange.bind(this));
    this.validator.events.addEventListener(
      "possible-due-to-wildcard-change",
      this.onPossibleDueToWildcardChange.bind(this));
    this.validationController =
      new ValidationController(this,
                               this.validator,
                               mode.getAbsoluteResolver(),
                               this.scroller,
                               this.guiRoot,
                               this.validationProgress,
                               this.validationMessage,
                               this.errorLayer,
                               this.$errorList[0],
                               this.errorItemHandlerBound);
    return this.postInitialize();
  }

  // tslint:disable-next-line:max-func-body-length
  private async postInitialize(): Promise<Editor> {
    if (this.destroyed) {
      return this;
    }

    // Make the validator revalidate the structure from the point where a change
    // occurred.
    this.domlistener.addHandler(
      "children-changed",
      "._real, ._phantom_wrap, .wed-document",
      (_root: Node, added: Node[], removed: Node[], _prev: Node | null,
       _next: Node | null, target: Element) => {
        for (const child of added.concat(removed)) {
          if (isText(child) ||
              (isElement(child) &&
               (child.classList.contains("_real") ||
                child.classList.contains("_phantom_wrap")))) {
            this.validator.resetTo(target);
            break;
          }
        }
      });

    // Revalidate on attribute change.
    this.domlistener.addHandler(
      "attribute-changed",
      "._real",
      (_root: Node, el: Element, namespace: string, name: string) => {
        if (namespace === "" && name.indexOf("data-wed", 0) === 0) {
          // Doing the restart immediately messes up the editing. So schedule it
          // for ASAP.
          setTimeout(() => {
            if (this.destroyed) {
              return;
            }
            this.validator.resetTo(el);
          }, 0);
        }
      });

    // Revalidate on text change.
    this.domlistener.addHandler("text-changed", "._real",
                                (_root: Node, text: Node) => {
                                  this.validator.resetTo(text);
                                });

    this.modeTree.addDecoratorHandlers();

    this.domlistener.addHandler(
      "included-element",
      "._label",
      (_root: Node, _tree: Node, _parent: Node, _prev: Node | null,
       _next: Node | null, target: Element) => {
         const cl = target.classList;
         let found: number | undefined;
         for (let i = 0; i < cl.length && found === undefined; ++i) {
           if (cl[i].lastIndexOf("_label_level_", 0) === 0) {
             found = Number(cl[i].slice(13));
           }
         }
         if (found === undefined) {
           throw new Error("unable to get level");
         }
         if (found > this.currentLabelLevel) {
           cl.add("_invisible");
         }
       });

    // If an element is edited and contains a placeholder, delete the
    // placeholder
    this.domlistener.addHandler(
      "children-changed",
      "._real, ._phantom_wrap, .wed-document",
      // tslint:disable-next-line:cyclomatic-complexity
      (_root: Node, _added: Node[], removed: Node[], _prev: Node | null,
       _next: Node | null, target: Element) => {
         if (this.updatingPlaceholder !== 0) {
           return;
         }

         this.updatingPlaceholder++;

         // We perform this check on the GUI tree because there's no way to know
         // about ._phantom._text elements in the data tree.
         const toConsider: Node[] = [];
         let ph: Element | undefined;
         let child = target.firstChild;
         while (child !== null) {
           if (isText(child) ||
               (isElement(child) &&
                (child.classList.contains("_real") ||
                 child.classList.contains("_phantom_wrap") ||
                 // For ._phantom._text but ._text is used only with ._real and
                 // ._phantom so we don't check for ._phantom.
                 child.classList.contains("_text")))) {
             toConsider.push(child);
           }
           if (isElement(child) && child.classList.contains("_placeholder")) {
             ph = child;
           }
           child = child.nextSibling;
         }

         const caretManager = this.caretManager;
         if (toConsider.length === 0 ||
             (toConsider.length === 1 &&
              removed.indexOf(toConsider[0]) !== -1)) {
           if (ph === undefined) {
             const mode = this.modeTree.getMode(target);
             const nodes = mode.nodesAroundEditableContents(target);
             if (target === this.guiRoot) {
               const loc = caretManager.makeCaret(this.guiRoot, 0)!;
               ph = this.insertTransientPlaceholderAt(loc);
               caretManager.setCaret(loc, { textEdit: true });
             }
             else {
               ph = mode.makePlaceholderFor(target);
               this.guiUpdater.insertBefore(target, ph, nodes[1]);
             }
           }
         }
         else if (ph !== undefined && !ph.classList.contains("_transient")) {
           const caret = caretManager.caret !==  undefined ?
             caretManager.caret.node : undefined;
           // Move the caret out of the placeholder if needed...
           const move = caret !== undefined && ph.contains(caret);
           let parent;
           let offset;
           if (move) {
             parent = ph.parentNode!;
             offset = indexOf(parent.childNodes, ph);
           }
           this.guiUpdater.removeNode(ph);
           if (move) {
             caretManager.setCaret(parent, offset, { textEdit: true });
           }
         }

         this.updatingPlaceholder--;
       });

    const attributePlaceholderHandler = (target: Element) => {
      if (this.updatingPlaceholder !== 0) {
        return;
      }

      this.updatingPlaceholder++;
      const dataNode = this.toDataNode(target) as Attr;
      const ph = domutil.childByClass(target, "_placeholder");
      if (dataNode.value !== "") {
        if (ph !== null) {
          target.removeChild(ph);
        }
      }
      else if (ph === null) {
        this.guiUpdater.insertBefore(target, domutil.makePlaceholder(), null);
      }
      this.updatingPlaceholder--;
    };

    this.domlistener.addHandler(
      "children-changed",
      "._attribute_value",
      (_root: Node, _added: Node[], _removed: Node[], _prev: Node | null,
       _next: Node | null, target: Element) => {
        attributePlaceholderHandler(target);
      });

    this.domlistener.addHandler(
      "included-element",
      "._attribute_value",
      (_root: Node, _tree: Node, _parent: Node, _prev: Node | null,
       _next: Node | null, target: Element) => {
        attributePlaceholderHandler(target);
      });

    this.modeTree.startListening();
    if (this._dataChild !== undefined) {
      this.dataUpdater.insertAt(this.dataRoot, 0, this._dataChild);
    }

    // Drag and drop not supported by us. And we have to use "as any" to please
    // TS.
    const $guiRoot = this.$guiRoot;
    // tslint:disable-next-line:no-any
    $guiRoot.on("dragenter" as any, "*", false);
    // tslint:disable-next-line:no-any
    $guiRoot.on("dragstart" as any, "*", false);
    // tslint:disable-next-line:no-any
    $guiRoot.on("dragover" as any, "*", false);
    // tslint:disable-next-line:no-any
    $guiRoot.on("drop" as any, "*", false);

    $guiRoot.on("wed-global-keydown", this.globalKeydownHandler.bind(this));

    $guiRoot.on("wed-global-keypress", this.globalKeypressHandler.bind(this));

    $guiRoot.on("keydown", this.keydownHandler.bind(this));
    $guiRoot.on("keypress", this.keypressHandler.bind(this));

    this.$inputField.on("keydown", this.keydownHandler.bind(this));
    this.$inputField.on("keypress", this.keypressHandler.bind(this));

    this.$inputField.on("compositionstart compositionupdate compositionend",
                        this.compositionHandler.bind(this));
    this.$inputField.on("input", this.inputHandler.bind(this));

    // No click in the next binding because click does not distinguish left,
    // middle, right mouse buttons.
    $guiRoot.on("mousedown", this.mousedownHandler.bind(this));
    $guiRoot.on("mouseover", this.mouseoverHandler.bind(this));
    $guiRoot.on("mouseout", this.mouseoutHandler.bind(this));
    $guiRoot.on("contextmenu", this.mouseupHandler.bind(this));

    $guiRoot.on("paste", log.wrap(this.pasteHandler.bind(this)));
    this.$inputField.on("paste", log.wrap(this.pasteHandler.bind(this)));

    $guiRoot.on("copy", log.wrap(this.copyHandler.bind(this)));
    this.$inputField.on("copy", log.wrap(this.copyHandler.bind(this)));

    $guiRoot.on("cut", log.wrap(this.cutHandler.bind(this)));
    this.$inputField.on("cut", log.wrap(this.cutHandler.bind(this)));
    $(this.window).on("resize.wed", this.resizeHandler.bind(this));

    $guiRoot.on("click", "a", (ev) => {
      if (ev.ctrlKey) {
        window.location.href = (ev.currentTarget as HTMLAnchorElement).href;
      }
      return false;
    });

    // This is a guard to make sure that mousemove handlers are removed once the
    // button is up again.
    const $body = $(this.doc.body);
    $body.on("mouseup.wed", () => {
      this.$guiRoot.off("mousemove.wed mouseup");
    });

    $body.on("contextmenu.wed", (ev) => {
      // It may happen that contextmenu can escape to the body even if the
      // target is an element in guiRoot. This notably happens on IE for some
      // reason. So trap such cases here and dispose of them.
      return !this.guiRoot.contains(ev.target);
    });

    $body.on("click.wed", (ev) => {
      // If the click is triggered programmatically ``pageX`` and ``pageY``
      // won't be defined. If the click is triggered due to an ENTER key
      // converted by the browser, one or both will be negative. Or screenX,
      // screenY will both be zero.
      if (ev.pageX === undefined || ev.pageX < 0 ||
          ev.pageY === undefined || ev.pageY < 0 ||
          ((ev.screenX === ev.screenY) && (ev.screenX === 0))) {
        return;
      }

      // We don't want to blur for clicks that are on elements part of our GUI.
      if (this.widget.contains(ev.target)) {
        return;
      }

      const el = this.doc.elementFromPoint(ev.clientX, ev.clientY);

      if ($(el).closest(this.$excludedFromBlur).length !== 0) {
        return;
      }

      const offset = this.$guiRoot.offset()!;
      const x = ev.pageX - offset.left;
      const y = ev.pageY - offset.top;

      if (!((x >= 0) && (y >= 0) &&
            (x < this.$guiRoot.outerWidth()) &&
            (y < this.$guiRoot.outerHeight()))) {
        this.caretManager.onBlur();
      }
      // We don't need to do anything special to focus the editor.
    });

    // Make ourselves visible.
    this.$widget.removeClass("loading");
    this.$widget.css("display", "block");

    const namespaceError = this.initializeNamespaces();
    if (namespaceError !== undefined) {
      const limitationModal = this.modals.getModal("limitation");
      limitationModal.setBody(namespaceError);
      limitationModal.modal();
      this.destroy();
      return this;
    }
    this.domlistener.processImmediately();
    // Flush whatever has happened earlier.
    this._undo.reset();

    $guiRoot.focus();

    this.validator.start();

    let demo = this.options.demo;
    if (demo !== undefined) {
      // Provide a generic message.
      if (typeof demo !== "string") {
        demo = "Some functions may not be available.";
      }
      const demoModal = this.makeModal();
      demoModal.setTitle("Demo");
      demoModal.setBody(`<p>This is a demo of wed. ${demo}</p> \
<p>Click <a href='${this.docURL}' target='_blank'>this link</a> to see \
wed's generic help. The link by default will open in a new tab.</p>`);
      demoModal.addButton("Ok", true);
      demoModal.modal();
    }

    const save = this.options.save;
    let savePromise;
    if (save !== undefined) {
      // The editor is not initialized until the saver is also initialized,
      // which may take a bit.
      savePromise = this.runtime.resolveModules(save.path)
        .then((modules) => {
          // tslint:disable-next-line:no-any variable-name
          const SaverClass = (modules[0] as any).Saver as SaverConstructor;
          const saveOptions = save.options !== undefined ? save.options : {};
          const saver = new SaverClass(this.runtime, version, this.dataUpdater,
                                       this.dataRoot, saveOptions);
          this.saver = saver;

          saver.events
            .pipe(filter(filterSaveEvents.bind(undefined, "Saved")))
            .subscribe(this.onSaverSaved.bind(this));

          saver.events
            .pipe(filter(filterSaveEvents.bind(undefined, "Autosaved")))
            .subscribe(this.onSaverAutosaved.bind(this));

          saver.events
            .pipe(filter(filterSaveEvents.bind(undefined, "Failed")))
            .subscribe(this.onSaverFailed.bind(this));

          saver.events
            .pipe(filter(filterSaveEvents.bind(undefined, "Changed")))
            .subscribe(this.onSaverChanged.bind(this));

          this.refreshSaveStatus();
          this.saveStatusInterval =
            setInterval(this.refreshSaveStatus.bind(this), 30 * 1000);
          onbeforeunload.install(
            this.window,
            () => !this.destroyed && this.saver.getModifiedWhen() !== false,
            true);

          return saver.init();
        });
    }
    else {
      savePromise = Promise.resolve()
        .then(() => {
          log.error("wed cannot save data due to the absence of a save option");
        });
    }

    await savePromise;
    this.initializedResolve(this);
    return this;
  }

  /**
   * Handler preparing nodes included into the tree. This handler preforms an
   * initial generic setup that does not need mode-specific information.
   */
  private newContentHandler(ev: BeforeInsertNodeAtEvent): void {
    const mod = (el: Element) => {
      // All elements that may get a selection must be focusable to
      // work around issue:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
      el.setAttribute("tabindex", "-1");
      let child = el.firstElementChild;
      while (child !== null) {
        mod(child);
        child = child.nextElementSibling;
      }
    };

    // We never call this function with something else than an Element for
    // ev.node.
    mod(ev.node as Element);
  }

  private initializeNamespaces(): string | undefined {
    const mode = this.modeTree.getMode(this.guiRoot);
    const resolver = mode.getAbsoluteResolver();
    let failure: string | undefined;
    if (this.dataRoot.firstChild === null) {
      // The document is empty: create a child node with the absolute namespace
      // mappings.
      const attrs = Object.create(null);
      this.validator.getSchemaNamespaces().forEach((ns) => {
        if (ns === "*" || ns === "::except") {
          return;
        }

        const k = resolver.prefixFromURI(ns);
        // Don't create a mapping for the `xml`, seeing as it is defined by
        // default.
        if (k === "xml") {
          return;
        }

        if (k === "") {
          attrs.xmlns = ns;
        }
        else {
          if (k === undefined) {
            failure = `The mode does not allow determining the namespace \
prefix for ${ns}. The most likely issue is that the mode is buggy or wed was \
started with incorrect options.`;
          }
          attrs[`xmlns:${k}`] = ns;
        }
      });

      if (failure !== undefined) {
        return failure;
      }

      const evs = Array.from(this.validator.possibleAt(this.dataRoot, 0));
      if (evs.length === 1 && evs[0].params[0] === "enterStartTag") {
        const name = evs[0].params[1] as salve.BaseName;
        // If the name pattern is not simple or it allows for a number of
        // choices, then we skip this creation.
        const asArray = name.toArray();
        if (asArray !== null && asArray.length === 1) {
          const simple = asArray[0];
          insertElement(
            this.dataUpdater, this.dataRoot, 0, simple.ns,
            resolver.unresolveName(simple.ns, simple.name)!, attrs);
          this.caretManager.setCaret(this.dataRoot.firstElementChild, 0);
        }
      }

      // Ok, we did not insert anything, let's put a placeholder there.
      if (this.dataRoot.firstChild === null) {
        const ph = this.insertTransientPlaceholderAt(
          this.caretManager.makeCaret(this.guiRoot, 0)!);
        this.caretManager.setCaret(ph, 0);
      }
    }
    else {
      const namespaces = this.validator.getDocumentNamespaces();
      // Yeah, we won't stop as early as possible if there's a failure.  So
      // what?
      Object.keys(namespaces).forEach((prefix) => {
        const uri = namespaces[prefix];
        if (uri.length > 1) {
          failure = "The document you are trying to edit uses namespaces \
in a way not supported by this version of wed.";
        }

        resolver.definePrefix(prefix, uri[0]);
      });
    }
    return failure;
  }

  addToolbarAction(actionClass: editorActions.ActionCtor,
                   options: AddOptions): void {
    this.toolbar.addButton(new actionClass(this).makeButton(), options);
  }

  /**
   * Creates a new task runner and registers it with the editor so that it is
   * started and stopped by the methods that stop/start all tasks.
   *
   * @param task The task that the runner must run.
   *
   * @returns The new runner.
   */
  newTaskRunner(task: Task): TaskRunner {
    const runner = new TaskRunner(task);
    this.taskRunners.push(runner);
    return runner;
  }

  /**
   * Triggers the resizing algorithm.
   */
  resize(): void {
    this.resizeHandler();
  }

  private resizeHandler(): void {
    let heightAfter = 0;

    function addHeight(x: Element): void {
      heightAfter += x.getBoundingClientRect().height;
    }

    let constrainerSibling = this.constrainer.nextElementSibling;
    while (constrainerSibling !== null) {
      addHeight(constrainerSibling);
      constrainerSibling = constrainerSibling.nextElementSibling;
    }

    let examine: Element | null = this.widget;
    // We want to use isElement here because eventually we'll run into the
    // document element that holds everything. We still declare examine as an
    // Element or null because we never use it as a document.
    while (isElement(examine)) {
      let sibling = examine.nextElementSibling;
      while (sibling !== null) {
        if (sibling.tagName !== "script") {
          addHeight(sibling);
        }
        sibling = sibling.nextElementSibling;
      }
      examine = examine.parentNode as (Element | null);
    }

    // The height is the inner height of the window:
    // a. minus what appears before it.
    // b. minus what appears after it.
    let height = this.window.innerHeight -
      // This is the space before
      (this.scroller.getBoundingClientRect().top + this.window.pageYOffset) -
      // This is the space after
      heightAfter;

    height = Math.floor(height);

    this.scroller.coerceHeight(height);

    const sidebar = this.sidebar;
    let pheight = this.window.innerHeight -
      (sidebar.getBoundingClientRect().top + this.window.pageYOffset) -
      heightAfter;
    sidebar.style.maxHeight = `${pheight}px`;
    sidebar.style.minHeight = `${pheight}px`;

    const sp =
      sidebar.getElementsByClassName("wed-sidebar-panel")[0] as HTMLElement;
    pheight = this.window.innerHeight -
      (sp.getBoundingClientRect().top + this.window.pageYOffset) -
      heightAfter;
    sp.style.maxHeight = `${pheight}px`;
    sp.style.minHeight = `${pheight}px`;

    const panels = sp.getElementsByClassName("panel");
    const headings = sp.getElementsByClassName("panel-heading");
    let hheight = 0;
    for (let i = 0; i < headings.length; ++i) {
      const heading = headings[i];
      const $parent = $(heading.parentNode as Node);
      hheight += $parent.outerHeight(true) - $parent.innerHeight();
      hheight += $(heading).outerHeight(true);
    }
    const maxPanelHeight = pheight - hheight;
    let panel;
    for (let i = 0; i < panels.length; ++i) {
      panel = panels[i] as HTMLElement;
      panel.style.maxHeight = `${maxPanelHeight +
        $(domutil.childByClass(panel, "panel-heading")).outerHeight(true)}px`;
      const body = panel.getElementsByClassName("panel-body")[0] as HTMLElement;
      body.style.height = `${maxPanelHeight}px`;
    }

    if (this.validationController !== undefined) {
      // We must refresh these because resizing the editor pane may cause text
      // to move up or down due to line wrap.
      this.validationController.refreshErrors();
    }
    this.caretManager.mark.refresh();
  }

  /**
   * Opens a documentation link.
   *
   * @param url The URL to open.
   */
  openDocumentationLink(url: string): void {
    window.open(url);
  }

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
  getElementTransformationsAt(treeCaret: DLoc, types: string |  string[]):
  { tr: Action<{}>; name?: string }[]
  {
    const mode = this.modeTree.getMode(treeCaret.node);
    const resolver = mode.getAbsoluteResolver();
    const ret: { tr: Action<{}>; name?: string }[] = [];
    this.validator.possibleAt(treeCaret).forEach((ev: salve.Event) => {
      if (ev.params[0] !== "enterStartTag") {
        return;
      }

      const pattern = ev.params[1] as salve.BaseName;
      const asArray = pattern.toArray();
      if (asArray !== null) {
        for (const name of asArray) {
          const unresolved = resolver.unresolveName(name.ns, name.name);

          const trs = mode.getContextualActions(
            types, unresolved!, treeCaret.node, treeCaret.offset);
          if (trs === undefined) {
            return;
          }

          for (const tr of trs) {
            ret.push({ tr, name: unresolved });
          }
        }
      }
      else {
        // We push an action rather than a transformation.
        ret.push({ tr: this.complexPatternAction, name: undefined });
      }
    });

    return ret;
  }

  private shouldAddToClipboard(): boolean {
    const ret = this.clipboardAdd;
    this.clipboardAdd = false;
    return ret;
  }

  private copyHandler(e: JQueryEventObject): boolean {
    const add = this.shouldAddToClipboard();
    let result = ClipboardEventHandling.NOOP;
    switch (this.selectionMode) {
      case SelectionMode.SPAN:
        result = this.spanCopyHandler();
        break;
      case SelectionMode.UNIT:
        result = this.unitCopyHandler(add);
        break;
      default:
        const q: never = this.selectionMode;
        throw new Error(`unhandled selection mode: ${q}`);
    }

    if (result === ClipboardEventHandling.PASS_TO_BROWSER) {
      return true;
    }

    if (result === ClipboardEventHandling.SET_CLIPBOARD) {
      // tslint:disable-next-line:no-any
      const cd = (e.originalEvent as any).clipboardData as DataTransfer;
      this.clipboard.setupDOMClipboardData(cd);
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  private spanCopyHandler(): ClipboardEventHandling {
    const { caretManager } = this;
    const sel = caretManager.sel;
    if (sel === undefined) {
      return ClipboardEventHandling.NOOP;
    }

    const { clipboard } = this;

    if (!sel.wellFormed) {
      notify(`Selection is not well-formed XML, and consequently was copied \
naively.`, { type: "warning" });
      return ClipboardEventHandling.PASS_TO_BROWSER;
    }

    const [startCaret, endCaret] = sel.mustAsDataCarets();
    let span: Node[] | string;
    if (isAttr(startCaret.node)) {
      const attr = startCaret.node;
      if (attr !== endCaret.node) {
        throw new Error("attribute selection that does not start " +
                        "and end in the same attribute");
      }
      span = attr.value.slice(startCaret.offset, endCaret.offset);
    }
    else {
      span = domutil.copy([startCaret.node, startCaret.offset],
                          [endCaret.node, endCaret.offset]);
    }
    clipboard.putSpan(span);

    return ClipboardEventHandling.SET_CLIPBOARD;
  }

  private notifyHeterogenousData(): void {
    notify("The data to add to the clipboard is not of the same kind as \
the data already in the clipboard. Operation aborted.", { type: "danger" });
  }

  private unitCopyHandler(add: boolean): ClipboardEventHandling {
    const { caretManager } = this;
    const caret = caretManager.getDataCaret(true);
    if (caret === undefined) {
      return ClipboardEventHandling.NOOP;
    }

    const { clipboard } = this;
    let { node } = caret;
    if (add && !clipboard.canAddUnit(node)) {
      this.notifyHeterogenousData();
      return ClipboardEventHandling.NOOP;
    }
    if (isText(node)) {
      node = node.parentNode as Element;
    }
    clipboard.putUnit(node.cloneNode(true), add);
    return ClipboardEventHandling.SET_CLIPBOARD;
  }

  private cutHandler(e: JQueryEventObject): boolean {
    const add = this.shouldAddToClipboard();
    let result = ClipboardEventHandling.NOOP;
    switch (this.selectionMode) {
      case SelectionMode.SPAN:
        result = this.spanCutHandler();
        break;
      case SelectionMode.UNIT:
        result = this.unitCutHandler(add);
        break;
      default:
        const q: never = this.selectionMode;
        throw new Error(`unhandled selection mode: ${q}`);
    }

    if (result === ClipboardEventHandling.PASS_TO_BROWSER) {
      return true;
    }

    if (result === ClipboardEventHandling.SET_CLIPBOARD) {
      // tslint:disable-next-line:no-any
      const cd = (e.originalEvent as any).clipboardData as DataTransfer;
      this.clipboard.setupDOMClipboardData(cd);
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  private spanCutHandler(): ClipboardEventHandling {
    const sel = this.caretManager.sel;
    if (sel === undefined) {
      return ClipboardEventHandling.NOOP;
    }

    if (!sel.wellFormed) {
      this.clipboard.clear();
      notify(`Selection is not well-formed XML, and consequently the selection \
cannot be cut.`, { type: "danger" });
      return ClipboardEventHandling.NOOP;
    }

    const el = closestByClass(sel.anchor.node, "_real", this.guiRoot);
    // We do not operate on elements that are readonly.
    if (el === null || el.classList.contains("_readonly")) {
      return ClipboardEventHandling.NOOP;
    }

    // The only thing we need to pass is the event that triggered the cut.
    this.fireTransformation(this.cutTr, {});
    return ClipboardEventHandling.SET_CLIPBOARD;
  }

  private unitCutHandler(add: boolean): ClipboardEventHandling {
    const { caretManager, clipboard } = this;
    const caret = caretManager.getDataCaret(true);
    if (caret === undefined) {
      return ClipboardEventHandling.NOOP;
    }

    const el = closestByClass(caretManager.caret!.node, "_real", this.guiRoot);
    // We do not operate on elements that are readonly.
    if (el === null || el.classList.contains("_readonly")) {
      return ClipboardEventHandling.NOOP;
    }

    if (add && !clipboard.canAddUnit(caret.node)) {
      this.notifyHeterogenousData();
      return ClipboardEventHandling.NOOP;
    }

    this.fireTransformation<CutUnitTransformationData>(this.cutUnitTr, { add });
    return ClipboardEventHandling.SET_CLIPBOARD;
  }

  private cut(_editor: EditorAPI, _data: TransformationData): void {
    const caretManager = this.caretManager;
    const sel = caretManager.sel;
    if (sel === undefined) {
      throw new Error("no selection");
    }

    if (!sel.wellFormed) {
      throw new Error("malformed range");
    }

    const [startCaret, endCaret] = sel.mustAsDataCarets();
    const { clipboard } = this;
    let span: Node[] | string;
    if (isAttr(startCaret.node)) {
      const attr = startCaret.node;
      if (attr !== endCaret.node) {
        throw new Error("attribute selection that does not start " +
                        "and end in the same attribute");
      }
      span = attr.value.slice(startCaret.offset, endCaret.offset);
      this.spliceAttribute(
        closestByClass(caretManager.mustFromDataLocation(startCaret).node,
                       "_attribute_value") as HTMLElement,
        startCaret.offset,
        endCaret.offset - startCaret.offset, "");
    }
    else {
      const cutRet = this.dataUpdater.cut(startCaret, endCaret);
      span = cutRet[1];
      caretManager.setCaret(cutRet[0]);
    }
    clipboard.putSpan(span);
  }

  private cutUnit(_editor: EditorAPI, data: CutUnitTransformationData): void {
    const { caretManager, clipboard } = this;
    const caret = caretManager.getDataCaret(true);
    if (caret === undefined) {
      throw Error("no caret");
    }

    const { add } = data;
    const { node } = caret;
    if (isAttr(node)) {
      const { ownerElement, name, namespaceURI } = node;
      const { attributes } = ownerElement!;
      let names = [];
      for (let ix = 0; ix < attributes.length; ++ix) {
        names.push(attributes[ix].name);
      }
      names = names.sort();
      const index = names.indexOf(name);
      if (index === -1) {
        throw new Error("cannot find attribute name in list of names");
      }
      this.dataUpdater.setAttributeNS(ownerElement!,
                                      namespaceURI === null ? "" : namespaceURI,
                                      node.localName!,
                                      null);
      clipboard.putUnit(node, add);
      if (index < names.length - 1) {
        const newAttributeName = names[index + 1];
        caretManager.setCaret(attributes.getNamedItem(newAttributeName), 0);
      }
      else {
        caretManager.setCaret(ownerElement!, 0);
      }
    }
    else {
      const el = isElement(node) ? node : node.parentNode as Element;
      const next = el.nextElementSibling;
      const parent = el.parentNode;
      this.dataUpdater.removeNode(el);
      clipboard.putUnit(el, add);
      const caretNode = next !== null ? next : parent;
      if (caretNode !== null) {
        caretManager.setCaret(caretNode, 0);
      }
      // Otherwise, there's no good value.
    }
  }

  private pasteHandler(e: JQueryEventObject): boolean {
    const caret = this.caretManager.caret;
    if (caret === undefined) {
      return false;
    }

    const el = closestByClass(this.caretManager.anchor!.node, "_real",
                              this.guiRoot);
    // We do not operate on elements that are readonly.
    if (el === null || el.classList.contains("_readonly")) {
      return false;
    }

    const { clipboard } = this;
    switch (clipboard.mode) {
      case SelectionMode.SPAN:
        this.spanPasteHandler(e);
        break;
      case SelectionMode.UNIT:
        this.unitPasteHandler(e);
        break;
      default:
        const q: never = clipboard.mode;
        throw new Error(`unexpected selection mode: ${q}`);
    }

    return false;
  }

  private clipboardToElement(data: DataTransfer): Element | null{
    const { clipboard } = this;
    let xml = data.getData("text/xml");
    let el: Element | null = null;
    if (xml !== "") {
      if (clipboard.isSerializedTree(xml)) {
        //
        // If the text we are trying to paste is identical to the text in our
        // cutBuffer then we assume that the user is trying to paste what has
        // been cut/copied from a previous wed operation, and we just get the
        // nodes to paste from the cutTree *instead* of reparsing the pasted
        // text.
        //
        // One advantage of doing this is that it works around the spurious
        // ``xmlns`` attributes that are created when we do a
        // serialization/parsing round-trip.
        //
        // (Note that in the odd case where a user would in fact have gotten
        // the text from somewhere else, the false positive does not
        // matter. What matters is that the cutBuffer and the cutTree are in
        // sync.)
        //
        el = clipboard.cloneTree();
      }
      else {
        // This could result in an empty string.
        xml = this.normalizeEnteredText(xml);
        if (xml === "") {
          return null;
        }

        try {
          el = safeParse(`<div>${xml}</div>`, this.window).firstElementChild;
        }
        catch (ex) {
          if (!(ex instanceof ParsingError)) {
            throw ex;
          }
        }
      }
    }

    return el;
  }

  private spanPasteHandler(e: JQueryEventObject): void {
    const caret = this.caretManager.getDataCaret();
    if (caret === undefined) {
      return;
    }

    // tslint:disable-next-line:no-any
    const cd = (e.originalEvent as any).clipboardData as DataTransfer;

    // If we are in an attribute then the clipboard has to be pasted as text. It
    // cannot be parsed as XML and insert Elements or other nodes into the
    // attribute value.
    let data = isAttr(caret.node) ? null : this.clipboardToElement(cd);
    if (data === null) {
      const text = this.normalizeEnteredText(cd.getData("text/plain"));
      if (text == null || text === "") {
        return;
      }

      data = this.doc.createElement("div");
      data.textContent = text;
    }

    // At this point data is a single top level fake <div> element
    // which contains the contents we actually want to paste.
    this.fireTransformation(this.pasteTr, { to_paste: data, e: e });
  }

  private unitPasteHandler(e: JQueryEventObject): void {
    // tslint:disable-next-line:no-any
    const cd = (e.originalEvent as any).clipboardData as DataTransfer;

    const top = this.clipboardToElement(cd);
    if (top === null) {
      return;
    }

    const caret = this.caretManager.getDataCaret();
    if (!containsClipboardAttributeCollection(top) && caret === undefined) {
      notify(`Cannot paste the content here.`, { type: "danger" });
      return;
    }

    this.fireTransformation(this.pasteUnitTr, { to_paste: top, e: e });
  }

  private pasteIntoElement(caret: DLoc, toPaste: Element): DLoc {
    let newCaret: DLoc;
    const frag = document.createDocumentFragment();
    while (toPaste.firstChild !== null) {
      frag.appendChild(toPaste.firstChild);
    }
    const { nodeType } = caret.node;
    switch (nodeType) {
      case Node.TEXT_NODE:
        newCaret = this.dataUpdater.insertIntoText(caret, frag)[1];
        break;
      case Node.ELEMENT_NODE:
        const child = caret.node.childNodes[caret.offset];
        const after = child != null ? child.nextSibling : null;
        // tslint:disable-next-line:no-any
        this.dataUpdater.insertBefore(caret.node as Element, frag as any,
                                      child);
        newCaret = caret.makeWithOffset(after !== null ?
                                        indexOf(caret.node.childNodes, after) :
                                        caret.node.childNodes.length);
        break;
      default:
        throw new Error(`unexpected node type ${nodeType}`);
    }

    return newCaret;
  }

  private paste(_editor: EditorAPI, data: PasteTransformationData): void {
    const toPaste = data.to_paste;
    const dataClone = toPaste.cloneNode(true);
    let caret = this.caretManager.getDataCaret();
    if (caret === undefined) {
      throw new Error("trying to paste without a caret");
    }

    let newCaret: DLoc | undefined;

    // Handle the case where we are pasting only text.
    if (toPaste.childNodes.length === 1 && isText(toPaste.firstChild)) {
      if (isAttr(caret.node)) {
        const guiCaret = this.caretManager.mustGetNormalizedCaret();
        this.spliceAttribute(closestByClass(
          guiCaret.node, "_attribute_value",
          guiCaret.node as HTMLElement) as HTMLElement,
                             guiCaret.offset, 0, toPaste.firstChild.data);
      }
      else {
        ({ caret: newCaret } =
         this.dataUpdater.insertText(caret, toPaste.firstChild.data));
      }
    }
    else {
      newCaret = this.pasteIntoElement(caret, toPaste);
    }
    if (newCaret !== undefined) {
      this.caretManager.setCaret(newCaret);
      caret = newCaret;
    }
    this.$guiRoot.trigger("wed-post-paste", [data.e, caret, dataClone]);
  }

  private pasteUnit(_editor: EditorAPI, data: PasteTransformationData): void {
    const top = data.to_paste;
    const dataClone = top.cloneNode();
    let caret = this.caretManager.getDataCaret(true);
    if (caret === undefined) {
      throw new Error("trying to paste without a caret");
    }

    const { node } = caret;
    if (containsClipboardAttributeCollection(top)) {
      let el: Element;
      if (isElement(node)) {
        el = node;
      }
      else if (isAttr(node)) {
        el = node.ownerElement!;
      }
      else if (isText(node)) {
        el = node.parentNode as Element;
      }
      else {
        throw new Error(`unexpected node type: ${node.nodeType}`);
      }

      const collection = top.firstElementChild!;
      for (let ix = 0; ix < collection.attributes.length; ++ix) {
        const { namespaceURI, localName, value } = collection.attributes[ix];
        this.dataUpdater.setAttributeNS(el,
                                        namespaceURI === null ? "" :
                                        namespaceURI,
                                        localName!, value);
        this.caretManager.mark.refresh();
      }
    }
    else if (isAttr(node)) {
      const guiCaret = this.caretManager.mustGetNormalizedCaret();
      this.spliceAttribute(closestByClass(
        guiCaret.node, "_attribute_value",
        guiCaret.node as HTMLElement) as HTMLElement,
                           guiCaret.offset, 0, top.firstChild!.textContent!);
    }
    else {
      const newCaret = this.pasteIntoElement(caret, top);
      this.caretManager.setCaret(newCaret);
      caret = newCaret;
    }

    this.$guiRoot.trigger("wed-post-paste", [data.e, caret, dataClone]);
  }

  private keydownHandler(e: JQueryKeyEventObject): void {
    const caret = this.caretManager.getNormalizedCaret();
    // Don't call it on undefined caret.
    if (caret !== undefined) {
      this.$guiRoot.trigger("wed-input-trigger-keydown", [e]);
    }
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped()) {
      return;
    }

    this.$guiRoot.trigger("wed-global-keydown", [e]);
  }

  pushGlobalKeydownHandler(handler: KeydownHandler): void {
    this.globalKeydownHandlers.push(handler);
  }

  popGlobalKeydownHandler(handler: KeydownHandler): void {
    const popped = this.globalKeydownHandlers.pop();
    if (popped !== handler) {
      throw new Error("did not pop the expected handler");
    }
  }

  // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
  private globalKeydownHandler(wedEvent: JQueryEventObject,
                               e: JQueryEventObject): boolean {
    let caret; // damn hoisting

    // These are things like the user hitting Ctrl, Alt, Shift, or
    // CapsLock, etc. Return immediately.
    if (e.which === 17 || e.which === 16 || e.which === 18 || e.which === 0) {
      return true;
    }

    // We don't process any input if the minibuffer is enabled.
    if (this.minibuffer.enabled) {
      return true;
    }

    function terminate(): false {
      e.stopPropagation();
      e.preventDefault();
      return false;
    }

    for (const handler of this.globalKeydownHandlers) {
      const ret = handler(wedEvent, e);
      if (ret === false) {
        return terminate();
      }
    }

    // F1
    if (e.which === 112) {
      this.modals.getModal("help").modal();
      return terminate();
    }

    // Diagnosis stuff
    if (this.developmentMode) {
      // F2
      if (e.which === 113) {
        this.caretManager.dumpCaretInfo();
        return terminate();
      }
      // F3
      if (e.which === 114) {
        this.dumpUndo();
        return terminate();
      }
      // F4
      if (e.which === 115) {
        // tslint:disable:no-console
        console.log("manual focus");
        console.log("document.activeElement before",
                    document.activeElement);
        console.log("document.querySelector(\":focus\") before",
                    document.querySelector(":focus"));
        this.caretManager.focusInputField();
        console.log("document.activeElement after",
                    document.activeElement);
        console.log("document.querySelector(\":focus\") after",
                    document.querySelector(":focus"));
        // tslint:enable:no-console
        return terminate();
      }
    }

    const selFocus = this.caretManager.caret;
    // Cursor movement keys: handle them.
    if (e.which >= 33 /* page up */ && e.which <= 40 /* down arrow */) {
      let direction: caretMovement.Direction | undefined;
      if (keyConstants.RIGHT_ARROW.matchesEvent(e)) {
        direction = "right";
      }
      else if (keyConstants.LEFT_ARROW.matchesEvent(e)) {
        direction = "left";
      }
      else if (keyConstants.DOWN_ARROW.matchesEvent(e)) {
        direction = "down";
      }
      else if (keyConstants.UP_ARROW.matchesEvent(e)) {
        direction = "up";
      }

      if (direction !== undefined) {
        this.caretManager.move(direction,
                               // When we are in span mode, we don't select
                               // ranges.
                               e.shiftKey &&
                               this.selectionMode === SelectionMode.SPAN);
        return terminate();
      }
      return true;
    }
    else if (keyConstants.ESCAPE.matchesEvent(e)) {
      if (this.closeAllTooltips()) {
        return terminate();
      }
      return true;
    }
    else if (keyConstants.SAVE.matchesEvent(e)) {
      // tslint:disable-next-line:no-floating-promises
      this.save();
      return terminate();
    }
    else if (keyConstants.NEXT_SELECTION_MODE.matchesEvent(e)) {
      this.selectionMode = SelectionMode.next(this.selectionMode);
      return terminate();
    }
    else if (keyConstants.UNDO.matchesEvent(e)) {
      this.undo();
      return terminate();
    }
    else if (keyConstants.REDO.matchesEvent(e)) {
      this.redo();
      return terminate();
    }
    else if (keyConstants.COPY.matchesEvent(e) ||
             keyConstants.CUT.matchesEvent(e) ||
             keyConstants.PASTE.matchesEvent(e)) {
      return true;
    }
    else if (keyConstants.COPY_ADD.matchesEvent(e)) {
      if (this.selectionMode === SelectionMode.UNIT) {
        // This assignment is a crappy way to convey to the "copy" handler that
        // it should add to the clipboard. There's no way to pass arguments to
        // the "copy" command that we invoke with execCommand.
        this.clipboardAdd = true;
        this.doc.execCommand("copy");
      }
      return terminate();
    }
    else if (keyConstants.CUT_ADD.matchesEvent(e)) {
      if (this.selectionMode === SelectionMode.UNIT) {
        // This assignment is a crappy way to convey to the "cut" handler that
        // it should add to the clipboard. There's no way to pass arguments to
        // the "cut" command that we invoke with execCommand.
        this.clipboardAdd = true;
        this.doc.execCommand("cut");
      }
      return terminate();
    }
    else if (keyConstants.DEVELOPMENT.matchesEvent(e)) {
      this.developmentMode = !this.developmentMode;
      notify(this.developmentMode ? "Development mode on." :
             "Development mode off.");
      if (this.developmentMode) {
        log.showPopup();
      }
      return terminate();
    }
    else if (keyConstants.LOWER_LABEL_VISIBILITY.matchesEvent(e)) {
      return this.decreaseLabelVisibilityLevelAction.terminalEventHandler(e);
    }
    else if (keyConstants.INCREASE_LABEL_VISIBILITY.matchesEvent(e)) {
      return this.increaseLabelVisibilityLevelAction.terminalEventHandler(e);
    }
    else if (keyConstants.CONTEXTUAL_MENU.matchesEvent(e)) {
      if (selFocus !== undefined) {
        let selFocusNode = selFocus.node;
        const gui = closestByClass(selFocusNode, "_gui", selFocus.root);
        if (gui !== null && gui.classList.contains("_label_clicked")) {
          if (isText(selFocusNode)) {
            selFocusNode = selFocusNode.parentNode!;
          }
          $(selFocusNode).trigger("wed-context-menu", [e]);
          return terminate();
        }
      }

      if (this.editingMenuManager.contextMenuHandler(e) === false) {
        return terminate();
      }
    }
    else if (keyConstants.REPLACEMENT_MENU.matchesEvent(e)) {
      this.editingMenuManager.setupReplacementMenu();
      return terminate();
    }
    else if (keyConstants.QUICKSEARCH_FORWARD.matchesEvent(e)) {
      if (this.caretManager.caret !== undefined) {
        // tslint:disable-next-line:no-unused-expression
        new QuickSearch(this, this.scroller, Direction.FORWARD);
      }
      return terminate();
    }
    else if (keyConstants.QUICKSEARCH_BACKWARDS.matchesEvent(e)) {
      if (this.caretManager.caret !== undefined) {
        // tslint:disable-next-line:no-unused-expression
        new QuickSearch(this, this.scroller, Direction.BACKWARDS);
      }
      return terminate();
    }
    else if (keyConstants.SEARCH_FORWARD.matchesEvent(e)) {
      if (this.caretManager.caret !== undefined) {
        // tslint:disable-next-line:no-unused-expression
        new DialogSearchReplace(this, this.scroller, Direction.FORWARD);
      }
      return terminate();
    }
    else if (keyConstants.SEARCH_BACKWARDS.matchesEvent(e)) {
      if (this.caretManager.caret !== undefined) {
        // tslint:disable-next-line:no-unused-expression
        new DialogSearchReplace(this, this.scroller, Direction.BACKWARDS);
      }
      return terminate();
    }

    if (selFocus === undefined) {
      return true;
    }

    const placeholder = closestByClass(selFocus.node, "_placeholder",
                                       selFocus.root);
    if (placeholder !== null) {
      // We're in a placeholder, so...

      // Reminder: if the caret is currently inside a placeholder getCaret will
      // return a caret value just in front of the placeholder.
      caret = this.caretManager.getDataCaret();

      // A place holder could be in a place that does not allow text. If so,
      // then do not allow entering regular text in this location.
      if (!util.anySpecialKeyHeld(e)) {
        let textPossible = false;

        if ((placeholder.parentNode as HTMLElement)
            .classList.contains("_attribute_value")) {
          textPossible = true;
        }
        else {
          // Maybe throwing an exception could stop this loop early but that
          // would have to be tested.
          this.validator.possibleAt(caret!).forEach((ev) => {
            if (ev.params[0] === "text") {
              textPossible = true;
            }
          });
        }

        if (!textPossible) {
          return terminate();
        }
      }

      // Swallow these events when they happen in a placeholder.
      if (keyConstants.BACKSPACE.matchesEvent(e) ||
          keyConstants.DELETE.matchesEvent(e)) {
        return terminate();
      }
    }

    const attrVal = closestByClass(selFocus.node, "_attribute_value",
                                   selFocus.root);
    const label = this.guiRoot.querySelector(
      ".__start_label._label_clicked, .__end_label._label_clicked");
    if (attrVal === null && label !== null &&
        keyConstants.DELETE.matchesEvent(e)) {
      // The caret is currently in an element label, and not in an attribute
      // value. Delete the element!
      const el = closestByClass(label, "_real", this.guiRoot);
      const dataNode =
        this.dataUpdater.pathToNode(this.nodeToPath(el!)) as HTMLElement;
      const mode = this.modeTree.getMode(el!);
      // Yes, delete-parent is correct because we take position 0 *inside*
      // dataNode.
      const trs = mode.getContextualActions("delete-parent", dataNode.tagName,
                                            dataNode, 0);

      trs[0].execute({ node: dataNode, name: dataNode.tagName });
      return terminate();
    }
    else if (isElement(selFocus.node) &&
             (selFocus.node.classList.contains("_phantom") ||
              selFocus.node.classList.contains("_phantom_wrap"))) {
      return terminate();
    }

    if (keyConstants.SPACE.matchesEvent(e)) {
      caret = this.caretManager.getNormalizedCaret();
      if (caret === undefined) {
        return terminate();
      }

      if (attrVal !== null ||
          closestByClass(caret.node, "_phantom", caret.root) === null) {
        this.handleKeyInsertingText(e);
      }

      return terminate();
    }
    else if (keyConstants.DELETE.matchesEvent(e)) {
      if (attrVal !== null) { // In attribute.
        if (attrVal.textContent !== "") { // empty === noop
          this.spliceAttribute(attrVal as HTMLElement,
                               this.caretManager.getNormalizedCaret()!.offset,
                               1, "");
        }
      }
      else {
        // Prevent deleting phantom stuff
        const next =
          domutil.nextCaretPosition(selFocus.toArray(), this.guiRoot, true)![0];
        if (!isElement(next) ||
            !(next.classList.contains("_phantom") ||
              next.classList.contains("_phantom_wrap"))) {
          // When a range is selected, we delete the whole range.
          if (!this.deleteSelection()) {
            // There was no range, so we need to handle the delete.
            this.deleteChar(keyConstants.DELETE);
          }
        }
      }
      return terminate();
    }
    else if (keyConstants.BACKSPACE.matchesEvent(e)) {
      if (attrVal !== null) { // In attribute.
        if (attrVal.textContent !== "") { // empty === noop
          this.spliceAttribute(attrVal as HTMLElement,
                               this.caretManager
                               .getNormalizedCaret()!.offset - 1,
                               1, "");
        }
      }
      else {
        // Prevent backspacing over phantom stuff
        const prev =
          domutil.prevCaretPosition(selFocus.toArray(), this.guiRoot, true)![0];
        if (!isElement(prev) ||
            !(prev.classList.contains("_phantom") ||
              prev.classList.contains("_phantom_wrap"))) {
          // When a range is selected, we delete the whole range.
          if (!this.deleteSelection()) {
            // There was no range, so we need to handle the backspace
            this.deleteChar(keyConstants.BACKSPACE);
          }
        }
      }
      return terminate();
    }

    return true;
  }

  private keypressHandler(e: JQueryEventObject): boolean | undefined {
    // IE is the odd browser that allows ESCAPE to show up as a keypress so
    // we have to prevent it from going any further.
    if (ESCAPE_KEYPRESS.matchesEvent(e)) {
      return true;
    }

    this.$guiRoot.trigger("wed-input-trigger-keypress", [e]);
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped()) {
      return true;
    }

    this.$guiRoot.trigger("wed-global-keypress", [e]);
    return undefined;
  }

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
  // tslint:disable-next-line:no-reserved-keywords
  type(text: string | Key | Key[],
       where: WedEventTarget = WedEventTarget.DEFAULT): void {
    if (text instanceof Key) {
      text = [text];
    }

    for (let k of text) {
      if (typeof k === "string") {
        k = (k === " ") ? keyConstants.SPACE : makeKey(k);
      }

      const event = new $.Event("keydown");
      k.setEventToMatch(event);

      switch (where) {
      case WedEventTarget.MINIBUFFER:
        this.minibuffer.forwardEvent(event);
        break;
      case WedEventTarget.DEFAULT:
        this.$inputField.trigger(event);
        break;
      default:
        const t: never = where;
        throw new Error(`unhandled target: ${t}`);
      }
    }
  }

  private globalKeypressHandler(_wedEvent: JQueryEventObject,
                                e: JQueryKeyEventObject): boolean {
    if (this.caretManager.caret === undefined) {
      return true;
    }

    function terminate(): false {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // On Firefox keypress events are generated for things like hitting the left
    // or right arrow. The which value is 0 in these cases. On Chrome, hitting
    // the left or right arrow will generate keyup, keydown events but not
    // keypress. Yay for inconsistencies!
    if (e.which === 0) {
      return true;
    }

    // Backspace, which for some reason gets here on Firefox...
    if (e.which === 8) {
      return terminate();
    }

    // On Firefox the modifier keys will generate a keypress event, etc. Not so
    // on Chrome. Yay for inconsistencies!
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return true;
    }

    this.deleteSelection();
    this.handleKeyInsertingText(e);
    return terminate();
  }

  /**
   * Delete the current selection from the document. If the selection is not
   * well-formed, this is a no-op.
   *
   * We do not call this a "cut" because a real cut operation modifies the
   * clipboard. Whereas this does not.
   *
   * @returns ``false`` if there was no selection to process, or the selection
   * was empty. ``true`` otherwise.
   */
  private deleteSelection(): boolean {
    const sel = this.caretManager.sel;
    if (sel !== undefined && !sel.collapsed) {
      if (!sel.wellFormed) {
        return true;
      }

      this.fireTransformation(this.deleteSelectionTr, {});
      return true;
    }

    return false;
  }

  private _deleteSelection(_editor: EditorAPI,
                           _data: TransformationData): void {
    const sel = this.caretManager.sel;
    if (sel === undefined) {
      throw new Error("called with undefined selection");
    }
    const [start, end] = sel.mustAsDataCarets();
    const cutRet = this.dataUpdater.cut(start, end)[0];
    this.caretManager.setCaret(cutRet, { textEdit: true });
  }

  private handleKeyInsertingText(e: JQueryKeyEventObject): boolean | undefined {
    const text = String.fromCharCode(e.which);

    if (text === "") {
      // Nothing needed
      return false;
    }

    this.insertText(text);
    e.preventDefault();
    e.stopPropagation();
    return undefined;
  }

  private compositionHandler(ev: JQueryEventObject): void {
    if (ev.type === "compositionstart") {
      this.composing = true;
      this.compositionData = {
        // tslint:disable-next-line:no-any
        data: (ev.originalEvent as any).data,
        startCaret: this.caretManager.caret,
      };
      this.inputField.style.zIndex = "10";
      this.caretManager.mark.refresh();
    }
    else if (ev.type === "compositionupdate") {
      // tslint:disable-next-line:no-any
      this.compositionData!.data = (ev.originalEvent as any).data;
    }
    else if (ev.type === "compositionend") {
      this.composing = false;
      this.inputField.style.zIndex = "";
      this.inputField.style.top = "";
      this.inputField.style.left = "";
    }
    else {
      throw new Error(`unexpected event type: ${ev.type}`);
    }
  }

  private inputHandler(): void {
    if (this.composing) {
      return;
    }
    if (this.$inputField.val() === "") {
      return;
    }
    this.insertText(this.$inputField.val());
    this.$inputField.val("");
    this.caretManager.focusInputField();
  }

  private mousemoveHandler(e: JQueryMouseEventObject): void {
    // If the selection mode is not span, there's nothing to do.
    if (this.selectionMode !== SelectionMode.SPAN) {
      return;
    }

    let elementAtMouse = this.doc.elementFromPoint(e.clientX, e.clientY);
    if (!this.guiRoot.contains(elementAtMouse)) {
      // Not in GUI tree.
      return;
    }

    const editable = (el: Element): boolean => {
      const cl = el.classList;
      return cl.contains("_real") ||
        (cl.contains("_attribute_value") &&
         this.modeTree.getAttributeHandling(el) === "edit");
    };

    let boundary;
    if (editable(elementAtMouse)) {
      boundary = this.pointToCharBoundary(e.clientX, e.clientY);
      if (boundary === undefined) {
        return;
      }
    }
    else {
      let child = elementAtMouse;
      while (!editable(elementAtMouse)) {
        child = elementAtMouse;
        elementAtMouse = child.parentNode as Element;
        if (!this.guiRoot.contains(elementAtMouse)) {
          // The mouse was in a bunch of non-editable elements.
          return;
        }
      }
      let offset = indexOf(elementAtMouse.childNodes, child);
      const range = this.doc.createRange();
      range.setStart(elementAtMouse, offset);
      range.setEnd(elementAtMouse, offset + 1);
      const rect = range.getBoundingClientRect();
      if (Math.abs(rect.left - e.clientX) >= Math.abs(rect.right - e.clientX)) {
        offset++;
      }
      boundary = this.caretManager.makeCaret(elementAtMouse, offset);
    }

    this.caretManager.setRange(this.caretManager.anchor!, boundary!);
  }

  private mousedownHandler(ev: JQueryMouseEventObject): boolean {
    // Make sure the mouse is not on a scroll bar.
    if (!this.scroller.isPointInside(ev.pageX, ev.pageY)) {
      return false;
    }

    const boundary = this.pointToCharBoundary(ev.clientX, ev.clientY);
    if (boundary === undefined) {
      return true;
    }

    this.$guiRoot.one("mouseup", this.mouseupHandler.bind(this));

    this.errorLayer.unselectAll();
    this.$errorList.find(".selected").removeClass("selected");

    const root = this.guiRoot;
    const target = ev.target;
    const placeholder = closestByClass(target, "_placeholder", root);
    const label = closestByClass(target, "_label", root);
    const caretManager = this.caretManager;
    switch (ev.which) {
    case 1:
      // Don't track selections in gui elements, except if they are inside an
      // attribute value.
      if (closest(target, "._gui, ._phantom", root) === null ||
          closestByClass(target, "_attribute_value", root) !== null) {
        this.$guiRoot.on("mousemove.wed", this.mousemoveHandler.bind(this));
      }

      // If the caret is changing due to a click on a placeholder, then put it
      // inside the placeholder.
      if (placeholder !== null) {
        caretManager.setCaret(placeholder, 0);
      }
      else if (label !== null) {
        // If the caret is changing due to a click on a label, then normalize it
        // to a valid position.
        caretManager.setCaretToLabelPosition(target, label, boundary);
      }
      else {
        caretManager.setCaret(boundary);
      }

      if (ev.target.classList.contains("wed-validation-error")) {
        return true;
      }

      break;
    case 3:
      const range = this.caretManager.range;
      if (!(range !== undefined && !range.collapsed)) {
        // If the caret is changing due to a click on a placeholder, then put it
        // inside the placeholder.
        if (placeholder !== null) {
          caretManager.setCaret(placeholder, 0);
        }
        else if (label !== null) {
          // If the caret is changing due to a click on a label, then normalize
          // it to a valid position.
          caretManager.setCaretToLabelPosition(target, label, boundary);
        }
        else {
          caretManager.setCaret(boundary);
        }
      }
      break;
    default:
    }
    return false;
  }

  // In previous versions of wed all mouse button processing was done in
  // _mousedownHandler. However, this caused problems when processing context
  // menus events. On IE in particular the mouseup that would occur when a
  // context menu is brought up would happen on the newly brought up menu and
  // would cause focus problems.
  private mouseupHandler(ev: JQueryEventObject): boolean {
    // Make sure the mouse is not on a scroll bar.
    if (!this.scroller.isPointInside(ev.pageX, ev.pageY)) {
      return false;
    }

    const boundary = this.pointToCharBoundary(ev.clientX, ev.clientY);
    if (boundary === undefined) {
      return true;
    }

    // Normalize.
    if (ev.type === "contextmenu") {
      ev.which = 3;
    }

    const root = this.guiRoot;
    const target = ev.target;
    const placeholder = closestByClass(target, "_placeholder", root);
    const label = closestByClass(target, "_label", root);
    const caretManager = this.caretManager;
    switch (ev.which) {
    case 3:
      // If the caret is changing due to a click on a placeholder, then put it
      // inside the placeholder.
      if (placeholder !== null) {
        caretManager.setCaret(target, 0);
      }

      if (label !== null) {
        caretManager.setCaretToLabelPosition(target, label, boundary);
        $(target).trigger("wed-context-menu", [ev]);
      }
      else {
        // If the editor is just gaining focus with *this* click, then
        // this.caretManager.caret will not be set. It also means the range is
        // collapsed.
        if (caretManager.caret === undefined) {
          caretManager.setCaret(boundary);
        }

        if (closest(target, "*[data-wed--custom-context-menu]",
                    root) !== null) {
          $(target).trigger("wed-context-menu", [ev]);
        }
        else {
          this.editingMenuManager.contextMenuHandler(ev);
        }
      }
      break;
    default:
    }
    this.$guiRoot.off("mousemove");
    ev.preventDefault();
    return false;
  }

  private mouseoverHandler(ev: JQueryMouseEventObject): void {
    const root = this.guiRoot;
    const label = closestByClass(ev.target, "_label", root);
    if (label !== null) {
      // Get tooltips from the current mode
      const real = closestByClass(label, "_real", root);
      const origName = util.getOriginalName(real!);
      const options = {
        title: () => {
          const mode = this.modeTree.getMode(label);
          return mode.shortDescriptionFor(origName);
        },
        container: "body",
        delay: { show: 1000 },
        placement: "auto top",
        trigger: "hover",
      };
      this.makeGUITreeTooltip($(label), options);
      const tt = $.data(label, "bs.tooltip");
      tt.enter(tt);
    }
  }

  private mouseoutHandler(ev: JQueryMouseEventObject): boolean | undefined {
    const root = this.guiRoot;
    const label = closestByClass(ev.target, "_label", root);
    if (label !== null) {
      $(label).tooltip("destroy");
      // See _mouseoutHandler. We return false here for symmetry.
      return false;
    }

    return undefined;
  }

  private refreshSaveStatus(): void {
    if (this.saver !== undefined) {
      const saveStatus = this.saver.getSavedWhen();
      this.$saveStatus.children("span").first()
        .text(saveStatus !== undefined ? saveStatus : "");
      if (saveStatus === undefined) {
        this.$saveStatus.removeClass("label-success label-info")
          .addClass("label-default");
      }
      else {
        const kind = this.saver.getLastSaveKind();
        let toAdd;
        let tip;
        switch (kind) {
        case SaveKind.AUTO:
          toAdd = "label-info";
          tip = "The last save was an autosave.";
          break;
        case SaveKind.MANUAL:
          toAdd = "label-success";
          tip = "The last save was a manual save.";
          break;
        default:
          throw new Error(`unexpected kind of save: ${kind}`);
        }
        this.$saveStatus.removeClass("label-default label-info label-success")
          .addClass(toAdd);
        this.$saveStatus.tooltip("destroy");
        this.$saveStatus.tooltip({
          title: tip,
          container: "body",
          placement: "auto top",
          trigger: "hover",
        });
      }

      const modified = this.saver.getModifiedWhen();
      if (modified !== false) {
        this.$modificationStatus.removeClass("label-success");
        this.$modificationStatus.addClass("label-warning");
        this.$modificationStatus.children("i").css("visibility", "");
      }
      else {
        this.$modificationStatus.removeClass("label-warning");
        this.$modificationStatus.addClass("label-success");
        this.$modificationStatus.children("i").css("visibility", "hidden");
      }
    }
  }

  private onValidatorStateChange(workingState: WorkingStateData): void {
    const state = workingState.state;
    if (state === WorkingState.VALID || state === WorkingState.INVALID) {
      if (!this._firstValidationComplete) {
        this._firstValidationComplete = true;
        this.firstValidationCompleteResolve(this);
      }
    }
  }

  private onPossibleDueToWildcardChange(node: Node): void {
    //
    // This function is designed to execute fairly quickly. **IT IS IMPORTANT
    // NOT TO BURDEN THIS FUNCTION.** It will be called for every element and
    // attribute in the data tree and thus making this function slower will have
    // a significant impact on validation speed and the speed of wed generally.
    //
    let guiNode: Node | Element | undefined | null =
      getGUINodeIfExists(this, node);

    // This may happen if we are dealing with an attribute node.
    if (isText(guiNode)) {
      guiNode = closestByClass(guiNode, "_attribute", this.guiRoot);
    }

    if (guiNode != null) {
      const decorator = this.modeTree.getDecorator(node);
      // guiNode is necessarily an Element if we get here.
      // And the property is necessarily set.
      decorator.setReadOnly(guiNode as Element,
                            this.validator.getNodeProperty(
                              node, "PossibleDueToWildcard")!);
    }

    // If the GUI node does not exist yet, then the decorator will take care of
    // adding or removing _readonly when decorating the node.
  }

  /**
   * Expand the error panel if there is no navigation.
   */
  expandErrorPanelWhenNoNavigation(): void {
    if (this.$navigationPanel[0].style.display === "none") {
      this.$errorList.parents(".panel-collapse").collapse("show");
    }
  }

  private errorItemHandler(ev: JQueryEventObject): boolean {
    const err = ev.data as GUIValidationError;
    const marker =
      document.querySelector(ev.target.getAttribute("href")!) as HTMLElement;
    this.errorLayer.select(marker);
    const $parent = $(ev.target.parentNode!);
    $parent.siblings().removeClass("selected");
    $parent.addClass("selected");

    // We move the caret to the location of the error.
    this.caretManager.setCaret(err.ev.node, err.ev.index);

    // We don't want href to cause further movement.
    return false;
  }

  setNavigationList(items: Node | JQuery | Node[]): void {
    this.$navigationList.empty();
    // tslint:disable-next-line:no-any
    this.$navigationList.append(items as any);

    // Show the navigation panel.
    this.$navigationPanel.css("display", "");
  }

  makeModal(options?: ModalOptions): Modal {
    const ret = new Modal(options);
    const $top = ret.getTopLevel();
    // Ensure that we don't lose the caret when a modal is displayed.
    $top.on("show.bs.modal.modal", () => {
      this.caretManager.pushSelection();
    });
    $top.on("hidden.bs.modal.modal", () => {
      this.caretManager.popSelection();
    });
    this.$widget.prepend($top);
    return ret;
  }

  makeGUITreeTooltip($for: JQuery, options: TooltipOptions): void {
    const title = options.title;
    if (title !== undefined) {
      options = {...options};
      options.title = () => {
        // The check is here so that we can turn tooltips on and off
        // dynamically.
        if (this.destroyed || !(this.preferences.get("tooltips") as boolean)) {
          return undefined;
        }

        return (typeof title === "function") ? title() : title;
      };
    }

    tooltip($for, options);
  }

  /**
   * Reset the label visibility level to what it was when the editor was first
   * initialized.
   */
  resetLabelVisibilityLevel(): void {
    this.setLabelVisibilityLevel(this.initialLabelLevel);
  }

  /**
   * Set the visibility level to a specific value. It is a no-op if it is called
   * with a value that is less than 0 or greater than the maximum level
   * supported, or if the new level is the same as the current level.
   *
   * @param level The new level.
   */
  setLabelVisibilityLevel(level: number): void {
    if (level < 0 || level > this.maxLabelLevel) {
      return;
    }

    while (this.currentLabelLevel > level) {
      this.decreaseLabelVisiblityLevel();
    }

    while (this.currentLabelLevel < level) {
      this.increaseLabelVisibilityLevel();
    }
  }

  increaseLabelVisibilityLevel(): void {
    if (this.currentLabelLevel >= this.maxLabelLevel) {
      return;
    }

    this.currentLabelLevel++;
    const labels = this.guiRoot.getElementsByClassName(
      `_label_level_${this.currentLabelLevel}`);
    // tslint:disable-next-line:one-variable-per-declaration
    for (let i = 0, limit = labels.length; i < limit; i++) {
      labels[i].classList.remove("_invisible");
    }

    // We cannot just refresh the errors because some errors may appear or
    // disappear due to the visibility change.
    this.validationController.recreateErrors();
    this.caretManager.mark.refresh();
  }

  decreaseLabelVisiblityLevel(): void {
    if (this.currentLabelLevel === 0) {
      return;
    }

    const prev = this.currentLabelLevel;
    this.currentLabelLevel--;
    const labels = this.guiRoot.getElementsByClassName(`_label_level_${prev}`);
    // tslint:disable-next-line:one-variable-per-declaration
    for (let i = 0, limit = labels.length; i < limit; i++) {
      labels[i].classList.add("_invisible");
    }

    // We cannot just refresh the errors because some errors may appear or
    // disappear due to the visibility change.
    this.validationController.recreateErrors();
    this.caretManager.mark.refresh();
  }

  toggleAttributeHiding(): void {
    this.guiRoot.classList.toggle("inhibit_attribute_hiding");
  }

  private closeAllTooltips(): boolean {
    const tts = this.doc.querySelectorAll("div.tooltip");
    let closed = false;
    for (let i = 0; i < tts.length; ++i) {
      const forEl = $.data(tts[i], "wed-tooltip-for");
      const data = $(forEl).data("bs.tooltip");
      if (data != null) {
        data.leave(data);
        closed = true;
      }
    }
    return closed;
  }

  excludeFromBlur(elements: JQuery | Element): void {
    // tslint:disable-next-line:no-any
    this.$excludedFromBlur.add(elements as any);
  }

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
  private findLocationAt(x: number, y: number): DLoc | undefined {
    const elementAtMouse = this.doc.elementFromPoint(x, y);
    // This could happen if x, y is outside our screen.
    if (elementAtMouse === null) {
      return undefined;
    }

    // The elementAtMouse is not in the editing pane.
    if (!this.guiRoot.contains(elementAtMouse)) {
      return undefined;
    }

    return this.findLocationInElementAt(elementAtMouse, x, y);
  }

  private findLocationInElementAt(node: Node, x: number, y: number,
                                  textOk: boolean = true): DLoc | undefined {
    const range = this.doc.createRange();

    let min: {
      dist: { x: number; y: number };
      node: Node;
      start: number;
    } | undefined;

    //
    // This function works only in cases where a space that is effectively
    // rendered as a line break on the screen has a height and width of
    // zero. (Logically this makes sense, there is no part of the screen which
    // really belongs to the space.)
    //
    function checkRange(checkNode: Node, start: number): boolean {
      let rects;
      if (isText(checkNode)) {
        range.setStart(checkNode, start);
        range.setEnd(checkNode, start + 1);
        rects = range.getClientRects();
      }
      else {
        rects = (checkNode.childNodes[start] as Element).getClientRects();
      }

      for (let rectIx = 0; rectIx < rects.length; ++rectIx) {
        const rect = rects[rectIx];
        // Not a contender...
        if (rect.height === 0 || rect.width === 0) {
          continue;
        }

        const dist = util.distsFromRect(x, y, rect.left, rect.top,
                                        rect.right, rect.bottom);
        if (min === undefined || min.dist.y > dist.y ||
            (min.dist.y === dist.y && min.dist.x > dist.x)) {
          min = {
            dist: dist,
            node: checkNode,
            start: start,
          };

          // Returning true means the search can end.
          return (dist.y === 0 && dist.x === 0);
        }
      }

      return false;
    }

    let child = node.firstChild;
    let childIx = 0;
    main_loop:
    while (child !== null) {
      if (textOk && isText(child)) {
        for (let i = 0; i < child.length; ++i) {
          if (checkRange(child, i)) {
            // Can't get any better than this.
            break main_loop;
          }
        }
      }
      else if (checkRange(node, childIx)) {
          // Can't get any better than this.
        break;
      }
      child = child.nextSibling;
      childIx++;
    }

    if (min === undefined) {
      return this.caretManager.makeCaret(node, 0);
    }

    return this.caretManager.makeCaret(min.node, min.start);
  }

  // tslint:disable-next-line:cyclomatic-complexity
  private pointToCharBoundary(x: number, y: number): DLoc | undefined {
    // This obviously won't work for top to bottom scripts.  Probably does not
    // work with RTL scripts either.
    let boundary = this.findLocationAt(x, y);
    if (boundary !== undefined) {
      const { node, offset } = boundary;
      const nodeType = node.nodeType;

      if ((isElement(node) && (offset < node.childNodes.length)) ||
          (isText(node) && (offset < node.length))) {
        // Adjust the value we return so that the location returned is the one
        // closest to the x, y coordinates.

        const range = this.doc.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        const rect = range.getBoundingClientRect();
        switch (nodeType) {
        case Node.TEXT_NODE:
          // We use newPosition to adjust the position so that the caret ends up
          // in a location that makes sense from an editing standpoint.
          const right = this.caretManager.newPosition(boundary, "right");
          const left = this.caretManager.newPosition(boundary.make(node,
                                                                   offset + 1),
                                                     "left");
          if (right !== undefined && left === undefined) {
            boundary = right;
          }
          else if (left !== undefined && right === undefined) {
            boundary = left;
          }
          else if (right !== undefined && left !== undefined) {
            boundary = (Math.abs(boundaryXY(right).left - x) >=
                        Math.abs(boundaryXY(left).left - x) ?
                        left : right);
          }
          break;
        case Node.ELEMENT_NODE:
          // We don't use newPosition here because we want to skip over the
          // *whole* element.
          let before;
          const pointedNode = node.childNodes[offset];
          if (isElement(pointedNode)) {
            const closestPos = this.findLocationInElementAt(pointedNode, x, y)!;
            const limit = isElement(closestPos.node) ?
                  closestPos.node.childNodes.length - 1 : -1;
            switch (closestPos.offset) {
            case 0:
              before = true;
              break;
            case limit:
              before = false;
              break;
            default:
            }
          }

          if (before === undefined) {
            before = Math.abs(rect.left - x) < Math.abs(rect.right - x);
          }

          if (!before) {
            boundary = boundary.make(node, offset + 1);
          }

          break;
        default:
          throw new Error(`unexpected node type: ${nodeType}`);
        }
      }
    }
    return boundary;
  }

  // tslint:disable-next-line:max-func-body-length cyclomatic-complexity
  private caretChange(ev: CaretChange): void {
    const { options, caret, prevCaret, mode, prevMode, manager } = ev;
    if (caret === undefined) {
      return;
    }

    const textEdit = options.textEdit === true;
    const gainingFocus = options.gainingFocus === true;
    // We don't want to do this on regaining focus.
    if (!gainingFocus) {
      this.editingMenuManager.setupCompletionMenu();
    }

    // Caret movement terminates a text undo, unless the caret is moved by a
    // text edit.
    if (!textEdit) {
      this.terminateTextUndo();
    }

    // The class owns_caret can be on more than one element. The classic case is
    // if the caret is at an element label.
    while (this.caretOwners[0] !== undefined) {
      this.caretOwners[0].classList.remove("_owns_caret");
    }

    // _label_clicked can also be on more than one element.
    while (this.clickedLabels[0] !== undefined) {
      this.clickedLabels[0].classList.remove("_label_clicked");
    }

    // _with_caret should not be on more than one element, but if a momentary
    // issue happens, we fix it here.
    let hadCaret: Element | undefined;
    while (this.withCaret[0] !== undefined) {
      // We record the element with the caret. If there is more than one, which
      // should not happen except in transient cases, it does not matter as it
      // only means that we'll have an unnecessary error recreation.
      hadCaret = this.withCaret[0];
      hadCaret.classList.remove("_with_caret");
    }

    if (prevCaret !== undefined) {
      const oldTp = closest(prevCaret.node, "._placeholder._transient",
                            prevCaret.root);
      if (oldTp !== null && caret.root.contains(oldTp)) {
        this.guiUpdater.removeNode(oldTp);
      }
    }

    const node = isElement(caret.node) ?
      caret.node : caret.node.parentNode as HTMLElement;
    const root = caret.root;

    // This caret is no longer in the gui tree. It is probably an intermediary
    // state so don't do anything with it.
    if (!this.guiRoot.contains(node)) {
      return;
    }

    if (mode !== prevMode) {
      this.toolbar.setModeButtons(
        mode !== undefined ? mode.getToolbarButtons() : []);
    }

    const real = closestByClass(node, "_real", root);
    if (real !== null) {
      real.classList.add("_owns_caret");
    }

    let hasCaret: Element | undefined;
    const gui = closestByClass(node, "_gui", root);
    // Make sure that the caret is in view.
    if (gui !== null) {
      if (manager.anchor === undefined ||
          closestByClass(manager.anchor.node, "_gui", root) === gui) {
        for (const child of domutil.childrenByClass(gui.parentNode!, "_gui")) {
          child.classList.add("_label_clicked");
        }

        gui.classList.add("_with_caret");
        hasCaret = gui;
      }
    }
    else {
      node.classList.add("_owns_caret");
    }

    // When the caret moves, it may move outside of, or into, a start label
    // that has autohidden attributes. In such case, we must recreate the
    // errors, so that any error associated with an attribute that may be
    // shown or hidden is recreated to fix hyperlinking.
    if ((hadCaret !== hasCaret) &&
        ((hasCaret !== undefined &&
          hasCaret.getElementsByClassName("_shown_when_caret_in_label")
          .length !== 0) ||
         (hadCaret !== undefined &&
          hadCaret.getElementsByClassName("_shown_when_caret_in_label")
          .length !== 0))) {
      this.validationController.recreateErrors();
    }

    if (!gainingFocus) {
      manager.mark.scrollIntoView();
    }

    // We need to refresh the mark here because the modifications we made above
    // to the CSS may have caused GUI items to appear or disappear and may have
    // mucked up the caret mark.
    this.caretManager.mark.refresh();
    this.setLocationTo(node);
  }

  /**
   * Set the location bar to a new location.
   *
   * @param el The element at which the location should point.
   */
  private setLocationTo(el: Element): void {
    const steps = [];
    while (el !== this.guiRoot) {
      if (el.nodeType !== Node.ELEMENT_NODE) {
        throw new Error(`unexpected node type: ${el.nodeType}`);
      }

      if (!el.classList.contains("_placeholder") &&
          closestByClass(el, "_phantom", this.guiRoot) === null) {
        steps.unshift(`<span class='_gui _label'><span>&nbsp;\
${util.getOriginalName(el)}&nbsp;</span></span>`);
      }
      el = el.parentNode as HTMLElement;
    }
    const span = this.wedLocationBar.getElementsByTagName("span")[0];
    // tslint:disable-next-line:no-inner-html
    span.innerHTML =
      steps.length !== 0 ? steps.join("/") : "<span>&nbsp;</span>";
  }

  public replaceRange(editor: EditorAPI,
                      data: ReplaceRangeTransformationData): void {
    const caretManager = editor.caretManager;
    const { range, newText, caretAtEnd } = data;
    const { start, end } = range;
    const dataStart = caretManager.toDataLocation(start)!;
    const dataEnd = caretManager.toDataLocation(end)!;

    let caret: DLoc;
    if (isAttr(dataStart.node)) {
      const attr = dataStart.node;
      let value = attr.value;
      value = value.slice(0, dataStart.offset) + newText +
        value.slice(dataEnd.offset);
      editor.dataUpdater.setAttributeNS(
        attr.ownerElement!,
        attr.namespaceURI === null ? "" : attr.namespaceURI,
        attr.name, value);
      if (caretAtEnd) {
        caret = dataStart.makeWithOffset(dataStart.offset + newText.length);
      }
      else {
        caret = dataStart;
      }
    }
    else {
      const cutRet = editor.dataUpdater.cut(dataStart, dataEnd)[0];
      ({ caret } = editor.dataUpdater.insertText(cutRet, newText, caretAtEnd));
    }
    caretManager.setCaret(caret, { textEdit: true });
  }
}

export {
  PasteTransformationData,
  ReplaceRangeTransformationData,
};

//  LocalWords:  MPL keyConstants KEYPRESS sm md contenteditable constrainer sb
//  LocalWords:  scroller nbsp href nav ul li errorlist HTMLElement jQuery lt
//  LocalWords:  html runtime DLocRoot config navlist popstate attr xmlns xml
//  LocalWords:  getDescriptionFor fireTransformation exitTaskSuspension tooOld
//  LocalWords:  readonly attrVal Refetch pathToNode nodeToPath Autosaved bs ev
//  LocalWords:  editedByOther autosaving guiRoot BeforeInsertNodeAt tooltip ns
//  LocalWords:  InsertNodeAt tooltips BeforeDeleteNode stylesheet css tabindex
//  LocalWords:  revalidate dragenter dragstart dragover keydown keypress pageX
//  LocalWords:  compositionstart compositionupdate compositionend mousedown px
//  LocalWords:  mouseover mouseout contextmenu mousemove mouseup pageY screenX
//  LocalWords:  screenY docUrl wed's enterStartTag pheight maxPanelHeight cd
//  LocalWords:  domutil childByClass outerHeight clipboardData parsererror Yay
//  LocalWords:  Ctrl CapsLock activeElement querySelector getCaret dataNode nd
//  LocalWords:  noop keyup mousedownHandler caretManager mouseoutHandler rect
//  LocalWords:  typeahead autosave guiNode PossibleDueToWildcard RTL nodeType
//  LocalWords:  currentLabelLevel elementAtMouse newPosition
