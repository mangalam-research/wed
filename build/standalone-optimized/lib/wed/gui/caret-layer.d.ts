/**
 * A layer that manages carets.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Layer } from "./layer";
import { LayerManager } from "./layer-manager";
/**
 * A layer that manages carets.
 */
export declare class CaretLayer extends Layer {
    private readonly $el;
    constructor(manager: LayerManager, el: HTMLElement);
    private caretLayerMouseHandler(e);
}
