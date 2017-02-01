/**
 * @module modes/generic/generic_meta
 * @desc Meta-information regarding the schema.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic_meta */
function (require, exports, module) {
'use strict';

var $ = require("jquery");
var log = require("../../log");
var pubsub = require("../../lib/pubsub");

/**
 * @event module:lib/pubsub#WED_MODES_GENERIC_META_READY
 */
var WED_MODES_GENERIC_META_READY =
        pubsub.makeTopic("wed.modes.generic.meta.ready");

/**
 * @classdesc Meta-information for the generic mode. This is
 * information that cannot be simply derived from the schema.
 *
 * Objects of this class take the following options:
 *
 * + ``metadata``: a URL to a JSON file that contains metadata that
 * this meta should read.
 *
 * It is illegal to use the meta before it has emitted {@link
 * module:lib/pubsub#event:WED_MODES_GENERIC_META_READY
 * WED_MODES_GENERIC_META_READY}.
 *
 * @constructor
 * @param {Object} options The options to pass to the Meta.
 *
 * @emits module:lib/pubsub#WED_MODES_GENERIC_META_READY
 */
function Meta (options) {
    this._options = options || {};
    this._desc_map = undefined;
    this._namespace_mappings = undefined;
    this._resolveOptions();
}

/**
 * This method is meant to be called by objects of this class to
 * signal that they are ready to be used.
 * @emits module:lib/pubsub#WED_MODES_GENERIC_META_READY
 */
Meta.prototype._ready = function () {
    pubsub.publish(WED_MODES_GENERIC_META_READY, this);
};

/**
 * Resolves the metadata option from a URL to actual data.
 * @private
 */
Meta.prototype._resolveOptions = function () {
    var options = this._options;
    var resolved = $.extend(true, {}, options);
    if (options && options.metadata) {
        $.ajax({
            type: "GET",
            url: options.metadata,
            success: log.wrap(function (data) {
                resolved.metadata = data;
                this._options = resolved;
                this._afterResolved();
            }.bind(this)),
            dataType: "json"
        }).fail(log.wrap(function (jqXHR, textStatus, errorThrown) {
            throw new Error("cannot load metadata; status: " + textStatus +
                            " error thrown: " + errorThrown);
        }));
    }
    else
        this._afterResolved();
};

/**
 * This method acts upon the resolved metadata.
 * @private
 */
Meta.prototype._afterResolved = function () {
    this._metadata = this._options.metadata;

    if (this._metadata) {
        if (this._metadata.version != 1)
            throw new Error("unexpected version number: " +
                            this._metadata.version);

        this._namespace_mappings = this._metadata.namespaces;
        if ("xml" in this._namespace_mappings)
            throw new Error("xml mapping already defined");

        this._namespace_mappings.xml =
            "http://www.w3.org/XML/1998/namespace";

        this._reverse_mapping = Object.create(null);
        for(var prefix in this._namespace_mappings) {
            var ns = this._namespace_mappings[prefix];
            // If prefix foo resolves to http://bar and bar resolves
            // to the same URI and foo is before bar, then foo wins.
            if (!this._reverse_mapping[ns])
                this._reverse_mapping[ns] = prefix;
        }
        this._reverse_mapping[this._namespace_mappings[""]] = "";

        var elements = this._metadata.elements;
        var desc_map = Object.create(null);
        var me = this;
        elements.forEach(function (el) {
            // Here, an undefined namespace is the tei namespace.
            var ns = el.ns || "http://www.tei-c.org/ns/1.0";
            var prefix = me._reverse_mapping[ns];
            if (prefix === undefined)
                throw new Error("undefined namespace: " + ns);
            var name = prefix === "" ? el.name : (prefix + ":" + el.name);
            desc_map[name] = el.desc;
        });
        this._desc_map = desc_map;

    }

    this._ready();
};

/**
 * This method determines whether a node needs to be represented inline.
 *
 * @param {Node} node The node to examine.
 * @return {boolean} True if the node should be inline, false otherwise.
 */
Meta.prototype.isInline = function (node) {
    return false;
};

/**
 * Returns additional classes that should apply to a node.
 *
 * @param {Node} node The node to check.
 * @returns {string} A string that contains all the class names
 * separated by spaces. In other words, a string that could be put as
 * the value of the <code>class</code> attribute in an HTML tree.
 */
Meta.prototype.getAdditionalClasses = function (node) {
    var ret = [];
    if (this.isInline(node))
        ret.push("_inline");
    return ret.join(" ");
};

/**
 * Returns absolute namespace mappings. The default implementation
 * returns an empty mapping.
 *
 * @returns {Object} An object whose keys are namespace prefixes and
 * values are namespace URIs. The object returned by this method
 * should not be modified.
 */
Meta.prototype.getNamespaceMappings = function () {
    return this._namespace_mappings;
};

/**
 * Returns a short description for an element. The element should be
 * named according to the mappings reported by {@link
 * module:generic_meta~Meta#getNamespaceMappings
 * getNamespaceMappings}. The default implementation returns the
 * description provided by the metadata file loaded when the Meta
 * object was created.
 *
 * While this API provides for the case where descriptions have not
 * been loaded yet or cannot be loaded, this class does not allow such
 * eventuality to occur. Derived classes could allow it.
 *
 * @param {string} name The name of the element.
 * @returns {string|null|undefined} The description. If the value
 * returned is ``undefined``, then the description is not available. If the
 * value returned is ``null``, the description has not been loaded
 * yet.
 */
Meta.prototype.shortDescriptionFor = function (name) {
    return this._desc_map && this._desc_map[name];
};

/**
 * Returns a URL to the documentation for an element. The element
 * should be named according to the mappings reported by the resolve
 * returned by {@link module:mode~Mode#getAbsoluteResolver
 * getAbsoluteResolver}.
 *
 * While this API provides for the case such URL have not been loaded
 * yet or cannot be loaded, this class does not allow such eventuality
 * to occur. Derived classes could allow it.
 *
 * @param {string} name The name of the element.
 * @returns {string|null|undefined} The URL. If the value returned is
 * ``undefined``, then the URL is not available. If the value returned is
 * ``null``, the URL has not been loaded yet.
 */
Meta.prototype.documentationLinkFor = function (name) {
    if (!this._metadata)
        return undefined;

    var root = this._metadata.dochtml;

    // The TEI odd2html stylesheet creates file names of the form
    // prefix_local-name.html. So replace the colon with an
    // underscore.
    name = name.replace(":", "_");

    return require.toUrl(root + "ref-" + name + ".html");
};

exports.Meta = Meta;

});

//  LocalWords:  classdesc Mangalam MPL Dubeau
