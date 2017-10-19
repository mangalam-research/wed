/**
 * Search and replace GUI.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Editor } from "../wed";
import { Scroller } from "./scroller";
import { Direction } from "./search-replace";
export { Direction };
export declare class ModalSearchReplace {
    private readonly search;
    private readonly modal;
    constructor(editor: Editor, scroller: Scroller, direction: Direction);
}
