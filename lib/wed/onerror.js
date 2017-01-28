/**
 * @module onerror
 * @desc The error handler for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:onerror */function (require, exports, module) {
'use strict';

var util = require("./util");
var test = (typeof __WED_TESTING !== "undefined") && __WED_TESTING.testing;

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
        <div class="save-messages"></div>\
        <div class="error-message"></div>\
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
/**
 * An array into which wed editors register themselves at creation and
 * unregister themselves when destroyed.
 */
var editors = [];


var TERMINATION_TIMEOUT = 5000;
var terminating = false;
var termination_timeout;
// So that we can issue clearTimeout elsewhere.
var termination_window;

function showModal(saveMessages, errorMessage) {
    $(document.body).append($modal);
    $modal.find(".save-messages")[0].innerHTML = saveMessages;
    $modal.find(".error-message")[0].textContent = errorMessage;
    $modal.on("hide.bs.modal.modal", function () {
        $modal.remove();
        window.location.reload();
    });
    $modal.modal();
}

function _handler(ev) {
    ev.preventDefault();
    // This avoids an infinite loop.
    if (terminating) {
        return false;
    }
    terminating = true;

    var errorMessage = eventToMessage(ev);

    var total = editors.length;
    var results = [];
    var messages = [];

    var root = window;
    termination_timeout = root.setTimeout(terminate, TERMINATION_TIMEOUT);
    termination_window = root;
    function terminate() {
        if (termination_timeout)
            root.clearTimeout(termination_timeout);

        if (total === 1) {
            messages.push(to_msg(undefined,
                                 results[0] ? results[0][1] : undefined));
        }
        else {
            for(var r_ix = 0, result; (result = results[r_ix]) !== undefined;
                ++r_ix) {
                messages.push(to_msg(editors[result[0]].name, result[1]));
            }
        }
        showModal(messages.join(""), errorMessage);
    }

    function done(success) {
        /* jshint validthis:true */
        results.push([this, success]);
        if (results.length === total)
            terminate();
    }

    log.error(errorMessage);
    for(var i = 0, editor; (editor = editors[i]) !== undefined; ++i) {
        var saver = editor._saver;
        try {
            if (saver) {
                saver.recover(done.bind(i));
            }
        }
        catch (ex) {
            results.push([i, undefined]);
        }
    }
    return false;
}

function handler(ev) {
    try {
        try {
            _handler(ev);
        }
        catch (ex) {
            showModal("", "Error while trying to handle fatal error: " +
                      ex.toString());
        }
    }
    catch (ex) {
        console.error("Error while trying to handle fatal error:");
        console.error(ex);
    }
}

exports.handler = handler;

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

function eventToMessage(ev) {
    var msg = "";
    if (ev.type === "error") {
        var message = ev.message;
        var filename = ev.filename;
        var lineno = ev.lineno;
        var colno = ev.colno;
        var err = ev.error;

        if (err) {
            msg = err.stack;
        }
        else {
            msg = filename + ":" + lineno;
            if (colno) {
                msg += "." + colno;
            }
            msg += ": " + message;
        }
    }
    else {
        msg += "Unhandled promise rejection!\n";
        var reason;
        var promise;
        var source = ev.promise ? ev : ev.detail;
        if (source) {
            reason = source.reason;
            promise = source.promise;
        }

        if (reason) {
            msg += "Reason: ";
            if (reason.stack)
                msg += "\n" + reason.stack;
            else
                msg += reason;
        }
        else if (promise) {
            msg += "Promise: " + promise;
        }
    }
    return msg;
}

exports.editors = editors;

});

//  LocalWords:  clearTimeout unregister iframe RequireJS href MPL
//  LocalWords:  onerror Mangalam Dubeau validthis jshint btn jquery
//  LocalWords:  tabindex jQuery
