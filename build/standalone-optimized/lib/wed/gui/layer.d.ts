/**
 * Layers over the editing area.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
/**
 * This class represents a layer over the editing area. Layers are used to show
 * information that are above (in z order) the edited content.
 */
export declare class Layer {
    protected readonly el: HTMLElement;
    /**
     * @param el The DOM element which is the layer.
     */
    constructor(el: HTMLElement);
    /**
     * Remove all elements from the layer.
     */
    clear(): void;
    /**
     * Append a child to a layer.
     *
     * @param child The child to append. This could be a document fragment if you
     * want to add multiple nodes at once.
     */
    append(child: Node): void;
}
