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
export class Layer {
  /**
   * @param el The DOM element which is the layer.
   */
  constructor(protected readonly el: HTMLElement) { }

  /**
   * Remove all elements from the layer.
   */
  clear(): void {
    const el = this.el;
    while (el.lastChild !== null) {
      el.removeChild(el.lastChild);
    }
  }

  /**
   * Append a child to a layer.
   *
   * @param child The child to append. This could be a document fragment if you
   * want to add multiple nodes at once.
   */
  append(child: Node): void {
    this.el.appendChild(child);
  }
}

//  LocalWords:  MPL
