/**
 * @module gui/tooltip
 * @desc Tooltips for elements that appear in the editor pane.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:gui/tooltip */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
require("bootstrap");

function _showHandler(ev) {
    var $for = $(ev.target);
    var tooltip = $for.data('bs.tooltip');
    tooltip.tip().data("wed-tooltip-for", ev.target);
}

/**
 * Creates a tooltip for an element. This function must be used to
 * create *all* tooltips that are associated with elements that appear
 * in the editing pane of wed.
 *
 * The major task performed by this function is to add the
 * ``wed-tooltip-for`` data to the ``$for`` element.
 *
 * @param {jQuery} $for The element for which to create a tooltip.
 * @param {Object} options The options to pass to Bootstrap to create
 * the tooltip.
 */
function tooltip($for, options) {
    $for.tooltip(options);

    // This makes it so that when we find a div element created to
    // hold a tooltip, we can find the element for which the tooltip
    // was created.
    $for.on('show.bs.tooltip', _showHandler);
}

exports.tooltip = tooltip;

});
