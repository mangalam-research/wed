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

/**
 * @classdesc Meta-information for the generic mode. This is
 * information that cannot be simply derived from the schema.
 * @constructor
 */
function Meta () {

}

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
 * values are namespace URIs.
 */
Meta.prototype.getNamespaceMappings = function () {
    return {};
};

exports.Meta = Meta;

});

//  LocalWords:  classdesc Mangalam MPL Dubeau
