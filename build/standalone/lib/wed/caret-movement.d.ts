/**
 * Library of caret movement computations.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { DLoc } from "./dloc";
import { ModeTree } from "./mode-tree";
export declare type Direction = "right" | "left" | "up" | "down";
export declare function newPosition(pos: DLoc | undefined | null, direction: Direction, docRoot: Document | Element, modeTree: ModeTree): DLoc | undefined;
/**
 * Compute the position to the right of a starting position. This function takes
 * into account wed-specific needs. For instance, it knows how start and end
 * labels are structured.
 *
 * @param pos The position at which we start.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export declare function positionRight(pos: DLoc | undefined | null, docRoot: Document | Element, modeTree: ModeTree): DLoc | undefined;
/**
 * Compute the position to the left of a starting position. This function takes
 * into account wed-specific needs. For instance, it knows how start and end
 * labels are structured.
 *
 * @param pos The position at which we start.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export declare function positionLeft(pos: DLoc | undefined | null, docRoot: Document | Element, modeTree: ModeTree): DLoc | undefined;
/**
 * Compute the position under a starting position. This function takes into
 * account wed-specific needs. For instance, it knows how start and end labels
 * are structured.
 *
 * @param pos The position at which we start.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export declare function positionDown(pos: DLoc | undefined | null, docRoot: Document | Element, modeTree: ModeTree): DLoc | undefined;
/**
 * Compute the position above a starting position. This function takes into
 * account wed-specific needs. For instance, it knows how start and end labels
 * are structured.
 *
 * @param pos The position at which we start.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param modeTree The mode tree from which to get a mode.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export declare function positionUp(pos: DLoc | undefined | null, docRoot: Document | Element, modeTree: ModeTree): DLoc | undefined;
