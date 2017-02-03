/**
 * @module object_check
 * @desc Checks whether an object conforms to a template.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:object_check */function f(require, exports) {
  "use strict";

  /**
   * Checks whether a field is required.
   *
   * @param {Object} template The template to check.
   * @param {string} name The name of the field.
   * @returns {boolean} Whether the field is required or not.
   */
  function _required(template, name) {
    var val = template[name];
    if (!(val instanceof Array) && typeof (val) === "object") {
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
    var name;
    var prefixed;
    for (name in template) {
      if (_required(template, name)) {
        prefixed = prefix ? [prefix, name].join(".") : name;
        if (!(name in object)) {
          ret.missing.push(prefixed);
        }
        else {
          var val = object[name];
          var template_val = template[name];
          if (!(val instanceof Array) && typeof (val) === "object" &&
              typeof (template_val) === "object") {
            _check(template_val, val, prefixed, ret);
          }
        }
      }
    }

    for (name in object) {
      if (!(name in template)) {
        prefixed = prefix ? [prefix, name].join(".") : name;
        ret.extra.push(prefixed);
      }
    }
  }

  /**
   * Checks whether an object conforms to a template. The template must
   * be an object which specifies the known fields and which among them
   * are required. A field is known if it appears in the template. A
   * field is considered *required* if:
   *
   *  + it is an object which has any field which is required, or
   *
   *  + it is not an object but evaluates to a true value.
   *
   * A required field which does not appear in the object being checked
   * will appear in the ``missing`` field in the returned value.
   *
   * A field which appears on the object being checked but which is not
   * known will appear in the ``extra`` field in the returned value.
   *
   * The fields mentioned above exist only if there is something to
   * report. The names returned in the lists are fully qualified names.
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
   * The names "foo", "bar", "bar.baz", "bar.bin", "bip", "bip.baz",
   * bip.bin" are known. The names "bar" and "bar.baz" are required. The
   * name "bar" is required because "bar.baz" is required. The other
   * names correspond to objects whose fields are not required or are
   * non-object values that evaluate to false.
   *
   * @param {Object} template The template to use for the check.
   * @param {Object} object The object to check
   * @returns {Object.<string, Array.<string>>}} The results.
   */
  function check(template, object) {
    var ret = { missing: [], extra: [] };
    _check(template, object, undefined, ret);

    // clean up
    for (var name in ret) {
      if (!ret[name].length) {
        delete ret[name];
      }
    }
    return ret;
  }

  exports.check = check;
});
