/**
 * @module browsers
 * @desc Browser detection. Extremely ad hoc and meant for wed's
 * internal purposes only.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:browsers */function (require, exports, module) {
'use strict';

// Yes, testing features rather versions or specific browsers is the
// way to go, generally speaking. However, when we are working around
// bugs in *specific versions* of a *specific browser*, feature testing is
// mostly useless, so... here we are.

/**
 * True if the browser is Chrome 31.
 */
var CHROME_31 = navigator.userAgent.indexOf(" Chrome/31.") !== -1;
exports.CHROME_31 = CHROME_31;

/**
 * True if the browser is Chrome.
 */
var CHROME = navigator.userAgent.indexOf(" Chrome/") !== -1;
exports.CHROME = CHROME;

/**
 * True if the browser is Internet Explorer up to version 10.
 */
var MSIE_TO_10 = navigator.userAgent.indexOf(" MSIE ") !== -1;
exports.MSIE_TO_10 = MSIE_TO_10;

/**
 * True if the browser is Internet Explorer from version 11 and up.
 */
//
// This may be overbroad but at this point, we don't care.  The string
// "like Gecko" appears in a number of user agent strings but AFAIK it
// is only IE 11 that puts it at the end. We might want to refine this
// eventually.
//
var MSIE_11_MARK = " like Gecko";
var MSIE_11_AND_UP = navigator.userAgent.indexOf(
    MSIE_11_MARK, navigator.userAgent.length - MSIE_11_MARK.length) !== -1;
exports.MSIE_11_AND_UP = MSIE_11_AND_UP;

/**
 * True if the browser is Internet Explorer, any version.
 */
var MSIE = MSIE_11_AND_UP || MSIE_TO_10;
exports.MSIE = MSIE;

/**
 * True if the browser is Firefox.
 */
var FIREFOX = navigator.userAgent.indexOf(" Firefox/") !== -1;
exports.FIREFOX = FIREFOX;

/**
 * True if the browser is Gecko-based.
 */
var GECKO = navigator.userAgent.indexOf(" Gecko/") !== -1;
exports.GECKO = GECKO;

/**
 * True if running on a OS X system.
 */
var OSX = navigator.platform.lastIndexOf("Mac", 0) === 0;

exports.OSX = OSX;

});
