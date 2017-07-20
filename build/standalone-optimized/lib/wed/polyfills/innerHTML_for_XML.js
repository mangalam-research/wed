(function polyfill() {
  "use strict";

  // Firefox and Chrome support innerHTML on XML nodes. However, IE,
  // Safari and Opera do not. This adds only the capability to
  // **read** innerHTML on such nodes, but not to **set** it.
  var parser = new window.DOMParser();
  var doc = parser.parseFromString("<div/>", "text/xml");
  var child = doc.firstChild;
  var serializer = new window.XMLSerializer();
  if (child.innerHTML === undefined) {
    Object.defineProperty(child.constructor.prototype, "innerHTML", {
      get: function innerHTML() {
        if (this.childNodes.length === 0) {
          return "";
        }

        var ret = serializer.serializeToString(this);

        //
        // There is no avoiding the following text manipulation. The contents of
        // some random XML element is not a valid XML document so if we did not
        // use `this` as the container we'd have to provide a temporary
        // container to serialize the contents of an element, and then we'd have
        // to strip out this container. It could conceivably make the regexps
        // that follow *simpler* but it would not eliminate them. And the cost
        // of cloning the contents to put it in the temporary wrapper would be
        // non-negligible.
        //

        // This cleanup is meant to be only good enough to use with
        // XMLSerializer, not any random serialization.  The strategy is to ...

        // ... remove the start of the tag for the top level element, and ...
        ret = ret.replace(/^<[^>\s]+/, "");

        // ... remove the attributes of the top level element one by one, and
        // ...
        var prev_len;
        do {
          prev_len = ret.length;
          ret = ret.replace(/^[^>=]+=\s*(["']).*?\1\s*/, "");
        } while (prev_len !== ret.length);

        ret = ret
        // ... remove the end of the start tag, and ...
          .replace(/^.*?>/, "")
        // ... remove the end tag.
          .replace(/<\/[^<]+?>$/, "");

        return ret;
      },
    });
  }

  if (child.outerHTML === undefined) {
    Object.defineProperty(child.constructor.prototype, "outerHTML", {
      get: function outerHTML() {
        return serializer.serializeToString(this);
      },
    });
  }
}());
