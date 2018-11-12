/**
 * An internal clipboard for a wed editor.
 *
 * Due to the limitations of the clipboard API, wed maintains an internal
 * clipboard which allows it to transfer data in a way meaningful to wed.
 */
export class Clipboard {
  private readonly tree: Document =
    new DOMParser().parseFromString("<div/>", "text/xml");
  private readonly firstChild: Element = this.tree.firstChild as Element;

  /**
   * Clear the clipboard.
   *
   * Note that this clears only the contents of this object. **IT DOES NOT
   * AFFECT THE BROWSER CLIPBOARD!**
   */
  clear(): void {
    // Empty the div.
    // tslint:disable-next-line:no-inner-html
    this.firstChild.innerHTML = "";
  }

  /**
   * Sets the clipboard nodes. This adds the nodes to the internal DOM tree.
   *
   * Note that the clipboard is cleared before adding the nodes.
   *
   * @param nodes The nodes to add. These nodes become property of the clipboard
   * after being added. If you want to keep the nodes in another document, clone
   * them first.
   */
  setNodes(nodes: Node[]): void {
    this.clear();
    const { tree, firstChild } = this;
    for (const node of nodes) {
      firstChild.appendChild(tree.adoptNode(node));
    }
  }

  /**
   * Sets the text of the clipboard.
   *
   * Note that the clipboard is cleared before setting the text.
   *
   * @param text The text to set the buffer to.
   */
  setText(text: string): void {
    this.clear();
    this.firstChild.textContent = text;
  }

  /**
   * Determines whether, in a paste operation, the tree that is stored in this
   * clipboard should be used.
   *
   * @param toPaste The XML that the user is trying to paste.
   */
  canUseTree(toPaste: string): boolean {
    return this.firstChild.textContent === toPaste;
  }

  /**
   * @returns A deep copy of the tree in this clipboard.
   */
  cloneTree(): Document {
    return this.tree.cloneNode(true) as Document;
  }

  /**
   * Set the DOM clipboard data to reflect what is stored in this wed-internal
   * clipboard. Note that any old data in the DOM clipboard data is cleared
   * before setting the new data.
   *
   * @param clipboardData The object to set.
   */
  setClipboardData(clipboardData: DataTransfer): void {
    const { firstChild } = this;
    clipboardData.clearData();
    clipboardData.setData("text/plain", firstChild.textContent!);
    clipboardData.setData("text/xml", firstChild.innerHTML);
  }
}
