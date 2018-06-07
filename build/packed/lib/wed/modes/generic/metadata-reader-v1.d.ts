import { MetadataReaderBase } from "./metadata-versioned-reader";
/**
 * A reader that reads version 1 of the metadata format.
 */
export declare class MetadataReaderV1 extends MetadataReaderBase {
    static readonly version: string;
    constructor();
}
