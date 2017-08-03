import { NameResolver } from "salve";

import { CaretManager } from "./caret-manager";
import { EditingMenuManager } from "./gui/editing-menu-manager";
import * as modal from "./gui/modal";
import { Mode } from "./mode";
import { ModeTree } from "./mode-tree";
import { Runtime } from "./runtime";
import { TaskRunner } from "./task-runner";
import { Transformation } from "./transformation";
import { TreeUpdater } from "./tree-updater";
import { Undo } from "./undo";
import { Validator } from "./validator";

export declare const version: string;

export type KeydownHandler = (wedEv: JQueryEventObject,
                              ev: JQueryKeyEventObject) => boolean;

export class Editor {
  readonly my_window: Window;
  readonly runtime: Runtime;
  readonly caretManager: CaretManager;
  readonly $gui_root: JQuery;
  readonly gui_root: HTMLElement;
  readonly data_root: Element;
  readonly modeTree: ModeTree;
  readonly data_updater: TreeUpdater;
  readonly split_node_tr: Transformation;
  readonly merge_with_previous_homogeneous_sibling_tr: Transformation;
  readonly merge_with_next_homogeneous_sibling_tr: Transformation;
  readonly validator: Validator;
  readonly complex_pattern_action: Action<{}>;
  readonly editingMenuManager: EditingMenuManager;
  readonly doc: Document;
  readonly _cut_buffer: HTMLElement;
  // XXX drop this.
  readonly mode: Mode<any>;
  // XXX drop this.
  readonly resolver: NameResolver;
  // XXX drop this.
  readonly max_label_level: number;
  // XXX drop this.
  readonly attributes: string;


  expandErrorPanelWhenNoNavigation(): void;
  _resumeTaskWhenPossible(runner: TaskRunner): void;
  undoingOrRedoing(): boolean;
  fireTransformation<T>(action: Transformation<T>, data: T): void;
  toDataNode(node: Node): Node | Attr | null;
  fromDataNode(node: Node): Node | null;
  type(text: string): void;
  isAttrProtected(name: string, parent: Element): boolean;
  isAttrProtected(node: Node): boolean;
  makeDocumentationLink(url: string): HTMLElement;
  getElementTransformationsAt(loc: DLoc, types: string | string[]):
  { tr: Action<{}>, name: string }[];
  // getElementTransformationsAt(pos: DLoc, transformationType: string):
  // { name: string,
  //   tr: Transformation<TransformationData> }[];
  displayTypeaheadPopup(x: number, y: number, width: number,
                        placeholder: string, options: any,
                        dismissCallbac: (obj?: { value: string }) => void): any;
  makeModal(options: modal.Options): Modal.Modal;
  recordUndo(obj: Undo): void;
  pushGlobalKeydownHandler(KeydownHandler): void;
  popGlobalKeydownHandler(KeydownHandler): void;
  openDocumentationLink(docURL: string): void;
  _spliceAttribute(attrVal: HTMLElement, offset: number, count: number,
                   add: string): void;
}
