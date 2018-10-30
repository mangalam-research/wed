/**
 * An internal clipboard for a wed editor.
 *
 * Due to the limitations of the clipboard API, wed maintains an internal
 * clipboard which allows it to transfer data in a way meaningful to wed.
 */
export class Clipboard {
  private readonly tree: Document =
    new DOMParser().parseFromString("<div/>", "text/xml");
  private readonly doc: Document;
  private readonly win: Window;

  constructor(private readonly buffer: HTMLElement) {
    this.doc = buffer.ownerDocument;
    this.win = buffer.ownerDocument.defaultView;
  }

  /**
   * Clear the clipboard.
   *
   * Note that this clears only the contents of this object. **IT DOES NOT
   * AFFECT THE BROWSER CLIPBOARD!**
   */
  clear(): void {
    const { tree, buffer } = this;
    while (buffer.firstChild !== null) {
      buffer.removeChild(buffer.firstChild);
    }

    // Empty the div.
    // tslint:disable-next-line:no-inner-html
    (tree.firstChild as Element).innerHTML = "";
  }

  /**
   * Sets the clipboard nodes. This adds the nodes to the internal DOM tree, and
   * sets the text of the internal buffer to the HTML of the nodes.
   *
   * Note that the buffer and tree are cleared before adding the nodes.
   *
   * @param nodes The nodes to add. These nodes become property of the clipboard
   * after being added. If you want to keep the nodes in another document, clone
   * them first.
   */
  setNodes(nodes: Node[]): void {
    this.clear();
    const { tree, buffer } = this;
    for (const node of nodes) {
      tree.firstChild!.appendChild(tree.adoptNode(node));
    }

    buffer.textContent = (tree.firstChild as Element).innerHTML;
  }

  /**
   * Sets the text of the internal buffer.
   *
   * Note that the buffer and tree are cleared before setting the text.
   *
   * @param text The text to set the buffer to.
   */
  setText(text: string): void {
    this.clear();
    this.buffer.textContent = text;
  }

  /**
   * Sets the current selection of the window to which the clipboard belongs to
   * select the whole buffer.
   */
  selectBuffer(): void {
    const range = this.doc.createRange();
    const { buffer } = this;
    range.setStart(buffer, 0);
    range.setEnd(buffer, buffer.childNodes.length);
    const domSel = this.win.getSelection();
    domSel.removeAllRanges();
    domSel.addRange(range);
  }

  canUseTree(toPaste: string): boolean {
    return toPaste === this.buffer.textContent &&
      this.tree.firstChild!.firstChild !== null;
  }

  cloneTree(): Document {
    return this.tree.cloneNode(true) as Document;
  }
}
