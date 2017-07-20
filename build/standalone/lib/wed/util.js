define(["require", "exports", "module", "bluebird"], function (require, exports, module, Promise) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Calculates the distance on the basis of two deltas. This would typically be
     * called with the difference of X coordinates and the difference of Y
     * coordinates.
     *
     * @param delta1 The first delta.
     *
     * @param delta2 The second delta.
     *
     * @returns The distance.
     */
    function distFromDeltas(delta1, delta2) {
        // eslint-disable-next-line no-mixed-operators
        return Math.sqrt(delta1 * delta1 + delta2 * delta2);
    }
    exports.distFromDeltas = distFromDeltas;
    /**
     * Measures the distance of a point from a rectangle. If the point is in the
     * rectangle or touches it, the distance is 0. In the nomenclature below, left
     * and right are on the X axis and top and bottom on the Y axis.
     *
     * @param x X coordinate of the point.
     *
     * @param y Y coordinate of the point.
     *
     * @param left Left coordinate of the rectangle.
     *
     * @param top Top coordinate of the rectangle.
     *
     * @param right Right coordinate of the rectangle.
     *
     * @param bottom Bottom coordinate of the rectangle.
     *
     * @returns The distance.
     */
    function distFromRect(x, y, left, top, right, bottom) {
        var topDelta = y - top;
        var leftDelta = x - left;
        var bottomDelta = y - bottom;
        var rightDelta = x - right;
        var above = topDelta < 0;
        var below = bottomDelta > 0;
        // Neologism used to avoid conflict with left above.
        var lefter = leftDelta < 0;
        var righter = rightDelta > 0;
        /* eslint-disable no-nested-ternary */
        var deltaX = lefter ? leftDelta : (righter ? rightDelta : 0);
        var deltaY = above ? topDelta : (below ? bottomDelta : 0);
        /* eslint-enable */
        return distFromDeltas(deltaX, deltaY);
    }
    exports.distFromRect = distFromRect;
    /**
     * Measures the absolute horizontal and vertical distances of a point from a
     * rectangle. If the point is in the rectangle or touches it, the distance is
     * 0. In the nomenclature below, left and right are on the X axis and top and
     * bottom on the Y axis.
     *
     * @param x X coordinate of the point.
     *
     * @param y Y coordinate of the point.
     *
     * @param left Left coordinate of the rectangle.
     *
     * @param top Top coordinate of the rectangle.
     *
     * @param right Right coordinate of the rectangle.
     *
     * @param bottom Bottom coordinate of the rectangle.
     *
     * @returns The distance.
     */
    function distsFromRect(x, y, left, top, right, bottom) {
        var topDelta = y - top;
        var leftDelta = x - left;
        var bottomDelta = y - bottom;
        var rightDelta = x - right;
        var above = topDelta < 0;
        var below = bottomDelta > 0;
        // Neologism used to avoid conflict with left above.
        var lefter = leftDelta < 0;
        var righter = rightDelta > 0;
        /* eslint-disable no-nested-ternary */
        var deltaX = lefter ? leftDelta : (righter ? rightDelta : 0);
        var deltaY = above ? topDelta : (below ? bottomDelta : 0);
        /* eslint-enable */
        return { x: Math.abs(deltaX), y: Math.abs(deltaY) };
    }
    exports.distsFromRect = distsFromRect;
    /**
     * Escape character in CSS class that could cause trouble in CSS
     * selectors. **This is not a general solution.** This function supports only
     * what wed uses.
     *
     * @param cls The class
     *
     * @returns The escaped class.
     */
    function escapeCSSClass(cls) {
        return cls.replace(/:/g, "\\:");
    }
    exports.escapeCSSClass = escapeCSSClass;
    /**
     * Get the original element name of a node created for wed's data tree.
     *
     * @param el The element whose name we want.
     *
     * @returns The name.
     */
    function getOriginalName(el) {
        // The original name is the first class name of the element that was created.
        return el.classList[0];
    }
    exports.getOriginalName = getOriginalName;
    /**
     * Makes a class string appropriate for a node in wed's data tree.
     *
     * @param name The original element name.
     *
     * @returns The class string.
     */
    function classFromOriginalName(name) {
        // Special case if we want to match all
        if (name === "*") {
            return "._real";
        }
        return "." + escapeCSSClass(name) + "._real";
    }
    exports.classFromOriginalName = classFromOriginalName;
    /**
     * Transforms an attribute name from wed's data tree to the original attribute
     * name before the data was transformed for use with wed.
     *
     * @param name The encoded name.
     *
     * @returns The decoded name.
     */
    function decodeAttrName(name) {
        // The slice skips "data-wed-"
        return name.slice(9).replace(/---/, ":").replace(/---(-+)/g, "--$1");
    }
    exports.decodeAttrName = decodeAttrName;
    /**
     * Transforms an attribute name from its unencoded form in the
     * original XML data (before transformation for use with wed) to its
     * encoded name.
     *
     * @param name The unencoded name.
     *
     * @returns The encoded name.
     */
    function encodeAttrName(name) {
        return "data-wed-" + name.replace(/--(-+)/g, "---$1").replace(/:/, "---");
    }
    exports.encodeAttrName = encodeAttrName;
    /**
     * Gets all the attributes of the node that were "original" attributes in the
     * XML document being edited, by opposition to those attributes that exist only
     * for HTML rendering.
     *
     * @param node The node to process.
     *
     * @returns An object whose keys are attribute names and values are attribute
     * values.
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
    exports.getOriginalAttributes = getOriginalAttributes;
    var nextID = 0;
    /**
     * Generates a new generic element id. This id is guaranteed to be unique for
     * the current run of wed. The ids generated by this function are meant to be
     * eventually replaced by something more permanent.
     *
     * @returns An element id.
     */
    function newGenericID() {
        return "WED-ID-" + ++nextID;
    }
    exports.newGenericID = newGenericID;
    /**
     * @param ev A DOM event.
     *
     * @returns ``true`` if Control, Alt or Meta were held when the event was
     * created. Otherwise, ``false``.
     */
    function anySpecialKeyHeld(ev) {
        var anyEv = ev;
        return anyEv.altKey || anyEv.ctrlKey || anyEv.metaKey;
    }
    exports.anySpecialKeyHeld = anySpecialKeyHeld;
    /**
     * **This function is meant to be used in debugging.** It creates a
     * ``selenium_log`` object on ``window`` which is an array that contains the
     * series of ``obj`` passed to this function. Remember that ultimately
     * ``selenium_log`` is going to be serialized by Selenium. So go easy on what
     * you put in there and be aware that Selenium may have bugs that prevent
     * serialization of certain objects.
     *
     * @param args Objects to log.
     */
    /* tslint:disable:no-any no-unsafe-any */
    function seleniumLog() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var w = window;
        if (w.selenium_log === undefined) {
            w.selenium_log = [];
        }
        w.selenium_log.push.apply(w.selenium_log, args);
    }
    exports.seleniumLog = seleniumLog;
    function _exceptionStackTrace(err) {
        try {
            throw err;
        }
        catch (e) {
            return e.stack;
        }
    }
    /* tslint:enable */
    /**
     * **This function is meant to be used in debugging.** Gets a stack trace. This
     * is only as cross-platform as needed for the platforms we support.
     *
     * Support for IE 9 is missing because it was designed by baboons.
     */
    function stackTrace() {
        var err = new Error();
        if (err.stack != null) {
            return err.stack;
        }
        // If the stack is not filled already (true of IE 10, 11) then raise an
        // exception to fill it.
        return _exceptionStackTrace(err);
    }
    exports.stackTrace = stackTrace;
    /**
     * Convert a "pattern object" to a string that can be shown to the user. This
     * function is meant to be used for "complex" name patterns that we may get from
     * salve. Note that a "pattern object" is the result of calling ``toObject()``
     * on the pattern. The goal of this function is to convert the pattern object to
     * a string that would be intepretable by the end user.
     *
     * An explanation about how this handles namespaces and wildcard patterns is in
     * order. In a Relax NG schema the name pattern ``*`` in the compact notation is
     * equivalent to ``<anyName/>`` in the expanded notation. And ``foo:*`` is
     * equivalent to ``<nsName ns="uri_of_foo">`` where ``uri_of_foo`` is the URI
     * that has been assocated with ``foo`` in the compact schema. It would be nice
     * if the function here could reuse this notation, but we cannot. Consider the
     * case where an Relax NG schema in the compact notation wants to declare a name
     * pattern which means "any name in the default namespace". In XML we express a
     * name in the default namespace currently in effect by simply not prefixing it
     * with a namespace name: whereas ``foo:bar`` is the ``bar`` element in the
     * ``foo`` namespace, ``bar`` is the ``bar`` element in the default
     * namespace. The pattern "any element in namespace foo" is represented with
     * ``foo:*``, however we cannot use ``*`` to mean "any element in the default
     * namespace", because ``*`` means "any name in any namespace whatsoever". The
     * compact notation forces the author of the schema to use a prefix for the
     * default namespace. And because of this, ``*`` means unambiguously "any
     * element in any namespace".
     *
     * So the ``*`` in the Relax NG schema becomes ``*:*`` here. "Any element in the
     * default namespace" is represented by ``*``. Thus ``foo:*`` and ``*`` can
     * stand in the same relation to one another as ``foo:bar`` and ``bar``.
     *
     * @param obj The "pattern object" to convert.
     * @param resolver The resolver to use to convert URIs to prefixes.
     * @returns The string representing the pattern.
     */
    /* tslint:disable:no-any no-unsafe-any */
    function convertPatternObj(obj, resolver) {
        // NameChoice
        if (obj.a != null && obj.b != null) {
            return "(" + convertPatternObj(obj.a, resolver) + ") or (" + convertPatternObj(obj.b, resolver) + ")";
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
        if (obj.except != null) {
            ret += " except (" + convertPatternObj(obj.except, resolver) + ")";
        }
        return ret;
    }
    exports.convertPatternObj = convertPatternObj;
    /* tslint:enable */
    function readFile(file) {
        var reader = new FileReader();
        return new Promise(function (resolve, reject) {
            reader.onload = function () {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    exports.readFile = readFile;
    /**
     * This is required to work around a problem when extending built-in classes
     * like ``Error``. Some of the constructors for these classes return a value
     * from the constructor, which is then picked up by the constructors generated
     * by TypeScript (same with ES6 code transpiled through Babel), and this messes
     * up the inheritance chain.
     *
     * See https://github.com/Microsoft/TypeScript/issues/12123.
     */
    // tslint:disable:no-any
    function fixPrototype(obj, parent) {
        var oldProto = Object.getPrototypeOf !== undefined ?
            Object.getPrototypeOf(obj) : obj.__proto__;
        if (oldProto !== parent) {
            if (Object.setPrototypeOf !== undefined) {
                Object.setPrototypeOf(obj, parent.prototype);
            }
            else {
                obj.__proto__ = parent.prototype;
            }
        }
    }
    exports.fixPrototype = fixPrototype;
});
// tslint:enable:no-any
//  LocalWords:  Mangalam MPL Dubeau util CSS wed's unencoded

//# sourceMappingURL=util.js.map
