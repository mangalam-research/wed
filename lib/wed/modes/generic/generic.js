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
        // Make arg an array and add our extra argument(s).
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this);
        GenericDecorator.apply(obj, args);
        return obj;
    };

    this.getTransformationRegistry = function () {
        return tr;
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
        if ($(end).is("_gui.start_button"))
            ret[1] = end;
        return ret;
    };

}).call(GenericMode.prototype);

exports.Mode = GenericMode;

});
