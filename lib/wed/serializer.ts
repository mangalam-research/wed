/**
 * An XML serializer for platforms that produce erratic results.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

/**
 * Escape characters that cannot be represented literally in XML.
 *
 * @private
 *
 * @param text The text to escape.
 *
 * @param isAttr Whether the text is part of an attribute.
 *
 * @returns The escaped text.
 */
function escape(text: string, isAttr: boolean): string {
  // Even though the > escape is not *mandatory* in all cases, we still do it
  // everywhere.
  let ret = text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (isAttr) {
    ret = ret.replace(/"/g, "&quot;");
  }

  return ret;
}

function serializeDocument(out: string[], node: Document): void {
  if (node.childNodes.length > 1) {
    throw new Error("cannot serialize a document with more than " +
                    "one child node");
  }

  if (node.firstChild === null) {
    throw new Error("cannot serialize an empty document");
  }

  _serialize(out, node.firstChild);
}

function serializeElement(out: string[], node: Element): void {
  out.push("<", node.tagName);

  const attributes = node.attributes;
  for (let i = 0; i < attributes.length; ++i) {
    const attr = attributes[i];
    out.push(" ", attr.name, "=\"", escape(attr.value, true), "\"");
  }
  if (node.childNodes.length === 0) {
    out.push("/>");
  }
  else {
    out.push(">");
    let child = node.firstChild;
    while (child !== null) {
      _serialize(out, child);
      child = child.nextSibling;
    }
    out.push("</", node.tagName, ">");
  }
}

function serializeText(out: string[], node: Text): void {
  out.push(escape(node.textContent!, false));
}

const typeToHandler: Record<string, Function> = Object.create(null);
typeToHandler[Node.DOCUMENT_NODE] = serializeDocument;
typeToHandler[Node.DOCUMENT_FRAGMENT_NODE] = serializeDocument;
typeToHandler[Node.ELEMENT_NODE] = serializeElement;
typeToHandler[Node.TEXT_NODE] = serializeText;

function _serialize(out: string[], node: Node): void {
  const handler = typeToHandler[node.nodeType];
  if (handler === undefined) {
    throw new Error(`can't handle node of type: ${node.nodeType}`);
  }
  handler(out, node);
}

/**
 * Serialize an XML tree. This serializer implements only as much as wed
 * currently needs. Notably, this does not currently serialize comments, CDATA,
 * or processing instructions.
 *
 * @param root The root of the document.
 *
 * @returns The serialized document.
 */
export function serialize(root: Element | Document | DocumentFragment): string {
  const out: string[] = [];
  _serialize(out, root);

  return out.join("");
}

//  LocalWords:  MPL lt nodeType CDATA
