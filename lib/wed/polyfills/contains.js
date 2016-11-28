(function () {
    'use strict';

    //
    // Fix IE's implementation of `contains`.
    //

    //
    // This part works around a bug present in IE 10 that makes it so
    // that Node.prototype.contains does not work with text
    // nodes. Fortunately, compareDocumentPosition works fine, so we
    // use it to fix the problem.
    //

    // Test whether we can fix it.
    if (!Node.prototype.compareDocumentPosition)
        throw new Error(
            "this browser does not support compareDocumentPosition");

    // Test whether the problem actually occurs.
    var div = document.createElement("div");
    var text = document.createTextNode("foo");
    div.appendChild(text);
    if (!div.contains(text)) {
        // Peform the fix, using compareDocumentPosition.
        HTMLElement.prototype.contains = function (other) {
            // The regular contains method returns false when junk is
            // passed, but compareDocumentPosition is more picky,
            // so...
            if (!(other instanceof Node))
                return false;

            // Handle the trival case.
            if (this === other)
                return true;

            return !!(this.compareDocumentPosition(other) & 16);
        };

        if (!div.contains(text))
            throw new Error("The fix did not take!");
    }

    //
    // The following code adds contains to XML Elements, which is
    // needed in IE 10 and IE 11.
    //

    var parser = new window.DOMParser();
    var doc = parser.parseFromString("<div/>", "text/xml");
    var child = doc.firstChild;
    if (!child.contains) {
        // We can just take it from HTMLElement.prototype.contains. It
        // does not matter whether it is native or not.
        child.constructor.prototype.contains = HTMLElement.prototype.contains;
    }

    // The document has a different prototype, and also needs to have
    // contains. So...
    if (!doc.contains) {
        doc.constructor.prototype.contains = HTMLElement.prototype.contains;
    }
})();
