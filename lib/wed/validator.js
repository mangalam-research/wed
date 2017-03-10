/**
 * @module validator
 * @desc This module is responsible for validating the document being
 * edited in wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:validator */ function f(require, exports) {
  "use strict";

  var salveDom = require("salve-dom");
  var oop = require("./oop");
  var dloc = require("./dloc");

  exports.INCOMPLETE = salveDom.WorkingState.INCOMPLETE;
  exports.WORKING = salveDom.WorkingState.WORKING;
  exports.INVALID = salveDom.WorkingState.INVALID;
  exports.VALID = salveDom.WorkingState.VALID;

  /**
   * @classdesc A document validator.
   *
   * @constructor
   * @param {module:salve/validate~Grammar} schema A path to the
   * schema to pass to salve for validation. This is a path that will be
   * interpreted by RequireJS. The schema must have already been
   * prepared for use by salve. See salve's documentation. Or this can
   * be a ``Grammar`` object that has already been produced from
   * ``salve``'s ``constructTree``.
   * @param {Node} root The root of the DOM tree to validate. This root
   * contains the document to validate but is not
   * @param {module:mode~Mode} [mode] The mode that is currently in use.
   * <strong>part</strong> of it.
   */
  function Validator(schema, root, mode) {
    salveDom.Validator.call(this, schema, root, {
      timeout: 200,
      maxTimespan: 100,
    });
    this.mode = mode;
  }

  oop.inherit(Validator, salveDom.Validator);

  var ValidatorP = Validator.prototype;

  /**
   * Runs document-wide validation specific to the mode passed to
   * the validator.
   *
   * @private
   * @emits module:validator~Validator#error
   */
  ValidatorP._runDocumentValidation = function _runDocumentValidation() {
    if (!this.mode) {
      return;
    }

    var errors = this.mode.validateDocument();
    for (var i = 0; i < errors.length; ++i) {
      this._processError(errors[i]);
    }
  };

  /**
   * Returns the set of possible events for the location specified by
   * the parameters.
   *
   * @param {module:dloc~DLoc} loc Location at which to get possibilities.
   * @param {boolean} [attributes=false] Whether we are interested in
   * the attribute events of the node pointed to by ``container,
   * index``. If ``true`` the node pointed to by ``container, index``
   * must be an element, and the returned set will contain attribute
   * events.
   * @returns {module:validate~EventSet} A set of possible events.
   *
   * @also
   *
   * @param {Node} container Together with ``index`` this parameter is
   * interpreted to form a location as would be specified by a {@link
   * module:dloc~DLoc DLoc} object.
   * @param {integer} index Together with ``container`` this parameter
   * is interpreted to form a location as would be specified by a
   * {@link module:dloc~DLoc DLoc} object.
   * @param {boolean} [attributes=false]
   * @returns {module:validate~EventSet} A set of possible events.
   */
  ValidatorP.possibleAt = function possibleAt(container, index, attributes) {
    if (container instanceof dloc.DLoc) {
      attributes = index;
      index = container.offset;
      container = container.node;
    }
    return salveDom.Validator.prototype.possibleAt.call(this,
                                                        container, index,
                                                        attributes);
  };

  /**
   * Validate a DOM fragment as if it were present at the point
   * specified in the parameters in the DOM tree being validated.
   *
   * WARNING: This method will not catch unclosed elements. This is
   * because the fragment is not considered to be a "complete"
   * document. Unclosed elements or fragments that are not well-formed
   * must be caught by other means.
   *
   * @param {module:dloc~DLoc} loc The location in the tree to start at.
   * @param {Node|Array.<Node>} to_parse The fragment to parse.
   * @returns {Array.<Object>|false} Returns an array of errors if there
   * is an error. Otherwise returns false.
   *
   * @also
   *
   * @param {Node} container The location in the tree to start at.
   * @param {integer} index The location in the tree to start at.
   * @param {Node|Array.<Node>} to_parse The fragment to parse.
   * @returns {Array.<Object>|false} Returns an array of errors if there
   * is an error. Otherwise returns false.
   */
  ValidatorP.speculativelyValidate = function speculativelyValidate(container,
                                                                    index,
                                                                    to_parse) {
    if (container instanceof dloc.DLoc) {
      to_parse = index;
      index = container.offset;
      container = container.node;
    }

    return salveDom.Validator.prototype.speculativelyValidate.call(
      this, container, index, to_parse);
  };

  /**
   * Validate a DOM fragment as if it were present at the point
   * specified in the parameters in the DOM tree being validated.
   *
   * WARNING: This method will not catch unclosed elements. This is
   * because the fragment is not considered to be a "complete"
   * document. Unclosed elements or fragments that are not well-formed
   * must be caught by other means.
   *
   * @param {module:dloc~DLoc} loc The location in the tree to start at.
   * @param {Node} to_parse The fragment to parse. This fragment must
   * not be part of the tree that the validator normally validates. (It
   * can be **cloned** from that tree.) This fragment must contain a
   * single top level element which has only one child. This child is
   * the element that will actually be parsed.
   * @returns {Array.<Object>|false} Returns an array of errors if there
   * is an error. Otherwise returns false.
   *
   * @also
   *
   * @param {Node} container The location in the tree to start at.
   * @param {integer} index The location in the tree to start at.
   * @param {Node} to_parse The fragment to parse. See above.
   * @returns {Array.<Object>|false} Returns an array of errors if there
   * is an error. Otherwise returns false.
   */
  ValidatorP.speculativelyValidateFragment =
    function speculativelyValidateFragment(container, index, to_parse) {
      if (container instanceof dloc.DLoc) {
        to_parse = index;
        index = container.offset;
        container = container.node;
      }

      return salveDom.Validator.prototype.speculativelyValidateFragment.call(
        this, container, index, to_parse);
    };

  exports.Validator = Validator;
});

//  LocalWords:  revalidating inspect's leaveContext leaveStartTag el
//  LocalWords:  attributeValue endTag attributeName enterContext DOM
//  LocalWords:  SimpleEventEmitter namespace mixin ProgressState oop
//  LocalWords:  validateUpTo unclosed fireEvent definePrefix xmlns
//  LocalWords:  speculativelyValidate RequireJS enterStartTag MPL
//  LocalWords:  namespaces validator Mangalam Dubeau nextSibling
//  LocalWords:  prev whitespace boolean jquery util
