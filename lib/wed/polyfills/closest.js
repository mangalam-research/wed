(function polyfill(p) {
  "use strict";

  if (p.closest) {
    // We don't need to do anything!
    return;
  }

  if (!p.matches) {
    throw new Error("This polyfill depends on Element.prototype.matches " +
                    "being available.");
  }

  p.closest = function closest(selector) {
    var el = this;

    while (el) {
      if (el.matches(selector)) {
        break;
      }

      el = el.parentElement;
    }

    return el;
  };
}(Element.prototype));
