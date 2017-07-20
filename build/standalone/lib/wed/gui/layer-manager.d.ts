/**
 * A layer manager allows operating on layers as a group.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Layer } from "./layer";
/**
 * A layer manager allows operating on layers as a group.
 */
export declare class LayerManager {
    private readonly doc;
    private readonly layers;
    /**
     * @param doc The DOM document for which this manager exists.
     */
    constructor(doc: Document);
    /**
     * Add a layer to the manager. You should not need to do this as layers add
     * themselves at initialization.
     */
    addLayer(layer: Layer): void;
    /**
     * Temporarily hide the layers. The previous visibility will be restored by
     * [[popVisibility]].
     */
    hideTemporarily(): void;
    /**
     * Undo the hiding that was done with [[hideTemporarily]]. It is an error to
     * call this more than [[hideTemporarily]] was called.
     */
    popVisibility(): void;
    /**
     * Returns the element under the point, ignoring the editor's layers.
     *
     * @param x The x coordinate.
     *
     * @param y The y coordinate.
     *
     * @returns The element under the point, or ``undefined`` if the point is
     * outside the document.
     */
    elementAtPointUnderLayers(x: number, y: number): Element | undefined;
}
