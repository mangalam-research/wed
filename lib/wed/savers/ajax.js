/**
 * @module savers/ajax
 * @desc Data saving functionality, using Ajax.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:savers/ajax */
    function (require, exports, module) {
'use strict';
var saver = require("../saver");
var oop = require("../oop");
var log = require("../log");
var $ = require("jquery");

/**
 * @typedef Options
 * @type {Object}
 * @property {string} url The url location to POST save requests.
 * @property {Object} [headers] Headers to set on the POST request. This
 * may be necessary for cross domain request protection, for instance.
 * @property {string|undefined} initial_etag The initial ETag to use.
 */

/**
 * @classdesc A saver responsible for communicating with a server to save the
 * data edited by a wed editor.
 *
 * @constructor
 * @param {string} version The version of wed for which this object is
 * created.
 * @param {module:tree_updater~TreeUpdater} data_updater The updater
 * that the editor created for its data tree.
 * @param {Node} data_tree The editor's data tree.
 * @param {module:savers/ajax~Options} options
 * The options specific to this class.
 */
function AjaxSaver(version, data_updater, data_tree, options) {
    saver.Saver.call(this, version, data_updater, data_tree);
    // This value is saved with the double quotes around it so that we
    // can just pass it to 'If-Match'.

    this._url = options.url;
    this._headers = options.headers;
    this._etag = '"' + options.initial_etag + '"';

    this._post({command: "check", version: version },
              function (data) {
        this._initialized = true;
        this._setCondition("initialized");
        this._failed = false;
    }.bind(this), "json").fail(this._failure_wrapper(function () {
        // This effectively aborts the editing session. This is okay,
        // since there's a good chance that the issue is major.
        throw new Error(
            url +  " is not responding; saving is not possible.");
    }.bind(this)));

    // Every 5 minutes.
    this.setAutosaveInterval(5 * 60 * 1000);
}

oop.inherit(AjaxSaver, saver.Saver);

/**
 * A safety harness to detect when asynchronous operations fail. This
 * method will mark its <code>Saver</code> instance as failed.
 *
 * @private
 *
 * @param {Function} f The function to be wrapped.
 * @returns {Function} The wrapped function.
 */
AjaxSaver.prototype._failure_wrapper = function(f) {
    return log.wrap(function (jqXHR, textStatus, errorThrown) {
        try {
            // This is a case where a precondition failed.
            if (jqXHR.status === 412) {
                var error = {msg: "The document was edited by someone else.",
                             type: "save_edited"};
                this._fail(error);
                return undefined;
            }
            return f.apply(undefined, arguments);
        }
        catch (e) {
            this._fail();
            throw e;
        }
    }.bind(this));
};


/**
 * A safety harness to detect when asynchronous operations fail. This
 * method will mark its <code>Saver</code> instance as failed if the
 * callback throws an exception.
 *
 * @private
 *
 * @param {Function} f The function to be wrapped.
 * @returns {Function} The wrapped function.
 */
AjaxSaver.prototype._success_wrapper = function(f) {
    return log.wrap(function () {
        try {
            return f.apply(undefined, arguments);
        }
        catch (e) {
            this._fail();
            throw e;
        }
    }.bind(this));
};

AjaxSaver.prototype._save = function (autosave, done) {
    if (!this._initialized)
        return;

    // We must store this value now because a modifying operation
    // could occur after the data is sent to the server but before we
    // can be sure the data is saved.
    var saving_generation = this._current_generation;

    function success (data) {
        /* jshint validthis:true */
        var msgs = _get_messages(data);
        if (!msgs)
            throw new Error(
                "The server accepted the save request but did " +
                    "not return any information regarding whether the " +
                    "save was successful or not.");

        if (msgs.save_fatal_error)
            throw new Error(
                "The server was not able to save the data " +
                    "due to a fatal error. Please contact technical " +
                    "support before trying to edit again.");

        if (msgs.save_transient_error) {
            this._emit("failed", msgs.save_transient_error);
            if (done)
                done(msgs.save_transient_error);
            return;
        }

        if (!msgs.save_successful)
            throw new Error(
                "Unexpected response from the server while saving. " +
                    "Please contact technical support before trying to " +
                    "edit again.");

        if (msgs.version_too_old_error)
            this._emit("too_old");

        this._saveSuccess(autosave, saving_generation);
        if (done)
            done(null);
    }

    this._post({command: autosave ? "autosave" : "save",
                version: this._version,
                data: this.getData() },
               this._success_wrapper(success.bind(this)), "json").
        fail(this._failure_wrapper(function () {
            var error = {msg: "Your browser cannot contact the server",
                         type: "save_disconnected"};
            this._emit("failed", error);
            if (done)
                done(error);
        }.bind(this)));
};


AjaxSaver.prototype._recover = function (done) {
    function success (data) {
        var msgs = _get_messages(data);
        if (!msgs) {
            done(false);
            return;
        }

        if (msgs.save_fatal_error) {
            done(false);
            return;
        }

        if (!msgs.save_successful) {
            done(false);
            return;
        }

        done(true);
    }

    this._post({command: "recover",
                version: this._version,
                data: this.getData() },
               success, "json").
        fail(done.bind(undefined, false));
};

/**
 * Utility wrapper for <code>jQuery.ajax</code>. Its parameters
 * correspond to the parameters of the same name on
 * <code>jQuery.ajax</code>. Read the code for more information.
 *
 * @private
 *
 * @param data
 * @param callback
 * @param dataType
 *
 * @returns The same thing as <code>jQuery.ajax</code>.
 */
AjaxSaver.prototype._post = function (data, callback, dataType) {
    var headers;

    if (this._etag) {
        headers = $.extend({}, this._headers);
        headers['If-Match'] = this._etag;
    }
    else
        headers = this._headers;

    var me = this;
    return $.ajax({
        type: "POST",
        url: this._url,
        data: data,
        dataType: dataType,
        headers: headers
    }).done(function (data, textStatus, jqXHR) {
        var msgs = _get_messages(data);
        // Unsuccessful operations don't have a valid etag.
        if (msgs && msgs.save_successful)
            me._etag = jqXHR.getResponseHeader('ETag');
        callback(data, textStatus, jqXHR);
    });
};

/**
 * Processes a list of messages received from the server.
 * @private
 *
 * @param {Object} data The data received from the server.
 * @returns {Object} An object which has for field names message types
 * and for field values a message of the corresponding type.
 *
 * @throws {Error} If there is more than one message of the same type
 * in the data being processed.
 */
function _get_messages (data) {
    var raw = data.messages;
    if (!raw || !raw.length)
        return undefined;

    var ret = {};
    for(var i = 0, msg; (msg = raw[i]) !== undefined; ++i) {
        var type = msg.type;
        if (ret[type] !== undefined)
            throw new Error("same type of message appearing more than " +
                            "once in one transaction");
        ret[type] = msg;
    }
    return ret;
}

exports.Saver = AjaxSaver;

});
