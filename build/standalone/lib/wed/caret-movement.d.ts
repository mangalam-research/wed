/**
 * Library of caret movement computations.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { DLoc } from "./dloc";
import { Mode } from "./mode";
export declare type Direction = "right" | "left" | "up" | "down";
export declare function newPosition(pos: DLoc | undefined | null, direction: Direction, inAttributes: boolean, docRoot: Document | Element, mode: Mode<{}>): DLoc | undefined;
/**
 * Compute the position to the right of a starting position. This function takes
 * into account wed-specific needs. For instance, it knows how start and end
 * labels are structured.
 *
 * @param pos The position at which we start.
 *
 * @param inAttributes Whether we are to move into attributes.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param mode The mode governing editing.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export declare function positionRight(pos: DLoc | undefined | null, inAttributes: boolean, docRoot: Document | Element, mode: Mode<{}>): DLoc | undefined;
/**
 * Compute the position to the left of a starting position. This function takes
 * into account wed-specific needs. For instance, it knows how start and end
 * labels are structured.
 *
 * @param pos The position at which we start.
 *
 * @param inAttributes Whether we are to move into attributes.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param mode The mode governing editing.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export declare function positionLeft(pos: DLoc | undefined | null, inAttributes: boolean, docRoot: Document | Element, mode: Mode<{}>): DLoc | undefined;
/**
 * Compute the position under a starting position. This function takes into
 * account wed-specific needs. For instance, it knows how start and end labels
 * are structured.
 *
 * @param pos The position at which we start.
 *
 * @param inAttributes Whether we are to move into attributes.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param mode The mode governing editing.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export declare function positionDown(pos: DLoc | undefined | null, inAttributes: boolean, docRoot: Document | Element, mode: Mode<{}>): DLoc | undefined;
/**
 * Compute the position above a starting position. This function takes into
 * account wed-specific needs. For instance, it knows how start and end labels
 * are structured.
 *
 * @param pos The position at which we start.
 *
 * @param inAttributes Whether we are to move into attributes.
 *
 * @param docRoot The element within which caret movement is to be constrained.
 *
 * @param mode The mode governing editing.
 *
 * @returns The new position, or ``undefined`` if there is no such position.
 */
export declare function positionUp(pos: DLoc | undefined | null, inAttributes: boolean, docRoot: Document | Element, mode: Mode<{}>): DLoc | undefined;
