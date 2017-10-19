define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The onbeforeunload handler for wed.
     * @author Louis-Dominique Dubeau
     * @license MPL 2.0
     * @copyright Mangalam Research Center for Buddhist Languages
     */
    // tslint:disable-next-line:no-typeof-undefined strict-boolean-expressions
    var test = (typeof __WED_TESTING !== "undefined") && !!__WED_TESTING.testing;
    function defaultCheck() {
        return true;
    }
    /**
     * Installs an ``onbeforeunload`` handler.
     *
     * @param win The window to install it on.
     *
     * @param A check to perform to verify whether prompting is necessary. If the
     * check returns ``false``, no prompting will occur. If unspecified, the prompt
     * will always be presented.
     *
     * @param Whether to force the installation even if a previous handler was
     * already installed. If ``force`` is ``false`` then if a handler was previously
     * installed **by this module** then an exception will be raised. If ``true``
     * then the old handler will be overwritten.
     */
    function install(win, check, force) {
        if (check === void 0) { check = defaultCheck; }
        if (force === void 0) { force = false; }
        if (win.onbeforeunload != null &&
            // tslint:disable-next-line:no-any
            win.onbeforeunload.installedByOnbeforeunload &&
            !force) {
            throw new Error("reregistering window with `force` false");
        }
        function newHandler() {
            var result = check();
            return result ? result : undefined;
        }
        // tslint:disable-next-line:no-any
        newHandler.installedByOnbeforeunload = true;
        win.onbeforeunload = newHandler;
    }
    exports.install = install;
    if (!test) {
        install(window);
    }
});
//  LocalWords:  reregistering Mangalam MPL Dubeau onbeforeunload

//# sourceMappingURL=onbeforeunload.js.map
