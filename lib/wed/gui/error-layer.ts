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
export class ErrorLayer extends Layer {
  constructor(protected readonly el: HTMLElement) {
    super(el);
  }

  select(marker: HTMLElement): void {
    if (marker.parentNode !== this.el) {
      throw new Error("marker is not a child of the layer element");
    }

    this.unselectAll();

    marker.classList.add("selected");
  }

  unselectAll(): void {
    let child = this.el.firstElementChild;
    while (child !== null) {
      child.classList.remove("selected");
      child = child.nextElementSibling;
    }
  }
}

//  LocalWords:  MPL
