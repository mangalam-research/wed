/**
 * Decorator for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Decorator, Editor } from "wed/decorator";
import { Listener } from "wed/domlistener";
import { GUIUpdater } from "wed/gui-updater";
import { Mode } from "wed/mode";
import { Metadata } from "./metadata";
/**
 * A decorator for the generic mode.
 */
export declare class GenericDecorator extends Decorator {
    protected readonly mode: Mode<any>;
    protected readonly metadata: Metadata;
    protected readonly options: any;
    /**
     * @param mode The mode object.
     *
     * @param metadata Meta-information about the schema.
     *
     * @param options The options object passed to the mode which uses this
     * decorator.
     *
     * @param listener The DOM listener that will listen to changes on the
     * document.
     *
     * @param editor The wed editor to which the mode is applied.
     *
     * @param guiUpdater The updater to use to modify the GUI tree. All
     * modifications to the GUI must go through this updater.
     */
    constructor(mode: Mode<any>, metadata: Metadata, options: any, domlistener: Listener, editor: Editor, guiUpdater: GUIUpdater);
    addHandlers(): void;
    elementDecorator(root: Element, el: Element): void;
    /**
     * Returns additional classes that should apply to a node.
     *
     * @param node The node to check.
     *
     * @returns A string that contains all the class names separated by spaces. In
     * other words, a string that could be put as the value of the ``class``
     * attribute in an HTML tree.
     */
    getAdditionalClasses(node: Element): string;
}
