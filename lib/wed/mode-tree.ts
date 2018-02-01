/**
 * Manage a tree of modes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as mergeOptions from "merge-options";

import { Decorator } from "./decorator";
import { contains, toGUISelector } from "./domutil";
import { Editor } from "./editor";
import { Mode } from "./mode";
import { ModeTreeAPI } from "./mode-api";
import { ModeLoader } from "./mode-loader";
import { Mode as ModeOption } from "./options";
import { ModeValidator } from "./validator";
import { CleanedWedOptions, processWedOptions } from "./wed-options-validation";

/**
 * A callback for reporting wed option errors.
 *
 * @param path The mode's path, as specified in the configuration.
 *
 * @param errors The errors encountered.
 */
type WedOptionsErrorCallback = (path: string, errors: string[]) => void;

export interface AttributeHidingSpecs {
  elements: {
    selector: string,
    attributes: (string | { except: string[]})[];
  }[];
}

/**
 * A node for the mode tree.
 */
class ModeNode {
  private _attributeHidingSpecs: AttributeHidingSpecs | null | undefined;
  private _decorator: Decorator | undefined;

  /**
   * @param mode The mode that this node holds.
   *
   * @param editor The editor for which we are holding a mode.
   *
   * @param selector The selector that determines to what this modes apply. This
   * selector must have been converted to operate in the GUI tree.
   *
   * @param submodes The submodes set for this mode.
   *
   * @param wedOptions The cleaned up wed options that pertain to the mode held
   * by this node.
   */
  constructor(public readonly mode: Mode,
              public readonly editor: Editor,
              public readonly selector: string,
              public readonly submodes: ModeNode[],
              public readonly wedOptions: CleanedWedOptions) {}

  /**
   * Determines whether an element matched by the selector of this ``ModeNode``
   * node in the GUI tree contains a node. If it does, this means that the mode
   * that this ``ModeNode`` holds, or one of the submode, governs the node.
   *
   * @param parentScope The element from which the selector in this ``ModeNode``
   * is interpreted.
   *
   * @param node A GUI node to test.
   *
   * @returns The element that represents the top of the mode's region of
   * activity and contains ``node``. Returns ``null`` if no element contains the
   * node.
   */
  containingElement(parentScope: Element, node: Node): Element | null {
    if (!parentScope.contains(node)) {
      return null;
    }

    if (this.selector === "") {
      return parentScope;
    }

    const regions = parentScope.querySelectorAll(this.selector);
    for (const region of Array.from(regions)) {
      if (region.contains(node)) {
        return region;
      }
    }

    return null;
  }

  reduceTopFirst<T>(fn: (accumulator: T, node: ModeNode) => T,
                    initialValue: T): T {
    let value = fn(initialValue, this);

    for (const submode of this.submodes) {
      value = submode.reduceTopFirst(fn, value);
    }

    return value;
  }

  eachTopFirst(fn: (node: ModeNode) => void): void {
    fn(this);

    for (const submode of this.submodes) {
      submode.eachTopFirst(fn);
    }
  }

  get attributeHidingSpecs(): AttributeHidingSpecs | null {
    if (this._attributeHidingSpecs === undefined) {
      const attributeHiding = this.wedOptions.attributes.autohide;
      if (attributeHiding === undefined) {
        // No attribute hiding...
        this._attributeHidingSpecs = null;
      }
      else {
        const method = attributeHiding.method;
        if (method !== "selector") {
          throw new Error(`unknown attribute hiding method: ${method}`);
        }

        const specs: AttributeHidingSpecs = {
          elements: [],
        };

        for (const element of attributeHiding.elements) {
          const copy = mergeOptions({}, element);
          copy.selector =
            toGUISelector(copy.selector,
                          this.mode.getAbsoluteNamespaceMappings());
          specs.elements.push(copy);
        }

        this._attributeHidingSpecs = specs;
      }
    }

    return this._attributeHidingSpecs;
  }

  get decorator(): Decorator {
    if (this._decorator === undefined) {
      this._decorator = this.mode.makeDecorator();
    }

    return this._decorator;
  }
}

/**
 * A tree containing the modes configured for the current editing session.
 */
export class ModeTree implements ModeTreeAPI {
  private root!: ModeNode;
  private loader: ModeLoader;
  private cachedMaxLabelNode: ModeNode | undefined;

  /**
   * @param editor The editor for which we are building this tree.
   *
   * @param option The ``mode`` option from the options passed to the wed
   * instance. This object will construct a tree from this option.
   */
  constructor(private readonly editor: Editor,
              private readonly option: ModeOption) {
    this.loader = new ModeLoader(editor, editor.runtime);
  }

  /**
   * Load the modes, initialize them and build the tree.
   *
   * @returns A promise that resolves to ``this`` once all the modes are loaded
   * and initialized.
   */
  async init(): Promise<ModeTree> {
    const combinedErrors: string[] = [];
    this.root = await this.makeNodes(
      "",
      this.option,
      (path: string, errors: string[]) => {
        for (const error of errors) {
          combinedErrors.push(
            `mode at path ${path} has an error in its wed options: ${error}`);
        }
      });

    if (combinedErrors.length > 0) {
      throw new Error(`wed options are incorrect: ${combinedErrors.join("")}`);
    }

    return this;
  }

  /**
   * Make the nodes of the tree. This function operates recursively: it will
   * inspect ``option`` for a ``submode`` option and will call itself to create
   * the necessary child nodes.
   *
   * @param selector The selector associated with the options passed in the 2nd
   * argument.
   *
   * @param option The mode option being processed.
   *
   * @param errorHanler The handler to call on errors in processing the wed
   * options. If this handler is called at all, then the returned value should
   * not be used. We operate this way because we want to report all errors that
   * can be reported, rather than abort early.
   *
   * @returns A promise that resolves to the created node.
   */
  private async makeNodes(selector: string,
                          option: ModeOption,
                          errorHandler: WedOptionsErrorCallback):
  Promise<ModeNode> {
    const submode = option.submode;
    const mode = await this.loader.initMode(option.path, option.options);
    const submodes = (submode !== undefined) ?
      [await this.makeNodes(toGUISelector(submode.selector,
                                          mode.getAbsoluteNamespaceMappings()),
                            submode.mode,
                            errorHandler)] :
      [];
    const rawOptions = mode.getWedOptions();
    const result = processWedOptions(rawOptions);
    let cleanedOptions: CleanedWedOptions;
    if (Array.isArray(result)) {
      errorHandler(option.path, result);
      // This is a lie.
      cleanedOptions = rawOptions as CleanedWedOptions;
    }
    else {
      cleanedOptions = result;
    }
    return new ModeNode(mode, this.editor, selector, submodes, cleanedOptions);
  }

  getMode(node: Node): Mode {
    return this.getModeNode(node).mode;
  }

  getDecorator(node: Node): Decorator {
    return this.getModeNode(node).decorator;
  }

  getWedOptions(node: Node): CleanedWedOptions {
    const modeNode = this.getModeNode(node);
    return modeNode.wedOptions;
  }

  getAttributeHandling(node: Node): "show" | "hide" | "edit" {
    return this.getWedOptions(node).attributes.handling;
  }

  getAttributeHidingSpecs(node: Node):  AttributeHidingSpecs | null {
    return this.getModeNode(node).attributeHidingSpecs;
  }

  /**
   * Get the mode node that governs a node.
   *
   * @param The node we want to check. This must be a done in the data tree or
   * the GUI tree.
   *
   * @returns The mode that governs the node.
   */
  private getModeNode(node: Node): ModeNode {
    // Handle the trivial case where there is no submode first.
    if (this.root.submodes.length === 0) {
      return this.root;
    }

    if (contains(this.editor.dataRoot, node)) {
      const data = this.editor.fromDataNode(node);
      if (data !== null) {
        node = data;
      }
    }

    if (!this.editor.guiRoot.contains(node)) {
      throw new Error("did not pass a node in the GUI or data tree");
    }

    const result = this._getModeNode(this.root, this.editor.guiRoot, node);
    if (result === undefined) {
      throw new Error("cannot find a mode for the node; something is wrong");
    }

    return result;
  }

  private _getModeNode(parent: ModeNode, parentScope: Element,
                       node: Node): ModeNode | undefined {
    const scope = parent.containingElement(parentScope, node);
    if (scope !== null) {
      let narrower: ModeNode | undefined;
      for (const submode of parent.submodes) {
        narrower = this._getModeNode(submode, scope, node);
        if (narrower !== undefined) {
          return narrower;
        }
      }

      return parent;
    }

    return undefined;
  }

  getStylesheets(): string[] {
    return Object.keys(this.root.reduceTopFirst(
      (accumulator: Record<string, boolean>, node) => {
        for (const sheet of node.mode.getStylesheets()) {
          accumulator[sheet] = true;
        }
        return accumulator;
      }, Object.create(null)));
  }

  getMaxLabelLevel(): number {
    return this.maxLabelLevelNode.wedOptions.label_levels.max;
  }

  getInitialLabelLevel(): number {
    return this.maxLabelLevelNode.wedOptions.label_levels.initial;
  }

  /**
   * The node with the maximum label visibility level. If multiple nodes have
   * the same value, the earlier node "wins", and is the one provided by this
   * property. For instance, if the root node and its submode have the same
   * number, then this property has the root node for value.
   *
   * This is a cached value, computed on first access.
   */
  private get maxLabelLevelNode(): ModeNode {
    if (this.cachedMaxLabelNode === undefined) {
      this.cachedMaxLabelNode = this.root.reduceTopFirst<ModeNode>(
        (accumulator, node) => {
          const accMax = accumulator.wedOptions.label_levels.max;
          const nodeMax = node.wedOptions.label_levels.max;
          return (nodeMax > accMax) ? node : accumulator;
        }, this.root);
    }

    return this.cachedMaxLabelNode;
  }

  getValidators(): ModeValidator[] {
    return this.root.reduceTopFirst<ModeValidator[]>(
      (accumulator, node) => {
        const validator = node.mode.getValidator();
        return validator !== undefined ?
          accumulator.concat(validator) : accumulator;
      }, []);
  }

  /**
   * Call on each decorator to add its event handlers.
   */
  addDecoratorHandlers(): void {
    this.root.eachTopFirst((node) => {
      node.decorator.addHandlers();
    });
  }

  /**
   * Call on each decorator to start listening.
   */
  startListening(): void {
    this.root.eachTopFirst((node) => {
      node.decorator.startListening();
    });
  }
}

//  LocalWords:  MPL submodes submode combinedErrors nd preprocessed
//  LocalWords:  stylesheets
