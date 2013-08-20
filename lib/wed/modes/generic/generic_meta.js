/**
 * @module generic_meta
 * @desc Meta-information regarding the schema.
 * @author Louis-Dominique Dubeau
 */
define(function (require, exports, module) {
'use strict';

/**
 * @class
 */
function Meta () {

}

/**
 * This method determines whether a node needs to be represented inline.
 *
 * @param {Node} node The node to examine.
 * @return {Boolean} True if the node should be inline, false otherwise.
 */
Meta.prototype.isInline = function (node) {
    return false;
};

Meta.prototype.getAdditionalClasses = function (node) {
    var ret = [];
    if (this.isInline(node))
        ret.push("_inline");
    return ret.join(" ");
};

exports.Meta = Meta;

});