/**
 * Menu for replacing values.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import $ from "jquery";

import { Editor } from "../editor";
import { ContextMenu } from "./context-menu";

export type DismissCallback = (selected: string | undefined) => void;

/**
 * A menu for displaying replacement values.
 */
export class ReplacementMenu extends ContextMenu {
  private readonly replacementItems: string[];
  private readonly editor: Editor;
  private selected: string | undefined;

  /**
   * @param editor The editor for which to create this menu.
   *
   * @param document The DOM document for which to make this context menu.
   *
   * @param x Position of the menu. The context menu may ignore this position if
   * the menu would appear off-screen.
   *
   * @param y Position of the menu.
   *
   * @param items An array of possible replacement values.
   *
   * @param dismissCallback Function to call when the menu is dismissed.
   */
  constructor(editor: Editor, document: Document, x: number, y: number,
              items: string[], dismissCallback: DismissCallback) {
    super(document, x, y, [], () => {
      dismissCallback(this.selected);
    }, false);
    this.replacementItems = items;
    this.editor = editor;

    this.dropdown.classList.add("wed-replacement-menu");

    this.display([]);
  }

  render(): void {
    const items = [];
    const doc = this.editor.doc;
    for (const item of this.replacementItems) {
      const li = doc.createElement("li");
      // tslint:disable-next-line:no-inner-html
      li.innerHTML = "<a href='#'></a>";
      li.lastChild!.textContent = item;
      items.push(li);
      $(li).click(item, () => {
        this.selected = item;
        this.dismiss();
      });
    }

    super.render(items);
  }

  dismiss(): void {
    if (this.dismissed) {
      return;
    }
    super.dismiss();
  }
}

//  LocalWords:  MPL li href
