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
define(["require", "exports", "module", "wed/util", "./doc-pattern", "./metadata-versioned-reader"], function (require, exports, module, util, doc_pattern_1, metadata_versioned_reader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Execution context for the [[DocPattern]] objects we evaluate with
     * [[MetadataV2]].
     */
    var MetadataContext = (function () {
        /**
         * @param name The value to return when we interpolate the symbol "name".
         */
        function MetadataContext(name) {
            this.name = name;
        }
        MetadataContext.prototype.resolveName = function (name) {
            if (name === "name") {
                return this.name;
            }
            throw new Error("cannot resolve: " + name);
        };
        return MetadataContext;
    }());
    // tslint:disable-next-line:completed-docs
    var MetadataV2 = (function (_super) {
        __extends(MetadataV2, _super);
        function MetadataV2(metadata) {
            var _this = _super.call(this, "2", metadata) || this;
            if (metadata.namespaces === undefined) {
                throw new Error("namespaces are not optional in version 2");
            }
            // The parent class already does this check but we need it to get TS to know
            // what specific type metadata.inline is.
            if (metadata.version !== "2") {
                throw new Error("need version 2");
            }
            _this.inline = metadata.inline;
            if (_this.inline !== undefined && _this.inline.method !== "name") {
                throw new Error("only the 'name' method is supported for inlines");
            }
            _this.dochtml = metadata.dochtml;
            if (_this.dochtml !== undefined) {
                if (_this.dochtml.method !== "simple-pattern") {
                    throw new Error("only the 'simple-pattern' method is supported for dochtml");
                }
                _this.docPattern = doc_pattern_1.compile(_this.dochtml.pattern);
            }
            return _this;
        }
        MetadataV2.prototype.isInline = function (node) {
            if (this.inline === undefined) {
                return false;
            }
            // We need to normalize the name to fit the names we have below.
            var originalName = util.getOriginalName(node);
            var parts = originalName.split(":");
            if (parts.length === 1) {
                parts[1] = parts[0];
                parts[0] = "tei";
            }
            var name = parts.join(":");
            var result = this.inline.rules[name];
            if (result === undefined) {
                return false;
            }
            return result;
        };
        MetadataV2.prototype.documentationLinkFor = function (name) {
            var docPattern = this.docPattern;
            if (docPattern === undefined) {
                return undefined;
            }
            var unresolved = this.unresolveName(name);
            if (unresolved === undefined) {
                return undefined;
            }
            return docPattern.execute(new MetadataContext(unresolved));
        };
        return MetadataV2;
    }(metadata_versioned_reader_1.MetadataBase));
    /**
     * A reader that reads version 2 of the metadata format.
     */
    var MetadataReaderV2 = (function (_super) {
        __extends(MetadataReaderV2, _super);
        function MetadataReaderV2() {
            return _super.call(this, MetadataV2) || this;
        }
        MetadataReaderV2.version = "2";
        return MetadataReaderV2;
    }(metadata_versioned_reader_1.MetadataReaderBase));
    exports.MetadataReaderV2 = MetadataReaderV2;
});

//# sourceMappingURL=metadata-reader-v2.js.map
