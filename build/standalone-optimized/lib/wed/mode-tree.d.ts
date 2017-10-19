import { Decorator } from "./decorator";
import { Mode } from "./mode";
import { Mode as ModeOption } from "./options";
import { ModeValidator } from "./validator";
import { Editor } from "./wed";
import { CleanedWedOptions } from "./wed-options-validation";
export interface AttributeHidingSpecs {
    elements: {
        selector: string;
        attributes: (string | {
            except: string[];
        })[];
    }[];
}
/**
 * A tree containing the modes configured for the current editing session.
 */
export declare class ModeTree {
    private readonly editor;
    private readonly option;
    private root;
    private loader;
    private cachedMaxLabelNode;
    /**
     * @param editor The editor for which we are building this tree.
     *
     * @param option The ``mode`` option from the options passed to the wed
     * instance. This object will construct a tree from this option.
     */
    constructor(editor: Editor, option: ModeOption);
    /**
     * Load the modes, initialize them and build the tree.
     *
     * @returns A promise that resolves to ``this`` once all the modes are loaded
     * and initialized.
     */
    init(): Promise<ModeTree>;
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
    private makeNodes(selector, option, errorHandler);
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
    getDecorator(node: Node): Decorator;
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
    getAttributeHidingSpecs(node: Node): AttributeHidingSpecs | null;
    /**
     * Get the mode node that governs a node.
     *
     * @param The node we want to check. This must be a done in the data tree or
     * the GUI tree.
     *
     * @returns The mode that governs the node.
     */
    private getModeNode(node);
    private _getModeNode(parent, parentScope, node);
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
     * The node with the maximum label visibility level. If multiple nodes have
     * the same value, the earlier node "wins", and is the one provided by this
     * property. For instance, if the root node and its submode have the same
     * number, then this property has the root node for value.
     *
     * This is a cached value, computed on first access.
     */
    private readonly maxLabelLevelNode;
    /**
     * @returns The list of all mode validators defined by the modes.
     */
    getValidators(): ModeValidator[];
    /**
     * Call on each decorator to add its event handlers.
     */
    addDecoratorHandlers(): void;
    /**
     * Call on each decorator to start listening.
     */
    startListening(): void;
}
