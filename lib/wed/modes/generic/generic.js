/**
 * @module modes/generic/generic
 * @desc The main module for the generic mode.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:modes/generic/generic */
function (require, exports, module) {
'use strict';

var Mode = require("../../mode").Mode;
var name_resolver = require("../../name_resolver");
var oop = require("../../oop");
var GenericDecorator = require("./generic_decorator").GenericDecorator;
var Registry = require("./generic_tr").Registry;
var $ = require("jquery");

/**
 * <p>This is the class that implements the generic mode. This mode
 * decorates all the elements of the file being edited. On the basis
 * of the schema used by wed for validation, it allows the addition of
 * the elements authorized by the schema.</p>
 *
 * <p>The only option recognized is <code>meta</code>, which should be
 * a path pointing to a module that implements the meta object needed
 * by the mode.</p>
 *
 * @class
 * @extends module:mode~Mode
 * @param {Object} options The options for the mode.
 */
function GenericMode () {
    Mode.apply(this, arguments);
    this._resolver = new name_resolver.NameResolver();
    this._meta = new this._options.meta.Meta();
}

oop.inherit(GenericMode, Mode);

GenericMode.optionResolver = function (options, callback) {
    var resolved = $.extend({}, options);
    if (options && options.meta) {
        require([options.meta], function (meta) {
            resolved.meta = meta;
            callback(resolved);
        });
    }
    else
        callback(resolved);
};

GenericMode.prototype.init = function (editor) {
    Mode.prototype.init.call(this, editor);
    this._tr = this._getTransformationRegistry();
};

GenericMode.prototype.getAbsoluteResolver = function () {
    return this._resolver;
};

GenericMode.prototype.makeDecorator = function () {
    var obj = Object.create(GenericDecorator.prototype);
    var args = Array.prototype.slice.call(arguments);
    args = [this, this._meta, this._options].concat(args);
    GenericDecorator.apply(obj, args);
    return obj;
};

GenericMode.prototype.getContextualMenuItems = function () {
    return [];
};

GenericMode.prototype.nodesAroundEditableContents = function (parent) {
    var ret = [null, null];
    var start = parent.childNodes[0];
    if ($(start).is("._gui._start_button"))
        ret[0] = start;
    var end = parent.childNodes[parent.childNodes.length - 1];
    if ($(end).is("._gui._end_button"))
        ret[1] = end;
    return ret;
};

var registry;

/**
 * Modes that derive from this mode should override this function to
 * enable the creation of the correct registry needed by the mode.
 *
 * @returns {module:transformation~TransformationRegistry} A registry
 * to use for this mode. The value returned here must be treated as
 * immutable. This may be a singleton if the registry happens to be
 * independent of context.
 */
GenericMode.prototype._getTransformationRegistry = function () {
    if (!registry)
        registry = new Registry(this._editor);
    return registry;
};

exports.Mode = GenericMode;

});
