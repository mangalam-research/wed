/**
 * Checks whether an object conforms to a template.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module"], function (require, exports, module) {
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
    function _check(template, object, prefix, ret) {
        for (var name_1 in template) {
            if (_required(template, name_1)) {
                var prefixed = prefix !== undefined ? [prefix, name_1].join(".") : name_1;
                if (!(name_1 in object)) {
                    ret.missing.push(prefixed);
                }
                else {
                    var val = object[name_1];
                    var templateVal = template[name_1];
                    if (!(val instanceof Array) && typeof val === "object" &&
                        typeof templateVal === "object") {
                        _check(templateVal, val, prefixed, ret);
                    }
                }
            }
        }
        for (var name_2 in object) {
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
     * @param object The object to check
     *
     * @returns The results.
     */
    function check(template, object) {
        var initial = { missing: [], extra: [] };
        _check(template, object, undefined, initial);
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
    exports.check = check;
});

//# sourceMappingURL=object-check.js.map
