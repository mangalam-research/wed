/**
 * @module util
 * @desc Various utilities for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:util */function f(require, exports) {
  "use strict";

  /**
   * Calculates the distance on the basis of two deltas. This would
   * typically be called with the difference of X coordinates and the
   * difference of Y coordinates.
   *
   * @param {Float} delta1 The first delta.
   * @param {Float} delta2 The second delta.
   *
   * @returns {Float} The distance.
   */
  function distFromDeltas(delta1, delta2) {
    // eslint-disable-next-line no-mixed-operators
    return Math.sqrt(delta1 * delta1 + delta2 * delta2);
  }

  /**
   * Measures the distance of a point from a rectangle. If the point is
   * in the rectangle or touches it, the distance is 0. In the
   * nomenclature below, left and right are on the X axis and top and
   * bottom on the Y axis.
   *
   * @param {Float} x X coordinate of the point.
   * @param {Float} y Y coordinate of the point.
   * @param {Float} left Left coordinate of the rectangle.
   * @param {Float} top Top coordinate of the rectangle.
   * @param {Float} right Right coordinate of the rectangle.
   * @param {Float} bottom Bottom coordinate of the rectangle.
   *
   * @returns {Float} The distance.
   */
  function distFromRect(x, y, left, top, right, bottom) {
    var top_delta = y - top;
    var left_delta = x - left;
    var bottom_delta = y - bottom;
    var right_delta = x - right;

    var above = top_delta < 0;
    var below = bottom_delta > 0;
    // Neologism used to avoid conflict with left above.
    var lefter = left_delta < 0;
    var righter = right_delta > 0;

    /* eslint-disable no-nested-ternary */
    var delta_x = lefter ? left_delta : (righter ? right_delta : 0);
    var delta_y = above ? top_delta : (below ? bottom_delta : 0);
    /* eslint-enable */

    return distFromDeltas(delta_x, delta_y);
  }

  /**
   * Measures the absolute horizontal and vertical distances of a point
   * from a rectangle. If the point is in the rectangle or touches it,
   * the distance is 0. In the nomenclature below, left and right are on
   * the X axis and top and bottom on the Y axis.
   *
   * @param {Float} x X coordinate of the point.
   * @param {Float} y Y coordinate of the point.
   * @param {Float} left Left coordinate of the rectangle.
   * @param {Float} top Top coordinate of the rectangle.
   * @param {Float} right Right coordinate of the rectangle.
   * @param {Float} bottom Bottom coordinate of the rectangle.
   *
   * @returns {{x: number, y: number}} The distance.
   */
  function distsFromRect(x, y, left, top, right, bottom) {
    var top_delta = y - top;
    var left_delta = x - left;
    var bottom_delta = y - bottom;
    var right_delta = x - right;

    var above = top_delta < 0;
    var below = bottom_delta > 0;
    // Neologism used to avoid conflict with left above.
    var lefter = left_delta < 0;
    var righter = right_delta > 0;

    /* eslint-disable no-nested-ternary */
    var delta_x = lefter ? left_delta : (righter ? right_delta : 0);
    var delta_y = above ? top_delta : (below ? bottom_delta : 0);
    /* eslint-enable */

    return { x: Math.abs(delta_x), y: Math.abs(delta_y) };
  }


  /**
   * Escape character in CSS class that could cause trouble in CSS
   * selectors. <strong>This is not a general solution.</strong> This
   * function supports only what wed uses.
   *
   * @param {string} cls The class
   * @returns {string} The escaped class.
   */
  function escapeCSSClass(cls) {
    return cls.replace(/:/g, "\\:");
  }

  /**
   * Get the original element name of a node created for wed's data tree.
   *
   * @param {Node} node The node whose name we want.
   * @returns {string} The name.
   */
  function getOriginalName(node) {
    // The original name is the first class name of the element that
    // was created.
    return node.classList[0];
  }

  /**
   * Makes a class string appropriate for a node in wed's data tree.
   *
   * @param {string} name The original element name.
   * @returns {string} The class string.
   */
  function classFromOriginalName(name) {
    // Special case if we want to match all
    if (name === "*") {
      return "._real";
    }

    return "." + escapeCSSClass(name) + "._real";
  }

  /**
   * Transforms an attribute name from wed's data tree to the original
   * attribute name before the data was transformed for use with wed.
   *
   * @param {string} name The encoded name.
   * @returns {string} The decoded name.
   */
  function decodeAttrName(name) {
    // The slice skips "data-wed-"
    return name.slice(9).replace(/---/, ":").replace(/---(-+)/g, "--$1");
  }

  /**
   * Transforms an attribute name from its unencoded form in the
   * original XML data (before transformation for use with wed) to its
   * encoded name.
   *
   * @param {string} name The unencoded name.
   * @returns {string} The encoded name.
   */
  function encodeAttrName(name) {
    return "data-wed-" + name.replace(/--(-+)/g, "---$1").replace(/:/, "---");
  }

  /**
   * Gets all the attributes of the node that were "original" attributes
   * in the XML document being edited, by opposition to those attributes
   * that exist only for HTML rendering.
   *
   * @param {Node} Node The node to process.
   * @returns {Object} An object whose keys are attribute names and
   * values are attribute values.
   */
  function getOriginalAttributes(node) {
    var original = Object.create(null);
    var attributes = node.attributes;
    for (var i = 0; i < attributes.length; ++i) {
      var attr = attributes[i];
      // It is a node we want.
      if (attr.localName.lastIndexOf("data-wed-", 0) === 0) {
        original[decodeAttrName(attr.localName)] = attr.value;
      }
    }
    return original;
  }


  var next_id = 0;

  /**
   * Generates a new generic element id. This id is guaranteed to be
   * unique for the current run of wed. The ids generated by this
   * function are meant to be eventually replaced by something more
   * permanent.
   *
   * @returns {string} An element id.
   */
  function newGenericID() {
    return "WED-ID-" + (++next_id);
  }

  /**
   * @param {Event} ev A DOM event.
   * @returns {boolean} <code>true</code> if Control, Alt or Meta were
   * held when the event was created. Otherwise, <code>false</code>.
   */
  function anySpecialKeyHeld(ev) {
    return ev.altKey || ev.ctrlKey || ev.metaKey;
  }

  /**
   * **This function is meant to be used in debugging.** It creates a
   * ``selenium_log`` object on ``window`` which is an array that
   * contains the series of ``obj`` passed to this function. Remember
   * that ultimately ``selenium_log`` is going to be serialized by
   * Selenium. So go easy on what you put in there and be aware that
   * Selenium may have bugs that prevent serialization of certain
   * objects.
   *
   * @param {...Object} obj Objects to log.
   */
  function seleniumLog() {
    if (!window.selenium_log) {
      window.selenium_log = [];
    }

    window.selenium_log.push.apply(window.selenium_log, arguments);
  }

  function _exceptionStackTrace(err) {
    try {
      throw err;
    }
    catch (e) {
      return e.stack;
    }
  }

  /**
   * **This function is meant to be used in debugging.** Gets a stack
   * trace. This is only as cross-platform as needed for the platforms
   * we support.
   *
   * Support for IE 9 is missing because it was designed by baboons.
   */
  function stackTrace() {
    var err = new Error();
    if (err.stack) {
      return err.stack;
    }

    // If the stack is not filled already (true of IE 10, 11) then
    // raise an exception to fill it.
    return _exceptionStackTrace(err);
  }

  /**
   * Convert a "pattern object" to a string that can be shown to the
   * user. This function is meant to be used for "complex" name patterns
   * that we may get from salve. Note that a "pattern object" is the
   * result of calling ``toObject()`` on the pattern. The goal of this
   * function is to convert the pattern object to a string that would be
   * intepretable by the end user.
   *
   * An explanation about how this handles namespaces and wildcard
   * patterns is in order. In a Relax NG schema the name pattern ``*``
   * in the compact notation is equivalent to ``<anyName/>`` in the
   * expanded notation. And ``foo:*`` is equivalent to ``<nsName
   * ns="uri_of_foo">`` where ``uri_of_foo`` is the URI that has been
   * assocated with ``foo`` in the compact schema. It would be nice if
   * the function here could reuse this notation, but we
   * cannot. Consider the case where an Relax NG schema in the compact
   * notation wants to declare a name pattern which means "any name in
   * the default namespace". In XML we express a name in the default
   * namespace currently in effect by simply not prefixing it with a
   * namespace name: whereas ``foo:bar`` is the ``bar`` element in the
   * ``foo`` namespace, ``bar`` is the ``bar`` element in the default
   * namespace. The pattern "any element in namespace foo" is
   * represented with ``foo:*``, however we cannot use ``*`` to mean
   * "any element in the default namespace", because ``*`` means "any
   * name in any namespace whatsoever". The compact notation forces the
   * author of the schema to use a prefix for the default namespace. And
   * because of this, ``*`` means unambiguously "any element in any
   * namespace".
   *
   * So the ``*`` in the Relax NG schema becomes ``*:*`` here. "Any
   * element in the default namespace" is represented by ``*``. Thus
   * ``foo:*`` and ``*`` can stand in the same relation to one another
   * as ``foo:bar`` and ``bar``.
   *
   * @param {object} obj The "pattern object" to convert.
   * @param {module:salve/name_resolver~NameResolver} resolver The resolver to
   * use to convert URIs to prefixes.
   * @returns {string} The string representing the pattern.
   */
  function convertPatternObj(obj, resolver) {
    // NameChoice
    if (obj.a && obj.b) {
      return "(" + convertPatternObj(obj.a, resolver) + ") or (" +
        convertPatternObj(obj.b, resolver) + ")";
    }

    var ret;

    // AnyName
    if (obj.pattern === "AnyName") {
      ret = "*:*";
    }
    else {
      // Name and NsName
      if (obj.ns === undefined) {
        throw new Error("unexpected undefined obj.ns");
      }

      if (obj.name !== undefined) {
        ret = resolver.unresolveName(obj.ns, obj.name);
        // Cannot unresolve, use the expanded name.
        if (ret === undefined) {
          ret = "{" + obj.ns + "}" + obj.name;
        }
      }
      else {
        var ns = resolver.prefixFromURI(obj.ns);
        // If ns is undefined, we cannot resolve the URI, so we
        // display the expanded name.
        if (ns === undefined) {
          ret = "{" + obj.ns + "}";
        }
        else {
          // An empty ns happens if the URI refers to the default
          // namespace.
          ret = (ns !== "") ? (ns + ":") : ns;
        }
        ret += "*";
      }
    }

    if (obj.except) {
      ret += " except (" + convertPatternObj(obj.except, resolver) + ")";
    }
    return ret;
  }

  exports.escapeCSSClass = escapeCSSClass;
  exports.getOriginalName = getOriginalName;
  exports.classFromOriginalName = classFromOriginalName;
  exports.decodeAttrName = decodeAttrName;
  exports.encodeAttrName = encodeAttrName;
  exports.getOriginalAttributes = getOriginalAttributes;
  exports.newGenericID = newGenericID;
  exports.anySpecialKeyHeld = anySpecialKeyHeld;
  exports.distFromDeltas = distFromDeltas;
  exports.distFromRect = distFromRect;
  exports.distsFromRect = distsFromRect;
  exports.seleniumLog = seleniumLog;
  exports.stackTrace = stackTrace;
  exports.convertPatternObj = convertPatternObj;
});

//  LocalWords:  Mangalam MPL Dubeau util CSS wed's unencoded
