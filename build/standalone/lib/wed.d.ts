/**
 * The main module of wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { EditorInstance } from "./wed/client-api";
import * as convert from "./wed/convert";
import * as domtypeguards from "./wed/domtypeguards";
import * as domutil from "./wed/domutil";
import * as exceptions from "./wed/exceptions";
import * as inputTriggerFactory from "./wed/input-trigger-factory";
import * as key from "./wed/key";
import * as keyConstants from "./wed/key-constants";
import * as labelman from "./wed/labelman";
import * as objectCheck from "./wed/object-check";
import { Options } from "./wed/options";
import { Runtime } from "./wed/runtime";
import * as saver from "./wed/saver";
import * as transformation from "./wed/transformation";
import * as treeUpdater from "./wed/tree-updater";
import * as util from "./wed/util";
export { convert, domutil, domtypeguards, EditorInstance, exceptions, inputTriggerFactory, key, keyConstants, labelman, objectCheck, Options, Runtime, saver, transformation, treeUpdater, util };
export declare function makeEditor(widget: HTMLElement, options: Options | Runtime): EditorInstance;
export { Action } from "./wed/action";
export { Decorator } from "./wed/decorator";
export { DLoc, DLocRoot } from "./wed/dloc";
export { DOMListener } from "./wed/domlistener";
export { version } from "./wed/editor";
export { GUISelector } from "./wed/gui-selector";
export { BaseMode, CommonModeOptions, Mode } from "./wed/mode";
export * from "./wed/mode-api";
export { UndoMarker } from "./wed/undo";
export { ModeValidator, Validator } from "./wed/validator";
export { WedOptions } from "./wed/wed-options";
import * as button_ from "./wed/gui/button";
import * as contextMenu_ from "./wed/gui/context-menu";
import * as modal_ from "./wed/gui/modal";
import * as tooltip_ from "./wed/gui/tooltip";
import * as typeaheadPopup_ from "./wed/gui/typeahead-popup";
export declare namespace gui {
    export import button = button_;
    export import contextMenu = contextMenu_;
    export import modal = modal_;
    export import tooltip = tooltip_;
    export import typeaheadPopup = typeaheadPopup_;
}
