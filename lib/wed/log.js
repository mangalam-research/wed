/**
 * @module log
 * @desc Logging facilities
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
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
 * TBA
 * @param {TBA} original
 */
function Handled(original) {
    this.original = original;
}

/**
 * Reports an unhandled exception. Avoids reporting the same exception
 * more than once.
 *
 * <p><strong>Use this function only if it makes sense to not abort
 * the current execution by throwing a new exception.</strong> In most
 * cases you want to use {@link module:log~handle handle} instead of
 * this function.</p>
 *
 * @param e The exception to report. This exception will not be
 * reported if it happens to be a {@link module:log~Handled
 * Handled} object.
 * @returns {module:log~Handled} A wrapper around the
 * original exception.
 */
function unhandled(e) {
    if (!(e instanceof Handled)) {
        log.fatal("Unhandled exception", e);
        return new Handled(e);
    }
    return e;
}

exports.unhandled = unhandled;

/**
 * Handles an unhandled exception. In almost all cases where you have
 * to deal with an unhandled exception, you want to interrupt the flow
 * of execution. This function does this.
 *
 * @param e The exception that is unhandled.
 * @throws {Handled} Always.
 */
function handle(e) {
    throw unhandled(e);
}

exports.handle = handle;

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
            handle(ex);
        }
    };
}

exports.wrap = wrap;

/**
 * This method adds an Ajax appender to the topmost logger defined by
 * wed so that all messages are sent to the URL specified as a
 * parameter. A server should be listening at that address.
 *
 * @param {String} url The URL for the location to send log messages.
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


//  LocalWords:  InputTrigger jQuery util jqutil jquery hashstructs
//  LocalWords:  keydown tabindex keypress submap focusable boolean

//  LocalWords:  domutil jquery util whitespace pathToNode nodeToPath
//  LocalWords:  contenteditable abcd abfoocd cd insertIntoText lt
//  LocalWords:  Prepend deleteText jQuery getSelectionRange prev
//  LocalWords:  lastChild makeCutFunction deleteNode mergeTextNodes
//  LocalWords:  jshint validthis insertNodeAt insertFragAt versa

//  LocalWords:  domlistener jquery findandself lt ul li nextSibling
//  LocalWords:  MutationObserver previousSibling jQuery LocalWords
// LocalWords:  Dubeau MPL Mangalam jquery validator util domutil oop
// LocalWords:  domlistener wundo jqutil gui onerror mixins html DOM
// LocalWords:  jQuery href sb nav ul li navlist errorlist namespaces
// LocalWords:  contenteditable Ok Ctrl listDecorator tabindex nbsp
// LocalWords:  unclick enterStartTag unlinks startContainer dropdown
// LocalWords:  startOffset endContainer endOffset mousedown keyup
// LocalWords:  setTextNodeValue popup appender unhandled rethrown
// LocalWords:  Django CSRFToken javascript param
