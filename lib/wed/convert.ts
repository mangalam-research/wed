/**
 * Convertion from XML to HTML.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { isElement, isText } from "./domtypeguards";

function ancestorNamespaceValue(node: Element,
                                name: string): string | undefined {
  const parent = node.parentNode;
  if (!isElement(parent)) {
    return undefined;
  }

  const val = parent.getAttribute(name);
  return (val !== null) ? val : ancestorNamespaceValue(parent, name);
}

export function toHTMLTree(doc: Document, node: Node): Node {
  let ret;
  if (isElement(node)) {
    ret = doc.createElement("div");
    ret.className = `${node.tagName} _real`;
    //
    // We encode attributes here in the following way:
    //
    // 1. A sequence of three dashes or more gains a dash. So three dashes
    // becomes 4, 4 becomes 5, etc.
    //
    // 2. A colon (which should be present only to mark the prefix) becomes a
    // sequence of three dashes.
    //
    for (let i = 0; i < node.attributes.length; ++i) {
      const attr = node.attributes[i];
      const ns = (attr.name === "xmlns" ||
                  attr.name.lastIndexOf("xmlns:", 0) === 0);

      // Don't do anything for namespace attributes that don't actually change
      // the namespace.
      if (ns && (attr.value === ancestorNamespaceValue(node, attr.name))) {
        continue;
      }

      const attrName = "data-wed-" + attr.name.replace(/--(-+)/, "---$1")
        .replace(":", "---");

      ret.setAttribute(attrName, attr.value);
    }

    let child = node.firstChild;
    while (child !== null) {
      ret.appendChild(toHTMLTree(doc, child));
      child = child.nextSibling;
    }

  }
  else if (isText(node)) {
    ret = document.createTextNode(node.data);
  }
  else {
    throw new Error(`unhandled node type: ${node.nodeType}`);
  }

  return ret;
}
