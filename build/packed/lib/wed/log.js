var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "log4javascript"], function (require, exports, log4javascript) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    log4javascript = __importStar(log4javascript);
    log4javascript.setShowStackTraces(true);
    var ajaxLogger = log4javascript.getLogger("wed");
    ajaxLogger.setLevel(log4javascript.Level.ALL);
    var log = log4javascript.getLogger("wed.common");
    log.setLevel(log4javascript.Level.ALL);
    var popup = new log4javascript.PopUpAppender(true);
    popup.setThreshold(log4javascript.Level.ERROR);
    popup.setInitiallyMinimized(true);
    popup.setNewestMessageAtTop(true);
    log.addAppender(popup);
    exports.trace = log.trace.bind(log);
    exports.debug = log.debug.bind(log);
    exports.info = log.info.bind(log);
    exports.warn = log.warn.bind(log);
    exports.error = log.error.bind(log);
    exports.fatal = log.fatal.bind(log);
    /**
     * Shows the popup appender.
     */
    function showPopup() {
        popup.show();
    }
    exports.showPopup = showPopup;
    /**
     * Wrapper for handled exceptions.
     */
    var Handled = /** @class */ (function () {
        /**
         * original The original exception that was raised.
         */
        function Handled(original) {
            this.original = original;
        }
        return Handled;
    }());
    exports.Handled = Handled;
    /**
     * Reports an unhandled exception. Avoids reporting the same exception
     * more than once.
     *
     * **Use this function only if it makes sense to not abort the current execution
     * by throwing a new exception.** In most cases you want to use [[handle]]
     * instead of this function.
     *
     * @param e The exception to report. This exception will not be
     * reported if it happens to be a [[Handled]] object.
     *
     * @returns A wrapper around the original exception.
     */
    function unhandled(e) {
        if (!(e instanceof Handled)) {
            log.fatal("Unhandled exception", e);
            // tslint:disable-next-line:no-typeof-undefined
            if (typeof console !== "undefined") {
                // tslint:disable:no-console
                console.log(e);
                console.log(e.stack);
                // tslint:enable:no-console
            }
            return new Handled(e);
        }
        return e;
    }
    exports.unhandled = unhandled;
    /**
     * Handles an unhandled exception. In almost all cases where you have to deal
     * with an unhandled exception, you want to interrupt the flow of
     * execution. This function does this.
     *
     * @param e The exception that is unhandled.
     *
     * @throws {Handled} Always.
     */
    function handle(e) {
        throw unhandled(e);
    }
    exports.handle = handle;
    /**
     * Wraps a function into an unhandled exception logger. The exceptions caught
     * are rethrown after being logged.
     *
     * @param f The function to wrap.
     *
     * @returns The value returned by f.
     */
    function wrap(fn) {
        // @ts-ignore
        return function wrapper() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            try {
                // tslint:disable-next-line:no-invalid-this
                return fn.apply(this, arguments);
            }
            catch (ex) {
                handle(ex);
            }
        };
    }
    exports.wrap = wrap;
    /**
     * This method adds an Ajax appender to the topmost logger defined by wed so
     * that all messages are sent to the URL specified as a parameter. A server
     * should be listening at that address.
     *
     * @param url The URL for the location to send log messages.
     *
     * @param headers An object having (key, value) pairs which define header fields
     * to set for communicating. One use for this parameter would be for instance to
     * set the X-CSRFToken field when wed is being used on pages served by a Django
     * server.
     *
     * @returns The appender that was created to handle the URL. This may be used
     * with [[removeAppender]] to remove an appender that is no longer used.
     */
    function addURL(url, headers) {
        var appender = new log4javascript.AjaxAppender(url);
        appender.setThreshold(log4javascript.Level.ALL);
        var layout = new log4javascript.XmlLayout();
        appender.setLayout(layout);
        if (headers !== undefined) {
            Object.keys(headers).forEach(function (x) {
                appender.addHeader(x, headers[x]);
            });
        }
        ajaxLogger.addAppender(appender);
        log.info("Ajax appender initialized");
        return appender;
    }
    exports.addURL = addURL;
    /**
     * Removes an appender from the logger. Flushes out any pending messages first.
     *
     * @param appender The appender to remove.
     */
    function removeAppender(appender) {
        appender.sendAll();
        ajaxLogger.removeAppender(appender);
    }
    exports.removeAppender = removeAppender;
});
//  LocalWords:  Dubeau MPL Mangalam popup appender unhandled rethrown Django
//  LocalWords:  CSRFToken param
//# sourceMappingURL=log.js.map