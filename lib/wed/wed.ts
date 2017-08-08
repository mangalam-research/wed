/**
 * The main module of wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as Ajv from "ajv";
import "bootstrap";
import * as $ from "jquery";
import * as salve from "salve";
import { WorkingState, WorkingStateData } from "salve-dom";

import { Action } from "./action";
import * as buildInfo from "./build-info";
import { CaretChange, CaretManager } from "./caret-manager";
import * as caretMovement from "./caret-movement";
import { Decorator } from "./decorator";
import { DLoc, DLocRoot } from "./dloc";
import * as domlistener from "./domlistener";
import { isAttr, isElement, isText } from "./domtypeguards";
import * as domutil from "./domutil";
import { closest, closestByClass, htmlToElements, indexOf } from "./domutil";
import { AbortTransformationException } from "./exceptions";
import { GUIUpdater } from "./gui-updater";
import { EditingMenuManager } from "./gui/editing-menu-manager";
import { ErrorLayer } from "./gui/error-layer";
import * as icon from "./gui/icon";
import { Layer } from "./gui/layer";
import { Modal, Options as ModalOptions } from "./gui/modal";
import { notify } from "./gui/notify";
import { Scroller } from "./gui/scroller";
import { tooltip } from "./gui/tooltip";
import { TypeaheadPopup } from "./gui/typeahead-popup";
import { GUIRoot } from "./guiroot";
import { Key, makeKey } from "./key";
import * as keyConstants from "./key-constants";
import * as log from "./log";
import { Mode } from "./mode";
import { ModeTree } from "./mode-tree";
import * as onbeforeunload from "./onbeforeunload";
import * as onerror from "./onerror";
import { Options } from "./options";
import * as optionsSchema from "./options-schema.json";
import * as preferences from "./preferences";
import { Runtime } from "./runtime";
import { FailedEvent, SaveKind, Saver, SaverConstructor } from "./saver";
import { Task, TaskRunner } from "./task-runner";
import { insertElement, mergeWithNextHomogeneousSibling,
         mergeWithPreviousHomogeneousSibling, splitNode, Transformation,
         TransformationData } from "./transformation";
import { TreeUpdater } from "./tree-updater";
import { Undo, UndoList } from "./undo";
import { UndoRecorder } from "./undo-recorder";
import * as util from "./util";
import { ErrorItemHandler,
         ValidationController } from "./validation-controller";
import { Validator } from "./validator";
import { boundaryXY, getGUINodeIfExists } from "./wed-util";
import * as wundo from "./wundo";

export const version = "0.29.0";

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
  execute(): void {
    this.editor.complexPatternModal.modal();
  }
}

export interface PasteTransformationData extends TransformationData {
  to_paste: Element;
}

const FRAMEWORK_TEMPLATE = "\
<div class='row'>\
 <div class='wed-frame col-sm-push-2 col-lg-10 col-md-10 col-sm-10'>\
  <div class='row'>\
   <div class='progress'>\
    <span></span>\
    <div id='validation-progress' class='progress-bar' style='width: 0%'></div>\
   </div>\
  </div>\
  <div class='row'>\
   <div class='wed-cut-buffer' contenteditable='true'></div>\
   <div class='wed-document-constrainer'>\
    <input class='wed-comp-field' type='text'></input>\
    <div class='wed-caret-layer'></div>\
    <div class='wed-scroller'>\
     <div class='wed-error-layer'></div>\
     <div class='wed-document'><span class='root-here'></span></div>\
    </div>\
   </div>\
   <div class='wed-location-bar'><span>&nbsp;</span></div>\
  </div>\
 </div>\
 <div id='sidebar' class='col-sm-pull-10 col-lg-2 col-md-2 col-sm-2'>\
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
export class Editor {
  private _firstValidationComplete: boolean = false;
  private firstValidationCompleteResolve: (value: Editor) => void;
  private initializedResolve: (value: Editor) => void;
  // tslint:disable-next-line:no-any
  private modeData: any = {};
  private developmentMode: boolean = false;
  private textUndoMaxLength: number = 10;
  private readonly taskRunners: TaskRunner[] = [];
  private taskSuspension: number = 0;
  // We may want to make this configurable in the future.
  private readonly normalizeEnteredSpaces: boolean = true;
  private readonly strippedSpaces: RegExp = /\u200B/g;
  private readonly replacedSpaces: RegExp = /\s+/g;
  private destroying: boolean = false;
  private destroyed: boolean = false;
  private currentLabelLevel: number;
  /** A temporary initialization value. */
  private _dataChild: Element | undefined;
  private scroller: Scroller;
  private inputField: HTMLInputElement;
  private $inputField: JQuery;
  private cutBuffer: HTMLElement;
  private caretLayer: Layer;
  private errorLayer: ErrorLayer;
  private wedLocationBar: HTMLElement;
  private sidebar: HTMLElement;
  private validationProgress: HTMLElement;
  private validationMessage: HTMLElement;
  private caretOwners: NodeList;
  private clickedLabels: NodeList;
  private withCaret: NodeList;
  private guiUpdater: GUIUpdater;
  private undoRecorder: UndoRecorder;
  private $modificationStatus: JQuery;
  private $saveStatus: JQuery;
  private $navigationPanel: JQuery;
  private limitationModal: Modal;
  private pasteModal: Modal;
  private disconnectModal: Modal;
  private editedByOtherModal: Modal;
  private tooOldModal: Modal;
  private $navigationList: JQuery;
  private $excludedFromBlur: JQuery;
  private errorItemHandlerBound: ErrorItemHandler;
  private _undo: UndoList;
  private saveStatusInterval: number | undefined;
  private readonly globalKeydownHandlers: KeydownHandler[] = [];
  private updatingPlaceholder: number = 0;
  private preferences: preferences.Preferences;
  private composing: boolean = false;
  private compositionData: {
    // tslint:disable-next-line:no-any
    data: any;
    startCaret: DLoc | undefined;
  } | undefined;
  private currentTypeahead: TypeaheadPopup | undefined;

  /** A name for this editor. */
  name: string = "";

  /** A promise that resolves once the first validation is complete. */
  readonly firstValidationComplete: Promise<Editor>;

  /** A promise that resolves once the editor is initialized. */
  readonly initialized: Promise<Editor>;

  /** The HTMLElement controlled by this editor */
  widget: HTMLElement;

  /** Same as [[widget]] but as a jQuery object. */
  $widget: JQuery;

  /** The &lt;html> element that holds the widget. */
  $frame: JQuery;

  /** The window which holds the widget. */
  window: Window;

  /** The document which holds the widget. */
  doc: Document;

  /** The root of the data tree. */
  dataRoot: Document;

  /** Same as [[dataRoot]] but as a jQuery object. */
  $dataRoot: JQuery;

  /** The root of the GUI tree. */
  guiRoot: HTMLElement;

  /** Same as [[guiRoot]] but as a jQuery object. */
  $guiRoot: JQuery;

  /** The runtime associated with this editor. */
  runtime: Runtime;

  /** The options used by this editor. */
  options: Options;

  /** The maximum label level that labels may have. */
  maxLabelLevel: number;

  /** The DLocRoot object marking the root of the GUI tree. */
  guiDLocRoot: DLocRoot;

  /** The DLocRoot object marking the root of the data tree. */
  dataDLocRoot: DLocRoot;

  /** The updater through which all data tree manipulations must be made. */
  dataUpdater: TreeUpdater;

  /** Modal to display when there is an XML straddling error. */
  straddlingModal: Modal;

  /** The modal that shows generic help. */
  helpModal: Modal;

  /** A modal to present when encountering a complex name pattern. */
  complexPatternModal: Modal;

  /** DOM listener on the GUI tree. */
  domlistener: domlistener.Listener;

  /** The list of errors in the sidebar. */
  $errorList: JQuery;

  /**
   * The action to perform is a user is tyring to do something with a complex
   * pattern.
   */
  complexPatternAction: Action<{}>;

  /** Paste transformation. */
  pasteTr: Transformation<PasteTransformationData>;

  /** Cut transformation. */
  cutTr: Transformation<TransformationData>;

  /** Transformation for splitting nodes. */
  splitNodeTr: Transformation<TransformationData>;

  /** The link for the embedded documentation page. */
  docLink: string;

  mergeWithPreviousHomogeneousSiblingTr: Transformation<TransformationData>;

  mergeWithNextHomogeneousSiblingTr: Transformation<TransformationData>;

  modeTree: ModeTree;

  decorator: Decorator;

  mode: Mode<{}>;

  caretManager: CaretManager;

  validator: Validator;

  validationController: ValidationController;

  editingMenuManager: EditingMenuManager;

  saver: Saver;

  constructor() {
    // tslint:disable-next-line:promise-must-complete
    this.firstValidationComplete = new Promise((resolve) => {
      this.firstValidationCompleteResolve = resolve;
    });

    // tslint:disable-next-line:promise-must-complete
    this.initialized = new Promise((resolve) => {
      this.initializedResolve = resolve;
    });

    onerror.editors.push(this);
  }

  /**
   * @param tr The transformation to fire.
   *
   * @param data Arbitrary data to be passed to the transformation.
   */
  fireTransformation<T extends TransformationData>(tr: Transformation<T>,
                                                   data: T): void {
    // This is necessary because our context menu saves/restores the selection
    // using rangy. If we move on without this call, then the transformation
    // could destroy the markers that rangy put in and rangy will complain.
    this.editingMenuManager.dismiss();
    let currentGroup = this._undo.getGroup();
    if (currentGroup instanceof wundo.TextUndoGroup) {
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
        // A data node could be an attribute node but unfortunately,
        // ``contains`` does not work on such nodes so we need to manually
        // handle it.
        const check = isAttr(node) ? node.ownerElement : node;
        if (!this.dataRoot.contains(check)) {
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

    tr.handler(this, data);
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

  recordUndo(undo: Undo): void {
    this._undo.record(undo);
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

  undoMarker(msg: string): void {
    this.recordUndo(new wundo.MarkerUndo(msg));
  }

  undoingOrRedoing(): boolean {
    return this._undo.undoingOrRedoing();
  }

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
  isAttrProtected(name: string, parent: Element): boolean;
  isAttrProtected(node: Attr | Element): boolean;
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

  /**
   * Saves the document.
   *
   * @returns A promise that resolves when the save operation is done.
   */
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

  private insertText(text: string): void {
    // We remove zero-width spaces.
    this.closeAllTooltips();

    text = this.normalizeEnteredText(text);

    if (text === "") {
      return;
    }

    const caretManager = this.caretManager;
    let caret = caretManager.caret;

    if (caret === undefined) {
      return;
    }

    const el = closestByClass(caret.node, "_real", this.guiRoot);
    // We do not operate on elements that are readonly.
    if (el === null || el.classList.contains("_readonly")) {
      return;
    }

    this.enterTaskSuspension();
    try {
      const attrVal = closestByClass(caret.node, "_attribute_value",
                                     this.guiRoot);
      if (attrVal === null) {
        caret = caretManager.getDataCaret()!;
        text = this.compensateForAdjacentSpaces(text, caret);
        if (text === "") {
          return;
        }

        const textUndo = this.initiateTextUndo();
        const [modified, newText] = this.dataUpdater.insertText(caret, text);
        if (modified === undefined) {
          caretManager.setCaret(newText, text.length, { textEdit: true });
        }
        else {
          let finalOffset;
          // Before the call, either the caret was in the text node that
          // received the new text...
          if (modified === caret.node) {
            finalOffset = caret.offset + text.length;
          }
          // ... or it was immediately adjacent to this text node.
          else if (caret.node.childNodes[caret.offset] === modified) {
            finalOffset = text.length;
          }
          else {
            finalOffset = modified.nodeValue!.length;
          }
          caretManager.setCaret(modified, finalOffset, { textEdit: true });
        }
        textUndo.recordCaretAfter();
      }
      else {
        // Modifying an attribute...
        this.spliceAttribute(attrVal as HTMLElement, caret.offset, 0, text);
      }
    }
    finally {
      this.exitTaskSuspension();
      this.validationController.refreshErrors();
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

    const textUndo = this.initiateTextUndo();
    val = val.slice(0, offset) + add + val.slice(offset + count);
    offset += add.length;
    const dataReal =
      $.data(closestByClass(attrVal, "_real")!, "wed_mirror_node");
    const guiPath = this.nodeToPath(attrVal);
    const name =
      domutil.siblingByClass(attrVal, "_attribute_name")!.textContent!;
    const resolved = this.mode.getAbsoluteResolver().resolveName(name, true);
    if (resolved === undefined) {
      throw new Error(`cannot resolve ${name}`);
    }
    this.dataUpdater.setAttributeNS(dataReal, resolved.ns, resolved.name, val);
    // Redecoration of the attribute's element may have destroyed our old
    // attrVal node. Refetch. And after redecoration, the attribute value
    // element may not have a child.
    let moveTo = this.pathToNode(guiPath)!;
    if (moveTo.firstChild !== null) {
      moveTo = moveTo.firstChild;
    }
    this.caretManager.setCaret(moveTo, offset, { textEdit: true });
    textUndo.recordCaretAfter();
  }

  /**
   * @param loc Location where to insert.
   *
   * @returns The placeholder.
   */
  insertTransientPlaceholderAt(loc: DLoc): Element {
    const ph =
      // tslint:disable-next-line:no-jquery-raw-elements
      $("<span class='_placeholder _transient' contenteditable='false'> \
</span>", loc.node.ownerDocument)[0];
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
      this.tooOldModal.modal(
        this.window.location.reload.bind(this.window.location));
    }
    else if (error.type === "save_disconnected") {
      this.disconnectModal.modal(() => {
        // tslint:disable-next-line:no-floating-promises
        this.save();
      });
    }
    else if (error.type === "save_edited") {
      this.editedByOtherModal.modal(() => {
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
    this.destroying = true;
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

    // ... but keep these two. Calling destroy over and over is okay.
    this.destroyed = true;
    // tslint:disable-next-line:no-empty
    this.destroy = function fakeDestroy(): void {};
  }

  // tslint:disable-next-line:max-func-body-length
  async init(widget: HTMLElement, options: Options,
             xmlData?: string): Promise<Editor> {
    this.preferences = new preferences.Preferences({
      tooltips: true,
    });

    this.widget = widget;
    this.$widget = $(this.widget);

    // We could be loaded in a frame in which case we should not alter anything
    // outside our frame.
    this.$frame = $(closest(this.widget, "html"));
    const doc = this.$frame[0].ownerDocument;
    this.window = doc.defaultView;
    this.doc = doc;

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

    // It is possible to pass a runtime as "options" but if the user passed
    // actual options, then make a runtime from them.
    this.runtime = (options instanceof Runtime) ? options :
      new Runtime(options);
    options = this.runtime.options;

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
                      // We need "as string" due to:
                      // https://github.com/palantir/tslint/issues/2736
                      (ajv.errorsText(optionsValidator.errors, {
                        dataVar: "options",
                      }) as string));
    }

    this.options = options;

    this.name = options.name !== undefined ? options.name : "";

    if (options.ajaxlog !== undefined) {
      log.addURL(options.ajaxlog.url, options.ajaxlog.headers);
    }

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

    // $guiRoot represents the document root in the HTML elements displayed. The
    // top level element of the XML document being edited will be the single
    // child of $guiRoot.
    this.guiRoot =
      framework.getElementsByClassName("wed-document")[0] as HTMLElement;
    this.$guiRoot = $(this.guiRoot);
    this.scroller =
      new Scroller(
        framework.getElementsByClassName("wed-scroller")[0] as HTMLElement);

    this.inputField =
      framework.getElementsByClassName("wed-comp-field")[0] as HTMLInputElement;
    this.$inputField = $(this.inputField);
    this.cutBuffer =
      framework.getElementsByClassName("wed-cut-buffer")[0] as HTMLElement;

    this.caretLayer = new Layer(
      framework.getElementsByClassName("wed-caret-layer")[0] as HTMLElement);
    this.errorLayer = new ErrorLayer(
      framework.getElementsByClassName("wed-error-layer")[0] as HTMLElement);

    this.wedLocationBar =
      framework.getElementsByClassName("wed-location-bar")[0] as HTMLElement;

    // Insert the framework and put the document in its proper place.
    const rootPlaceholder = framework.getElementsByClassName("root-here")[0];

    if (widget.firstChild !== null) {
      // tslint:disable-next-line:no-any
      if (!(widget.firstChild instanceof (this.window as any).Element)) {
        throw new Error("the data is populated with DOM elements constructed " +
                        "from another window");
      }

      rootPlaceholder.parentNode!.insertBefore(widget.firstChild,
                                               rootPlaceholder);
    }
    rootPlaceholder.parentNode!.removeChild(rootPlaceholder);
    this.widget.appendChild(framework);

    // These call to getElementById must be done after we insert the framework
    // into the document.
    const sidebar = doc.getElementById("sidebar")!;
    this.sidebar = sidebar;

    this.validationProgress = doc.getElementById("validation-progress")!;
    this.validationMessage =
      this.validationProgress.previousElementSibling as HTMLElement;

    this.caretOwners = this.guiRoot.getElementsByClassName("_owns_caret");
    this.clickedLabels =
      this.guiRoot.getElementsByClassName("_label_clicked");
    this.withCaret = this.guiRoot.getElementsByClassName("_with_caret");

    // $dataRoot is the document we are editing, $guiRoot will become decorated
    // with all kinds of HTML elements so we keep the two separate.
    this.$dataRoot = $(this.dataRoot);

    this.guiDLocRoot = new GUIRoot(this.guiRoot);
    this.dataDLocRoot = new DLocRoot(this.dataRoot);

    this.dataUpdater = new TreeUpdater(this.dataRoot);
    this.guiUpdater = new GUIUpdater(this.guiRoot, this.dataUpdater);
    this.undoRecorder = new UndoRecorder(this, this.dataUpdater);

    // This is a workaround for a problem in Bootstrap >= 3.0.0 <= 3.2.0. When
    // removing a Node that has an tooltip associated with it and the trigger is
    // delayed, a timeout is started which may timeout *after* the Node and its
    // tooltip are removed from the DOM. This causes a crash.
    //
    // All versions >= 3.0.0 also suffer from leaving the tooltip up if the Node
    // associated with it is deleted from the DOM. This does not cause a crash
    // but must be dealt with to avoid leaving orphan tooltips around.
    //
    const hasTooltips = document.getElementsByClassName("wed-has-tooltip");
    this.guiUpdater.events.subscribe((ev) => {
      if (ev.name !== "BeforeDeleteNode") {
        return;
      }

      const node = ev.node;
      if (node.nodeType !== Node.TEXT_NODE) {
        for (const hasTooltip of Array.from(hasTooltips)) {
          if (!node.contains(hasTooltip)) {
            continue;
          }

          const tt = $.data(hasTooltip, "bs.tooltip");
          if (tt != null) {
            tt.destroy();
          }

          // We don't remove the wed-has-tooltip class. Generally, the elements
          // that have tooltips and are removed from the GUI tree won't be added
          // to the tree again. If they are added again, they'll most likely get
          // a new tooltip so removing the class does not gain us much because
          // it will be added again.
          //
          // If we *were* to remove the class, then the collection would change
          // as we go through it.
        }
      }
    });

    this.$modificationStatus =
      $(sidebar.getElementsByClassName("wed-modification-status")[0]);
    this.$saveStatus =
      $(sidebar.getElementsByClassName("wed-save-status")[0]);

    this.$navigationPanel =
      $(sidebar.getElementsByClassName("wed-navigation-panel")[0]);
    this.$navigationPanel.css("display", "none");

    // The limitation modal is a modal that comes up when wed cannot proceed.
    // It is not created with this.makeModal() because we don't care about the
    // selection.
    this.limitationModal = new Modal();
    this.limitationModal.setTitle("Cannot proceed");

    this.complexPatternModal = this.makeModal();
    this.complexPatternModal.setTitle("Complex Name Pattern Encountered");
    this.complexPatternModal.setBody(
      "<p>The schema contains here a complex name pattern modal. While wed has \
no problem validating such cases. It does not currently have facilities to add \
elements or attributes that match such patterns. You can continue editing your \
document but you will not be able to take advantage of the possibilities \
provided by the complex pattern here.</p>");
    this.complexPatternModal.addButton("Ok", true);

    this.pasteModal = this.makeModal();
    this.pasteModal.setTitle("Invalid structure");
    this.pasteModal.setBody("<p>The data you are trying to paste appears to be \
XML. However, pasting it here will result in a structurally invalid document. \
Do you want to paste it as text instead? (If you answer negatively, the data \
won't be pasted at all.)<p>");
    this.pasteModal.addYesNo();

    this.straddlingModal = this.makeModal();
    this.straddlingModal.setTitle("Invalid modification");
    this.straddlingModal.setBody("<p>The text selected straddles disparate \
elements of the document. You may be able to achieve what you want to do by \
selecting smaller sections.<p>");
    this.straddlingModal.addButton("Ok", true);

    const docLink = this.docLink =
      // tslint:disable-next-line:no-any
      (require as any).toUrl("../../doc/index.html") as string;
    this.helpModal = this.makeModal();
    this.helpModal.setTitle("Help");
    this.helpModal.setBody(`
<p>Click <a href='${docLink}' target='_blank'>this link</a> to see
wed's generic help. The link by default will open in a new tab.</p>
<p>The key combinations with Ctrl below are done with Command in OS X.</p>
<ul>
  <li>Clicking the right mouse button on the document contents brings up a
contextual menu.</li>
  <li>F1: help</li>
  <li>Ctrl-[: Decrease the label visibility level.</li>
  <li>Ctrl-]: Increase the label visibility level.</li>
  <li>Ctrl-S: Save</li>
  <li>Ctrl-X: Cut</li>
  <li>Ctrl-V: Paste</li>
  <li>Ctrl-C: Copy</li>
  <li>Ctrl-Z: Undo</li>
  <li>Ctrl-Y: Redo</li>
  <li>Ctrl-/: Bring up a contextual menu.</li>
</ul>
<p class='wed-build-info'>Build descriptor: ${buildInfo.desc}<br/>
Build date: ${buildInfo.date}</p>`);
    this.helpModal.addButton("Close", true);

    this.disconnectModal = this.makeModal();
    this.disconnectModal.setTitle("Disconnected from server!");
    this.disconnectModal.setBody(
      "It appears your browser is disconnected from the server. Editing is \
frozen until the connection is reestablished. Dismissing this dialog will \
retry saving. If the operation is successful, you'll be able to continue \
editing. If not, this message will reappear.");
    this.disconnectModal.addButton("Retry", true);

    this.editedByOtherModal = this.makeModal();
    this.editedByOtherModal.setTitle("Edited by another!");
    this.editedByOtherModal.setBody(
      "Your document was edited by someone else since you last loaded or \
saved it. You must reload it before trying to edit further.");
    this.editedByOtherModal.addButton("Reload", true);

    this.tooOldModal = this.makeModal();
    this.tooOldModal.setTitle("Newer version!");
    this.tooOldModal.setBody(
      "There is a newer version of the editor. You must reload it before \
trying to edit further.");
    this.tooOldModal.addButton("Reload", true);

    this.$navigationList = $(doc.getElementById("navlist"));

    this.domlistener = new domlistener.Listener(this.guiRoot, this.guiUpdater);

    // Setup the cleanup code.

    $(this.window).on("unload.wed", { editor: this }, (e) => {
      e.data.editor.destroy();
    });
    $(this.window).on("popstate.wed", () => {
      if (document.location.hash === "") {
        this.guiRoot.scrollTop = 0;
      }
    });

    this.$errorList = $(doc.getElementById("sb-errorlist"));
    this.$excludedFromBlur = $();
    this.errorItemHandlerBound = this.errorItemHandler.bind(this);
    this._undo = new UndoList();

    this.complexPatternAction = new ComplexPatternAction(
      this, "Complex name pattern", undefined, icon.makeHTML("exclamation"),
      true);

    this.pasteTr = new Transformation(this, "add", "Paste",
                                      this.paste.bind(this));
    this.cutTr = new Transformation(this, "delete", "Cut", this.cut.bind(this));
    this.splitNodeTr =
      new Transformation(this, "split", "Split <name>",
                         (editor, data) => {
                           splitNode(editor, data.node!);
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

    this.modeTree = new ModeTree(this, options.mode);

    await this.modeTree.init();
    return this.onModeChange(this.modeTree.getMode(this.guiRoot));
  }

  async onModeChange(mode: Mode<{}>): Promise<Editor> {
    // We purposely do not raise an error here so that calls to destroy can be
    // done as early as possible. It aborts the initialization sequence without
    // causing an error.
    if (this.destroyed) {
      return this;
    }
    this.mode = mode;

    this.maxLabelLevel = this.modeTree.getMaxLabelLevel();
    this.currentLabelLevel = this.modeTree.getInitialLabelLevel();

    const styles = this.modeTree.getStylesheets();
    const $head = this.$frame.children("head");
    for (const style of styles) {
      $head.append(`<link rel="stylesheet" href="${style}" type="text/css" />`);
    }

    this.guiRoot.setAttribute("tabindex", "-1");
    this.$guiRoot.focus();

    const modeTree = this.modeTree;
    this.caretManager = new CaretManager(
      this.guiDLocRoot,
      this.dataDLocRoot,
      this.inputField,
      this.guiUpdater,
      this.caretLayer,
      this.scroller,
      (node) => modeTree.getAttributeHandling(node) === "edit",
      this.mode);
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
      (root: Node, added: Node[], removed: Node[], prev: Node | null,
       next: Node | null, target: Element) => {
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

    this.decorator = this.mode.makeDecorator(this.domlistener,
                                             this, this.guiUpdater);
    // Revalidate on attribute change.
    this.domlistener.addHandler(
      "attribute-changed",
      "._real",
      (root: Node, el: Element, namespace: string, name: string) => {
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

    this.decorator.addHandlers();

    this.domlistener.addHandler(
      "included-element",
      "._label",
      (root: Node, tree: Node, parent: Node, prev: Node | null,
       next: Node | null, target: Element) => {
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
      (root: Node, added: Node[], removed: Node[], prev: Node | null,
       next: Node | null, target: Element) => {
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
             const nodes = this.mode.nodesAroundEditableContents(target);
             if (target === this.guiRoot) {
               const loc = caretManager.makeCaret(this.guiRoot, 0)!;
               ph = this.insertTransientPlaceholderAt(loc);
               caretManager.setCaret(loc, { textEdit: true });
             }
             else {
               ph = this.mode.makePlaceholderFor(target);
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
      (root: Node, added: Node[], removed: Node[], prev: Node | null,
       next: Node | null, target: Element) => {
        attributePlaceholderHandler(target);
      });

    this.domlistener.addHandler(
      "included-element",
      "._attribute_value",
      (root: Node, tree: Node, parent: Node, prev: Node | null,
       next: Node | null, target: Element) => {
        attributePlaceholderHandler(target);
      });

    this.decorator.startListening();
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

    $guiRoot.on("cut", log.wrap(this.cutHandler.bind(this)));
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

      const offset = this.$guiRoot.offset();
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
      this.limitationModal.setBody(namespaceError);
      this.limitationModal.modal();
      this.destroy();
      return this;
    }
    this.domlistener.processImmediately();
    // Flush whatever has happened earlier.
    this._undo = new UndoList();

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
<p>Click <a href='${this.docLink}' target='_blank'>this link</a> to see \
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
          const saveOptions = save!.options !== undefined ? save!.options : {};
          const saver = new SaverClass(this.runtime, version, this.dataUpdater,
                                     this.dataRoot, saveOptions!);
          this.saver = saver;

          saver.events.filter(filterSaveEvents.bind(undefined, "Saved"))
            .subscribe(this.onSaverSaved.bind(this));

          saver.events.filter(filterSaveEvents.bind(undefined, "Autosaved"))
            .subscribe(this.onSaverAutosaved.bind(this));

          saver.events.filter(filterSaveEvents.bind(undefined, "Failed"))
            .subscribe(this.onSaverFailed.bind(this));

          saver.events.filter(filterSaveEvents.bind(undefined, "Changed"))
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

  private initializeNamespaces(): string | undefined {
    const resolver = this.mode.getAbsoluteResolver();
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

      const evs =
        this.validator.possibleAt(this.dataRoot, 0).toArray() as salve.Event[];
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

  resize(): void {
    this.resizeHandler();
  }

  private resizeHandler(): void {
    let heightAfter = 0;

    function addHeight(this: Element): void {
      heightAfter += this.scrollHeight;
    }

    let $examine = this.$widget;
    while ($examine.length > 0) {
      const $next = $examine.nextAll().not("script");
      $next.each(addHeight);
      $examine = $examine.parent();
    }

    heightAfter += this.wedLocationBar.scrollHeight;

    // The height is the inner height of the window:
    // a. minus what appears before it.
    // b. minus what appears after it.
    let height = this.window.innerHeight -
      // This is the space before
      (this.scroller.getBoundingClientRect().top + this.window.pageYOffset) -
      // This is the space after
      heightAfter -
      // Some rounding problem
      1;

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
   * @param url The url to open.
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
  { tr: Action<{}>, name?: string }[]
  {
    const mode = this.mode;
    const resolver = mode.getAbsoluteResolver();
    const ret: { tr: Action<{}>, name?: string }[] = [];
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

  private cutHandler(e: JQueryEventObject): boolean {
    if (this.caretManager.getDataCaret() === undefined) {
      // XXX alert the user?
      return false;
    }

    const sel = this.caretManager.sel!;
    if (sel.wellFormed) {
      const el = closestByClass(sel.anchor.node, "_real", this.guiRoot);
      // We do not operate on elements that are readonly.
      if (el === null || el.classList.contains("_readonly")) {
        return false;
      }

      // The only thing we need to pass is the event that triggered the
      // cut.
      this.fireTransformation(this.cutTr, { e: e });
      return true;
    }

    this.straddlingModal.modal();
    return false;
  }

  private pasteHandler(e: JQueryEventObject): boolean {
    const caret = this.caretManager.getDataCaret();
    if (caret === undefined) {
      // XXX alert the user?
      return false;
    }

    const el = closestByClass(this.caretManager.anchor!.node, "_real",
                            this.guiRoot);
    // We do not operate on elements that are readonly.
    if (el === null || el.classList.contains("_readonly")) {
      return false;
    }

    // IE puts the clipboardData as a object on the window.
    // tslint:disable
    const cd = (e.originalEvent as any).clipboardData ||
      (this.window as any).clipboardData;
    // tslint:enable

    let text = cd.getData("text");
    if (text == null || text === "") {
      return false;
    }

    // This could result in an empty string.
    text = this.normalizeEnteredText(text);
    if (text === "") {
      return false;
    }

    const parser = new this.window.DOMParser();
    const doc = parser.parseFromString(`<div>${text}</div>`, "text/xml");
    let asXML = true;
    if (isElement(doc.firstChild) &&
        doc.firstChild.tagName === "parsererror" &&
        doc.firstChild.namespaceURI ===
        // tslint:disable-next-line:no-http-string
        "http://www.mozilla.org/newlayout/xml/parsererror.xml") {
      asXML = false;
    }

    let data: Element;
    if (asXML) {
      data = doc.firstChild as Element;
      // Otherwise, check whether it is valid.
      const errors = this.validator.speculativelyValidate(
        caret, Array.prototype.slice.call(data.childNodes));

      if (errors) {
        // We need to save this before we bring up the modal because clicking to
        // dismiss the modal will mangle ``cd``.
        this.pasteModal.modal(() => {
          if (this.pasteModal.getClickedAsText() === "Yes") {
            data = this.doc.createElement("div");
            data.textContent = text;
            // At this point data is a single top level fake <div> element which
            // contains the contents we actually want to paste.
            this.fireTransformation(
              this.pasteTr,
              { node: caret!.node, to_paste: data, e: e });
          }
        });
        return false;
      }
    }
    else {
      data = this.doc.createElement("div");
      data.textContent = text;
    }

    // At this point data is a single top level fake <div> element
    // which contains the contents we actually want to paste.
    this.fireTransformation(this.pasteTr,
                            { node: caret.node, to_paste: data, e: e });
    return false;
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
      this.helpModal.modal();
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
        this.caretManager.move(direction, e.shiftKey);
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
    else if (keyConstants.CTRLEQ_S.matchesEvent(e)) {
      // tslint:disable-next-line:no-floating-promises
      this.save();
      return terminate();
    }
    else if (keyConstants.CTRLEQ_Z.matchesEvent(e)) {
      this.undo();
      return terminate();
    }
    else if (keyConstants.CTRLEQ_Y.matchesEvent(e)) {
      this.redo();
      return terminate();
    }
    else if (keyConstants.CTRLEQ_C.matchesEvent(e) ||
             keyConstants.CTRLEQ_X.matchesEvent(e) ||
             keyConstants.CTRLEQ_V.matchesEvent(e)) {
      return true;
    }
    else if (keyConstants.CTRLEQ_BACKQUOTE.matchesEvent(e)) {
      this.developmentMode = !this.developmentMode;
      notify(this.developmentMode ? "Development mode on." :
             "Development mode off.");
      if (this.developmentMode) {
        log.showPopup();
      }
      return terminate();
    }
    else if (keyConstants.CTRLEQ_OPEN_BRACKET.matchesEvent(e)) {
      this.decreaseLabelVisiblityLevel();
      return terminate();
    }
    else if (keyConstants.CTRLEQ_CLOSE_BRACKET.matchesEvent(e)) {
      this.increaseLabelVisibilityLevel();
      return terminate();
    }
    else if (keyConstants.CTRLEQ_FORWARD_SLASH.matchesEvent(e)) {
      let selFocusNode = selFocus !== undefined ? selFocus.node : undefined;
      if (selFocusNode !== undefined) {
        const gui = closestByClass(selFocusNode, "_gui", selFocus!.root);
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
      const trs = this.mode.getContextualActions("delete-parent",
                                                 dataNode.tagName,
                                                 dataNode, 0);

      trs[0].execute({ node: dataNode, name: dataNode.tagName });
      return terminate();
    }
    else if (isElement(selFocus.node) &&
             (selFocus.node.classList.contains("_phantom") ||
              selFocus.node.classList.contains("_phantom_wrap"))) {
      return terminate();
    }

    let textUndo;
    let parent;
    let offset;

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
        if (attrVal.textContent === "") { // empty === noop
          return terminate();
        }

        this.spliceAttribute(attrVal as HTMLElement,
                             this.caretManager.getNormalizedCaret()!.offset, 1,
                             "");
      }
      else {
        // Prevent deleting phantom stuff
        const next =
          domutil.nextCaretPosition(selFocus.toArray(), this.guiRoot, true)![0];
        if (!isElement(next) ||
            !(next.classList.contains("_phantom") ||
              next.classList.contains("_phantom_wrap"))) {
          // When a range is selected, we delete the whole range.
          if (this.cutSelection()) {
            this.validationController.refreshErrors();
            return terminate();
          }

          // We need to handle the delete
          caret = this.caretManager.getDataCaret()!;
          // If the container is not a text node, we may still be just AT a text
          // node from which we can delete. Handle this.
          if (!isText(caret.node)) {
            caret = caret.make(caret.node.childNodes[caret.offset], 0);
          }

          if (isText(caret.node)) {
            parent = caret.node.parentNode!;
            offset = indexOf(parent.childNodes, caret.node);

            textUndo = this.initiateTextUndo();
            this.dataUpdater.deleteText(caret, 1);
            // Don't set the caret inside a node that has been deleted.
            if (caret.node.parentNode !== null) {
              this.caretManager.setCaret(caret, { textEdit: true });
            }
            else {
              this.caretManager.setCaret(parent, offset, { textEdit: true });
            }
            textUndo.recordCaretAfter();
          }
        }
      }
      this.validationController.refreshErrors();
      return terminate();
    }
    else if (keyConstants.BACKSPACE.matchesEvent(e)) {
      if (attrVal !== null) { // In attribute.
        if (attrVal.textContent === "") { // empty === noop
          return terminate();
        }

        this.spliceAttribute(attrVal as HTMLElement,
                             this.caretManager.getNormalizedCaret()!.offset - 1,
                             1, "");
      }
      else {
        // Prevent backspacing over phantom stuff
        const prev =
          domutil.prevCaretPosition(selFocus.toArray(), this.guiRoot, true)![0];
        if (!isElement(prev) ||
            !(prev.classList.contains("_phantom") ||
              prev.classList.contains("_phantom_wrap"))) {
          // When a range is selected, we delete the whole range.
          if (this.cutSelection()) {
            this.validationController.refreshErrors();
            return terminate();
          }

          // We need to handle the backspace
          caret = this.caretManager.getDataCaret()!;

          // If the container is not a text node, we may still be just behind a
          // text node from which we can delete. Handle this.
          if (!isText(caret.node)) {
            const last = caret.node.childNodes[caret.offset - 1];
            // tslint:disable-next-line:no-any
            const length: number | undefined = (last as any).length;
            caret = caret.make(last, length);
          }

          if (isText(caret.node)) {
            parent = caret.node.parentNode!;
            offset = indexOf(parent.childNodes, caret.node);

            // At start of text, nothing to delete.
            if (caret.offset === 0) {
              return terminate();
            }

            textUndo = this.initiateTextUndo();
            this.dataUpdater.deleteText(caret.node, caret.offset - 1,
                                         1);
            // Don't set the caret inside a node that has been deleted.
            if (caret.node.parentNode !== null) {
              this.caretManager.setCaret(caret.node, caret.offset - 1,
                                         { textEdit: true });
            }
            else {
              this.caretManager.setCaret(parent, offset, { textEdit: true });
            }
            textUndo.recordCaretAfter();
          }
        }
      }
      this.validationController.refreshErrors();
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
   * @param text The text to type in. An array of keys, a string or a single
   * key.
   */
  // tslint:disable-next-line:no-reserved-keywords
  type(text: string | Key | Key[]): void {
    if (text instanceof Key) {
      text = [text];
    }

    for (let k of text) {
      if (typeof k === "string") {
        k = (k === " ") ? keyConstants.SPACE : makeKey(k);
      }

      const event = new $.Event("keydown");
      k.setEventToMatch(event);
      this.$inputField.trigger(event);
    }
  }

  private globalKeypressHandler(wedEvent: JQueryEventObject,
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

    this.cutSelection();
    this.handleKeyInsertingText(e);
    return terminate();
  }

  private cutSelection(): boolean {
    const sel = this.caretManager.sel;
    if (sel !== undefined && !sel.collapsed) {
      if (!sel.wellFormed) {
        return true;
      }

      const textUndo = this.initiateTextUndo();
      const [start, end] = sel.mustAsDataCarets();
      const cutRet = this.dataUpdater.cut(start, end)[0];
      this.caretManager.setCaret(cutRet, { textEdit: true });
      textUndo.recordCaretAfter();
      return true;
    }

    return false;
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
      break;
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
      break;
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
          if (this.destroyed) {
            return undefined;
          }

          // The check is here so that we can turn tooltips on and off
          // dynamically.
          if (!(this.preferences.get("tooltips") as boolean)) {
            return undefined;
          }
          return this.mode.shortDescriptionFor(origName);
        },
        container: "body",
        delay: { show: 1000 },
        placement: "auto top",
        trigger: "hover",
      };
      tooltip($(label), options);
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
  displayTypeaheadPopup(x: number, y: number, width: number,
                        // tslint:disable-next-line:no-any
                        placeholder: string, options: any,
                        dismissCallback:
                        // tslint:disable-next-line:no-any
                        (obj?: { value: string }) => void): any {
    this.editingMenuManager.dismiss();
    this.caretManager.pushSelection();
    this.currentTypeahead = new TypeaheadPopup(
      this.doc, x, y, width, placeholder, options,
      (obj) => {
        this.currentTypeahead = undefined;
        this.caretManager.popSelection();
        if (dismissCallback !== undefined) {
          dismissCallback(obj);
        }
      });
    return this.currentTypeahead;
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
      // guiNode is necessarily an Element if we get here.
      // And the property is necessarily set.
      this.decorator.setReadOnly(guiNode as Element,
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

  private errorItemHandler(ev: JQueryEventObject): void {
    const marker =
      document.querySelector(ev.target.getAttribute("href")!) as HTMLElement;
    this.errorLayer.select(marker);
    const $parent = $(ev.target.parentNode!);
    $parent.siblings().removeClass("selected");
    $parent.addClass("selected");
  }

  /**
   * Sets the list of items to show in the navigation list. This will make the
   * list appear if it was not displayed previously.
   *
   * @param {Node|jQuery|Array.<Node>} items The items to show.
   */
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

  /**
   * Registers elements that are outside wed's editing pane but should be
   * considered to be part of the editor. These would typically be menus or
   * toolbars that a larger application that uses wed for editing adds around
   * the editing pane.
   *
   * @param elements The elements to register.
   */
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
      dist: { x: number, y: number };
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
              break;
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

  // tslint:disable-next-line:cyclomatic-complexity
  private caretChange(ev: CaretChange): void {
    const { options, caret, prevCaret, manager } = ev;
    if (caret === undefined) {
      return;
    }

    const textEdit = options.textEdit === true;
    const focus = options.focus === true;
    // We don't want to do this on regaining focus.
    if (!focus) {
      this.editingMenuManager.setupCompletionMenu();
    }

    // Caret movement terminates a text undo, unless the caret is moved by a
    // text edit.
    if (!textEdit) {
      this.terminateTextUndo();
    }

    // The class owns_caret can be on more than one element. The classic case is
    // if the caret is at an element label.
    let el;
    // tslint:disable-next-line:no-conditional-assignment
    while ((el = this.caretOwners[0] as HTMLElement) !== undefined) {
      el.classList.remove("_owns_caret");
    }
    // tslint:disable-next-line:no-conditional-assignment
    while ((el = this.clickedLabels[0] as HTMLElement) !== undefined) {
      el.classList.remove("_label_clicked");
    }
    // tslint:disable-next-line:no-conditional-assignment
    while ((el = this.withCaret[0] as HTMLElement) !== undefined) {
      el.classList.remove("_with_caret");
    }

    if (prevCaret !== undefined) {
      const oldTp = closest(prevCaret.node, "._placeholder._transient",
                            prevCaret.root);
      if (oldTp !== null && caret.root.contains(oldTp)) {
        this.guiUpdater.removeNode(oldTp);
      }
    }

    let node = isElement(caret.node) ?
      caret.node : caret.node.parentNode as HTMLElement;
    const root = caret.root;

    // This caret is no longer in the gui tree. It is probably an intermediary
    // state so don't do anything with it.
    if (!this.guiRoot.contains(node)) {
      return;
    }

    const real = closestByClass(node, "_real", root);
    if (real !== null) {
      real.classList.add("_owns_caret");
    }

    const gui = closestByClass(node, "_gui", root);
    // Make sure that the caret is in view.
    if (gui !== null) {
      if (manager.anchor === undefined ||
          closestByClass(manager.anchor.node, "_gui", root) === gui) {
        for (const child of domutil.childrenByClass(gui.parentNode!, "_gui")) {
          child.classList.add("_label_clicked");
        }

        gui.classList.add("_with_caret");
      }
    }
    else {
      node.classList.add("_owns_caret");
    }

    if (!focus) {
      manager.mark.scrollIntoView();
    }

    // We need to refresh the mark here because the modifications we made above
    // to the CSS may have caused GUI items to appear or disappear and may have
    // mucked up the caret mark.
    this.caretManager.mark.refresh();

    const steps = [];
    while (node !== this.guiRoot) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        throw new Error(`unexpected node type: ${node.nodeType}`);
      }

      if (!node.classList.contains("_placeholder") &&
          closestByClass(node, "_phantom", root) === null) {
        steps.unshift(`<span class='_gui _label'><span>&nbsp;\
${util.getOriginalName(node)}&nbsp;</span></span>`);
      }
      node = node.parentNode as HTMLElement;
    }
    // tslint:disable-next-line:no-inner-html
    this.wedLocationBar.innerHTML = steps.length !== 0 ? steps.join("/") :
      "<span>&nbsp;</span>";
  }

  private cut(): void {
    const caretManager = this.caretManager;
    const sel = caretManager.sel;
    if (sel === undefined) {
      throw new Error("no selection");
    }

    if (!sel.wellFormed) {
      throw new Error("malformed range");
    }

    const [startCaret, endCaret] = sel.mustAsDataCarets();
    const cutBuffer = this.cutBuffer;
    while (cutBuffer.firstChild !== null) {
      cutBuffer.removeChild(cutBuffer.firstChild);
    }
    if (isAttr(startCaret.node)) {
      const attr = startCaret.node;
      if (attr !== endCaret.node) {
        throw new Error("attribute selection that does not start " +
                        "and end in the same attribute");
      }
      const removedText = attr.value.slice(startCaret.offset, endCaret.offset);
      this.spliceAttribute(
        closestByClass(caretManager.mustFromDataLocation(startCaret).node,
                       "_attribute_value") as HTMLElement,
        startCaret.offset,
        endCaret.offset - startCaret.offset, "");
      cutBuffer.textContent = removedText;
    }
    else {
      const cutRet = this.dataUpdater.cut(startCaret, endCaret);
      const nodes = cutRet[1];
      const parser = new this.window.DOMParser();
      const doc = parser.parseFromString("<div></div>", "text/xml");
      for (const node of nodes) {
        doc.firstChild!.appendChild(doc.adoptNode(node));
      }
      cutBuffer.textContent = (doc.firstChild as Element).innerHTML;
      caretManager.setCaret(cutRet[0]);
    }

    const range = this.doc.createRange();
    const container = cutBuffer;
    range.setStart(container, 0);
    range.setEnd(container, container.childNodes.length);
    const domSel = this.window.getSelection();
    domSel.removeAllRanges();
    domSel.addRange(range);

    // We've set the range to the cut buffer, which is what we want for the cut
    // operation to work. However, the focus is also set to the cut buffer but
    // once the cut is done we want the focus to be back to our caret, so...
    setTimeout(() => {
      caretManager.focusInputField();
    }, 0);
  }

  // tslint:disable-next-line:no-any
  private paste(editor: Editor, data: PasteTransformationData): void {
    const toPaste = data.to_paste;
    const dataClone = toPaste.cloneNode(true);
    let caret = this.caretManager.getDataCaret();
    if (caret === undefined) {
      throw new Error("trying to paste without a caret");
    }

    let newCaret;

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
        const [modified, newText] =
          this.dataUpdater.insertText(caret, toPaste.firstChild.data);
        // In the first case, the node that contained the caret was modified to
        // contain the text. In the 2nd case, a new node was created **or** the
        // text that contains the text is a child of the original node.
        newCaret = ((modified === newText) && (newText === caret.node)) ?
          // tslint:disable-next-line:restrict-plus-operands
          caret.make(caret.node, caret.offset + toPaste.firstChild.length) :
          caret.make(newText!, newText!.length);
      }
    }
    else {
      const frag = document.createDocumentFragment();
      while (toPaste.firstChild !== null) {
        frag.appendChild(toPaste.firstChild);
      }
      switch (caret.node.nodeType) {
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
        throw new Error(`unexpected node type: ${caret.node.nodeType}`);
      }
    }
    if (newCaret != null) {
      this.caretManager.setCaret(newCaret);
      caret = newCaret;
    }
    this.$guiRoot.trigger("wed-post-paste", [data.e, caret, dataClone]);
  }
}
