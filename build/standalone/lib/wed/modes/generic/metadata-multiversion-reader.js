/**
 * Reading facilities that allow reading different versions of a metadata file.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "./metadata-reader-v1", "./metadata-reader-v2"], function (require, exports, module, metadata_reader_v1_1, metadata_reader_v2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A metadata reader that automatically handles different versions of the
     * metadata format.
     */
    var MetadataMultiversionReader = /** @class */ (function () {
        function MetadataMultiversionReader() {
        }
        MetadataMultiversionReader.init = function () {
            var readers = [metadata_reader_v1_1.MetadataReaderV1, metadata_reader_v2_1.MetadataReaderV2];
            for (var _i = 0, readers_1 = readers; _i < readers_1.length; _i++) {
                var reader = readers_1[_i];
                MetadataMultiversionReader.versionToConstructor[reader.version] = reader;
            }
        };
        MetadataMultiversionReader.prototype.read = function (object) {
            // tslint:disable-next-line:no-any
            var version = object.version;
            if (version === undefined) {
                throw new Error("no version field, cannot decode metadata");
            }
            var ctor = MetadataMultiversionReader.versionToConstructor[version];
            if (ctor === undefined) {
                throw new Error("cannot handle version " + version);
            }
            return new ctor().read(object);
        };
        MetadataMultiversionReader.versionToConstructor = Object.create(null);
        return MetadataMultiversionReader;
    }());
    exports.MetadataMultiversionReader = MetadataMultiversionReader;
    MetadataMultiversionReader.init();
});
//  LocalWords:  MPL

//# sourceMappingURL=metadata-multiversion-reader.js.map
