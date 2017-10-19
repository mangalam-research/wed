/**
 * Model for a GUI root.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { DLocRoot } from "./dloc";
/**
 * Raised if an attribute could not be found when converting a path to a node.
 */
export declare class AttributeNotFound extends Error {
    constructor(message: string);
}
/**
 * This is a [[DLocRoot]] class customized for use to mark the root of the GUI
 * tree.
 */
export declare class GUIRoot extends DLocRoot {
    /**
     * Converts a node to a path suitable to be used by the
     * [["dloc".DLocRoot.pathToNode]] method so long as the root used is the one
     * for the data tree corresponding to the GUI tree to which this object
     * belongs.
     *
     * @param node The node for which to construct a path.
     *
     * @returns The path.
     */
    nodeToPath(node: Node): string;
    /**
     * This function recovers a DOM node on the basis of a path previously created
     * by [["dloc".DLocRoot.nodeToPath]] provided that the root from which the
     * path was obtained is on the data tree which corresponds to the GUI tree
     * that this root was created for.
     *
     * @param path The path to interpret.
     *
     * @returns The node corresponding to the path, or ``null`` if no such node
     * exists.
     *
     * @throws {Error} If given a malformed ``path``.
     */
    pathToNode(path: string): Node | null;
}
