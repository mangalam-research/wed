(function polyfill() {
  "use strict";

  var p = Element.prototype;
  if (p.matches) {
    return;
  }

  p.matches = p.matchesSelector || p.webkitMatchesSelector ||
    p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector;
}());
