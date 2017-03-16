/**
 * @module savers/indexeddb
 * @desc Data saving functionality, using IndexedDB. Note that this
 *       saver is mainly designed for demonstration purposes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:savers/indexeddb */ function f(require, exports) {
  "use strict";
  var saver = require("../saver");
  var oop = require("../oop");

  /**
   * @typedef Options
   * @type {Object}
   * @property {string} name The "name" of the file to save. This is the
   * key used to save the file in localforage.
   * @property {function} getStore A function that returns a store.
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

    this._store = options.getStore();
    this.setAutosaveInterval(5 * 60 * 1000);
  }

  oop.inherit(Saver, saver.Saver);

  Saver.prototype._save = function _save(autosave, done) {
    if (!this._initialized) {
      return;
    }

    // We must store this value now because a modifying operation
    // could occur after the data is sent to the server but before we
    // can be sure the data is saved.
    var saving_generation = this._current_generation;

    this._update(this._name, this.getData(), autosave,
                 saving_generation, done);
  };

  Saver.prototype._update = function _update(name, data, autosave,
                                             saving_generation,
                                             cb) {
    var me = this;
    this._store.put(name, data).then(function itemSet() {
      me._saveSuccess(autosave, saving_generation);
      if (cb) {
        cb(null);
      }
    }).catch(function failed() {
      var error = { type: undefined, msg: "Failed to save!" };
      me._fail(error);
      if (cb) {
        cb(error);
      }
    });
  };

  Saver.prototype._recover = function _recover(done) {
    this._save(false, done);
  };

  exports.Saver = Saver;
});
