(function polyfill() {
  "use strict";

  // On some versions of IE 11, normalize is hosed. Detect and fix.

  var frag = document.createDocumentFragment();
  frag.appendChild(document.createElement("p"));
  frag.appendChild(document.createTextNode(""));

  frag.normalize();

  if (frag.childNodes.length === 1) {
    return;
  } // Normalize works fine.

  var TEXT_NODE = Node.TEXT_NODE;
  Node.prototype.normalize = function normalize() {
    var child = this.firstChild;
    while (child) {
      var next = child.nextSibling;
      if (child.nodeType === TEXT_NODE) {
        var data = child.data;
        if (data === "") {
          this.removeChild(child);
        }
        else {
          var prev = child.previousSibling;
          if (prev && prev.nodeType === TEXT_NODE) {
            child.data = prev.data + data;
            this.removeChild(prev);
          }
        }
      }
      else if (child.firstChild) {
        child.normalize();
      }
      child = next;
    }
  };
}());
