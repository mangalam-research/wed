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

// Yes, testing features rather the versions is the way to go but when
// we are working around bugs in specific versions of a browser
// feature testing is usually useless, so...

/**
 * True if the browser is Chrome 31.
 */
var CHROME_31 = navigator.userAgent.indexOf(" Chrome/31.") !== -1;

exports.CHROME_31 = CHROME_31;

});
