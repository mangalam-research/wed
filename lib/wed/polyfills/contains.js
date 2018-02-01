(function polyfill() {
  "use strict";

  //
  // Fix IE's implementation of `contains`.
  //

  //
  // This part works around a bug present in IE 10 that makes it so that
  // contains does not work with text nodes. Fortunately,
  // compareDocumentPosition works fine, so we use it to fix the problem.
  //

  // Test whether we can fix it.
  if (!Node.prototype.compareDocumentPosition) {
    throw new Error("this browser does not support compareDocumentPosition");
  }

  // An implementation that depends on compareDocumentPosition.
  function contains(other) {
    // The regular contains method returns false when junk is passed, but
    // compareDocumentPosition is more picky, so...
    if (!(other instanceof Node)) {
      return false;
    }

    // Handle the trival case.
    if (this === other) {
      return true;
    }

    // eslint-disable-next-line no-bitwise
    return !!(this.compareDocumentPosition(other) & 16);
  }

  // Test whether the problem actually occurs.
  var div = document.createElement("div");
  var text = document.createTextNode("foo");
  div.appendChild(text);
  if (!text.contains || !div.contains(text)) {
    // We have to put it on both prototypes because of the wonky inheritance in
    // IE. In a stock IE browser, it is not implemented on Node, but is
    // implemented on HTMLElement, which inherits from Node. Setting it on Node,
    // sets it for everything except HTMLElement. :-/
    HTMLElement.prototype.contains = Node.prototype.contains = contains;
    if (!text.contains || !div.contains(text)) {
      throw new Error("The fix did not take!");
    }
  }

  //
  // The following code adds contains to XML objects, which is needed in IE 10
  // and IE 11.
  //

  var parser = new window.DOMParser();
  var doc = parser.parseFromString("<div>text</div>", "text/xml");
  var child = doc.firstChild;
  var xmlText = child.firstChild;

  function fix(what) {
    if (!what.contains) {
      // We can just take it from Node.prototype.contains. It does not matter
      // whether it is native or not.
      what.constructor.prototype.contains = Node.prototype.contains;
    }
  }

  fix(child);

  // Document and Text have a different constructors.
  fix(doc);
  fix(xmlText);
}());
