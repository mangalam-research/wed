/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { DLoc } from "./dloc";
export interface BoundaryCoordinates {
    left: number;
    top: number;
    bottom: number;
}
export declare function boundaryXY(boundary: DLoc): BoundaryCoordinates;
export declare function getAttrValueNode(attrVal: Element): Node;
export declare type Editor = any;
export declare function cut(editor: Editor): void;
export declare function paste(editor: Editor, data: any): void;
export declare function getGUINodeIfExists(editor: Editor, node: Node | null | undefined): Node | undefined;
