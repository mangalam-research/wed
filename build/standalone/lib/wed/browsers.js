/**
 * Browser detection. Extremely ad hoc and meant for wed's internal purposes
 * only.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //
    // Yes, testing features rather versions or specific browsers is the way to go,
    // generally speaking. However, when we are working around bugs in *specific
    // versions* of *specific browsers*, feature testing is mostly
    // useless. So... here we are.
    //
    // Note that symbols are introduced for purely ad-hoc reasons. If we need to
    // test for a specific combination somewhere in wed's code base, we have a
    // flag. If we don't need the test, we don't have a flag.
    //
    // Also this code only satisfies the interests of wed. Don't take the tests here
    // as gospel. If *you* need to test for some combinations that wed does not care
    // about, you may find that the code here gives incorrect results relative to
    // *your* goals. This code is meant to give correct results only relative to
    // what wed cares about. (Salient example: wed is not designed (at this time) to
    // run in tablets or phones. So the tests below don't take into account what
    // might happen when running in a tablet or phone.)
    //
    /**
     * True if the browser is Chrome.
     */
    exports.CHROME = navigator.userAgent.indexOf(" Chrome/") !== -1;
    /**
     * True if the browser is Internet Explorer up to version 10.
     */
    exports.MSIE_TO_10 = navigator.userAgent.indexOf(" MSIE ") !== -1;
    /**
     * True if the browser is Internet Explorer from version 11 and up.
     */
    //
    // This may be overbroad but at this point, we don't care.  The string "like
    // Gecko" appears in a number of user agent strings but AFAIK it is only IE 11
    // that puts it at the end. We might want to refine this eventually.
    //
    var MSIE_11_MARK = " like Gecko";
    exports.MSIE_11_AND_UP = navigator.userAgent.indexOf(MSIE_11_MARK, navigator.userAgent.length - MSIE_11_MARK.length) !== -1;
    /**
     * True if the browser is Internet Explorer, any version.
     */
    exports.MSIE = exports.MSIE_11_AND_UP || exports.MSIE_TO_10;
    /**
     * True if the browser is Firefox.
     */
    exports.FIREFOX = navigator.userAgent.indexOf(" Firefox/") !== -1;
    /**
     * True if the browser is Firefox 24. This is an ESR version.
     */
    exports.FIREFOX_24 = navigator.userAgent.indexOf(" Firefox/24") !== -1;
    /**
     * True if the browser is Gecko-based.
     */
    exports.GECKO = navigator.userAgent.indexOf(" Gecko/") !== -1;
    /**
     * True if running on a OS X system.
     */
    exports.OSX = navigator.platform.lastIndexOf("Mac", 0) === 0;
    /**
     * True if running on Windows.
     */
    // We don't care about old platforms or oddball Windows platforms.
    exports.WINDOWS = navigator.platform === "Win32";
});

//# sourceMappingURL=browsers.js.map
