/**
 * Checks whether an object conforms to a template.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
export interface Template {
    [key: string]: Template | boolean;
}
export interface _CheckResults {
    missing: string[];
    extra: string[];
}
export declare type CheckResults = Partial<_CheckResults>;
export interface CheckedObject {
    [key: string]: CheckedObject | boolean | number | string | any[];
}
/**
 * Checks whether an object conforms to a template. The template must be an
 * object which specifies the known fields and which among them are required. A
 * field is known if it appears in the template. A field is considered
 * *required* if:
 *
 *  + it is an object which has any field which is required, or
 *
 *  + it is not an object but evaluates to a true value.
 *
 * A required field which does not appear in the object being checked will
 * appear in the ``missing`` field in the returned value.
 *
 * A field which appears on the object being checked but which is not known will
 * appear in the ``extra`` field in the returned value.
 *
 * The fields mentioned above exist only if there is something to report. The
 * names returned in the lists are fully qualified names.
 *
 * For instance, given this template:
 *
 *     {
 *         foo: false,
 *         bar: {
 *             baz: true,
 *             bin: false,
 *         },
 *         bip: {
 *             baz: false,
 *             bin: false,
 *         }
 *     }
 *
 * The names "foo", "bar", "bar.baz", "bar.bin", "bip", "bip.baz", bip.bin" are
 * known. The names "bar" and "bar.baz" are required. The name "bar" is required
 * because "bar.baz" is required. The other names correspond to objects whose
 * fields are not required or are non-object values that evaluate to false.
 *
 * @param template The template to use for the check.
 *
 * @param object The object to check
 *
 * @returns The results.
 */
export declare function check(template: Template, object: CheckedObject): CheckResults;
