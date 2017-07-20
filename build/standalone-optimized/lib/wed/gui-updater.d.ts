import { DLoc } from "./dloc";
import * as treeUpdater from "./tree-updater";
/**
 * Updates a GUI tree so that its data nodes (those nodes that are not
 * decorations) mirror a data tree.
 */
export declare class GUIUpdater extends treeUpdater.TreeUpdater {
    private readonly treeUpdater;
    /**
     * @param guiTree The DOM tree to update.
     *
     * @param treeUpdater A tree updater that updates the data tree. It serves as
     * a source of modification events which the object being created will listen
     * on.
     */
    constructor(guiTree: Element, treeUpdater: treeUpdater.TreeUpdater);
    /**
     * Handles "InsertNodeAt" events.
     *
     * @param ev The event.
     */
    private _insertNodeAtHandler(ev);
    /**
     * Handles "SetTextNodeValue" events.
     *
     * @param ev The event.
     */
    private _setTextNodeValueHandler(ev);
    /**
     * Handles "BeforeDeleteNode" events.
     *
     * @param ev The event.
     */
    private _beforeDeleteNodeHandler(ev);
    /**
     * Handles "SetAttributeNS" events.
     *
     * @param ev The event.
     */
    private _setAttributeNSHandler(ev);
    /**
     * Converts a data location to a GUI location.
     *
     * @param loc The location.
     *
     * @returns The GUI location.
     */
    fromDataLocation(loc: DLoc): DLoc | null;
    fromDataLocation(node: Node, offset: number): DLoc | null;
}
