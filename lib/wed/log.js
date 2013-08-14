/**
 * @module log
 * @desc Logging facilities
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:log */function (require, exports, module) {
'use strict';

var options = module.config();

var log4javascript = require("log4javascript");
log4javascript.setShowStackTraces(true);

var ajax_logger = log4javascript.getLogger("wed");
ajax_logger.setLevel(log4javascript.Level.ALL);

var log = log4javascript.getLogger("wed.common");
log.setLevel(log4javascript.Level.ALL);
var appender = new log4javascript.PopUpAppender(true);
appender.setThreshold(log4javascript.Level.ERROR);
appender.setFocusPopUp(options && options.focus_popup);
appender.setInitiallyMinimized(true);
appender.setNewestMessageAtTop(true);

log.addAppender(appender);

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
    appender.show();
}
exports.showPopup = showPopup;

/**
 * Reports an unhandled exception.
 * @param e The exception to report.
 */
function unhandled(e) {
    if (!e.__wed_logged_me)
        log.fatal("Unhandled exception", e);
    e.__wed_logged_me = true;
}

exports.unhandled = unhandled;

/**
 * Wraps a function into an unhandled exception logger. The exceptions
 * caught are rethrown after being logged.
 *
 * @param {Function} f The function to wrap.
 * @returns The value returned by f.
 */
function wrap(f) {
    return function () {
        try {
            return f.apply(this, arguments);
        }
        catch (ex) {
            unhandled(ex);
            throw ex;
        }
    };
}

exports.wrap = wrap;

/**
 * This method adds an Ajax appender to the topmost logger defined by
 * wed so that all messages are sent to the URL specified as
 * parameter. A server should be listening at that address.
 *
 * @param {String} url The URL where to send log messages.
 * @param {Object} headers An object having (key, value) pairs which
 * define header fields to set for communicating. One use for this
 * parameter would be for instance to set the X-CSRFToken field when
 * wed is being used on pages served by a Django server.
 */
function addURL(url, headers) {
    var appender = new log4javascript.AjaxAppender(url);
    appender.setThreshold(log4javascript.Level.ALL);
    var layout = new log4javascript.XmlLayout();
    appender.setLayout(layout);
    if (headers) {
        Object.keys(headers).forEach(function (x) {
            appender.addHeader(x, headers[x]);
        });
    }
    ajax_logger.addAppender(appender);
    log.info("Ajax appender initialized");
}

exports.addURL = addURL;

});
