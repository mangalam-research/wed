(function(){
    'use strict';

    // If firstElementChild is supported then body's parent forcibly
    // must have firstElementChild return a defined value because it
    // at least has body as a child element.
    if(document.body.parentNode.firstElementChild)
        // Assume they all exist.
        return;

    var p = Element.prototype;
    Object.defineProperty(p, 'firstElementChild', {
        get: function () {
            var el = this.firstChild;
            while (el && el.nodeType !== 1)
                el = el.nextSibling;
            return el;
        }
    });

    Object.defineProperty(p, 'lastElementChild', {
        get: function () {
            var el = this.lastChild;
            while (el && el.nodeType !== 1)
                el = el.previousSibling;
            return el;
        }
    });

    Object.defineProperty(p, 'nextElementSibling', {
        get: function () {
            var el = this.nextSibling;
            while (el && el.nodeType !== 1)
                el = el.nextSibling;
            return el;
        }
    });

    Object.defineProperty(p, 'previousElementSibling', {
        get: function () {
            var el = this.previousSibling;
            while (el && el.nodeType !== 1)
                el = el.previousSibling;
            return el;
        }
    });
})();
