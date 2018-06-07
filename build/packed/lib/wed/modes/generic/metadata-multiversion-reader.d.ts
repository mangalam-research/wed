/**
 * Reading facilities that allow reading different versions of a metadata file.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Metadata } from "./metadata";
import { MetadataReader } from "./metadata-reader";
/**
 * This interface must be implemented by the classes that can participate in the
 * work done by [[MetadataMultiversionReader]].
 */
export interface VersionedReader {
    new (...args: void[]): MetadataReader;
    version: string;
}
/**
 * A metadata reader that automatically handles different versions of the
 * metadata format.
 */
export declare class MetadataMultiversionReader implements MetadataReader {
    private static readonly versionToConstructor;
    static init(): void;
    read(object: Object): Metadata;
}
