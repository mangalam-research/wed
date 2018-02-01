/**
 * Typeguards to facilitate working with TypeScript and the DOM.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:no-any
    function isNode(thing) {
        return thing != null && typeof thing.nodeType === "number";
    }
    exports.isNode = isNode;
    function isElement(node) {
        return node != null && node.nodeType === Node.ELEMENT_NODE;
    }
    exports.isElement = isElement;
    function isText(node) {
        return node != null && node.nodeType === Node.TEXT_NODE;
    }
    exports.isText = isText;
    var attrNodeType = Node.ATTRIBUTE_NODE;
    // Specialized for when Node.ATTRIBUTE_NODE still exists.
    function isAttrWithType(it) {
        return it instanceof Attr || (it.nodeType === attrNodeType);
    }
    // Specialized for when the platform has removed Node.ATTRIBUTE_NODE.
    function isAttrNoType(it) {
        return it instanceof Attr;
    }
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
    var isAttr = 
    // We check that ``attrNodeType`` is not undefined because eventually
    // ``ATTRIBUTE_NODE`` will be removed from the ``Node`` interface, and then we
    // could be testing ``undefined === undefined`` for objects which are not
    // attributes, which would return ``true``. The function is not very strict
    // but it should not be too lax either.
    (attrNodeType === undefined) ? isAttrNoType : isAttrWithType;
    exports.isAttr = isAttr;
    function isDocumentFragment(node) {
        return node != null && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
    }
    exports.isDocumentFragment = isDocumentFragment;
    function isDocument(node) {
        return node != null && node.nodeType === Node.DOCUMENT_NODE;
    }
    exports.isDocument = isDocument;
});
//  LocalWords:  Typeguards MPL isAttribute attrNodeType
//# sourceMappingURL=domtypeguards.js.map