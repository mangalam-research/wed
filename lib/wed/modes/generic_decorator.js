define(function (require, exports, module) {
'use strict';

var Decorator = require("wed/decorator").Decorator;
var oop = require("wed/oop");
var $ = require("jquery");
var util = require("wed/util");

function GenericDecorator(domlistener) {
    Decorator.call(this, domlistener);
    domlistener.addHandler("included-element",
                           util.classFromOriginalName("*"),
                           function ($root, el) {
                               this.elementDecorator(
                                   $root, el,
                                   util.eventHandler(this._contextMenuHandler.bind(this)));
                           }.bind(this));
}

oop.inherit(GenericDecorator, Decorator);

(function () {
    this._contextMenuHandler = function (ev, jQthis) {
        console.log("blip");
    };
}).call(GenericDecorator.prototype);

exports.GenericDecorator = GenericDecorator;

});
