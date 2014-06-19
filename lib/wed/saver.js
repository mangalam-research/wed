/**
 * @module saver
 * @desc Data saving functionality.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:saver */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var log= require("./log");
var oop = require("./oop");
var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
require("jquery.bootstrap-growl");

var AUTO = 1;
var MANUAL = 2;

/**
 * @classdesc A Saver is responsible for communicating with a server to save the
 * data edited by a wed editor.
 * @mixes module:lib/simple_event_emitter~SimpleEventEmitter
 *
 * @constructor
 * @param {string} url The url location to POST save requests.
 * @param {Object} headers Headers to set on the POST request. This
 * may be necessary for cross domain request protection, for instance.
 * @param {string} version The version of wed for which this object is
 * created.
 * @param {module:tree_updater~TreeUpdater} data_updater The updater
 * that the editor created for its data tree.
 * @param {Node} data_tree The editor's data tree.
 */
function Saver(url, headers, version, data_updater, data_tree) {
    // Call our mixin's constructor.
    SimpleEventEmitter.call(this);
    this._url = url;
    this._headers = headers;
    this._version = version;
    this._data_updater = data_updater;
    this._data_tree = data_tree;
    this._initialized = false;
    this._failed = undefined;
    this._current_generation = 0;
    this._saved_generation = 0;
    this._last_save = undefined;
    this._last_save_kind = undefined;
    this._autosave_interval = undefined;
    this._autosave_timeout = undefined;

    data_updater.addEventListener("changed", function () {
        if (this._saved_generation === this._current_generation)
            this._current_generation++;
    }.bind(this));

    this._post({command: "check", version: version },
              function (data) {
        this._initialized = true;
        this._failed = false;
    }.bind(this), "json").fail(this._failure_wrapper(function () {
        throw new Error(
            url +  " is not responding; saving is not possible.");
    }.bind(this)));

    this._bound_autosave = this._autosave.bind(this);

    // Every 5 minutes.
    this.setAutosaveInterval(5 * 60 * 1000);
}

oop.implement(Saver, SimpleEventEmitter);

/**
 * A safety harness to detect when asynchronous operations fail. This
 * method will mark its <code>Saver</code> instance as failed.
 *
 * @private
 *
 * @param {Function} f The function to be wrapped.
 * @returns {Function} The wrapped function.
 */
Saver.prototype._failure_wrapper = function(f) {
    return function () {
        try {
            return f.apply(undefined, arguments);
        }
        catch (e) {
            this._failed = true;
            throw e;
        }
    }.bind(this);
};

/**
 * This method must be called when the user manually initiates a save.
 * @throws {Error} If there are any problems communicating with the server
 * when saving.
 * @param {Function} [done] A function to call once the save operation
 * has been completed. The function's first parameter is the error
 * encountered. It will be ``null`` if there is no error.
 */
Saver.prototype.save = function (done) {
    this._save(false, done);
};

Saver.prototype._save = function (autosave, done) {
    if (!this._initialized)
        return;

    // We must store this value now because a modifying operation
    // could occur after the data is sent to the server but before we
    // can be sure the data is saved.
    var saving_generation = this._current_generation;

    function success (data) {
        /* jshint validthis:true */
        try {
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

            // If we get here, we've been successful.
            this._saved_generation = saving_generation;
            this._last_save = Date.now();
            this._last_save_kind = autosave ? AUTO : MANUAL;
            this._emit(autosave ? "autosaved" : "saved");
            if (done)
                done(null);
        }
        catch (e) {
            this._failed = true;
            throw e;
        }
    }

    this._post({command: autosave ? "autosave" : "save",
                version: this._version,
                data: this._data_tree.innerHTML },
               this._failure_wrapper(success.bind(this)), "json").
        fail(this._failure_wrapper(function () {
            throw new Error(this._url +
                            " is not responding; save did not work.");
        }.bind(this)));
};

Saver.prototype._autosave = function () {
    this._autosave_timeout = undefined;
    var me = this;
    function done() {
        // Calling ``setAutosaveInterval`` effectively starts a new
        // timeout, and takes care of possible race conditions. For
        // instance, a call to ``setAutosaveInterval`` could happen
        // after the current timeout has started saving but before
        // ``done`` is called. This would launch a new timeout. If the
        // code here called ``setTimeout`` instead of
        // ``setAutosaveInterval`` then two timeouts would be running.
        me.setAutosaveInterval(me._autosave_interval);
    }

    if (this._current_generation !== this._saved_generation)
        // We have something to save!
        this._save(true, done);
};

/**
 * Changes the interval at which autosaves are performed. Note that
 * calling this function will stop the current countdown and restart
 * it from zero. If, for instance, the previous interval was 5
 * minutes, and 4 minutes had elapsed since the last save, the next
 * autosave should happen one minute from now. However, if I now call
 * this function with a new interval of 4 minutes, this will cause the
 * next autosave to happen 4 minutes after the call, rather than one
 * minute.
 *
 * @param {number} interval The interval between autosaves in
 * milliseconds.
 */
Saver.prototype.setAutosaveInterval = function (interval) {
    this._autosave_interval = interval;
    var old_timeout = this._autosave_timeout;

    if (old_timeout)
        clearTimeout(old_timeout);

    this._autosave_timeout = interval ?
        setTimeout(this._bound_autosave, interval): undefined;
};

/**
 * This method is to be used by wed upon encountering a fatal
 * error. It will attempt to record the last state of the data tree
 * before wed dies.
 *
 * @param {Function} done A function to call once the recovery
 * operation is done. Cannot be <code>null</code> or
 * <code>undefined</code>. This function must accept one parameter
 * which will be set to <code>undefined</code> if the method did not
 * do anything because the Saver object is in an unintialized state or
 * has already failed. It will be set to <code>true</code> if the
 * recovery operation was successful, and <code>false</code> if not.
 */
Saver.prototype.recover = function (done) {
    if (!this._initialized || this._failed) {
        done(undefined);
        return;
    }

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
                data: this._data_tree.innerHTML },
               success, "json").
        fail(done.bind(undefined, false));
};

/**
 * Produces a string that indicates in human readable format when the
 * last save occurred and what type of save it was.
 */
Saver.prototype.getStatusString = function () {
    if (this._saved_generation === 0)
        return "Not changed and not saved";
    else {
        var delta = Math.round((Date.now() - this._last_save) / 1000);
        var time_desc = delta + " seconds ago";
        switch(this._last_save_kind) {
        case MANUAL:
            return "Saved manually" + time_desc;
        case AUTO:
            return "Saved automatically" + time_desc;
        default:
            throw new Error("unexpected save kind: " + this._last_save_kind);
        }
    }
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
Saver.prototype._post = function (data, callback, dataType) {
    return $.ajax({
        type: "POST",
        url: this._url,
        data: data,
        success: callback,
        dataType: dataType,
        headers: this._headers
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

exports.Saver = Saver;

});

//  LocalWords:  jQuery jquery url jshint validthis Dubeau MPL oop
//  LocalWords:  Mangalam mixin's json unintialized param dataType
//  LocalWords:  SimpleEventEmitter
