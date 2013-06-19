/**
 * @module jqutil
 * @desc Utilities for use with jQuery.
 * @author Louis-Dominique Dubeau
 */

define(/** @lends <global> */ function (require, exports, module) {
'use strict';

/**
 * This function is meant to be used as the paremeter in
 * jQuery.filter() to narrow a list of nodes to text nodes.
 */
function textFilter() {
    // jQuery sets this to the proper value so:
    /* jshint validthis:true */
    return this.nodeType === Node.TEXT_NODE;
}

exports.textFilter = textFilter;

});
