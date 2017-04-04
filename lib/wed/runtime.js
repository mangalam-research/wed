/**
 * @module runtime
 * @desc An execution runtime for editors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:runtime */function f(require, exports) {
  "use strict";
  var Promise = require("bluebird");
  var util = require("./util");
  var merge_options = require("merge-options");
  var ajax = require("./ajax");
  var Dexie = require("dexie");

  function Runtime(options) {
    // Make a private deep copy.
    options = merge_options({}, options);
    this.options = options;
    var bluejaxOptions = options.bluejaxOptions || {
      tries: 3,
      delay: 100,
      diagnose: {
        on: true,
        // It would be desirable to support this...
        // serverURL: "/ping",
        knownServers: [
          "http://www.google.com/",
          "http://www.cloudfront.com/",
        ],
      },
    };
    var made = ajax(bluejaxOptions);

    this.ajax = made.ajax;
    this.$ajax = made.$ajax;
  }

  var RuntimeP = Runtime.prototype;

  /**
   * Resolve resource references. References may be of the form:
   *
   * - String without a URL scheme identifier. Performs an Ajax query with the
   *   resource string as-is.
   *
   * - `indexeddb://v1/database/table/type/key/property` Loads from
   *    IndexedDB. It opens the database `database`, looks for the table
   *    `table`, loads the item with primary key `key` and extracts the value of
   *    the property `property`. (`property` is optional. When not specified,
   *    the whole record will be returned.) The `type` must have the values
   *    `number` or `string` determining how `key` is going to be
   *    interpreted. `v1` is the version number of the interpretation scheme
   *    used.
   */
  RuntimeP.resolve = function resolve(resource) {
    var me = this;
    return Promise.resolve().then(function tryIt() {
      var schemeSep = resource.indexOf("://");

      if (schemeSep === -1) {
        return me.ajax({
          url: resource,
          dataType: "text",
        });
      }

      var scheme = resource.substr(0, schemeSep);
      if (scheme === "indexeddb") {
        var path = resource.substr(schemeSep + 3);
        var parts = path.split("/");
        var version = parts[0];
        var db = parts[1];
        var table = parts[2];
        var type = parts[3];
        var key = parts[4];
        var property = parts[5];

        if (version !== "v1") {
          throw new Error("unsupported version number: " + version);
        }

        switch (type) {
        case "string":
          break;
        case "number":
          key = +key;
          break;
        default:
          throw new Error("unknown type: " + type);
        }

        var store = new Dexie(db);
        return store.open()
          .then(function opened() {
            return store.table(table).get(key);
          })
          .then(function got(record) {
            if (!record) {
              throw Error("cannot resolve key from: " + resource);
            }

            if (!property) {
              return record;
            }

            if (!(property in record)) {
              throw Error("cannot resolve property in the record of: " +
                          resource);
            }

            return record[property];
          });
      }

      throw new Error("unknown scheme: " + scheme);
    });
  };

  RuntimeP.resolveToString = function resolveToString(resource) {
    return this.resolve(resource).then(function resolved(data) {
      if (typeof data === "string") {
        return data;
      }

      if (data instanceof File) {
        return util.readFile(data);
      }

      return "" + data;
    });
  };

  /**
   * Resolve modules through the underlying module loader.
   *
   * @param { string | Array.<string>} resources A single module name or an
   * array of such names.
   *
   * @returns { Promise.<Array.<Object>> } A promise of modules.
   */
  RuntimeP.resolveModules = function resolveModules(resources) {
    return Promise.resolve().then(function tryIt() {
      if (!(resources instanceof Array)) {
        resources = [resources];
      }

      return new Promise(function make(resolve, reject) {
        require(resources, function success() {
          resolve(Array.prototype.slice.call(arguments));
        }, reject);
      });
    });
  };

  exports.Runtime = Runtime;
});
