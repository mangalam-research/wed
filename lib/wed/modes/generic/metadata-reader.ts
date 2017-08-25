/**
 * Facilities for reading metadata files.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { Metadata } from "./metadata";

/**
 * Interface that objects reading metadata must implement. Note that the
 * metadata must have already been loaded beforehand. Objects implementing this
 * interface are "readers" in the sense that they read an object and produce a
 * [[Metadata]] object out of it.
 */
export interface MetadataReader {
  /**
   * Read an object and convert it to a metadata instance.
   *
   * @param object A plain object that holds the metadata to be read.
   */
  read(object: Object): Metadata;
}

//  LocalWords:  MPL
