/**
 * The API presented to modes.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Observable } from "rxjs";

import { Action } from "./action";
import { CaretManager } from "./caret-manager";
import { DLoc, DLocRange, DLocRoot } from "./dloc";
import * as domlistener from "./domlistener";
import { GUIUpdater } from "./gui-updater";
import { EditingMenuManager } from "./gui/editing-menu-manager";
import { Minibuffer } from "./gui/minibuffer";
import { Modal, Options as ModalOptions } from "./gui/modal";
import { Mode } from "./mode";
import { AttributeHidingSpecs } from "./mode-tree";
import { Options } from "./options";
import { Runtime } from "./runtime";
import { StockModals } from "./stock-modals";
import { Transformation, TransformationData,
         TransformationEvent } from "./transformation";
import { TreeUpdater } from "./tree-updater";
import { UndoEvents, UndoMarker } from "./undo";
import { ModeValidator, Validator } from "./validator";
import { CleanedWedOptions } from "./wed-options-validation";

export interface PasteTransformationData extends TransformationData {
  to_paste: Element;
}

export interface ReplaceRangeTransformationData extends TransformationData {
  range: DLocRange;
  newText: string;
  caretAtEnd: boolean;
}

export interface DecoratorAPI {
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
  elementDecorator(root: Element, el: Element, level: number,
                   preContextHandler: ((wedEv: JQueryMouseEventObject,
                                        ev: Event) => boolean) | undefined,
                   postContextHandler: ((wedEv: JQueryMouseEventObject,
                                         ev: Event) => boolean) | undefined):
  void;
}

export interface ModeTreeAPI {
  /**
   * Get the mode that governs a node.
   *
   * @param The node we want to check. This must be a done in the data tree or
   * the GUI tree.
   *
   * @returns The mode that governs the node.
   */
  getMode(node: Node): Mode;

  /**
   * Get the decorator that governs a node.
   */
  getDecorator(node: Node): DecoratorAPI;

  /**
   * Get the processed wed options that are in effect for a given node.
   *
   * @param The node we want to check. This must be a done in the data tree or
   * the GUI tree.
   *
   * @returns The wed options that governs the node.
   */
  getWedOptions(node: Node): CleanedWedOptions;

  /**
   * Get the attribute handling that applies to a specific node.
   */
  getAttributeHandling(node: Node): "show" | "hide" | "edit";

  /**
   * Get the attribute hiding specs that apply to a specific node.
   *
   * @returns The specifications that apply to the node. These specifications
   * have been preprocessed to convert the selectors from being appropriate for
   * the data tree to selectors appropriate for the GUI tree. ``null`` is
   * returned if there are no specs.
   */
  getAttributeHidingSpecs(node: Node):  AttributeHidingSpecs | null;

  /**
   * Get the stylesheets that the modes define. It is up to the mode to use
   * stylesheets that are written so as to avoid interfering with one another.
   *
   * @returns The list of sheets used by the modes. Straight duplicates are
   * eliminated from the list. The paths must not require any further
   * interpretation from wed.
   */
  getStylesheets(): string[];

  /**
   * Get the maximum label visibility level configured by the modes. This
   * function looks at all modes in use and returns the highest number it finds.
   *
   * @returns The maximum label visibility level.
   */
  getMaxLabelLevel(): number;

  /**
   * Get the initial label visibility level configured by the modes. This
   * function looks at all modes in use and returns the number that is set by
   * the same mode used to provide the value of [[getMaxLabelLevel]].
   *
   * @returns The initial label visibility level.
   */
  getInitialLabelLevel(): number;

  /**
   * @returns The list of all mode validators defined by the modes.
   */
  getValidators(): ModeValidator[];
}

export interface EditorAPI {
  /** A name for this editor. */
  readonly name: string;

  /** A promise that resolves once the first validation is complete. */
  readonly firstValidationComplete: Promise<EditorAPI>;

  /** A promise that resolves once the editor is initialized. */
  readonly initialized: Promise<EditorAPI>;

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

  /** The URL for the embedded documentation page. */
  readonly docURL: string;

  /** The stream of transformation events for this editor. */
  readonly transformations: Observable<TransformationEvent>;

  /** The stream of undo/redo events for this editor. */
  readonly undoEvents: Observable<UndoEvents>;

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
  domlistener: domlistener.DOMListener;

  /** A collection of stock modals. */
  modals: StockModals;

  mergeWithPreviousHomogeneousSiblingTr: Transformation<TransformationData>;

  mergeWithNextHomogeneousSiblingTr: Transformation<TransformationData>;

  modeTree: ModeTreeAPI;

  caretManager: CaretManager;

  validator: Validator;

  editingMenuManager: EditingMenuManager;

  /**
   * @param tr The transformation to fire.
   *
   * @param data Arbitrary data to be passed to the transformation.
   */
  fireTransformation<T extends TransformationData>(tr: Transformation<T>,
                                                   data: T): void;

  /**
   * Record a marker into the list of undoable operations.
   *
   * We purposely restrict the objects that can be recored to
   * [[UndoMarker]]. The editor does not support calling this method
   * through the mode-api to record arbitrary [["undo".Undo]] objects.
   *
   * @param marker The marker to record.
   */
  recordUndo(marker: UndoMarker): void;

  /** Undo the last action recorded in the undo list. */
  undo(): void;

  /** Redo the previously undone action. */
  redo(): void;

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

  /**
   * Inserts a transient placeholder. A transient placeholder is one that
   * disappears if the caret is moved out of it.
   *
   * @param loc Location where to insert.
   *
   * @returns The placeholder.
   */
  insertTransientPlaceholderAt(loc: DLoc): Element;

  /** Find the data node that corresponds to a GUI node. */
  toDataNode(node: Node): Node | Attr | null;

  /** Find the GUI node that corresponds to a data node. */
  fromDataNode(node: Node): Node | null;

  /** Convert a GUI node to a node path. */
  nodeToPath(node: Node | Attr): string;

  /** Convert a node path to a GUI node. */
  pathToNode(path: string): Node | Attr | null;

  /**
   * Get data associated with a mode.
   *
   * @param key An arbitrary key.
   *
   * @returns The data.
   */
  // tslint:disable-next-line:no-any
  getModeData(key: string): any;

  /**
   * Set the data associated with a mode. By convention the key should be a
   * hierarchy of strings separated by dots. The first part should be the mode
   * name. e.g. ``test-mode.actions.modal``.
   *
   * @param key An arbitrary key.
   *
   * @param value The value to record.
   */
  // tslint:disable-next-line:no-any
  setModeData(key: string, value: any): void;

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
  { tr: Action<{}>, name?: string }[];

  /**
   * Sets the list of items to show in the navigation list. This will make the
   * list appear if it was not displayed previously.
   *
   * @param items The items to show.
   */
  setNavigationList(items: Node | JQuery | Node[]): void;

  /**
   * Creates a tooltip for entities that are inside the GUI tree. All code that
   * creates tooltips inside the GUI tree **must** use this method to create the
   * tooltips. This accomplishes two goals:
   *
   * 1. The editor is able to perform cleanup operations on tooltips.
   *
   * 2. This method takes into account tooltips preferences. And thus will show
   * or hide them depending on the preferences.
   *
   * @param $for The JQuery object for which we are creating a tooltip.
   *
   * @param options The tooltip options to use for this tooltip.
   */
  makeGUITreeTooltip($for: JQuery, options: TooltipOptions): void;

  makeModal(options?: ModalOptions): Modal;

  /**
   * Registers elements that are outside wed's editing pane but should be
   * considered to be part of the editor. These would typically be menus or
   * toolbars that a larger application that uses wed for editing adds around
   * the editing pane.
   *
   * @param elements The elements to register.
   */
  excludeFromBlur(elements: JQuery | Element): void;

  /** Insert text at caret. */
  insertText(text: string): void;

  /** Whether the editor is in the midst of redoing or undoing. */
  undoingOrRedoing(): boolean;

  /**
   * Decrease the label visibility level. It is a no-op if the level is already
   * at the minimum.
   */
  decreaseLabelVisiblityLevel(): void;

  /**
   * Increase the label visibility level. It is a no-op if the level is already
   * at the maximum.
   */
  increaseLabelVisibilityLevel(): void;

  /**
   * Toggle attribute hiding off and on.
   */
  toggleAttributeHiding(): void;
}
