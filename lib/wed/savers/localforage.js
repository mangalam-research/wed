/**
 * @module savers/localforage
 * @desc Data saving functionality, using localforage.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:savers/localforage */
    function (require, exports, module) {
'use strict';
var saver = require("../saver");
var oop = require("../oop");
var localforage = require("localforage");

/**
 * Configure localforage for usage by wed. This function must be
 * called before trying to access localforage.
 */
function config() {
    localforage.config({
        name: 'wed',
        storeName: 'files',
        // This is the version of the database created by localforage,
        // and nothing else!
        version: 1
    });
}

/**
 * @typedef Options
 * @type {Object}
 * @property {string} name The "name" of the file to save. This is the
 * key used to save the file in localforage.
 */

/**
 * @classdesc Defines a saver that uses localforage to save documents.
 *
 * This saver stores the document as a "file" into a localforage
 * instance. The objects are not really files but similar to
 * files. Henceforth, the name "file" will be used without quotes to
 * refer to the objects stored. See {@link module:files files} for a
 * description of how these files are managed.
 *
 * @param {string} version The version of wed for which this object is
 * created.
 * @param {module:tree_updater~TreeUpdater} data_updater The updater
 * that the editor created for its data tree.
 * @param {Node} data_tree The editor's data tree.
 * @param {module:savers/localforage~Options} options
 * The options specific to this class.
 */
function Saver(version, data_updater, data_tree, options) {
    saver.Saver.call(this, version, data_updater, data_tree);

    this._initialized = true;
    this._setCondition("initialized");
    this._failed = false;
    this._name = options.name;

    config();

    this.setAutosaveInterval(5 * 60 * 1000);
}

oop.inherit(Saver, saver.Saver);

/**
 * @typedef FileRecord
 * @type Object
 * @property {number} version The format version of the record.
 * @property {string} name The name of the file.
 * @property {string} data The data in the file.
 * @property {Date|string} uploaded The last date at which the file
 * was uploaded or the string "never".
 * @property {Date|string} saved The last date at which the file was
 * saved or the string "never".
 * @property {Date|string} downloaded The last date at which the file
 * was downloaded or the string "never".
 */

/**
 * Utility function used to make file records.
 *
 * @param {string} name The name of the file.
 * @param {string} data The data to save.
 * @returns {module:savers/localforage~FileRecord} The record.
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

Saver.prototype._save = function (autosave, done) {
    if (!this._initialized)
        return;

    // We must store this value now because a modifying operation
    // could occur after the data is sent to the server but before we
    // can be sure the data is saved.
    var saving_generation = this._current_generation;


    this._update(this._name, this.getData(), autosave,
                 saving_generation, done);
};

Saver.prototype._update = function (name, data, autosave, saving_generation,
                                    cb) {
    var me = this;
    localforage.getItem(name).then(function (rec) {
        if (rec.version !== 1)
            throw new Error("unexpected record version number: " + rec.version);
        rec.data = data;
        rec.saved = new Date();
        localforage.setItem(name, rec, function (err) {
            if (err) {
                me._fail({type: undefined, msg: "Failed to save!"});
                return;
            }
            me._saveSuccess(autosave, saving_generation);
        });
    });
};

Saver.prototype._recover = function (done) {
    this._save(false, done);
};

exports.Saver = Saver;
exports.config = config;
exports.makeFileRecord = makeFileRecord;

});
