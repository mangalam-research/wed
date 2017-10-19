/**
 * Convert an XML tree or subtree into an HTML tree suitable to be inserted into
 * the GUI tree.
 *
 * XML Elements are converted to ``div`` elements with a ``class`` that has:
 *
 * - for first class the tag name (qualified name in XML parlance) of the
 *    element,
 *
 * - for second class the ``_local_<local name>`` where ``<local name>`` is the
 *   local name of the element,
 *
 * - for third class ``_xmlns_<namespace uri>`` where ``namespace uri`` is
 *   the URI of the namespace of the XML element,
 *
 * - for fourth class ``_real``.
 *
 * The attributes of the XML element appear on the HTML element with the name
 * ``data-wed-<attribute name>``, where ``attribute name`` is converted by
 * [[encodeAttrName]]. This attribute has for value the original
 * value in the XML. A second attribute ``data-wed--ns-<attribute name>``
 * contains the namespace URI of the attribute. If the attribute was not in a
 * namespace, then ``data-wed--ns-<attribute name>`` is omitted.
 *
 * @param doc The HTML document in which we are going to use the generated
 * tree.
 *
 * @param node The root of the XML tree to convert.
 *
 * @returns The root of the newly created HTML tree.
 */
export declare function toHTMLTree(doc: Document, node: Node): Node;
