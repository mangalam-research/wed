define(function (require, exports, module) {
'use strict';

var Mode = require("../../mode").Mode;
var util = require("../../util");
var oop = require("../../oop");
var GenericDecorator = require("./generic_decorator").GenericDecorator;
var tr = require("./generic_tr").tr;

function GenericMode () {
    Mode.call(this);
    this._resolver = new util.NameResolver();
}

oop.inherit(GenericMode, Mode);

(function () {
    // Modes must override this.
    this.getAbsoluteResolver = function () {
        return this._resolver;
    };

    this.makeDecorator = function () {
        var obj = Object.create(GenericDecorator.prototype);
        GenericDecorator.apply(obj, arguments);
        return obj;
    };

    this.getTransformationRegistry = function () {
        return tr;
    };

    this.getContextualMenuItems = function () {
        return [];
    };

}).call(GenericMode.prototype);

exports.Mode = GenericMode;

});
