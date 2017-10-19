/**
 * Typeguards to facilitate working with TypeScript and the DOM.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
export declare function isNode(thing: any): thing is Node;
export declare function isElement(node?: Node | null): node is Element;
export declare function isText(node?: Node | null): node is Text;
/**
 * Determines whether the thing passed is an attribute. This function does not
 * try to be strict about what is passed to it. Pass anything that has a
 * ``nodeType`` field with a value equal to ``Node.ATTRIBUTE_NODE`` and it will
 * return ``true``, even if the thing is not actually an attribute.
 *
 * This is needed because wed works with HTML and XML DOM trees and
 * unfortunately, things have gotten murky. Once upon a time, an attribute was
 * determined by checking the ``nodeType`` field. This worked both for HTML and
 * XML nodes. This worked because attributes inherited from ``Node``, which is
 * the DOM interface that defines ``nodeType``. It was paradise.
 *
 * Then the luminaries that drive the implementation of DOM in actual browsers
 * decided that attributes were no longer really nodes. So they decided to make
 * attribute objects inherit from the ``Attr`` interface **only**. This means
 * that ``nodeType`` no longer exists for attributes. The new way to test
 * whether something is an attribute is to test with ``instanceof Attr``.
 * However, as usual, the DOM implementation for XML lags behind the HTML side
 * and on Chrome 49 (to name just one case), ``instanceof Attr`` does not work
 * on XML attributes whereas testing ``nodeType`` does.
 *
 * This function performs a test that works on HTML attributes and XML
 * attributes.
 *
 * @param it The thing to test.
 *
 * @returns ``true`` if an attribute, ``false`` if not.
 */
declare const isAttr: (it: Attr | Node | null | undefined) => it is Attr;
export { isAttr };
export declare function isDocumentFragment(node?: Node | null): node is DocumentFragment;
export declare function isDocument(node?: Node | null): node is Document;
