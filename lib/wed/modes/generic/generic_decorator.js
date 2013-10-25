/**
 * @module modes/generic/generic_decorator
 * @desc Decorator for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic_decorator */
function (require, exports, module) {
'use strict';

var Decorator = require("wed/decorator").Decorator;
var oop = require("wed/oop");
var $ = require("jquery");
var util = require("wed/util");
var jqutil = require("wed/jqutil");
var log = require("wed/log");

/**
 * @classdesc A decorator for the generic mode.
 * @extends module:decorator~Decorator
 *
 * @constructor
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
function GenericDecorator(mode, meta, options) {
    // Pass the rest of arguments to super's constructor.
    Decorator.apply(this, Array.prototype.slice.call(arguments, 3));

    this._mode = mode;
    this._meta = meta;
    this._options = options;
}

oop.inherit(GenericDecorator, Decorator);

GenericDecorator.prototype.addHandlers = function () {
    this._domlistener.addHandler(
        "included-element",
        util.classFromOriginalName("*"),
        function ($root, $tree, $parent,
                  $prev, $next, $el) {
        this.elementDecorator($root, $el);
    }.bind(this));

    this._domlistener.addHandler(
        "included-element",
        util.classFromOriginalName("*"),
        function ($root, $tree, $parent, $prev, $next, $el) {
        // Skip elements which would already have been removed from
        // the tree. Unlikely but...
        if ($el.closest($root).length === 0)
            return;

        var klass = this._meta.getAdditionalClasses($el.get(0));
        if (klass.length > 0)
            $el.addClass(klass);
    }.bind(this));

    this._domlistener.addHandler(
        "children-changed",
        util.classFromOriginalName("*"),
        function ($root, $added, $removed, $previous_sibling,
                  $next_sibling, $el) {
        if ($added.is("._real, ._phantom_wrap") ||
            $removed.is("._real, ._phantom_wrap") ||
            $added.filter(jqutil.textFilter).length +
            $removed.filter(jqutil.textFilter).length > 0)
            this.elementDecorator($root, $el);
    }.bind(this));

    this._domlistener.addHandler(
        "text-changed",
        util.classFromOriginalName("*"),
        function ($root, $el) {
        this.elementDecorator($root, $el.parent());
    }.bind(this));

    Decorator.prototype.addHandlers.call(this);
};

GenericDecorator.prototype.elementDecorator = function ($root, $el) {
    Decorator.prototype.elementDecorator.call(
        this, $root, $el,
        log.wrap(this._contextMenuHandler.bind(this, true)),
        log.wrap(this._contextMenuHandler.bind(this, false)));
};

exports.GenericDecorator = GenericDecorator;

});

//  LocalWords:  DOM jqutil util oop jquery Mangalam MPL Dubeau
