import { MetadataReaderBase } from "./metadata-versioned-reader";
/**
 * A reader that reads version 2 of the metadata format.
 */
export declare class MetadataReaderV2 extends MetadataReaderBase {
    static readonly version: string;
    constructor();
}
