/**
 * @module saver
 * @desc Data saving functionality.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:saver */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var log= require("./log");
var oop = require("./oop");
var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
require("jquery.bootstrap-growl");

/**
 * @classdesc A Saver is responsible for communicating with a server to save the
 * data edited by a wed editor.
 * @mixes module:lib/simple_event_emitter~SimpleEventEmitter
 *
 * @constructor
 * @param {String} url The url location to POST save requests.
 * @param {Object} headers Headers to set on the POST request. This
 * may be necessary for cross domain request protection, for instance.
 * @param {String} version The version of wed for which this object is
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

    this._post({command: "check", version: version },
              function (data) {
        this._initialized = true;
        this._failed = false;
    }.bind(this), "json").fail(this._failure_wrapper(function () {
        throw new Error(
            url +  " is not responding; saving is not possible.");
    }.bind(this)));
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
 */
Saver.prototype.save = function () {
    if (!this._initialized)
        return;

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
                return;
            }

            if (!msgs.save_successful)
                throw new Error(
                    "Unexpected response from the server while saving. " +
                        "Please contact technical support before trying to " +
                        "edit again.");


            this._emit("saved");
        }
        catch (e) {
            this._failed = true;
            throw e;
        }
    }

    this._post({command: "save",
                version: this._version,
                data: this._data_tree.innerHTML },
               this._failure_wrapper(success.bind(this)), "json").
        fail(this._failure_wrapper(function () {
            throw new Error(this._url +
                            " is not responding; save did not work.");
        }.bind(this)));
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
