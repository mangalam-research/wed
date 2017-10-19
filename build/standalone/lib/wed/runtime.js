/**
 * An execution runtime for editors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "dexie", "merge-options", "./ajax", "./util"], function (require, exports, module, dexie_1, mergeOptions, ajax_1, util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An object representing the runtime environment in which an editor is
     * running. In particular it allows loading external resources.
     */
    var Runtime = /** @class */ (function () {
        function Runtime(options) {
            // Make a deep copy.
            options = mergeOptions({}, options);
            this.options = options;
            var bluejaxOptions = options.bluejaxOptions != null ?
                options.bluejaxOptions : {
                tries: 3,
                delay: 100,
                diagnose: {
                    on: true,
                    // It would be desirable to support this...
                    // serverURL: "/ping",
                    knownServers: [
                        // tslint:disable:no-http-string
                        "http://www.google.com/",
                        "http://www.cloudfront.com/",
                    ],
                },
            };
            var made = ajax_1.make(bluejaxOptions);
            this.ajax = made.ajax;
            this.ajax$ = made.ajax$;
        }
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
        // The promise must resolve to any because when we address a field we really
        // can get anything.
        //
        // tslint:disable-next-line:no-any
        Runtime.prototype.resolve = function (resource) {
            var _this = this;
            return Promise.resolve().then(function () {
                var schemeSep = resource.indexOf("://");
                if (schemeSep === -1) {
                    return _this.ajax({
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
                    var table_1 = parts[2];
                    var keyType = parts[3];
                    var key_1 = parts[4];
                    var property_1 = parts[5];
                    if (version !== "v1") {
                        throw new Error("unsupported version number: " + version);
                    }
                    switch (keyType) {
                        case "string":
                            break;
                        case "number":
                            key_1 = Number(key_1);
                            break;
                        default:
                            throw new Error("unknown type: " + keyType);
                    }
                    var store_1 = new dexie_1.Dexie(db);
                    return store_1.open()
                        .then(function () { return store_1.table(table_1).get(key_1); })
                        .then(function (record) {
                        if (record == null) {
                            throw Error("cannot resolve key from: " + resource);
                        }
                        if (property_1 === undefined) {
                            return record;
                        }
                        if (!(property_1 in record)) {
                            throw Error("cannot resolve property in the record of: " + resource);
                        }
                        return record[property_1];
                    });
                }
                throw new Error("unknown scheme: " + scheme);
            });
        };
        Runtime.prototype.resolveToString = function (resource) {
            return this.resolve(resource).then(function (data) {
                if (typeof data === "string") {
                    return data;
                }
                if (data instanceof File) {
                    return util.readFile(data);
                }
                return String(data);
            });
        };
        /**
         * Resolve modules through the underlying module loader.
         *
         * @param resources A single module name or an array of such names.
         *
         * @returns promise of modules.
         */
        Runtime.prototype.resolveModules = function (resources) {
            return Promise.resolve().then(function () {
                if (!(resources instanceof Array)) {
                    resources = [resources];
                }
                return new Promise(function (resolve, reject) {
                    // tslint:disable-next-line:no-require-imports non-literal-require
                    require(resources, function success() {
                        resolve(Array.prototype.slice.call(arguments));
                    }, reject);
                });
            });
        };
        return Runtime;
    }());
    exports.Runtime = Runtime;
});
//  LocalWords:  runtime MPL serverURL IndexedDB indexeddb keyType

//# sourceMappingURL=runtime.js.map
