/**
 * Facilities for reading metadata stored as JSON.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as Ajv from "ajv";
import { Metadata } from "./metadata";
import { MetadataReader } from "./metadata-reader";
/**
 * Base class for all JSON readers.
 */
export declare abstract class MetadataJSONReader implements MetadataReader {
    private readonly schema;
    /** The cached validator. */
    private _validator;
    /**
     * @param schema The JSON schema with which to validate the metadata.
     */
    constructor(schema: string);
    /**
     * A validator that uses [[schema]].
     */
    protected readonly validator: Ajv.ValidateFunction;
    read(object: Object): Metadata;
    /**
     * Validate the object against [[schema]].
     *
     * @param object The object to validate.
     */
    private validate(object);
    /**
     * Convert the object to a metadata instance.
     *
     * @param object Object to convert.
     *
     * @returns A new metadata instance.
     */
    protected abstract convert(object: Object): Metadata;
}
