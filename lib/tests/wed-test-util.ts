/**
 * Utilities that require a DOM to run.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { expect } from "chai";

import { childByClass, childrenByClass } from "wed/domutil";
import { Editor } from "wed/wed";

export function activateContextMenu(editor: Editor, el: Element): void {
  // tslint:disable-next-line:no-any
  function computeValues(): any {
    el.scrollIntoView();
    const rect = el.getBoundingClientRect();
    const left = rect.left + (rect.width / 2);
    const top = rect.top + (rect.height / 2);
    const scrollTop = editor.window.document.body.scrollTop;
    const scrollLeft = editor.window.document.body.scrollLeft;
    return {
      which: 3,
      pageX: left + scrollLeft,
      pageY: top + scrollTop,
      clientX: left,
      clientY: top,
      target: el,
    };
  }

  editor.$guiRoot.trigger(new $.Event("mousedown", computeValues()));
  editor.$guiRoot.trigger(new $.Event("mouseup", computeValues()));
}

export function contextMenuHasOption(editor: Editor, pattern: RegExp,
                                     expectedCount?: number): void {
  const menu =
    editor.window.document.getElementsByClassName("wed-context-menu")[0];
  expect(menu, "the menu should exist").to.not.be.undefined;
  const items = menu.querySelectorAll("li>a");
  let found = 0;
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    if (pattern.test(item.textContent!.trim())) {
      found++;
    }

    if (expectedCount === undefined && found > 0) {
      break;
    }
  }

  if (expectedCount === undefined) {
    expect(found).to.be.greaterThan(0);
  }
  else {
    expect(found).to.equal(expectedCount,
                           "should have seen the option a number of times \
equal to the expected count");
  }
}

export function firstGUI(container: Element): Element | null {
  return childByClass(container, "_gui");
}

export function lastGUI(container: Element): Element | null {
  const children = childrenByClass(container, "_gui");
  const last = children[children.length - 1];
  return last !== undefined ? last : null;
}

export function getElementNameFor(container: Element,
                                  last: boolean = false): Element | undefined {
  const gui = last ? lastGUI(container) : firstGUI(container);

  return gui!.getElementsByClassName("_element_name")[0];
}

export function getAttributeValuesFor(container: Element): NodeListOf<Element> {
  return firstGUI(container)!.getElementsByClassName("_attribute_value");
}

export function caretCheck(editor: Editor, container: Node,
                           offset: number | null, msg: string): void {
  const caret = editor.caretManager.caret!;
  expect(caret, "there should be a caret").to.not.be.undefined;
  if (offset !== null) {
    expect(caret.toArray(), msg).to.deep.equal([container, offset]);
  }
  else {
    // A null offset means we are not interested in the specific offset.  We
    // just want to know that the caret is *inside* container either directly or
    // indirectly.
    expect(container.contains(caret.node), msg).to.be.true;
  }
}

export function dataCaretCheck(editor: Editor, container: Node,
                               offset: number, msg: string): void {
  const dataCaret = editor.caretManager.getDataCaret()!;
  expect(dataCaret.toArray(), msg).to.deep.equal([container, offset]);
}
