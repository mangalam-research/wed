/**
 * @desc Polyfill for adding firstElementChild, etc to HTML DOM nodes that
 * should have it and to XML nodes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
(function polyfill() {
  "use strict";

  //
  // This polyfill is not needed on recent incarnations of Chrome or
  // FF. (Based on compatibility information on MDN, it is probably
  // not needed for Chrome as early as version 29 and FF as early as
  // version 25.)
  //
  // It is needed on IE 11 because a) IE does not support the
  // NonDocumentTypeChildNode interface on CharacterData, b) IE
  // generally does not extend these interfaces to XML nodes, which
  // wed requires.
  //

  //
  // This polyfill has been tested with IE 11 and 10. It has not been tested
  // with older versions of IE because we do not support them.
  //

  function addParentNodeInterfaceToPrototype(p) {
    Object.defineProperty(p, "firstElementChild", {
      get: function firstElementChild() {
        var el = this.firstChild;
        while (el && el.nodeType !== 1) {
          el = el.nextSibling;
        }
        return el;
      },
    });

    Object.defineProperty(p, "lastElementChild", {
      get: function lastElementChild() {
        var el = this.lastChild;
        while (el && el.nodeType !== 1) {
          el = el.previousSibling;
        }
        return el;
      },
    });

    Object.defineProperty(p, "childElementCount", {
      get: function childElementCount() {
        var el = this.firstElementChild;
        var count = 0;
        while (el) {
          count++;
          el = el.nextElementSibling;
        }
        return count;
      },
    });
  }

  // We separate children from the rest because it is possible to have
  // firstElementChild, etc defined and yet not have children defined. Go
  // figure...
  function addChildrenToPrototype(p) {
    // Unfortunately, it is not possible to emulate the liveness of the
    // HTMLCollection this property *should* provide.
    Object.defineProperty(p, "children", {
      get: function children() {
        var ret = [];
        var el = this.firstElementChild;
        while (el) {
          ret.push(el);
          el = el.nextElementSibling;
        }

        return ret;
      },
    });
  }

  function maybeAddChildren(what) {
    if (!what.children) {
      addChildrenToPrototype(what.constructor.prototype);
    }
  }

  function addNonDocumentTypeChildNodeInterfaceToPrototype(p) {
    Object.defineProperty(p, "nextElementSibling", {
      get: function nextElementSibling() {
        var el = this.nextSibling;
        while (el && el.nodeType !== 1) {
          el = el.nextSibling;
        }
        return el;
      },
    });

    Object.defineProperty(p, "previousElementSibling", {
      get: function previousElementSibling() {
        var el = this.previousSibling;
        while (el && el.nodeType !== 1) {
          el = el.previousSibling;
        }
        return el;
      },
    });
  }

  //
  // Check whether HTML nodes need it.
  //

  (function checkHTML() {
    var test = document.createElement("p");
    var child = document.createElement("span");
    var sibling = document.createElement("div");
    var text_sibling = document.createTextNode("foo");
    test.appendChild(child);
    test.appendChild(sibling);
    test.appendChild(text_sibling);

    if (test.firstElementChild !== child) {
      addParentNodeInterfaceToPrototype(test.constructor.prototype);
    }

    maybeAddChildren(test);

    if (child.nextElementSibling !== sibling) {
      addNonDocumentTypeChildNodeInterfaceToPrototype(Element.prototype);
    }

    if (text_sibling.previousElementSibling !== sibling) {
      addNonDocumentTypeChildNodeInterfaceToPrototype(CharacterData.prototype);
    }

    // firstElementChild will exist and be the top HTML element at
    // this point if firstElementChild is already supported on
    // Document objects.
    if (!document.firstElementChild) {
      addParentNodeInterfaceToPrototype(document.constructor.prototype);
    }

    maybeAddChildren(document);

    // We also need to check document fragments...
    var frag = document.createDocumentFragment();
    var frag_child = document.createElement("span");
    frag.appendChild(frag_child);

    if (frag.firstElementChild !== frag_child) {
      addParentNodeInterfaceToPrototype(frag.constructor.prototype);
    }

    maybeAddChildren(frag);
  }());

  //
  // Check whether XML nodes need it.
  //

  (function checkXML() {
    var parser = new window.DOMParser();
    var doc = parser.parseFromString(
      "<p><span><q></q></span><div></div>foo</p>",
      "text/xml");
    // doc.firstChild is the top level "p";
    var child = doc.firstChild.childNodes[0]; // Span
    var sibling = doc.firstChild.childNodes[1]; // Div
    var text_sibling = doc.firstChild.childNodes[2];


    // The document most likely has a different constructor from
    // regular XML elements. So we check the document...
    if (doc.firstChild !== doc.firstElementChild) {
      addParentNodeInterfaceToPrototype(doc.constructor.prototype);
    }

    maybeAddChildren(doc);

    // ... and an element...
    if (child.firstChild !== child.firstElementChild) {
      addParentNodeInterfaceToPrototype(child.constructor.prototype);
    }

    maybeAddChildren(child);

    //
    // We make the assumption that making the necessary change for
    // the HTML case will take care of the XML. (Note that it is
    // the case for the test just above this comment: modifying
    // the constructor of a HTML Element to support
    // firstElementChild *will by the same token* fix the issue
    // for XML elements. So the test just above this comment will
    // always be false: there's no need to patch the prototype
    // once more for XML elements.) This is true for IE
    // 11. Unknown whether it holds true for earlier IE versions.
    //
    if (child.nextElementSibling !== sibling) {
      throw new Error(
        "Modifications to Element.prototype should have " +
          "taken care of the XML elements too.");
    }

    if (text_sibling.previousElementSibling !== sibling) {
      throw new Error(
        "Modifications to CharacterData.prototype should have " +
          "taken care of the XML text nodes too.");
    }

    // ... and a fragment...
    var frag = doc.createDocumentFragment();
    var frag_child = doc.createElement("span");
    frag.appendChild(frag_child);

    if (frag.firstElementChild !== frag_child) {
      addParentNodeInterfaceToPrototype(frag.constructor.prototype);
    }

    maybeAddChildren(frag);
  }());
}());
