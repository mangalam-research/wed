/**
 * @module name_resolver
 * @desc Implements a name resolver for handling namespace changes in XML.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:name_resolver */function (require, exports, module) {
"use strict";

var validate = require("./validate");

// Both defined at:
// http://www.w3.org/TR/REC-xml-names/#ns-decl
var XML1_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

/**
 * @classdesc A name resolver for handling namespace changes in
 * XML. This name resolver maintains mappings from namespace prefix to
 * namespace URI.
 *
 * @constructor
 */
function NameResolver() {
    this.id = "N" + this.__newID();
    this._context_stack = [];

    // Create a default context.
    this.enterContext();

    // Both namespaces defined at:
    // http://www.w3.org/TR/REC-xml-names/#ns-decl
    // Skip definePrefix for these initial values.
    this._context_stack[0].forward.xml = XML1_NAMESPACE;
    this._context_stack[0].backwards[XML1_NAMESPACE] = ["xml"];
    this._context_stack[0].forward.xmlns = XMLNS_NAMESPACE;
    this._context_stack[0].backwards[XMLNS_NAMESPACE] = ["xmlns"];
}

/**
 * The next id to associate to the next NameResolver object to be
 * created. This is used so that {@link module:name_resolver~NameResolver#hash
 * hash} can return unique values.
 *
 * @private
 */
NameResolver.__id=0;

/**
 * Gets a new Pattern id.
 *
 * @private
 * @returns {integer} The new id.
 */
NameResolver.prototype.__newID = function () {
    return NameResolver.__id++;
};

/**
 * <p>This method is mainly used to be able to use NameResolver objects in a
 * {@link module:hashstructs~HashSet HashSet} or a {@link
 * module:hashstructs~HashMap HashMap}.</p>
 *
 * <p>Returns a hash guaranteed to be unique to this object. There are
 * some limitations. First, if this module is instantiated twice, the
 * objects created by the two instances cannot mix without violating
 * the uniqueness guarantee. Second, the hash is a monotonically
 * increasing counter, so when it reaches beyond the maximum integer
 * that the JavaScript vm can handle, things go kaboom.</p>
 *
 * @returns {integer} A number unique to this object.
 */
NameResolver.prototype.hash = function () { return this.id; };

/**
 * Makes a deep copy.
 *
 * @returns {module:name_resolver~NameResolver} A deep copy of the
 * resolver.
 */
NameResolver.prototype.clone = function() {
    var ret = new NameResolver();
    ret._context_stack = this._context_stack.slice();
    return ret;
};



/**
 * Defines a (prefix, URI) mapping.
 *
 * @param {string} prefix The namespace prefix to associate with the URI.
 * @param {string} uri The namespace URI associated with the prefix.
 */
NameResolver.prototype.definePrefix = function (prefix, uri) {
    // http://www.w3.org/TR/REC-xml-names/#ns-decl
    if (prefix === "xmlns")
        throw new Error("trying to define 'xmlns' but the XML Namespaces " +
                        "standard stipulates that 'xmlns' cannot be declared " +
                        "(= \"defined\")");

    if (prefix === "xml" && uri !== XML1_NAMESPACE)
        throw new Error("trying to define 'xml' to an incorrect URI");

    this._context_stack[0].forward[prefix] = uri;

    var prefixes = this._context_stack[0].backwards[uri];
    if (prefixes === undefined)
        prefixes = this._context_stack[0].backwards[uri] = [];

    // This ensure that the default namespace is given priority
    // when unresolving names.
    if (prefix === "")
        prefixes.unshift("");
    else
        prefixes.push(prefix);
};

/**
 * <p>This method is called to indicate the start of a new
 * context. Contexts enable this class to support namespace
 * redeclarations. In XML, each start tag can potentially redefine a
 * prefix that was already defined by an ancestor. When using this
 * class, such redefinition must appear in a new context, otherwise it
 * would merely overwrite the old definition.</p>
 *
 * <p>At creation, a <code>NameResolver</code> has a default context
 * already created. There is no need to create it and it is not
 * possible to leave it.</p>
 */
NameResolver.prototype.enterContext = function () {
    this._context_stack.unshift(Object.create(null));
    this._context_stack[0].forward = Object.create(null);
    this._context_stack[0].backwards = Object.create(null);
};

/**
 * This method is called to indicate the end of a context. Whatever
 * context was in effect when the current context ends become
 * effective.
 *
 * @throws {Error} If this method is called when there is no context
 * created by {@link module:name_resolver~NameResolver.enterContext
 * enterContext}.
 */
NameResolver.prototype.leaveContext = function () {
    if (this._context_stack.length > 1)
        this._context_stack.shift();
    else
        throw new Error("trying to leave the default context");
};

/**
 * Resolves a qualified name to an expanded name. A qualified name is
 * an XML name optionally prefixed by a namespace prefix. For
 * instance, in <code>&lt;html xml:lang="en"></code>, "html" is a name
 * without a prefix, and "xml:lang" is a name with the "xml"
 * prefix. An expanded name is a (URI, name) pair.
 *
 * @param {string} name The name to resolve.
 * @param {boolean} attribute Whether this name appears as an attribute.
 * @throws {Error} If the name is malformed. For instance, a name with
 * two colons would be malformed.
 * @returns {module:validate~EName|undefined} The expanded name, or
 * <code>undefined</code> if the name cannot be resolved.
 */
NameResolver.prototype.resolveName = function (name, attribute) {
    if (attribute === undefined)
        attribute = false;

    var parts = name.split(":");

    if (parts.length == 1) { // If there is no prefix
        if (attribute) // Attribute in undefined namespace
            return new validate.EName("", name);

        // We are searching for the default namespace currently in
        // effect.
        parts = [ "", name ];
    }

    if (parts.length > 2)
        throw new Error("invalid name passed to resolveName");

    // Search through the contexts
    var uri;
    for(var c_ix = 0, ctx;
        (uri === undefined) &&
        (ctx = this._context_stack[c_ix]) !== undefined; ++c_ix)
        uri = ctx.forward[parts[0]];

    if (uri === undefined)
        return (parts[0] === "") ? new validate.EName("", parts[1]): undefined;

    return new validate.EName(uri, parts[1]);
};

/**
 * <p>Unresolves an expanded name to a qualified name. An expanded name
 * is a (URI, name) pair. Note that if we execute:
 *
 * <pre>
 *   var name_resolver = new NameResolver();
 *   var ename = name_resolver.resolveName(qname);
 *   var qname2 = name_resolver.unresolveName(ename.ns, ename.name);
 * </pre>
 *
 * then <code>qname === qname2</code> is not necessarily true. This
 * would happen if two prefixes map to the same URI. In such case the
 * prefix provided in the return value is arbitrarily chosen.</p>
 *
 * @param {string} uri The URI part of the expanded name. An empty
 * string is valid, and basically means "no namespace". This occurrs
 * for unprefixed attributes but could also happen if the default
 * namespace is undeclared.
 * @param {string} name The name part.
 * @returns {string|undefined} The qualified name that corresponds to
 * the expanded name, or <code>undefined</code> if it cannot be resolved.
 */
NameResolver.prototype.unresolveName = function (uri, name) {
    if (uri === "")
        return name;

    // Search through the contexts
    var prefixes;
    for(var c_ix = 0, ctx;
        (prefixes === undefined) &&
        (ctx = this._context_stack[c_ix]) !== undefined; ++c_ix)
        prefixes = ctx.backwards[uri];

    if (prefixes === undefined)
        return undefined;

    var pre = prefixes[0];

    return (pre !== "") ? (pre + ":" + name) : name;

};

/**
 * Returns a prefix that, in the current context, is mapped to the URI
 * specified. Note that this function will return the first prefix
 * that satisfies the requirement, starting from the innermost
 * context.
 *
 * @param {string} uri A URI for which to get a prefix.
 * @returns {string|undefined} A prefix that maps to this
 * URI. Undefined if there is no prefix available.
 */
NameResolver.prototype.prefixFromURI = function (uri) {
    var prefixes;
    for(var c_ix = 0, ctx;
        (prefixes === undefined) &&
        (ctx = this._context_stack[c_ix]) !== undefined; ++c_ix)
        prefixes = ctx.backwards[uri];

    if (prefixes === undefined)
        return undefined;

    var pre = prefixes[0];
    return pre;
};

exports.NameResolver = NameResolver;
exports.XML1_NAMESPACE = XML1_NAMESPACE;

});

// LocalWords:  namespace unresolving MPL xml resolveName Dubeau URI
// LocalWords:  Mangalam LocalWords NameResolver lt html lang ename
// LocalWords:  qname redeclarations Unresolves
