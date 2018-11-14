/**
 * An internal clipboard for wed editors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { isAttr } from "./domutil";
import { SelectionMode } from "./selection-mode";

// tslint:disable-next-line:no-http-string
export const CLIPBOARD_NS = "http://mangalamresearch.org/ns/wed/clipboard";

/**
 * An internal clipboard for wed editors.
 *
 * Due to the limitations of the clipboard API, wed maintains an internal
 * clipboard which allows it to transfer data in a way meaningful to wed.
 */
export class Clipboard {
  private readonly tree: Document =
    new DOMParser().parseFromString("<div/>", "text/xml");
  private readonly top: Element = this.tree.firstElementChild!;
  private _mode: SelectionMode = SelectionMode.SPAN;

  /**
   * The clipboard switches selection mode on the basis of how data is added to
   * it, and the mode remains in effect until data is added in a way that
   * changes the mode.
   *
   * Note that this property is **independent** of what the GUI is showing to
   * the user. The property "remembers", so to speak, how the clipboard has been
   * used.
   */
  get mode(): SelectionMode {
    return this._mode;
  }

  /**
   * Sets the selection mode of this clipboard.
   *
   * @param vale The new mode.
   */
  private setMode(value: SelectionMode): void {
    if (value !== this._mode) {
      this.clear();
    }

    this._mode = value;
  }

  /**
   * Clear the clipboard.
   *
   * Note that this clears only the contents of this object. **IT DOES NOT
   * AFFECT THE BROWSER'S CLIPBOARD!**
   */
  clear(): void {
    // Empty the div.
    // tslint:disable-next-line:no-inner-html
    this.top.innerHTML = "";
  }

  /**
   * Puts a span of nodes into the clipboard. This method switches the clipboard
   * to the span mode.
   *
   * Note that the clipboard is cleared before adding the nodes.
   *
   * @param nodes The nodes to put. These nodes become property of the clipboard
   * after being added. If you want to keep the nodes in another document, clone
   * them first.
   */
  putSpan(span: Node[] | string): void {
    this.clear();
    this.setMode(SelectionMode.SPAN);
    if (typeof span === "string") {
      this.top.textContent = span;
    }
    else {
      const { tree, top } = this;
      for (const node of span) {
        top.appendChild(tree.adoptNode(node));
      }
    }
  }

  /**
   * Check whether a node can be added to this clipboard's data. Clipboards
   * cannot contain heterogenous data. An attribute can be added only if the
   * clipboard is empty or contains attributes. Another type of node can be
   * added only if the clipboard does not contain attributes.
   *
   * @param node The node to check.
   *
   * @returns Whether the node can be added to this clipboard's data.
   */
  canAddUnit(node: Node): boolean {
    const { top } = this;
    return isAttr(node) ? (top.firstElementChild === null ||
                           containsClipboardAttributeCollection(top)) :
      !containsClipboardAttributeCollection(top);
  }

  /**
   * Puts a DOM node in the clipboard. This method switches the clipboard to
   * unit mode.
   *
   * Note that the clipboard is cleared before adding the node.
   *
   * @param node The node to put. This node becomes property of the clipboard
   * after being added. If you want to keep it in another document, clone it
   * first.
   *
   * @param add Add to the clipboard, rather than replace the contents.
   */
  putUnit(node: Node, add: boolean): void {
    this.setMode(SelectionMode.UNIT);
    const { top } = this;
    if (isAttr(node)) {
      let collection: Element;
      if (add && containsClipboardAttributeCollection(top)) {
        collection = top.firstElementChild!;
      }
      else {
        // In order to record a collection of attributes, we set the tree to
        // contain a single element on which we set the attributes we want to
        // move around.
        this.clear();
        collection =
          top.ownerDocument.createElementNS(CLIPBOARD_NS, "wed:attributes");
        top.appendChild(collection);
      }
      collection.setAttributeNode(node);
    }
    else {
      if (!add || containsClipboardAttributeCollection(top)) {
        this.clear();
      }
      top.appendChild(this.tree.adoptNode(node));
    }
  }

  /**
   * Determines whether, in a paste operation, the tree that is stored in this
   * clipboard, serialized, is equal to some text.
   *
   * This can be used as an optimization to avoid parsing anew ``text`` if the
   * tree in the clipboard is already a parsed representation of that text.
   *
   * @param text The text to test against.
   */
  isSerializedTree(text: string): boolean {
    return this.top.innerHTML === text;
  }

  /**
   * @returns A deep copy of the tree in this clipboard.
   */
  cloneTree(): Element {
    return this.top.cloneNode(true) as Element;
  }

  /**
   * Set the DOM clipboard data to reflect what is stored in this wed-internal
   * clipboard. Note that any old data in the DOM clipboard data is cleared
   * before setting the new data.
   *
   * @param clipboardData The object to set.
   */
  setupDOMClipboardData(clipboardData: DataTransfer): void {
    const { top } = this;
    clipboardData.clearData();
    clipboardData.setData("text/plain", top.textContent!);
    clipboardData.setData("text/xml", top.innerHTML);
  }
}

/**
 * Check whether the element has a single child element which is a collection of
 * attributes.
 *
 * @param el The element to check.
 *
 * @returns Whether the element contains an attribute collection.
 */
export function containsClipboardAttributeCollection(el: Element): boolean {
  const first = el.firstElementChild;
  return el.childNodes.length === 1 && first !== null &&
    first.namespaceURI === CLIPBOARD_NS && first.localName === "attributes";
}
