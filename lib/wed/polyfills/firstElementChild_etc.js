(function(){
    'use strict';

    var top = document.createElement("p");
    var span = document.createElement("span");
    top.appendChild(span);

    if(top.firstElementChild === span)
        return; // Assume they all exist.

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
