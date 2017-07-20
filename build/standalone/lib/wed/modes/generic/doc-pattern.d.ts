/**
 * Facilities for interpreting the patterns passed in dochtml in
 * metadata files.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
/**
 * An execution context for a pattern.
 */
export interface Context {
    /**
     * Resolve an interpolated name to a value.
     *
     * @param name The name to resolve.
     *
     * @returns The resolved name. An unresolvable name raise an error.
     */
    resolveName(name: string): string;
}
/**
 * A compiled pattern.
 */
export interface DocPattern {
    /**
     * Execute the pattern so as to get a value.
     *
     * @param context The execution context for the pattern.
     *
     * @returns The evaluated pattern.
     */
    execute(context: Context): string;
}
/**
 * Compile a string pattern to a [[DocPattern]] object.
 *
 * @param pattern The pattern to compile.
 *
 * @returns The compiled pattern.
 */
export declare function compile(pattern: string): DocPattern;
