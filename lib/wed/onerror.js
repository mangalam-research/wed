/**
 * @module onerror
 * @desc The onerror handler for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:onerror */function (require, exports, module) {
'use strict';

var options = module.config();
var suppress_old_onerror = options && options.suppress_old_onerror;
var test = options && options.test;

var log = require("./log");
var $ = require("jquery");

var $modal = $(
        '\
<div class="modal wed-fatal-modal" style="position: absolute" tabindex="1">\
  <div class="modal-dialog">\
    <div class="modal-content">\
      <div class="modal-header">\
        <button type="button" class="close" data-dismiss="modal"\
aria-hidden="true">&times;</button>\
        <h3>Fatal Error</h3>\
      </div>\
      <div class="modal-body">\
      </div>\
      <div class="modal-footer">\
        <a href="#" class="btn btn-primary" data-dismiss="modal">Reload</a>\
      </div>\
    </div>\
  </div>\
</div>');



// Normally onerror will be reset by reloading but when testing with
// mocha we don't want reloading, so we export this function.
function _reset() {
    terminating = false;
    if (termination_timeout) {
        termination_window.clearTimeout(termination_timeout);
        termination_timeout = undefined;
    }
    $modal.off();
    $modal.remove();
}

function is_terminating() {
    return terminating;
}

exports.is_terminating = is_terminating;

// For testing only
if (test) {
    exports.__test = {
        $modal: $modal,
        reset: _reset
    };
}

// We install onto whatever window is current ASAP to catch early errors.
installOnError(window);

/**
 * <p>Aggressively installs an onerror handler. It will install it both
 * in the window passed as parameter and into the root window if the
 * window passed happens to be an iframe. While running wed in an
 * iframe on Chrome 28.0.1500.95, we've noticed that the onerror
 * handlers set on iframe windows did not catch anything, hence this
 * behavior.</p>
 *
 * <p>This function will inspect the value of <code>win.onerror</code>
 * and call it after it does its own bookkeeping. If this behavior is
 * not desired, set <code>suppress_old_onerror</code> as a
 * configuration option for this module in your RequireJS setup.</p>
 *
 * <p>Note that it is extremely unlikely that wed would play well with
 * any onerror handler set by other software if this handler tries
 * to do something as substantial as wed does. Note also that this
 * handler will catch any JavaScript error so any other JavaScript
 * running on the same page as wed will trip it.</p>
 *
 * @param {Window} win The window to install on.
 */
function register(win) {
    installOnError(win);
}

exports.register = register;

/**
 * An array into which wed editors register themselves at creation and
 * unregister themselves when destroyed. (Note that this is not
 * related to this module's register function.)
 */
var editors = [];


var TERMINATION_TIMEOUT = 5000;
var terminating = false;
var termination_timeout;
// So that we can issue clearTimeout elsewhere.
var termination_window;

/**
 * Installs an <code>onerror</code> handler.
 *
 * @private
 * @param {Window} win The window to install it on.
 */
function installOnError(win) {
    // Install globally too.
    var root = win;
    while(root !== root.parent)
        root = root.parent;

    if (root !== win) // Don't invoke if we're already root.
        installOnError(root);

    if (win.wed_installed_onerror === win.onerror)
        return;

    var old_onerror = win.onerror;
    win.onerror = onerror;
    win.wed_installed_onerror = onerror;
    function onerror(msg, url, linenumber) {
        // This avoids an infinite loop.
        if (terminating)
            return false;
        terminating = true;

        var total = editors.length;
        var results = [];
        var messages = [];

        termination_timeout = root.setTimeout(terminate, TERMINATION_TIMEOUT);
        termination_window = root;
        function terminate() {
            if (termination_timeout)
                root.clearTimeout(termination_timeout);
            if (total === 1)
                messages.push(to_msg(undefined,
                                     results[0] ? results[0][1] : undefined));
            else {
                for(var r_ix = 0, result;
                    (result = results[r_ix]) !== undefined;
                    ++r_ix)
                    messages.push(to_msg(editors[result[0]].name, result[1]));
            }
            $(document.body).append($modal);
            $modal.find(".modal-body").contents().replaceWith(
                messages.join(""));
            $modal.on("hide.bs.modal.modal", function () {
                $modal.remove();
                root.location.reload();
            });
            $modal.modal();
        }

        function done(success) {
            /* jshint validthis:true */
            results.push([this, success]);
            if (results.length === total)
                terminate();
        }

        log.error(msg, url, linenumber);
        try {
            if (old_onerror && !suppress_old_onerror)
                old_onerror.apply(undefined, arguments);
        }
        finally {
            for(var i = 0, editor; (editor = editors[i]) !== undefined; ++i) {
                var saver = editor._saver;
                if (saver)
                    saver.recover(done.bind(i));
            }
            return false;
        }
    }
}

/**
 *
 * Converts a save operation result to a message.
 *
 * @private
 * @param {string} name The name of the editor instance.
 * @param {boolean|undefined} result The result of the save operation.
 *
 * @returns {string} The message.
*/
function to_msg(name, result) {
    var ret = ["<p>", name || "Your editor"];
    ret.push(" experienced a severe error.");
    switch(result) {
    case true:
        ret.push(" However, it successfully saved the latest state of "+
                 "your data to the server. Please reload.");
        break;
    case false:
    case undefined:
        ret.push(" It was not able to save your data to the server "+
                 "before terminating.");
        break;
    }
    ret.push("</p>");
    return ret.join('');
}

exports.editors = editors;

});

//  LocalWords:  clearTimeout unregister iframe RequireJS href MPL
//  LocalWords:  onerror Mangalam Dubeau validthis jshint btn jquery
//  LocalWords:  tabindex jQuery
