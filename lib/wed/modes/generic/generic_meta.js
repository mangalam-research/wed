/**
 * @module modes/generic/generic_meta
 * @desc Meta-information regarding the schema.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic_meta */
function (require, exports, module) {
'use strict';

var $ = require("jquery");
var log = require("../../log");
var pubsub = require("../../lib/pubsub");

var WED_MODES_GENERIC_META_READY =
        pubsub.makeTopic("wed.modes.generic.meta.ready");

/**
 * @classdesc Meta-information for the generic mode. This is
 * information that cannot be simply derived from the schema.
 *
 * * Object of this class take the following options:
 *
 * + ``metadata``: a URL to a JSON file that contains metadata that
 * this meta should read.
 *
 * Remember to call {@link
 * module:modes/generic/generic_meta~Meta#optionResolver
 * optionResolver} and pass the data passed to the callback to this
 * constructor instead of the raw data.
 *
 * @constructor
 * @param {Object} options The options to pass to the Meta. The
 * generic meta does not expect any options.
 */
function Meta (options) {
    this._options = options;
    this._resolveOptions();
}

/**
 * This method is meant to be called by objects of this class to
 * signal that they are ready to be used.
 */
Meta.prototype._ready = function () {
    pubsub.publish(WED_MODES_GENERIC_META_READY, this);
};


/**
 * This static method must be called by the mode before a meta is
 * instantiated allow the class to resolve those options which are
 * paths to data to be loaded dynamically.
 *
 * @param {Object} options The options for the meta. Each class that
 * models a meta defines what fields this object contains. The generic
 * meta resolves the ``metadata`` option.
 * @param {Function} callback A callback to call once the options have
 * been resolved.
 */
Meta.prototype._resolveOptions = function () {
    var options = this._options;
    var resolved = $.extend(true, {}, options);
    if (options && options.metadata) {
        $.ajax({
            type: "GET",
            url: require.toUrl(options.metadata),
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

Meta.prototype._afterResolved = function () {
    this._metadata = this._options.metadata;

    var elements = this._metadata.elements;
    var desc_map = {};
    elements.forEach(function (el) {
        desc_map[el.name] = el.desc;
    });
    this._desc_map = desc_map;

    this._namespace_mappings = this._metadata.namespaces;
    if ("xml" in this._namespace_mappings)
        throw new Error("xml mapping already defined");

    this._namespace_mappings.xml =
        "http://www.w3.org/XML/1998/namespace";
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
 * returned is ``null``, then descriptions are not available. If the
 * value returned is ``undefined``, descriptions have not been loaded
 * yet.
 */
Meta.prototype.shortDescriptionFor = function (name) {
    if (!this._desc_map)
        return this._desc_map;
    return this._desc_map[name];
};

exports.Meta = Meta;

});

//  LocalWords:  classdesc Mangalam MPL Dubeau
