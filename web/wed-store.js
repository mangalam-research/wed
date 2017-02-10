/**
 * @desc The "wed store" for the dashboard.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var store = require("dashboard/store");
  var xmlFile = require("dashboard/xml-file");

  var db = store.db;

  /**
   * This class is essentially an adapter between what the IndexedDB saver in
   * wed expects to be able to do, and what the dashboard wants. At the moment,
   * it is a simple wrapper around the store.
   */
  function WedStore() {
    this._store = db;
  }

  WedStore.prototype.get = function get(name) {
    return this._store.files.get({ name: name });
  };

  WedStore.prototype.put = function put(rec) {
    return this._store.files.put(rec);
  };

  // Right now this function is mostly used in testing.
  WedStore.prototype.makeFileRecord = function makeFileRecord(name, data) {
    return new xmlFile.XMLFile(name, data);
  };

  return new WedStore();
});
