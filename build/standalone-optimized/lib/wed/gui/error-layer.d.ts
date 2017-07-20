/**
 * Specialized layer for error markers.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Layer } from "./layer";
/**
 * Specialized layer for error markers.
 */
export declare class ErrorLayer extends Layer {
    protected readonly el: HTMLElement;
    constructor(el: HTMLElement);
    select(marker: HTMLElement): void;
    unselectAll(): void;
}
