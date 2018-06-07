/**
 * Facilities for reading metadata stored as JSON.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import Ajv from "ajv";

import { Metadata } from "./metadata";
import { MetadataReader } from "./metadata-reader";

/**
 * Base class for all JSON readers.
 */
export abstract class MetadataJSONReader implements MetadataReader {
  /** The cached validator. */
  private _validator: Ajv.ValidateFunction | undefined;

  /**
   * @param schema The JSON schema with which to validate the metadata.
   */
  constructor(private readonly schema: {}) {}

  /**
   * A validator that uses the schema set for this reader.
   */
  protected get validator(): Ajv.ValidateFunction {
    if (this._validator === undefined) {
      const ajv = new Ajv();
      this._validator = ajv.compile(this.schema);
    }

    return this._validator;
  }

  read(object: Object): Metadata {
    this.validate(object);
    return this.convert(object);
  }

  /**
   * Validate the object against the schema that was set for this reader.
   *
   * @param object The object to validate.
   */
  private validate(object: Object): void {
    const validator = this.validator;
    const valid = validator(object) as boolean;
    if (!valid) {
      if (validator.errors === undefined) {
        throw new Error("metadata JSON invalid but no errors!");
      }
      const error = new Error("failed to validate");
      // Yes, we cheat. This is not meant to be a full-fledged diagnosis
      // mechanism.
      // tslint:disable-next-line:no-any
      (error as any).jsonErrors = validator.errors;
      throw error;
    }
  }

  /**
   * Convert the object to a metadata instance.
   *
   * @param object The object to convert.
   *
   * @returns A new metadata instance.
   */
  protected abstract convert(object: Object): Metadata;
}

//  LocalWords:  MPL
