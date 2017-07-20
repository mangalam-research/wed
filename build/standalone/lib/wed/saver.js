/**
 * Base class for savers.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "bluebird", "rxjs", "./browsers", "./serializer"], function (require, exports, module, Promise, rxjs_1, browsers, serializer) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var SaveKind;
    (function (SaveKind) {
        SaveKind[SaveKind["AUTO"] = 1] = "AUTO";
        SaveKind[SaveKind["MANUAL"] = 2] = "MANUAL";
    })(SaveKind = exports.SaveKind || (exports.SaveKind = {}));
    function deltaToString(delta) {
        delta = Math.round(delta / 1000);
        var timeDesc = "moments ago";
        if (delta > 0) {
            timeDesc = " ≈ ";
            // To get a single digit after the decimal point, we divide by (factor /
            // 10), round the result, and then divide by 10. Note that this is imprecise
            // due to rounding errors in floating point arithmetics but we don't care.
            if (delta > 60 * 60 * 24) {
                timeDesc += Math.round(delta / (6 * 60 * 24)) / 10 + "d";
            }
            else if (delta > 60 * 60) {
                timeDesc += Math.round(delta / (6 * 60)) / 10 + "h";
            }
            else if (delta > 60) {
                timeDesc += Math.round(delta / 6) / 10 + "m";
            }
            else {
                timeDesc += delta + "s";
            }
            timeDesc += " ago";
        }
        return timeDesc;
    }
    /**
     * A saver is responsible for saving a document's data. This class cannot be
     * instantiated as-is, but only through subclasses.
     */
    var Saver = (function () {
        /**
         * @param runtime The runtime under which this saver is created.
         *
         * @param version The version of wed for which this object is created.
         *
         * @param dataUpdater The updater that the editor created for its data tree.
         *
         * @param {Node} dataTree The editor's data tree.
         */
        function Saver(runtime, version, dataUpdater, dataTree) {
            var _this = this;
            this.runtime = runtime;
            this.version = version;
            this.dataUpdater = dataUpdater;
            this.dataTree = dataTree;
            /**
             * Subclasses must set this variable to true once they have finished with
             * their initialization.
             */
            this.initialized = false;
            /**
             * The generation that is currently being edited.  It is mutable. Derived
             * classes can read it but not modify it.
             */
            this.currentGeneration = 0;
            /**
             * The generation that has last been saved. Derived classes can read it but
             * not modify it.
             */
            this.savedGeneration = 0;
            dataUpdater.events.subscribe(function (ev) {
                if (ev.name !== "Changed") {
                    return;
                }
                _this.lastModification = Date.now();
                if (_this.savedGeneration === _this.currentGeneration) {
                    _this.currentGeneration++;
                    _this._events.next({ name: "Changed" });
                }
            });
            /**
             * The _autosave method, pre-bound to ``this``.
             * @private
             */
            this._boundAutosave = this._autosave.bind(this);
            this._events = new rxjs_1.Subject();
            this.events = this._events.asObservable();
        }
        /**
         * This method must be called when the user manually initiates a save.
         *
         * @returns A promise which resolves if the save was successful.
         */
        Saver.prototype.save = function () {
            return this._save(false);
        };
        /**
         * This method returns the data to be saved in a save operation. Derived
         * classes **must** call this method rather than get the data directly from
         * the data tree.
         */
        Saver.prototype.getData = function () {
            var child = this.dataTree.firstChild;
            if (browsers.MSIE) {
                return serializer.serialize(child);
            }
            return child.outerHTML;
        };
        /**
         * Must be called by derived class upon a successful save.
         *
         * @param autosave ``true`` if called for an autosave operation, ``false`` if
         * not.
         *
         * @param savingGeneration The generation being saved. It is necessary to pass
         * this value due to the asynchronous nature of some saving operations.
         */
        Saver.prototype._saveSuccess = function (autosave, savingGeneration) {
            // If we get here, we've been successful.
            this.savedGeneration = savingGeneration;
            this.lastSave = Date.now();
            this.lastSaveKind = autosave ? SaveKind.AUTO : SaveKind.MANUAL;
            this._events.next(autosave ? { name: "Autosaved" } : { name: "Saved" });
            // This resets the countdown to now.
            this.setAutosaveInterval(this.autosaveInterval);
        };
        /**
         * Must be called by derived classes when they fail to perform their task.
         *
         * @param The error message associated with the failure. If the error message
         * is specified a ``failed`` event will be emitted. If not, no event is
         * emitted.
         */
        Saver.prototype._fail = function (error) {
            this.failed = true;
            if (error !== undefined) {
                this._events.next({ name: "Failed", error: error });
            }
        };
        /**
         * This is the function called internally when an autosave is needed.
         */
        Saver.prototype._autosave = function () {
            var _this = this;
            this.autosaveTimeout = undefined;
            var done = function () {
                // Calling ``setAutosaveInterval`` effectively starts a new timeout, and
                // takes care of possible race conditions. For instance, a call to
                // ``setAutosaveInterval`` could happen after the current timeout has
                // started saving but before ``done`` is called. This would launch a new
                // timeout. If the code here called ``setTimeout`` instead of
                // ``setAutosaveInterval`` then two timeouts would be running.
                _this.setAutosaveInterval(_this.autosaveInterval);
            };
            if (this.currentGeneration !== this.savedGeneration) {
                // We have something to save!
                this._save(true).then(done);
            }
            else {
                done();
            }
        };
        /**
         * Changes the interval at which autosaves are performed. Note that calling
         * this function will stop the current countdown and restart it from zero. If,
         * for instance, the previous interval was 5 minutes, and 4 minutes had
         * elapsed since the last save, the next autosave should happen one minute
         * from now. However, if I now call this function with a new interval of 4
         * minutes, this will cause the next autosave to happen 4 minutes after the
         * call, rather than one minute.
         *
         * @param interval The interval between autosaves in milliseconds. 0 turns off
         * autosaves.
         */
        Saver.prototype.setAutosaveInterval = function (interval) {
            this.autosaveInterval = interval;
            var oldTimeout = this.autosaveTimeout;
            if (oldTimeout !== undefined) {
                clearTimeout(oldTimeout);
            }
            this.autosaveTimeout = interval !== 0 ?
                setTimeout(this._boundAutosave, interval) : undefined;
        };
        /**
         * This method is to be used by wed upon encountering a fatal error. It will
         * attempt to record the last state of the data tree before wed dies.
         *
         * @returns A promise which resolves to ``undefined`` if the method did not do
         * anything because the Saver object is in an unintialized state or has
         * already failed. It resolves to ``true`` if the recovery operation was
         * successful, and ``false`` if not.
         */
        Saver.prototype.recover = function () {
            var _this = this;
            return Promise.resolve().then(function () {
                if (!_this.initialized || _this.failed) {
                    return Promise.resolve(undefined);
                }
                return _this._recover();
            });
        };
        /**
         * Returns information regarding whether the saver sees the data tree as
         * having been modified since the last save occurred.
         *
         * @returns Returns ``false`` if the tree has not been modified. Otherwise,
         * returns a string that describes how long ago the modification happened.
         */
        Saver.prototype.getModifiedWhen = function () {
            if (this.savedGeneration === this.currentGeneration) {
                return false;
            }
            return deltaToString(Date.now() - this.lastModification);
        };
        /**
         * Produces a string that indicates in human readable format when the last
         * save occurred.
         *
         * @returns The string. The value ``undefined`` is returned if no save has
         * occurred yet.
         */
        Saver.prototype.getSavedWhen = function () {
            if (this.lastSaveKind === undefined) {
                return undefined;
            }
            return deltaToString(Date.now() - this.lastSave);
        };
        /**
         * Returns the last kind of save that occurred.
         *
         * @returns {number|undefined} The kind. The value will be
         * ``undefined`` if there has not been any save yet.
         */
        Saver.prototype.getLastSaveKind = function () {
            return this.lastSaveKind;
        };
        return Saver;
    }());
    exports.Saver = Saver;
});
//  LocalWords:  jQuery jquery url jshint validthis Dubeau MPL oop
//  LocalWords:  Mangalam mixin's json unintialized param dataType
//  LocalWords:  SimpleEventEmitter

//# sourceMappingURL=saver.js.map
