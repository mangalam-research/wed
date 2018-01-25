/**
 * Checks whether an object conforms to a template.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

export interface Template {
  [key: string]: Template | boolean;
}

// tslint:disable-next-line:class-name
export interface _CheckResults {
  missing: string[];
  extra: string[];
}

export type CheckResults = Partial<_CheckResults>;

export interface CheckedObject {
  // tslint:disable-next-line:no-any
  [key: string]: CheckedObject | boolean | number | string | any[];
}

/**
 * Checks whether a field is required.
 *
 * @param template The template to check.
 *
 * @param name The name of the field.
 *
 * @returns Whether the field is required or not.
 */
function _required(template: Template, name: string): boolean {
  const val = template[name];
  if (typeof val === "object") {
    for (const subname in val) {
      if (_required(val, subname)) {
        return true;
      }
    }
    return false;
  }

  return val;
}

function _check(template: Template, toCheck: {},
                prefix: string | undefined, ret: _CheckResults): void {
  for (const name in template) {
    if (_required(template, name)) {
      const prefixed = prefix !== undefined ? [prefix, name].join(".") : name;
      if (!(name in toCheck)) {
        ret.missing.push(prefixed);
      }
      else {
        const val = (toCheck as CheckedObject)[name];
        const templateVal = template[name];
        if (!(val instanceof Array) && typeof val === "object" &&
            typeof templateVal === "object") {
          _check(templateVal, val, prefixed, ret);
        }
      }
    }
  }

  for (const name in toCheck) {
    if (!(name in template)) {
      const prefixed = prefix !== undefined ? [prefix, name].join(".") : name;
      ret.extra.push(prefixed);
    }
  }
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
 * @param toCheck The object to check
 *
 * @returns The results.
 */
export function check(template: Template, toCheck: {}): CheckResults {
  const initial: _CheckResults = { missing: [], extra: [] };
  _check(template, toCheck, undefined, initial);

  // clean up
  // tslint:disable-next-line:no-any
  const ret = initial as any;
  for (const name in ret) {
    if (ret[name].length === 0) {
      delete ret[name];
    }
  }
  return ret;
}

/**
 * Check whether the object fits the template, and throw at the first sign of
 * trouble. The thrown object contains information about the first error
 * encountered.
 *
 * @param template The template to use for the check.
 *
 * @param toCheck The object to check
 *
 * @throws {Error} If there is any error.
 */
export function assertSummarily(template: Template, toCheck: {}): void {
  const result = check(template, toCheck);

  if (result.missing !== undefined) {
    throw new Error(`missing option: ${result.missing[0]}`);
  }

  if (result.extra !== undefined) {
    throw new Error(`extra option: ${result.extra[0]}`);
  }
}

/**
 * Check whether the object fits the template, and throw an error that reports
 * all issues.
 *
 * @param template The template to use for the check.
 *
 * @param toCheck The object to check
 *
 * @throws {Error} If there is any error.
 */
export function assertExtensively(template: Template, toCheck: {}): void {
  const result = check(template, toCheck);

  const errors: string[] = [];
  if (result.missing !== undefined) {
    for (const name of result.missing) {
      errors.push(`missing option: ${name}`);
    }
  }

  if (result.extra !== undefined) {
    for (const name of result.extra) {
      errors.push(`extra option: ${name}`);
    }
  }

  if (errors.length !== 0) {
    throw new Error(errors.join(", "));
  }
}

//  LocalWords:  MPL baz bip
