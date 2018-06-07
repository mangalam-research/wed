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
define(["require", "exports", "./metadata-versioned-reader"], function (require, exports, metadata_versioned_reader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:completed-docs
    var MetadataV1 = /** @class */ (function (_super) {
        __extends(MetadataV1, _super);
        function MetadataV1(metadata) {
            return _super.call(this, "1", metadata) || this;
        }
        MetadataV1.prototype.isInline = function (_node) {
            return false;
        };
        MetadataV1.prototype.documentationLinkFor = function (name) {
            var root = this.metadata.dochtml;
            if (root === undefined) {
                return undefined;
            }
            var unresolved = this.unresolveName(name);
            if (unresolved === undefined) {
                return undefined;
            }
            // The TEI odd2html stylesheet creates file names of the form
            // prefix_local-name.html. So replace the colon with an underscore.
            unresolved = unresolved.replace(":", "_");
            return root + "ref-" + unresolved + ".html";
        };
        return MetadataV1;
    }(metadata_versioned_reader_1.MetadataBase));
    /**
     * A reader that reads version 1 of the metadata format.
     */
    var MetadataReaderV1 = /** @class */ (function (_super) {
        __extends(MetadataReaderV1, _super);
        function MetadataReaderV1() {
            return _super.call(this, MetadataV1) || this;
        }
        MetadataReaderV1.version = "1";
        return MetadataReaderV1;
    }(metadata_versioned_reader_1.MetadataReaderBase));
    exports.MetadataReaderV1 = MetadataReaderV1;
});
//  LocalWords:  MPL TEI html stylesheet
//# sourceMappingURL=metadata-reader-v1.js.map