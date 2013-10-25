/**
 * @module modes/test/test_decorator
 * @desc Decorator for the test mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/test/test_decorator */
function (require, exports, module) {
'use strict';

var Decorator = require("wed/modes/generic/generic_decorator").GenericDecorator;
var oop = require("wed/oop");
var $ = require("jquery");
var util = require("wed/util");
var jqutil = require("wed/jqutil");
var log = require("wed/log");

/**
 * @class
 * @extends module:modes/generic/generic_decorator~GenericDecorator
 * @param {module:modes/generic/generic~Mode} mode The mode object.
 * @param {module:modes/generic/generic_meta~Meta} meta
 * Meta-information about the schema.
 * @param {Object} options The options object passed to the mode which
 * uses this decorator.
 * @param {module:domlistener~Listener} listener The DOM listener that
 * will listen to changes on the document.
 * @param {module:wed~Editor} editor The wed editor to which the mode
 * is applied.
 * @param {module:domlistener~Listener} gui_domlistener The DOM
 * listener that listens to changes on the GUI tree.
 */
function TestDecorator(mode, meta, options) {
    // Pass the rest of arguments to super's constructor.
    Decorator.apply(this, arguments);

    // Under normal circumstances, this is an empty set so all
    // elements are decorated.
    this._no_element_decoration = {
        "term": true,
        "ref": true
    };
}

oop.inherit(TestDecorator, Decorator);

TestDecorator.prototype.elementDecorator = function ($root, $el) {
    var el = $el[0];
    var orig_name = util.getOriginalName(el);
    if (!this._no_element_decoration[orig_name])
        Decorator.prototype.elementDecorator.call(
            this, $root, $el,
            log.wrap(this._contextMenuHandler.bind(this, true)),
            log.wrap(this._contextMenuHandler.bind(this, false)));

    if (orig_name === "ref") {
        this._gui_updater.insertBefore(
            el, $("<div class='_text _phantom'>)</div>")[0], null);
        this._gui_updater.insertNodeAt(
            el, 0, $("<div class='_text _phantom'>(</div>")[0]);
    }
};

exports.TestDecorator = TestDecorator;

});

//  LocalWords:  GenericDecorator DOM jqutil util jquery oop Mangalam
//  LocalWords:  MPL Dubeau
