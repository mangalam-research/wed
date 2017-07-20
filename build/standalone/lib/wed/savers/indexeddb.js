/**
 * Data saving functionality, using IndexedDB. Note that this saver is mainly
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
define(["require", "exports", "module", "bluebird", "../saver"], function (require, exports, module, Promise, saver) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Defines a saver that uses localforage to save documents.
     *
     * This saver stores the document as a "file" into an indexeddb instance. The
     * objects are not really files but similar to files. Henceforth, the name
     * "file" will be used without quotes to refer to the objects stored.
     *
     * @param version The version of wed for which this object is
     * created.
     *
     * @param dataUpdater The updater that the editor created for its data tree.
     *
     * @param dataTree The editor's data tree.
     *
     * @param options The options specific to this class.
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
            _this.store = options.getStore();
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
            return this.store.put(name, data).then(function () {
                _this._saveSuccess(autosave, savingGeneration);
            }).catch(function () {
                _this._fail({ type: undefined, msg: "Failed to save!" });
                throw new Error("save failed");
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

//# sourceMappingURL=indexeddb.js.map
