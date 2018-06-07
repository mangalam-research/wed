/**
 * @module onerror
 * @desc The error handler for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:onerror */function f(require, exports) {
  "use strict";

  /* global Promise __WED_TESTING */
  var test = (typeof __WED_TESTING !== "undefined") && __WED_TESTING.testing;

  var log = require("./log");
  var $ = require("jquery");

  var $modal = $(
    "\
<div class=\"modal wed-fatal-modal\" style=\"position: absolute\" tabindex=\"1\">\
  <div class=\"modal-dialog\">\
    <div class=\"modal-content\">\
      <div class=\"modal-header\">\
        <button type=\"button\" class=\"close\" data-dismiss=\"modal\"\
aria-hidden=\"true\">&times;</button>\
        <h3>Fatal Error</h3>\
      </div>\
      <div class=\"modal-body\">\
        <div class=\"save-messages\"></div>\
        <div class=\"error-message\"></div>\
      </div>\
      <div class=\"modal-footer\">\
        <a href=\"#\" class=\"btn btn-primary\" data-dismiss=\"modal\">Reload</a>\
      </div>\
    </div>\
  </div>\
</div>");

  var terminating = false;
  var termination_timeout;
  var termination_window;

  // Normally onerror will be reset by reloading but when testing with mocha we
  // don't want reloading, so we export this function.
  function _reset() {
    terminating = false;
    if (termination_timeout) {
      termination_window.clearTimeout(termination_timeout);
      termination_timeout = undefined;
    }
    $modal.off();
    $modal.modal("hide");
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
      reset: _reset,
    };
  }
  /**
   * An array into which wed editors register themselves at creation and
   * unregister themselves when destroyed.
   */
  var editors = [];


  var TERMINATION_TIMEOUT = 5000;
  // So that we can issue clearTimeout elsewhere.

  function showModal(saveMessages, errorMessage) {
    $(document.body).append($modal);
    $modal.find(".save-messages")[0].innerHTML = saveMessages;
    $modal.find(".error-message")[0].textContent = errorMessage;
    $modal.on("hide.bs.modal.modal", function hidden() {
      $modal.remove();
      window.location.reload();
    });
    $modal.modal();
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
        if (reason.stack) {
          msg += "\n" + reason.stack;
        }
        else {
          msg += reason;
        }
      }
      else if (promise) {
        msg += "Promise: " + promise;
      }
    }
    return msg;
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
    switch (result) {
    case true:
      ret.push(" However, it successfully saved the latest state of " +
               "your data to the server. Please reload.");
      break;
    default:
      ret.push(" It was not able to save your data to the server " +
               "before terminating.");
      break;
    }
    ret.push("</p>");
    return ret.join("");
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

    function terminate() {
      if (termination_timeout) {
        root.clearTimeout(termination_timeout);
      }

      if (total === 1) {
        messages.push(to_msg(undefined,
                             results[0] ? results[0][1] : undefined));
      }
      else {
        for (var r_ix = 0; r_ix < results.length; ++r_ix) {
          var result = results[r_ix];
          messages.push(to_msg(editors[result[0]].name, result[1]));
        }
      }
      showModal(messages.join(""), errorMessage);
    }

    termination_timeout = root.setTimeout(terminate, TERMINATION_TIMEOUT);
    termination_window = root;

    function done(success) {
      /* jshint validthis:true */
      results.push([this, success]);
    }

    var promises = [];
    // eslint-disable-next-line no-console
    console.error(errorMessage);
    log.error(errorMessage);
    for (var i = 0; i < editors.length; ++i) {
      var editor = editors[i];
      var saver = editor.saver;
      if (saver) {
        var handle = done.bind(editor);
        promises.push(saver.recover().then(handle, handle));
      }
    }

    Promise.all(promises).then(terminate);

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
      /* eslint-disable no-console */
      console.error("Error while trying to handle fatal error:");
      console.error(ex);
      /* eslint-enable */
    }
  }

  exports.handler = handler;
  exports.editors = editors;
});

//  LocalWords:  clearTimeout unregister iframe RequireJS href MPL
//  LocalWords:  onerror Mangalam Dubeau validthis jshint btn jquery
//  LocalWords:  tabindex jQuery
