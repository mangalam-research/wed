/**
 * @module modes/generic/generic
 * @desc The main module for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic*/
function (require, exports, module) {
'use strict';

var Mode = require("../../mode").Mode;
var NameResolver = require("salve").NameResolver;
var oop = require("../../oop");
var GenericDecorator = require("./generic_decorator").GenericDecorator;
var makeTagTr = require("./generic_tr").makeTagTr;
var $ = require("jquery");
var pubsub = require("../../lib/pubsub");
var object_check = require("../../object_check");

// So that it registers the pubsub topic for meta readiness.
require("./generic_meta");

/**
 * @classdesc This is the class that implements the generic
 * mode. This mode decorates all the elements of the file being
 * edited. On the basis of the schema used by wed for validation, it
 * allows the addition of the elements authorized by the schema.
 *
 * Recognized options:
 *
 * - ``meta``: this option can be a path (a string) pointing to a
 *   module that implements the meta object needed by the mode. Or it
 *   can be an object of the form:
 *
 *         {
 *             path: "path/to/the/meta",
 *             options: {
 *                 // Meta-specific options.
 *             }
 *         }
 *
 * - ``autoinsert``: whether or not to fill newly inserted elements as
 *   much as possible. If this option is true, then when inserting a
 *   new element, the mode will try to detect whether the element has
 *   any mandatory children and if so will add these children to the
 *   element. For instance, if ``foo`` is invalid without the child
 *   ``baz`` then when inserting ``foo`` in the document, the
 *   following structure would be inserted
 *   ``<foo><baz></baz></foo>``. This automatic insertion of children
 *   happens only in non-ambiguous cases. Taking the same example as
 *   before, if ``foo`` could contain ``a`` or ``b``, then the mode
 *   won't add any children. This option is ``true`` by default.
 *
 * @alias Mode
 * @constructor
 * @extends module:mode~Mode
 * @param {Object} options The options for the mode.
 */
function GenericMode (options) {
    Mode.apply(this, arguments);

    if (this.constructor === GenericMode) {
        // Set our metadata.
        this._wed_options.metadata = {
            name: "Generic",
            authors: ["Louis-Dominique Dubeau"],
            description:
            "This is a basic mode bundled with wed and which can, "+
                "and probably should be used as the base for other modes.",
            license: "MPL 2.0",
            copyright:
            "2013, 2014 Mangalam Research Center for Buddhist Languages"
        };
    }
    // else it is up to the derived class to set it.

    var template = {
        meta: true,
        autoinsert: false
    };

    var ret = object_check.check(template, this._options);

    if (this._options.autoinsert === undefined)
        this._options.autoinsert = true;

    var errors = [];
    var name;
    if (ret.missing) {
        ret.missing.forEach(function (name) {
            errors.push("missing option: " + name);
        });
    }

    if (ret.extra) {
        ret.extra.forEach(function (name) {
            errors.push("extra option: " + name);
        });
    }

    if (errors.length)
        throw new Error("incorrect options: " + errors.join(", "));
    this._wed_options.attributes = "edit";
    this._resolveOptions();
}

oop.inherit(GenericMode, Mode);

/**
 * Resolves the ``meta`` option from a module path to a real module.
 * @private
 */
GenericMode.prototype._resolveOptions = function () {
    var options = this._options;
    var resolved = $.extend(true, {}, options);
    if (options && options.meta) {
        var meta = resolved.meta;
        if (typeof meta === "string")
            meta = resolved.meta = {
                path: meta
            };
        else if (typeof meta.path !== "object") {
            require([meta.path], function (mod) {
                resolved.meta.path = mod;
                this._options = resolved;
                this._afterResolved();
            }.bind(this));
            return;
        }
    }

    this._afterResolved();
};

/**
 * Processes the resolved options.
 * @private
 */
GenericMode.prototype._afterResolved = function () {
    var MetaClass = this._options.meta.path.Meta;
    var onReady = function (msg, meta) {
        if (this._meta !== meta)
            return;

        this._resolver = new NameResolver();
        var mappings = this._meta.getNamespaceMappings();
        Object.keys(mappings).forEach(function (key) {
            this._resolver.definePrefix(key, mappings[key]);
        }.bind(this));

        this._ready();
    }.bind(this);

    pubsub.subscribe(pubsub.WED_MODES_GENERIC_META_READY, onReady);
    this._meta = new MetaClass(this._options.meta.options);
};

GenericMode.prototype.init = function (editor) {
    Mode.prototype.init.call(this, editor);
    this._tag_tr = makeTagTr(editor);
};


GenericMode.prototype.getAbsoluteResolver = function () {
    return this._resolver;
};

GenericMode.prototype.makeDecorator = function () {
    var obj = Object.create(GenericDecorator.prototype);
    var args = Array.prototype.slice.call(arguments);
    args = [this, this._meta, this._options].concat(args);
    GenericDecorator.apply(obj, args);
    return obj;
};

/**
 * Returns a short description for an element. The element should be
 * named according to the mappings reported by the resolve returned by
 * {@link module:mode~Mode#getAbsoluteResolver
 * getAbsoluteResolver}. The generic mode delegates the call to the
 * meta object it was asked to use.
 *
 * @param {string} name The name of the element.
 * @returns {string|null|undefined} The description. If the value
 * returned is ``undefined``, then the description is not available. If the
 * value returned is ``null``, the description has not been loaded
 * yet.
 */
GenericMode.prototype.shortDescriptionFor = function (name) {
    return this._meta.shortDescriptionFor(name);
};

/**
 * Returns a URL to the documentation for an element. The element
 * should be named according to the mappings reported by the resolve
 * returned by {@link module:mode~Mode#getAbsoluteResolver
 * getAbsoluteResolver}. The generic mode delegates the call to the
 * meta object it was asked to use.
 *
 * @param {string} name The name of the element.
 * @returns {string|null|undefined} The URL. If the value returned is
 * ``undefined``, then URL is not available. If the value returned is
 * ``null``, the URL has not been loaded yet.
 */
Mode.prototype.documentationLinkFor = function (name) {
    return this._meta.documentationLinkFor(name);
};

/**
 * The generic mode's implementation merely returns what it has stored
 * in its transformation registry.
 */
Mode.prototype.getContextualActions = function (type, tag, container, offset) {
    if (!(type instanceof Array))
        type = [type];

    var ret = [];
    for(var ix = 0; ix < type.length; ix++) {
        var val = this._tag_tr[type[ix]];
        if (val !== undefined)
            ret.push(val);
    }
    return ret;
};

exports.Mode = GenericMode;

});

//  LocalWords:  gui jquery Mangalam MPL Dubeau
