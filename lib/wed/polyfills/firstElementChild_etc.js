(function(){
    'use strict';

    function addToPrototype(p) {
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

        Object.defineProperty(p, 'childElementCount', {
            get: function () {
                var el = this.firstElementChild;
                var count = 0;
                while (el) {
                    count++;
                    el = el.nextElementSibling;
                }
                return count;
            }
        });
    }

    // Check whether HTML nodes need it.
    var top = document.createElement("p");
    var span = document.createElement("span");
    top.appendChild(span);

    if (top.firstElementChild !== span)
        addToPrototype(top.constructor.prototype);

    // firstElementChild will exist and be the top HTML element at this point
    // if firstElementChild is already supported on Document objects.
    if (!document.firstElementChild)
        addToPrototype(document.constructor.prototype);

    // We also need to check document fragments...
    var frag = document.createDocumentFragment();
    var frag_child = document.createElement("span");
    frag.appendChild(frag_child);

    if (frag.firstElementChild !== frag_child)
        addToPrototype(frag.constructor.prototype);

    // Check whether XML nodes need it.
    var parser = new window.DOMParser();
    var doc = parser.parseFromString("<p><span><q></q></span></p>", "text/xml");
    var child = doc.firstChild;

    // The document most likely has a different constructor from
    // regular XML elements. So we check the document...
    if (child !== doc.firstElementChild)
        addToPrototype(doc.constructor.prototype);

    // ... and an element...
    if (child.firstChild !== child.firstElementChild)
        addToPrototype(child.constructor.prototype);

    // ... and a fragment...
    var xml_frag = doc.createDocumentFragment();
    var xml_frag_child = doc.createElement("span");
    xml_frag.appendChild(xml_frag_child);

    if (xml_frag.firstElementChild !== xml_frag_child)
        addToPrototype(xml_frag.constructor.prototype);

})();
