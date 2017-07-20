/**
 * Reading facilities common to all readers that read specific versions.
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
define(["require", "exports", "module", "./metadata-json-reader", "./metadata-schema.json"], function (require, exports, module, metadata_json_reader_1, metadataSchema) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:completed-docs
    var MetadataBase = (function () {
        function MetadataBase(expectedVersion, metadata) {
            this.metadata = metadata;
            this.reverseMapping = Object.create(null);
            this.descMap = Object.create(null);
            if (metadata.version !== expectedVersion) {
                throw new Error("incorrect version number: expected " + expectedVersion + ", got " + metadata.version);
            }
            this.version = metadata.version;
            this.generator = metadata.generator;
            this.date = metadata.date;
            if (metadata.namespaces !== undefined) {
                this.namespaceMappings = metadata.namespaces;
            }
            else {
                this.namespaceMappings = Object.create(null);
            }
            if ("xml" in this.namespaceMappings) {
                throw new Error("xml mapping already defined");
            }
            // tslint:disable-next-line:no-http-string
            this.namespaceMappings.xml = "http://www.w3.org/XML/1998/namespace";
            // tslint:disable-next-line:forin
            for (var prefix in this.namespaceMappings) {
                var ns = this.namespaceMappings[prefix];
                // If prefix foo resolves to http://bar and bar resolves to the same URI
                // and foo is before bar, then foo wins.
                if (this.reverseMapping[ns] === undefined) {
                    this.reverseMapping[ns] = prefix;
                }
            }
            this.reverseMapping[this.namespaceMappings[""]] = "";
            var elements = metadata.elements;
            if (elements !== undefined) {
                var descMap = this.descMap;
                for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
                    var el = elements_1[_i];
                    // Here, an undefined namespace is the tei namespace.
                    var elNs = el.ns !== undefined ? el.ns :
                        // tslint:disable-next-line:no-http-string
                        "http://www.tei-c.org/ns/1.0";
                    var elPrefix = this.reverseMapping[elNs];
                    if (elPrefix === undefined) {
                        throw new Error("undefined namespace: " + elNs);
                    }
                    var name_1 = elPrefix === "" ? el.name : elPrefix + ":" + el.name;
                    descMap[name_1] = el.desc;
                }
            }
        }
        MetadataBase.prototype.getNamespaceMappings = function () {
            return this.namespaceMappings;
        };
        MetadataBase.prototype.shortDescriptionFor = function (name) {
            var unresolved = this.unresolveName(name);
            if (unresolved === undefined) {
                return undefined;
            }
            return this.descMap[unresolved];
        };
        /**
         * Unresolve a name using the mapping defined by the metadata.
         *
         * @param name The name to unresolve.
         *
         * @returns The unresolved name or ``undefined`` if the name cannot be
         * unresolved.
         */
        MetadataBase.prototype.unresolveName = function (name) {
            var prefix = this.reverseMapping[name.ns];
            if (prefix === undefined) {
                return undefined;
            }
            return (prefix === "") ? name.name : prefix + ":" + name.name;
        };
        return MetadataBase;
    }());
    exports.MetadataBase = MetadataBase;
    /**
     * A reader that reads a versioned format of the metadata.
     */
    var MetadataReaderBase = (function (_super) {
        __extends(MetadataReaderBase, _super);
        function MetadataReaderBase(metadataClass) {
            var _this = _super.call(this, metadataSchema) || this;
            _this.metadataClass = metadataClass;
            return _this;
        }
        MetadataReaderBase.prototype.convert = function (object) {
            return new this.metadataClass(object);
        };
        MetadataReaderBase.version = "1";
        return MetadataReaderBase;
    }(metadata_json_reader_1.MetadataJSONReader));
    exports.MetadataReaderBase = MetadataReaderBase;
});

//# sourceMappingURL=metadata-versioned-reader.js.map
