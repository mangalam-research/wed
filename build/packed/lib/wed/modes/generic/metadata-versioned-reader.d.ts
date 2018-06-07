/**
 * Reading facilities common to all readers that read specific versions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { EName } from "salve";
import { Metadata } from "./metadata";
import { Metadata as MetadataInterface } from "./metadata-as-json";
import { MetadataJSONReader } from "./metadata-json-reader";
export declare abstract class MetadataBase implements Metadata {
    protected readonly metadata: MetadataInterface;
    readonly version: string;
    readonly generator?: string;
    readonly date?: string;
    protected readonly namespaceMappings: Record<string, string>;
    protected readonly reverseMappings: Record<string, string>;
    protected descMap: Record<string, string>;
    constructor(expectedVersion: string, metadata: MetadataInterface);
    getNamespaceMappings(): Record<string, string>;
    shortDescriptionFor(name: EName): string | undefined;
    abstract isInline(node: Element): boolean;
    abstract documentationLinkFor(name: EName): string | undefined;
    unresolveName(name: EName): string | undefined;
}
/**
 * A constructor of [[MetadataBase]] objects.
 */
export interface MetadataBaseCtor {
    new (...args: any[]): MetadataBase;
}
/**
 * A reader that reads a versioned format of the metadata.
 */
export declare class MetadataReaderBase extends MetadataJSONReader {
    protected readonly metadataClass: MetadataBaseCtor;
    static readonly version: string;
    constructor(metadataClass: MetadataBaseCtor);
    protected convert(object: Object): Metadata;
}
