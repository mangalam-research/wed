/**
 * @module jqutil
 * @desc Utilities for use with jQuery.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:jqutil */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
var util = require("./util");
var log = require("./log");

/**
 * This function is meant to be used as the parameter in
 * jQuery.filter() to narrow a list of nodes to text nodes.
 *
 * @returns {Boolean} <code>true</code> if the node is a text node.
 */
function textFilter() {
    // jQuery sets this to the proper value so:
    /* jshint validthis:true */
    return this.nodeType === Node.TEXT_NODE;
}


var separators = ",>+~ ";
var separator_re = new RegExp("([" + separators + "]+)");

/**
 * Converts a jQuery (or CSS) selector written as if it were run
 * against the XML document being edited by wed into a selector that
 * will match the corresponding items in the HTML tree that wed
 * actually edits. This implementation is extremely naive and likely
 * to break on complex selectors.
 *
 * @param {String} selector The selector to convert.
 * @returns {String} The converted selector.
 */
function toDataSelector(selector) {
    if (/[\]['"()]/.test(selector))
        throw new Error("selector is too complex");

    var parts = selector.split(separator_re);
    var ret = [];
    for(var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        if (part.length) {
            if (separators.indexOf(part) > -1)
                ret.push(part);
            else if (/[a-zA-Z]/.test(part[0])) {
                part = part.trim();
                var name_split = part.split(/(.#)/);
                ret.push(util.classFromOriginalName(name_split[0]));
                ret = ret.concat(name_split.slice(1));
            }
            else
                ret.push(part);
        }
    }
    return ret.join("");
}

/**
 * Converts a jQuery (CSS) selector composed of a sequence of ">" into
 * the corresponding data tree elements.
 *
 * @param {String} selector The selector to convert.
 * @returns {jQuery} The converted selector.
 * @throws {Error} If the selector is not in a format that this
 * function can handle.
 */
function selectorToElements(selector) {
    if (/[,+~#.]/.test(selector))
        throw new Error("selector is too complex for selectorToElements");
    var data_selector = toDataSelector(selector);

    var parts = selector.split(separator_re);
    var $ret = $();
    var expect_selector = false;
    for(var i = parts.length - 1; i > -1; --i) {
        var part = parts[i].trim();
        if (part.length) {
            if (expect_selector) {
                if (part !== ">")
                    throw new Error("selector is not a sequence of > " +
                                    "selectors");
                expect_selector = false;
            }
            else {
                var $el = $("<div>");
                $el.addClass(
                    util.classFromOriginalName(part).replace(/\./g, ' '));
                $el.append($ret);
                $ret = $el;
                expect_selector = true;
            }
        }
    }
    return $ret;

}

exports.textFilter = textFilter;
exports.toDataSelector = toDataSelector;
exports.selectorToElements = selectorToElements;

});

//  LocalWords:  jqutil jQuery jshint validthis CSS util zA jquery
//  LocalWords:  selectorToElements MPL
