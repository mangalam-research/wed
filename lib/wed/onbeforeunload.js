/**
 * @module onbeforeunload
 * @desc The onbeforeunload handler for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:onbeforeunload */function (require, exports, module) {
'use strict';

var util = require("./util");
var config_module = require("optional!./config");
var options = util.grabConfig(module, config_module).config;
var test = options && options.test;

if (!test)
    install(window);

function default_check() {
    return true;
}

/**
 * Installs an <code>onbeforeunload</code> handler.
 *
 * @param {Window} win The window to install it on.
 * @param {Function} [check=undefined] A check to perform to verify whether
 * prompting is necessary. If the check returns ``false``, no prompting
 * will occur. If unspecified, the prompt will always be presented.
 * @param {boolean} [force=false] Whether to force the installation even if
 * a previous handler was already installed. If ``force`` is ``false``
 * then if a handler was previously installed **by this module** then
 * an exception will be raised. If ``true`` then the old handler will
 * be overwritten.
 */
function install(win, check, force) {
    check = check || default_check;
    force = !!force;

    if (win.onbeforeunload &&
        win.onbeforeunload.installed_by_onbeforeunload &&
        !force)
        throw new Error("reregistering window with `force` false", win);

    function new_handler() {
        return check() || undefined;
    }

    new_handler.installed_by_onbeforeunload = true;

    win.onbeforeunload = new_handler;
}

exports.install = install;

});

// LocalWords:  onbeforeunload Dubeau MPL Mangalam
