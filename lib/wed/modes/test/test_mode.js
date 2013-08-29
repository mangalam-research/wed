define(function (require, exports, module) {
'use strict';

var $ = require("jquery");
var util = require("wed/util");
var log = require("wed/log");
var Mode = require("wed/modes/generic/generic").Mode;
var oop = require("wed/oop");
var transformation = require("wed/transformation");
var rangy = require("rangy");
var tei_meta = require("wed/modes/generic/metas/tei_meta");
var domutil = require("wed/domutil");
var TestDecorator = require("./test_decorator").TestDecorator;

var prefix_to_uri = {
    "tei": "http://www.tei-c.org/ns/1.0",
    "xml": "http://www.w3.org/XML/1998/namespace",
    "": "http://www.tei-c.org/ns/1.0"
};

/**
 * This mode is purely designed to help test wed, and nothing
 * else. Don't derive anything from it and don't use it for editing.
 *
 * @class
 * @extends module:modes/generic/generic~Mode
 * @param {Object} options The options for the mode.
 */
function TestMode () {
    Mode.apply(this, arguments);
    Object.keys(prefix_to_uri).forEach(function (k) {
        this._resolver.definePrefix(k, prefix_to_uri[k]);
    }.bind(this));
    this._contextual_menu_items = [];
}

oop.inherit(TestMode, Mode);

TestMode.optionResolver = Mode.optionResolver;

TestMode.prototype.makeDecorator = function () {
    var obj = Object.create(TestDecorator.prototype);
    var args = Array.prototype.slice.call(arguments);
    args = [this, this._meta, this._options].concat(args);
    TestDecorator.apply(obj, args);
    return obj;
};


exports.Mode = TestMode;

});
