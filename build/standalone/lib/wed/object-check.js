/**
 * Checks whether an object conforms to a template.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Checks whether a field is required.
     *
     * @param template The template to check.
     *
     * @param name The name of the field.
     *
     * @returns Whether the field is required or not.
     */
    function _required(template, name) {
        var val = template[name];
        if (typeof val === "object") {
            for (var subname in val) {
                if (_required(val, subname)) {
                    return true;
                }
            }
            return false;
        }
        return val;
    }
    function _check(template, toCheck, prefix, ret) {
        for (var name_1 in template) {
            if (_required(template, name_1)) {
                var prefixed = prefix !== undefined ? [prefix, name_1].join(".") : name_1;
                if (!(name_1 in toCheck)) {
                    ret.missing.push(prefixed);
                }
                else {
                    var val = toCheck[name_1];
                    var templateVal = template[name_1];
                    if (!(val instanceof Array) && typeof val === "object" &&
                        typeof templateVal === "object") {
                        _check(templateVal, val, prefixed, ret);
                    }
                }
            }
        }
        for (var name_2 in toCheck) {
            if (!(name_2 in template)) {
                var prefixed = prefix !== undefined ? [prefix, name_2].join(".") : name_2;
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
    function check(template, toCheck) {
        var initial = { missing: [], extra: [] };
        _check(template, toCheck, undefined, initial);
        // clean up
        // tslint:disable-next-line:no-any
        var ret = initial;
        for (var name_3 in ret) {
            if (ret[name_3].length === 0) {
                delete ret[name_3];
            }
        }
        return ret;
    }
    exports.check = check;
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
    function assertSummarily(template, toCheck) {
        var result = check(template, toCheck);
        if (result.missing !== undefined) {
            throw new Error("missing option: " + result.missing[0]);
        }
        if (result.extra !== undefined) {
            throw new Error("extra option: " + result.extra[0]);
        }
    }
    exports.assertSummarily = assertSummarily;
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
    function assertExtensively(template, toCheck) {
        var result = check(template, toCheck);
        var errors = [];
        if (result.missing !== undefined) {
            for (var _i = 0, _a = result.missing; _i < _a.length; _i++) {
                var name_4 = _a[_i];
                errors.push("missing option: " + name_4);
            }
        }
        if (result.extra !== undefined) {
            for (var _b = 0, _c = result.extra; _b < _c.length; _b++) {
                var name_5 = _c[_b];
                errors.push("extra option: " + name_5);
            }
        }
        if (errors.length !== 0) {
            throw new Error(errors.join(", "));
        }
    }
    exports.assertExtensively = assertExtensively;
});
//  LocalWords:  MPL baz bip
//# sourceMappingURL=object-check.js.map