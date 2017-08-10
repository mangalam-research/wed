/**
 * Utilities that require a DOM to run.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { expect } from "chai";

import { childByClass } from "wed/domutil";
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

export function getAttributeValuesFor(container: Element): NodeListOf<Element> {
  return firstGUI(container)!.getElementsByClassName("_attribute_value");
}
