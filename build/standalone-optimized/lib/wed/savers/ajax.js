/**
 * Data saving functionality, using Ajax.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "merge-options", "wed"], function (require, exports, mergeOptions, wed_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Processes a list of messages received from the server.
     *
     * @param data The data received from the server.
     *
     * @returns An object which has for field names message types and for field
     * values a message of the corresponding type.
     *
     * @throws {Error} If there is more than one message of the same type in the
     * data being processed.
     */
    function getMessages(data) {
        var raw = data.messages;
        if (raw === undefined || raw.length === 0) {
            return undefined;
        }
        var ret = {};
        for (var _i = 0, raw_1 = raw; _i < raw_1.length; _i++) {
            var msg = raw_1[_i];
            // When we parse responses from the server it is not possible to get an
            // answer for which msg.type is undefined.
            var errType = msg.type;
            if (ret[errType] !== undefined) {
                throw new Error("same type of message appearing more than " +
                    "once in one transaction");
            }
            ret[errType] = msg;
        }
        return ret;
    }
    /**
     * A saver responsible for communicating with a server to save the data edited
     * by a wed editor.
     *
     * @param runtime The runtime under which this saver is created.
     *
     * @param version The version of wed for which this object is created.
     *
     * @param dataUpdater The updater that the editor created for its data tree.
     *
     * @param {Node} dataTree The editor's data tree.
     *
     * @param options The options specific to this class.
     */
    var AjaxSaver = /** @class */ (function (_super) {
        __extends(AjaxSaver, _super);
        function AjaxSaver(runtime, version, dataUpdater, dataTree, options) {
            var _this = _super.call(this, runtime, version, dataUpdater, dataTree, options) || this;
            var headers = options.headers;
            _this.headers = headers != null ? headers : {};
            // This value is saved with the double quotes around it so that we can just
            // pass it to 'If-Match'.
            var initial_etag = options.initial_etag;
            _this.etag = initial_etag != null ? "\"" + initial_etag + "\"" : undefined;
            _this.url = options.url;
            // Every 5 minutes.
            _this.setAutosaveInterval(5 * 60 * 1000);
            return _this;
        }
        AjaxSaver.prototype.init = function () {
            var _this = this;
            return this._post({ command: "check", version: this.version }, "json")
                .then(function () {
                _this.initialized = true;
                _this.failed = false;
            })
                .catch(function () {
                // This effectively aborts the editing session. This is okay, since
                // there's a good chance that the issue is major.
                throw new Error(_this.url + " is not responding to a check; saving is not possible.");
            });
        };
        AjaxSaver.prototype._save = function (autosave) {
            var _this = this;
            return Promise.resolve().then(function () {
                if (!_this.initialized) {
                    return;
                }
                // We must store this value now because a modifying operation could occur
                // after the data is sent to the server but before we can be sure the data
                // is saved.
                var savingGeneration = _this.currentGeneration;
                var ignore = false;
                return _this._post({
                    command: autosave ? "autosave" : "save",
                    version: _this.version,
                    data: _this.getData(),
                }, "json")
                    .catch(function () {
                    ignore = true;
                    var error = {
                        msg: "Your browser cannot contact the server",
                        type: "save_disconnected",
                    };
                    _this._fail(error);
                })
                    .then(function (data) {
                    if (ignore) {
                        return;
                    }
                    var msgs = getMessages(data);
                    if (msgs === undefined) {
                        _this._fail();
                        throw new Error("The server accepted the save request but did not return any information regarding whether the save was successful or not.");
                    }
                    if (msgs.save_fatal_error !== undefined) {
                        _this._fail();
                        throw new Error("The server was not able to save the data due to a fatal error. Please contact technical support before trying to edit again.");
                    }
                    if (msgs.save_transient_error !== undefined) {
                        _this._events.next({ name: "Failed",
                            error: msgs.save_transient_error });
                        return;
                    }
                    if (msgs.save_edited !== undefined) {
                        _this._fail(msgs.save_edited);
                        return;
                    }
                    if (msgs.save_successful === undefined) {
                        _this._fail();
                        throw new Error("Unexpected response from the server while saving. Please contact technical support before trying to edit again.");
                    }
                    if (msgs.version_too_old_error !== undefined) {
                        _this._fail({ type: "too_old", msg: "" });
                        return;
                    }
                    _this._saveSuccess(autosave, savingGeneration);
                });
            });
        };
        AjaxSaver.prototype._recover = function () {
            var success = function (data) {
                var msgs = getMessages(data);
                if (msgs === undefined) {
                    return false;
                }
                if (msgs.save_fatal_error !== undefined) {
                    return false;
                }
                if (msgs.save_successful === undefined) {
                    return false;
                }
                return true;
            };
            return this._post({
                command: "recover",
                version: this.version,
                data: this.getData(),
            }, "json")
                .then(success)
                .catch(function () { return false; });
        };
        /**
         * Utility wrapper for Ajax queries. Read the code for more information.
         *
         * @private
         *
         * @param data
         * @param dataType
         *
         * @returns A promise that resolves when the post is over.
         */
        AjaxSaver.prototype._post = function (data, dataType) {
            var _this = this;
            var headers;
            if (this.etag !== undefined) {
                headers = mergeOptions(this.headers, {
                    "If-Match": this.etag,
                });
            }
            else {
                headers = this.headers;
            }
            return this.runtime.ajax({
                type: "POST",
                url: this.url,
                data: data,
                dataType: dataType,
                headers: headers,
                bluejaxOptions: {
                    verboseResults: true,
                },
            }).then(function (_a) {
                var reply = _a[0], jqXHR = _a[2];
                var msgs = getMessages(reply);
                // Unsuccessful operations don't have a valid etag.
                if (msgs !== undefined && msgs.save_successful !== undefined) {
                    _this.etag = jqXHR.getResponseHeader("ETag");
                }
                return reply;
                // tslint:disable-next-line:no-any
            }).catch(function (bluejaxError) {
                var jqXHR = bluejaxError.jqXHR;
                // This is a case where a precondition failed.
                if (jqXHR.status === 412) {
                    // We transform the 412 status into a Response object that will
                    // produce the right reaction.
                    return {
                        messages: [{
                                msg: "The document was edited by someone else.",
                                type: "save_edited",
                            }],
                    };
                }
                throw bluejaxError;
            });
        };
        return AjaxSaver;
    }(wed_1.saver.Saver));
    exports.Saver = AjaxSaver;
});
//  LocalWords:  MPL ETag runtime etag json url autosave
//# sourceMappingURL=ajax.js.map