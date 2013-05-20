define(function (require, exports, module) {
'use strict';

var Mode = require("../mode").Mode;
var util = require("../util");
var oop = require("../oop");
var GenericDecorator = require("./generic_decorator").GenericDecorator;
var tr = require("./generic_tr").tr;

function GenericMode () {
    Mode.call(this);
    this._resolver = new util.NameResolver({
        "xml": "http://www.w3.org/XML/1998/namespace",
        "": ""
    });
}

oop.inherit(GenericMode, Mode);

(function () {
    // Modes must override this.
    this.getResolver = function () {
        return this._resolver;
    };

    this.makeDecorator = function (domlistener) {
        return new GenericDecorator(domlistener);
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
