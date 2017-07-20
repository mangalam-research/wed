/**
 * @module onbeforeunload
 * @desc The onbeforeunload handler for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:onbeforeunload */function f(require, exports) {
  "use strict";

  /* global __WED_TESTING */
  var test = (typeof __WED_TESTING !== "undefined") && __WED_TESTING.testing;

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
        !force) {
      throw new Error("reregistering window with `force` false", win);
    }

    function new_handler() {
      return check() || undefined;
    }

    new_handler.installed_by_onbeforeunload = true;

    win.onbeforeunload = new_handler;
  }

  if (!test) {
    install(window);
  }

  exports.install = install;
});

// LocalWords:  onbeforeunload Dubeau MPL Mangalam
