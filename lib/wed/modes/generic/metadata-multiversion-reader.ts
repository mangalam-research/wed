/**
 * Reading facilities that allow reading different versions of a metadata file.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { Metadata } from "./metadata";
import { MetadataReader } from "./metadata-reader";
import { MetadataReaderV1 } from "./metadata-reader-v1";
import { MetadataReaderV2 } from "./metadata-reader-v2";

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
export class MetadataMultiversionReader implements MetadataReader {
  private static readonly versionToConstructor:
  Record<string, VersionedReader> = Object.create(null);

  static init(): void {
    const readers = [MetadataReaderV1, MetadataReaderV2];
    for (const reader of readers) {
      MetadataMultiversionReader.versionToConstructor[reader.version] = reader;
    }
  }

  read(object: Object): Metadata {
    // tslint:disable-next-line:no-any
    const version = (object as any).version;
    if (version === undefined) {
      throw new Error("no version field, cannot decode metadata");
    }

    const ctor = MetadataMultiversionReader.versionToConstructor[version];
    if (ctor === undefined) {
      throw new Error(`cannot handle version ${version}`);
    }

    return new ctor().read(object);
  }
}

MetadataMultiversionReader.init();

//  LocalWords:  MPL
