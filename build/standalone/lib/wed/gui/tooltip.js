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
    var for_ = ev.target;
    var tooltip = $.data(for_, 'bs.tooltip');
    $.data(tooltip.tip()[0], "wed-tooltip-for", for_);
}

/**
 * Creates a tooltip for an element. This function must be used to
 * create *all* tooltips that are associated with elements that appear
 * in a GUI tree. It is not necessary to use this function for
 * tooltips that are outside this tree.
 *
 * This function adds the ``wed-tooltip-for`` data to the tooltip
 * created for the ``$for`` element. This allows getting the DOM
 * element for which a tooltip was created from the DOM element
 * corresponding the tooltip itself.
 *
 * This function also adds the ``wed-has-tooltip`` class to the
 * ``$for`` element. This allows knowing which elements from the GUI
 * tree have tooltips.
 *
 * @param {jQuery} $for The element for which to create a tooltip.
 * @param {Object} options The options to pass to Bootstrap to create
 * the tooltip.
 */
function tooltip($for, options) {
    $for.tooltip(options);
    $for[0].classList.add("wed-has-tooltip");

    // This makes it so that when we find a div element created to
    // hold a tooltip, we can find the element for which the tooltip
    // was created. We do this in a show.bs.tooltip handler because
    // the DOM element for the tooltip won't be created before
    // then. (We could force its creation earlier but it would
    // pollute the DOM with needless elements.)
    $for.on('show.bs.tooltip', _showHandler);
}

exports.tooltip = tooltip;

});

//  LocalWords:  tooltip Tooltips bs tooltips
