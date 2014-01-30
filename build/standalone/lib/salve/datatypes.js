/**
 * @module datatypes
 * @desc Classes that model datatypes used in RNG schemas.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:datatypes */ function (require, exports, module) {
'use strict';

var builtin = require("./datatypes/builtin").builtin;
var xmlschema = require("./datatypes/xmlschema").xmlschema;
var errors = require("./datatypes/errors");

/**
 * @classdesc This class does not exist as a JavaScript entity. This
 * is a pseudo-class describing the structure that all datatypes
 * share.
 *
 * @name module:datatypes~Datatype
 * @class
 *
 * @property {boolean} needs_context ``true`` if this builtin type
 * needs a context, ``false`` if not.
 * @property {RegExp} regexp A javascript regular expression which can
 * be used to partially validate a value. This regular expression is
 * such that if it does *not* match a value, then the value is
 * invalid. If it does match the value, then {@link
 * module:datatypes~Datatype#disallows disallows} must be called to
 * determine whether the value is actually allowed or not.
 */

/**
 * Parses the parameters.
 *
 * @method
 * @name module:datatypes~Datatype#parseParams
 * @param {string} location A string indicating the location of the
 * &ltdata> element for which we are parsing parameters.
 * @param {Array.<{name: string, value: string}>} params The parameters.
 * @returns {Object} The parsed parameters, to be used with the other
 * methods on this class. Data types are free to change the format of
 * this object at any time.
 * @throws {module:datatypes/errors~ParameterParsingError} If the
 * parameters are erroneous.
 */

/**
 * Parses a value. Checks that the value is allowed by the type and
 * converts it to an internal representation.
 *
 * @method
 * @name module:datatypes~Datatype#parseValue
 * @returns {Object} The parsed value, to be used with the other
 * methods on this class. Data types are free to change the format of
 * this object at any time.
 * @param {module:datatypes~Context} context The context of the value.
 * @throws {module:datatypes/errors~ValueValidationError} If the value
 * is erroneous.
 */

/**
 * Checks whether two strings are equal according to the type.
 *
 * @method
 * @name module:datatypes~Datatype#equal
 * @param {string} value The string from the XML document to be validated.
 * @param {Object} schema_value The **parsed** value from the schema.
 * @param {module:datatypes~Context} context The context in the
 * document, if needed.
 * @returns {boolean} ``true`` if equal, ``false`` if not.
 */

/**
 * Checks whether the type disallows a certain string.
 *
 * @method
 * @name module:datatypes~Datatype#disallows
 * @param {string} value The string from the XML document to be validated.
 * @param {Object} params The type parameters. These must be
 * **parsed** already.
 * @param {module:datatypes~Context} context The context in the
 * document, if needed.
 * @returns {boolean} ``true`` if allowed, ``false`` if not.
 */

/**
 * @typedef {Object} module:datatypes~TypeLibrary
 *
 * @property {string} uri The uri of the type library.
 * @property {Array.<string, module:datatypes~Datatype>} types A
 * map of builtin type names to builtin types.
 */

/**
 * A context as defined by the Relax NG specification, minus the base
 * URI. (Why no base URI? Because none of the types implemented by
 * salve require it. So there is no point in keeping track of it.)
 *
 * @typedef {Object} module:datatypes~Context
 * @property {module:name_resolver~NameResolver} resolver A name
 * resolver that can resolve namespace prefixes to namespace URI.
 */

/**
 * @classdesc The registry of types.
 * @class
 */
function Registry() {
    this.libraries = Object.create(null);
}

/**
 * Adds a library to the registry.
 *
 * @param {module:datatypes~TypeLibrary} library The library to add to
 * the registry.
 * @throws {Error} If the URI is already registered.
 */
Registry.prototype.add = function (library) {
    var uri = library.uri;
    if (uri in this.libraries)
        throw new Error("URI clash: " + uri);
    this.libraries[uri] = library;
};

/**
 * Searches for a URI in the library.
 *
 * @param {string} uri The URI to search for.
 * @returns {module:datatypes~TypeLibrary|undefined} The library that
 * corresponds to the URI or undefined if no such library exists.
 */
Registry.prototype.find = function (uri) {
    return this.libraries[uri];
};

/**
 * Gets the library corresponding to a URI.
 *
 * @param {string} uri The URI.
 * @returns {module:datatypes~TypeLibrary} The library that
 * corresponds to the URI.
 * @throws {Error} If the library does not exist.
 */
Registry.prototype.get = function (uri) {
    var ret = this.find(uri);
    if (!ret)
        throw new Error("can't get library with URI: " + uri);
    return ret;
};

var registry = new Registry();
registry.add(builtin);
registry.add(xmlschema);

exports.registry = registry;
exports.ParameterParsingError = errors.ParameterParsingError;
exports.ValueValidationError = errors.ValueValidationError;
exports.ValueError = errors.ValueError;


});
