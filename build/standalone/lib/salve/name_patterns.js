/**
 * @module name_patterns
 * @desc Classes that model RNG patterns that pertain to names.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2015 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:name_patterns */ function (require, exports, module) {
'use strict';

var oop = require("./oop");

/**
 * @classdesc Base class for all name patterns.
 *
 * @constructor
 *
 * @param {string} path The XML path of the element that corresponds
 * to this object in the Relax NG schema from which this object was
 * contructed.
 */
function Base(path) {
    this.path = path;
}

/**
 * Tests whether the pattern matches a name.
 *
 * @param {string} ns The namespace to match.
 * @param {string} name The name to match.
 * @returns {boolean} ``true`` if there is a match.
 */
Base.prototype.match = function (ns, name) {
    throw new Error("subclasses must implement this method.");
};

/**
 * Tests whether the pattern matches a name and this match is due only
 * to a wildcard match (``nsName`` or ``anyName``).
 *
 * @param {string} ns The namespace to match.
 * @param {string} name The name to match.
 * @returns {boolean} ``true`` if there is a match **and** the match is due
 * only to a wildcard match. If there is a choice between matching with
 * a wildcard and matching with a regular ``name`` pattern, this will return
 * false because of the ``name`` pattern.
 */
Base.prototype.wildcardMatch = function (ns, name) {
    throw new Error("subclasses must implement this method.");
};

/**
 * Determines whether a pattern is simple or not. A pattern is deemed
 * simple if it does not use ``<except>``, ``<anyName>`` or
 * ``<NsName>``. Put in practical terms, non-simple patterns cannot
 * generally be presented as a list of choices to the user. In most
 * cases, the appropriate input from the user should be obtained by
 * presending an input field in which the user can type the namespace
 * and name of the entity to be named and the GUI reports whether the
 * name is allowed or not by the schema.
 *
 * @returns {boolean} ``true`` if the pattern is simple.
 */
Base.prototype.simple = function () {
    throw new Error("subclasses must implement this method.");
};


/**
 * Gets the list of namespaces in the used in the pattern. An
 * ``::except`` entry indicates that there are exceptions in the
 * pattern. A ``*`` entry indicates that any namespace is allowed.
 *
 * This method should be used by client code to help determine how to
 * prompt the user for a namespace. If the return value is a list
 * without ``::except`` or ``*``, the client code knows there is a
 * finite list of namespaces expected, and what the possible values
 * are. So it could present the user with a choice from the set. If
 * ``::except`` or ``*`` appears in the list, then a different
 * strategy must be used.
 *
 * @returns {Array.<string>} The list of namespaces.
 */
Base.prototype.getNamespaces = function () {
    var namespaces = Object.create(null);
    this._recordNamespaces(namespaces);
    return Object.keys(namespaces);
};


Base.prototype._recordNamespaces = function (namespaces) {
    throw new Error("subclasses must implement this method.");
};

/**
 * Represent the name pattern as a plain object. The object returned
 * contains a ``pattern`` field which has the name of the JavaScript
 * class that was used to create the object. Other fields are present,
 * depending on the actual needs of the class.
 *
 * @returns {Object} The object representing the instance.
 */
Base.prototype.toObject = function () {
    throw new Error("subclasses must implement this method.");
};

/**
 * Alias of {@link module:name_patterns~Base#toObject
 * toObject}.
 *
 * ``toJSON`` is a misnomer, as the data returned is not JSON but a
 * JavaScript object. This method exists to that ``JSON.stringify``
 * can use it.
 */
Base.prototype.toJSON = function () {
    return this.toObject();
};

/**
 * Returns an array of {@link module:name_patterns~Name Name} objects
 * which is a list of all the possible names that this pattern allows.
 *
 * @returns {Array.<module:name_patterns~Name>|null} An array of
 * names. The value ``null`` is returned if the pattern is not simple.
 */
Base.prototype.toArray = function () {
    throw new Error("subclasses must implement this method.");
};

/**
 * Stringify the pattern to a JSON string.
 *
 * @returns {string} The stringified instance.
 */
Base.prototype.toString = function () {
    return JSON.stringify(this);
};

/**
 * @classdesc Models the Relax NG ``<name>`` element.
 *
 * @constructor
 *
 * @extends module:name_patterns~Base
 *
 * @param {string} path See parent class.
 * @param {string} ns The namespace URI for this name. Corresponds to
 * the ``ns`` attribute in the simplified Relax NG syntax.
 * @param {string} name The name. Corresponds to the content of ``<name>`` in
 * the simplified Relax NG syntax.
 */
function Name(path, ns, name) {
    Base.call(this, path);
    this.ns = ns;
    this.name = name;
}

oop.inherit(Name, Base);

Name.prototype.match = function (ns, name) {
    return this.ns === ns && this.name === name;
};

Name.prototype.wildcardMatch = function (ns, name) {
    return false; // This is not a wildcard.
};

Name.prototype.toObject = function () {
    return {
        ns: this.ns,
        name: this.name
    };
};

Name.prototype.simple = function () {
    return true;
};

Name.prototype.toArray = function () {
    return [this];
};

Name.prototype._recordNamespaces = function (namespaces) {
    namespaces[this.ns] = 1;
};


/**
 * @classdesc Models the Relax NG ``<choice>`` element when it appears
 * in a name class.
 *
 * @constructor
 *
 * @extends module:name_patterns~Base
 *
 * @param {string} path See parent class.
 * @param {Array.<module:name_patterns~Base>} pats An array of length 2
 * which contains the two choices allowed by this object.
 */
function NameChoice(path, pats) {
    Base.call(this, path);
    this.a = pats[0];
    this.b = pats[1];
}

oop.inherit(NameChoice, Base);

NameChoice.prototype.match = function (ns, name) {
    return this.a.match(ns, name) || this.b.match(ns, name);
};

NameChoice.prototype.wildcardMatch = function (ns, name) {
    return this.a.wildcardMatch(ns, name) || this.b.wildcardMatch(ns, name);
};

NameChoice.prototype.toObject = function () {
    return {
        a: this.a.toObject(),
        b: this.b.toObject()
    };
};

NameChoice.prototype.simple = function () {
    return this.a.simple() && this.b.simple();
};

NameChoice.prototype.toArray = function () {
    var a_arr = this.a.toArray();

    if (!a_arr)
        return null;

    var b_arr = this.b.toArray();
    if (!b_arr)
        return null;

    return a_arr.concat(b_arr);
};



NameChoice.prototype._recordNamespaces = function (namespaces) {
    this.a._recordNamespaces(namespaces);
    this.b._recordNamespaces(namespaces);
};

/**
 * @classdesc Models the Relax NG ``<nsName>`` element.
 *
 * @constructor
 *
 * @extends module:name_patterns~Base
 *
 * @param {string} path See parent class.
 * @param {string} ns The namespace URI for this name. Corresponds to
 * the ``ns`` attribute in the simplified Relax NG syntax.
 * @param {module:name_patterns~Base} [except] Corresponds to an
 * ``<except>`` element appearing as a child of the ``<nsName>``
 * element in the Relax NG schema.
 */
function NsName(path, ns, except) {
    Base.call(this, path);
    this.ns = ns;
    this.except = except;
}

oop.inherit(NsName, Base);

NsName.prototype.match = function (ns, name) {
    return this.ns === ns &&
        !(this.except && this.except.match(ns, name));
};

NsName.prototype.wildcardMatch = function (ns, name) {
    return this.match(ns, name);
};

NsName.prototype.toObject = function () {
    var ret = {
        ns: this.ns
    };
    if (this.except)
        ret.except = this.except.toObject();
    return ret;
};

NsName.prototype.simple = function () {
    return false;
};

NsName.prototype.toArray = function () {
    return null;
};

NsName.prototype._recordNamespaces = function (namespaces) {
    namespaces[this.ns] = 1;
    if (this.except)
        namespaces['::except'] = 1;
};


/**
 * @classdesc Models the Relax NG ``<anyName>`` element.
 *
 * @constructor
 *
 * @extends module:name_patterns~Base
 *
 * @param {string} path See parent class.
 * @param {module:name_patterns~Base} [except] Corresponds to an
 * ``<except>`` element appearing as a child of the ``<anyName>``
 * element in the Relax NG schema.
 */
function AnyName(path, except) {
    Base.call(this, path);
    this.except = except;
}

oop.inherit(AnyName, Base);

AnyName.prototype.match = function (ns, name) {
    return !this.except || !this.except.match(ns, name);
};

AnyName.prototype.wildcardMatch = function (ns, name) {
    return this.match(ns, name);
};

AnyName.prototype.toObject = function () {
    var ret = {
        pattern: "AnyName"
    };
    if (this.except)
        ret.except = this.except.toObject();
    return ret;
};

AnyName.prototype.simple = function () {
    return false;
};

AnyName.prototype.toArray = function () {
    return null;
};

AnyName.prototype._recordNamespaces = function (namespaces) {
    namespaces['*'] = 1;
    if (this.except)
        namespaces['::except'] = 1;
};

exports.Name = Name;
exports.NameChoice = NameChoice;
exports.NsName = NsName;
exports.AnyName = AnyName;


});
