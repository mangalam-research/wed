/**
 * @module mode_validator
 * @desc The base class for mode validators.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:mode_validator */ function (require, exports, module) {
'use strict';

/**
 * @classdesc A mode validator performs mode-specific checks on a
 * document being edited with the mode. These checks should be those
 * that a schema cannot perform. We have split this functionality off
 * from the modes themselves because such validation may need to
 * performed on "bare" documents, i.e. not being edited in wed but as
 * part of server-side processing. Modes require a full-fledged editor
 * to operate and thus would be rather heavy for the task of merely
 * validating a document.
 *
 * @param {Node} gui_root A GUI tree that corresponds to the data tree being
 * given to wed's validator. This needs to be a **GUI** tree because
 * modes generally cannot perform queries on XML trees, and the data
 * tree is an XML tree. (This is a limitation of DOM implementation in
 * browsers.)
 * @param {Node} data_root The data tree that corresponds to the GUI
 * tree. This must be the same tree being validated by wed's
 * schema-based validator.
 */
function ModeValidator(gui_root, data_root) {
    this._gui_root = gui_root;
    this._data_root = data_root;
}

/**
 * This method will be called by wed's schema-based validator when the
 * document has finished being validated by the schema-based validator
 * but before the validator decides whether the document is actually
 * valid. Any errors returned here will deem the document invalid.
 *
 * The default implementation does not perform any additional checks.
 *
 * **Warning:** It is possible to produce errors for any node of the
 * document here. However, be warned that any error produced here
 * won't be seen by {@link module:validator~Validator#getErrorsFor
 * getErrorsFor}.
 *
 * @returns {Array.<module:validator~Validator#error>} The errors
 * found.
 */
ModeValidator.prototype.validateDocument = function () {
    return [];
};

exports.ModeValidator = ModeValidator;

});
