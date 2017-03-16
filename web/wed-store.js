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
  var Chunk = require("dashboard/chunk").Chunk;

  var db = store.db;

  /**
   * This class is essentially an adapter between what the IndexedDB saver in
   * wed expects to be able to do, and what the dashboard wants. At the moment,
   * it is a simple wrapper around the store.
   */
  function WedStore() {
    this._store = db;
  }

  /**
   * Safe a file of the given name "name" with the data "data".
   */
  WedStore.prototype.put = function put(name, data) {
    var me = this;
    return this._store.xmlfiles.get({ name: name })
      .then(function itemGot(rec) {
        if (rec.recordVersion !== 1) {
          throw new Error("unexpected record version number: " + rec.version);
        }

        return Chunk.makeChunk(data)
          .then(function chunked(chunk) {
            return me._store.chunks.put(chunk)
              .then(function savedChunk() {
                rec.savedChunk = chunk.id;
                rec.saved = new Date();
                return me._store.xmlfiles.put(rec);
              });
          });
      });
  };

  // Right now this function is mostly used in testing.
  WedStore.prototype.makeFileRecord = function makeFileRecord(name, data) {
    return new xmlFile.XMLFile(name, data);
  };

  return new WedStore();
});
