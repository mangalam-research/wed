/**
 * @module gui/icon
 * @desc The icons used by the user interface.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:gui/icon */ function (require, exports, module) {
'use strict';

var ICON_NAMES = Object.create(null);

ICON_NAMES.add = "fa-plus";
ICON_NAMES["delete"] = "fa-times";
ICON_NAMES.wrap = "fa-caret-square-o-down";
ICON_NAMES.unwrap = "fa-caret-square-o-up";
ICON_NAMES.documentation = "fa-question-circle";
ICON_NAMES.transform = "fa-cog";
ICON_NAMES.any = "fa-asterisk";
ICON_NAMES.element = "fa-angle-left";
ICON_NAMES.attribute = "fa-at";
ICON_NAMES.other = "fa-circle-thin";

/**
 * Generates the HTML for an icon. The icon name can be any of:
 *
 * - ``"add"`` for actions that add content.
 *
 * - ``"delete"`` for actions that delete content.
 *
 * - ``"wrap"`` for actions that wrap content.
 *
 * - ``"unwrap"`` for actions that unwrap content.
 *
 * - ``"documentation"`` for actions that present documentation.
 *
 * - ``"any"`` for any action.
 *
 * @param {string} name The name of the icon to create.
 * @returns {string} The HTML for the icon.
 */
function makeHTML(name) {
    var cl = ICON_NAMES[name];
    if (!cl)
        throw new Error("unknown icon name: " + name);
    return '<i class="fa fa-fw '+ cl + '"></i>';
}
exports.makeHTML = makeHTML;

});

//  LocalWords:  MPL fw
