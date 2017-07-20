/**
 * @module modes/test/test_mode_validator
 * @desc A mode for testing.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/test/test_mode_validator*/function f(require,
                                                                    exports) {
  "use strict";

  var ValidationError = require("salve").ValidationError;

  function Validator(data_root) {
    this._data_root = data_root;
  }

  Validator.prototype.validateDocument = function validateDocument() {
    return [{
      error: new ValidationError("Test"),
      node: this._data_root,
      index: 0,
    }];
  };

  exports.Validator = Validator;
});
