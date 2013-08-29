/**
 * @module onbeforeunload
 * @desc The onbeforeunload handler for wed.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:onbeforeunload */function (require, exports, module) {
'use strict';

var options = module.config();
var test = options && options.test;

if (!test)
    installOnBeforeunload(window);

function installOnBeforeunload(win) {
    win.onbeforeunload = function () {
        return "Do you really want to navigate away from this page?";
    };
}


});
