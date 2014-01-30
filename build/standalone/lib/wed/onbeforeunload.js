/**
 * @module onbeforeunload
 * @desc The onbeforeunload handler for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:onbeforeunload */function (require, exports, module) {
'use strict';

var options = module.config();
var test = options && options.test;

if (!test)
    installOnBeforeunload(window);

/**
 * Installs a <code>onbeforeunload</code> handler.
 *
 * @param {Window} win The window to install it on.
 */
function installOnBeforeunload(win) {
    win.onbeforeunload = function () {
        return "Do you really want to navigate away from this page?";
    };
}


});

// LocalWords:  onbeforeunload Dubeau MPL Mangalam
