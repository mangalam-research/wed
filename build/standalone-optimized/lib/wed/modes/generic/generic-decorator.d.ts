/**
 * Decorator for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Decorator } from "wed/decorator";
import { Mode } from "wed/mode";
import { Editor } from "wed/wed";
import { Metadata } from "./metadata";
/**
 * A decorator for the generic mode.
 */
export declare class GenericDecorator extends Decorator {
    protected readonly metadata: Metadata;
    protected readonly options: any;
    /**
     * @param mode The mode object.
     *
     * @param editor The wed editor to which the mode is applied.
     *
     * @param metadata Meta-information about the schema.
     *
     * @param options The options object passed to the mode which uses this
     * decorator.
     *
     */
    constructor(mode: Mode, editor: Editor, metadata: Metadata, options: any);
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
