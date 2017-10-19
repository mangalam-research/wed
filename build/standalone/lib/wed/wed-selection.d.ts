/**
 * Wed's notion of a selection.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as rangy from "rangy";
import { DLoc } from "./dloc";
import { RangeInfo } from "./domutil";
export interface GUIToDataConverter {
    toDataLocation(node: Node, offset: number): DLoc | undefined;
}
/**
 * Represents a selection as wed understands it.
 */
export declare class WedSelection {
    readonly converter: GUIToDataConverter;
    readonly anchor: DLoc;
    readonly focus: DLoc;
    /**
     * @param anchor The anchor point of the selection. The anchor is where the
     * selection started. It does not move when the user selects text.
     *
     * @param focus The focus point of the selection. It is the part of the
     * selection that moves when the user selects text. Omitting ``focus`` will
     * result in a collapsed selection.
     */
    constructor(converter: GUIToDataConverter, anchor: DLoc, focus?: DLoc | undefined);
    readonly range: rangy.RangyRange | undefined;
    readonly rangeInfo: RangeInfo | undefined;
    readonly collapsed: boolean;
    readonly wellFormed: boolean;
    asDataCarets(): [DLoc, DLoc] | undefined;
    mustAsDataCarets(): [DLoc, DLoc];
    /**
     * @returns Whether the two objects are equal. They are equal if they are the
     * same object or if they have equal focuses (foci?) and equal anchors.
     */
    equals<T extends WedSelection>(other: T | undefined | null): boolean;
}
