define(function (require, exports, module) {
'use strict';

var Mode = require("../../mode").Mode;
var util = require("../../util");
var oop = require("../../oop");
var GenericDecorator = require("./generic_decorator").GenericDecorator;
var Registry = require("./generic_tr").Registry;
var $ = require("jquery");

function GenericMode () {
    Mode.apply(this, arguments);
    this._resolver = new util.NameResolver();
    this._meta = new this._options.meta.Meta();
    this._tr = new Registry();
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

(function () {
    // Modes must override this.
    this.getAbsoluteResolver = function () {
        return this._resolver;
    };

    this.makeDecorator = function () {
        var obj = Object.create(GenericDecorator.prototype);
        var args = Array.prototype.slice.call(arguments);
        args = [this, this._meta].concat(args);
        GenericDecorator.apply(obj, args);
        return obj;
    };

    this.getTransformationRegistry = function () {
        return this._tr;
    };

    this.getContextualMenuItems = function () {
        return [];
    };

    this.nodesAroundEditableContents = function (parent) {
        var ret = [null, null];
        var start = parent.childNodes[0];
        if ($(start).is("._gui._start_button"))
            ret[0] = start;
        var end = parent.childNodes[parent.childNodes.length - 1];
        if ($(end).is("._gui._end_button"))
            ret[1] = end;
        return ret;
    };

}).call(GenericMode.prototype);

exports.Mode = GenericMode;

});
