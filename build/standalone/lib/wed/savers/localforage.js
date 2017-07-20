/**
 * Data saving functionality, using localforage. Note that this saver is mainly
 * designed for demonstration purposes.
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
define(["require", "exports", "module", "bluebird", "localforage", "../saver"], function (require, exports, module, Promise, localforage, saver) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Create a localforage store instance. If you have code that needs to
     * access the store that this saver uses. You need to call this
     * function first.
     *
     * @returns A configured localforage instance.
     */
    function config() {
        return localforage.createInstance({
            name: "wed",
            storeName: "files",
        });
    }
    exports.config = config;
    /**
     * Utility function used to make file records.
     *
     * @param name The name of the file.
     *
     * @param data The data to save.
     *
     * @returns The record.
     */
    function makeFileRecord(name, data) {
        var ret = Object.create(null);
        ret.version = 1;
        ret.name = name;
        ret.data = data;
        ret.uploaded = new Date();
        ret.saved = "never";
        ret.downloaded = "never";
        return ret;
    }
    exports.makeFileRecord = makeFileRecord;
    /**
     * Defines a saver that uses localforage to save documents.
     *
     * This saver stores the document as a "file" into a localforage instance. The
     * objects are not really files but similar to files. Henceforth, the name
     * "file" will be used without quotes to refer to the objects stored.
     */
    var Saver = (function (_super) {
        __extends(Saver, _super);
        /**
         * @param runtime The runtime under which this saver is created.
         *
         * @param version The version of wed for which this object is created.
         *
         * @param dataUpdater The updater that the editor created for its data tree.
         *
         * @param dataTree The editor's data tree.
         *
         * @param options The options specific to this class.
         */
        function Saver(runtime, version, dataUpdater, dataTree, options) {
            var _this = _super.call(this, runtime, version, dataUpdater, dataTree) || this;
            _this.initPromise = Promise.resolve();
            _this.initialized = true;
            _this.failed = false;
            _this.name = options.name;
            _this.store = config();
            _this.setAutosaveInterval(5 * 60 * 1000);
            return _this;
        }
        Saver.prototype.init = function () {
            // It is initialized from the get-go.
            return this.initPromise;
        };
        Saver.prototype._save = function (autosave) {
            var _this = this;
            return Promise.resolve().then(function () {
                if (!_this.initialized) {
                    return;
                }
                return _this._update(_this.name, _this.getData(), autosave, _this.currentGeneration)
                    .catch(function () { return undefined; });
            });
        };
        Saver.prototype._update = function (name, data, autosave, savingGeneration) {
            var _this = this;
            return this.store.getItem(name).then(function (rec) {
                if (rec.version !== 1) {
                    throw new Error("unexpected record version number: " + rec.version);
                }
                rec.data = data;
                rec.saved = new Date();
                return _this.store.setItem(name, rec).then(function () {
                    _this._saveSuccess(autosave, savingGeneration);
                }).catch(function () {
                    var error = { type: undefined, msg: "Failed to save!" };
                    _this._fail(error);
                    throw new Error("save failed");
                });
                // tslint:disable-next-line:no-any
            });
        };
        Saver.prototype._recover = function () {
            return this._save(false)
                .then(function () { return true; })
                .catch(function () { return false; });
        };
        return Saver;
    }(saver.Saver));
    exports.Saver = Saver;
});

//# sourceMappingURL=localforage.js.map
