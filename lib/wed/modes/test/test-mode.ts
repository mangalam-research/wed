/**
 * A mode for testing.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as Promise from "bluebird";
import * as $ from "jquery";
import { EName, ValidationError } from "salve";
import { ErrorData } from "salve-dom";

import { Action } from "wed/action";
import { Decorator, Editor } from "wed/decorator";
import { closestByClass, indexOf } from "wed/domutil";
import * as context_menu from "wed/gui/context-menu";
import { Modal } from "wed/gui/modal";
import * as input_trigger_factory from "wed/input-trigger-factory";
import * as key from "wed/key";
import * as key_constants from "wed/key-constants";
import { GenericModeOptions,
         Mode as GenericMode } from "wed/modes/generic/generic";
import { GenericDecorator } from "wed/modes/generic/generic-decorator";
import { Template } from "wed/object-check";
import * as transformation from "wed/transformation";
import { ModeValidator } from "wed/validator";

// tslint:disable-next-line:completed-docs
class Validator implements ModeValidator {
  constructor(private readonly dataRoot: Element) {}

  validateDocument(): ErrorData[] {
    return [{
      error: new ValidationError("Test"),
      node: this.dataRoot,
      index: 0,
    }];
  }
}

// tslint:disable-next-line:completed-docs
export class TestDecorator extends GenericDecorator {
  private readonly elementLevel: Record<string, number> = {
    term: 2,
    ref: 2,
    text: 1,
  };

  protected readonly mode: TestMode;

  addHandlers(): void {
    super.addHandlers();
    input_trigger_factory.makeSplitMergeInputTrigger(
      this.editor,
      "hi",
      key.makeKey(";"),
      key_constants.BACKSPACE,
      key_constants.DELETE);
  }

  // tslint:disable:no-jquery-raw-elements
  elementDecorator(root: Element, el: Element): void {
    const dataNode = this.editor.toDataNode(el) as Element;
    const rend = dataNode.getAttribute("rend");

    const localName = dataNode.localName!;
    const inTEI = dataNode.namespaceURI === this.namespaces.tei;

    let level = inTEI ? this.elementLevel[localName] : undefined;
    if (level === undefined) {
      level = 1;
    }

    const isP = inTEI && localName === "p";
    const isRef = inTEI && localName === "ref";

    // We don't run the default when we wrap p.
    if (!(isP && rend === "wrap")) {
      // There's no super.super syntax we can use here.
      Decorator.prototype.elementDecorator.call(
        this, root, el, level,
        this.contextMenuHandler.bind(this, true),
        this.contextMenuHandler.bind(this, false));
    }

    if (isRef) {
      $(el).children("._text._phantom").remove();
      this.guiUpdater.insertBefore(
        el,
        $("<div class='_text _phantom _end_wrapper'>)</div>")[0],
        el.lastChild);

      const $before = $("<div class='_text _phantom _start_wrapper'>(</div>");
      this.guiUpdater.insertBefore(el, $before[0],
                                   el.firstChild!.nextSibling);

      $before.on("wed-context-menu",
                 { node: el },
                 this._navigationContextMenuHandler.bind(this));
      $before[0].setAttribute("data-wed--custom-context-menu", "true");
    }

    if (isP) {
      switch (rend) {
      case "foo":
        $(el).children("._gui_test").remove();
        this.guiUpdater
          .insertBefore(
            el,
            $("<div class='_gui _phantom _gui_test btn " +
              "btn-default'>Foo</div>")[0],
            el.lastChild);

        let found: Element | undefined;
        let child = dataNode.firstElementChild;
        while (found === undefined && child !== null) {
          if (child.tagName === "abbr") {
            found = child;
          }
          child = child.nextElementSibling;
        }
        if (found !== undefined) {
          this.guiUpdater
            .insertBefore(
              el,
              $("<div class='_gui _phantom _gui_test btn " +
                "btn-default'>Foo2</div>")[0],
              el.lastChild);
          this.guiUpdater
            .insertBefore(
              el,
              $("<div class='_gui _phantom _gui_test btn " +
                "btn-default'>Foo3</div>")[0],
              el.lastChild);
        }
        break;
      case "wrap":
        if (closestByClass(el, "_gui_test") !== null) {
          break;
        }

        const wrapper = $("<div class='_gui _phantom_wrap _gui_test btn " +
                          "btn-default'></div>")[0];
        this.guiUpdater.insertBefore(el.parentNode! as Element, wrapper, el);
        this.guiUpdater.insertBefore(wrapper, el, null);
        break;
      default:
        break;
      }
    }
  }

  private _navigationContextMenuHandler(wedEv: JQueryEventObject,
                                        ev: JQueryEventObject): boolean {
    // node is the node in the GUI tree which corresponds to the navigation item
    // for which a context menu handler was required by the user.
    const node = wedEv.data.node;
    const dataNode = this.editor.toDataNode(node) as Element;
    const prefixedName = this.mode.unresolveName(
      new EName(dataNode.namespaceURI === null ? "" : dataNode.namespaceURI,
                dataNode.localName!));

    // We don't know this element.
    if (prefixedName === undefined) {
      return true;
    }

    // container, offset: location of the node in its parent.
    const container = node.parentNode;
    const offset = indexOf(container.childNodes, node);

    // Create "insert" transformations for siblings that could be inserted
    // before this node.
    const actions = this.mode.getContextualActions("insert", prefixedName,
                                                   container, offset);
    // data to pass to transformations
    const data = {
      name: prefixedName,
      moveCaretTo: this.editor.caretManager.makeCaret(container, offset),
    };

    const items = [];
    for (const act of actions) {
      const text = `${act.getLabelFor(data)} before this one`;
      const $a = $(`<a tabindex='0' href='#'>${text}</a>`);
      $a.click(data, act.boundTerminalHandler);
      items.push($("<li></li>").append($a)[0]);
    }

    // tslint:disable-next-line:no-unused-expression
    new context_menu.ContextMenu(this.editor.doc,
                                 ev.clientX, ev.clientY, items);

    return false;
  }
}

export interface TestModeOptions extends GenericModeOptions {
  ambiguous_fileDesc_insert: boolean;
  fileDesc_insert_needs_input: boolean;
  hide_attributes: boolean;
}

type MatchCallback = (matches: { value: string }[]) => void;

// tslint:disable-next-line:completed-docs
class TypeaheadAction extends Action<{}> {

  execute(): void {
    const editor = this.editor;

    const substringMatcher = (strs: string[]) => {
      return (q: string, cb: MatchCallback) => {
        const re = new RegExp(q, "i");

        const matches = [];
        for (const str of strs) {
          if (re.test(str)) {
            matches.push({ value: str });
          }
        }

        cb(matches);
      };
    };

    const testData = [];
    for (let i = 0; i < 100; ++i) {
      testData.push(`Test ${i}`);
    }

    const options = {
      options: {
        autoselect: true,
        hint: true,
        highlight: true,
        minLength: 1,
      },
      datasets: [{
        source: substringMatcher(testData),
      }],
    };

    const pos = editor.editingMenuManager.computeMenuPosition(undefined, true);
    const typeahead =
      editor.displayTypeaheadPopup(pos.left, pos.top, 300,
                                   "Test", options,
                                   (obj?: { value: string }) => {
                                     if (obj != null) {
                                       editor.type(obj.value);
                                     }
                                   });
    typeahead.hideSpinner();
    const range = editor.caretManager.range;

    // This is purposely not as intelligent as what real mode would
    // need.
    if (range != null && !(range.collapsed as boolean)) {
      typeahead.setValue(range.toString());
    }
  }
}

// tslint:disable-next-line:completed-docs
class DraggableModalAction extends Action<{}> {
  execute(): void {
    const editor = this.editor;
    const modal = editor.mode.draggable;
    modal.modal();
  }
}

// tslint:disable-next-line:completed-docs
class ResizableModalAction extends Action<{}> {
  execute(): void {
    const editor = this.editor;
    const modal = editor.mode.resizable;
    modal.modal();
  }
}

// tslint:disable-next-line:completed-docs
class DraggableResizableModalAction extends Action<{}> {
  execute(): void {
    const editor = this.editor;
    const modal = editor.mode.draggableResizable;
    modal.modal();
  }
}

/**
 * This mode is purely designed to help test wed, and nothing
 * else. Don't derive anything from it and don't use it for editing.
 */
export class TestMode extends GenericMode<TestModeOptions> {
  private typeaheadAction: TypeaheadAction;
  private draggable: Modal;
  private resizable: Modal;
  private draggableResizable: Modal;
  private draggableAction: DraggableModalAction;
  private resizableAction: ResizableModalAction;
  private draggableResizableAction: DraggableResizableModalAction;

  readonly optionTemplate: Template = {
    metadata: true,
    autoinsert: false,
    ambiguous_fileDesc_insert: false,
    fileDesc_insert_needs_input: false,
    hide_attributes: false,
  };

  constructor(editor: Editor, options: TestModeOptions) {
    super(editor, options);

    if (this.constructor !== TestMode) {
      throw new Error("this is a test mode; don't derive from it!");
    }

    this.wedOptions.metadata = {
      name: "Test",
      authors: ["Louis-Dominique Dubeau"],
      description: "TEST MODE. DO NOT USE IN PRODUCTION!",
      license: "MPL 2.0",
      copyright: "Mangalam Research Center for Buddhist Languages",
    };
    this.wedOptions.label_levels = {
      max: 2,
      initial: 1,
    };

    if (options.hide_attributes) {
      this.wedOptions.attributes = "hide";
    }
    else {
      this.wedOptions.attributes = {
        handling: "edit",
        autohide: {
          method: "selector",
          elements: [{
            selector: "div",
            attributes: ["*", {
              except: ["sample", "type", "subtype"],
            }],
          }],
        },
      };
    }
  }

  init(): Promise<void> {
    return super.init()
      .then(() => {
        const editor = this.editor;
        this.typeaheadAction = new TypeaheadAction(
          editor, "Test typeahead", undefined,
          "<i class='fa fa-plus fa-fw'></i>", true);

        this.draggable = editor.makeModal({ draggable: true });
        this.resizable = editor.makeModal({ resizable: true });
        this.draggableResizable = editor.makeModal({
          resizable: true,
          draggable: true,
        });

        this.draggableAction = new DraggableModalAction(
          editor, "Test draggable", undefined, undefined, true);
        this.resizableAction = new ResizableModalAction(
          editor, "Test resizable", undefined, undefined, true);
        this.draggableResizableAction = new DraggableResizableModalAction(
          editor, "Test draggable resizable", undefined, undefined, true);
      });
  }

  getContextualActions(transformationType: string | string[],
                       tag: string,
                       container: Node,
                       offset: number): Action<{}>[] {
    if (this.options.fileDesc_insert_needs_input &&
        tag === "fileDesc" && transformationType === "insert") {
      return [new transformation.Transformation(
        this.editor, "insert", "foo", undefined, undefined, true,
        // We don't need a real handler because it will not be called.
        // tslint:disable-next-line:no-empty
        () => {})];
    }

    let ret = super.getContextualActions(transformationType, tag,
                                         container, offset);

    if (this.options.ambiguous_fileDesc_insert &&
        tag === "fileDesc" && transformationType === "insert") {
      // We just duplicate the transformation.
      ret = ret.concat(ret);
    }

    if (tag === "ref" &&
        (transformationType === "insert" || transformationType === "wrap")) {
      ret.push(this.typeaheadAction, this.draggableAction,
               this.resizableAction, this.draggableResizableAction);
    }

    return ret;
  }

  makeDecorator(): TestDecorator {
    const obj = Object.create(TestDecorator.prototype);
    let args = Array.prototype.slice.call(arguments);
    args = [this, this.metadata, this.options].concat(args);
    TestDecorator.apply(obj, args);
    return obj;
  }

  getAttributeCompletions(attr: Attr): string[] {
    if (attr.name === "n") {
      return ["completion1", "completion2"];
    }

    return [];
  }

  getValidator(): ModeValidator {
    return new Validator(this.editor.data_root);
  }
}

export { TestMode as Mode };

//  LocalWords:  domutil metas tei oop util Mangalam MPL
//  LocalWords:  Dubeau
