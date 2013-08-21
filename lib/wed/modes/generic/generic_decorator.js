/**
 * @module modes/generic/generic_decorator
 * @desc Decorator for the generic mode.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:modes/generic/generic_decorator */
function (require, exports, module) {
'use strict';

var Decorator = require("wed/decorator").Decorator;
var oop = require("wed/oop");
var $ = require("jquery");
var util = require("wed/util");
var jqutil = require("wed/jqutil");

/**
 * @class
 * @extends module:decorator~Decorator
 * @param {module:modes/generic/generic~Mode} mode The mode object.
 * @param {module:modes/generic/generic_meta~Meta} meta
 * Meta-information about the schema.
 * @param {Object} options The options object passed to the mode which
 * uses this decorator.
 * @param {module:domlistener~Listener} listener The DOM listener that
 * will listen to changes on the document.
 * @param {module:wed~Editor} editor The Wed editor to which the mode
 * is applied.
 */
function GenericDecorator(mode, meta, options) {
    // Pass the rest of arguments to super's constructor.
    Decorator.apply(this, Array.prototype.slice.call(arguments, 3));

    this._mode = mode;
    this._meta = meta;
    this._options = options;

    // Under normal circumstances, this is an empty set so all
    // elements are decorated.
    this._no_element_decoration = {};

    // For testing purpose only, do not count on this. It could be
    // removed or changed without warning.
    if (this._options.__test !== undefined) {
        for(var i = 0, el;
            (el = this._options.__test.no_element_decoration[i])
            !== undefined;
            ++i)
            this._no_element_decoration[el] = 1;
    }
}

oop.inherit(GenericDecorator, Decorator);

GenericDecorator.prototype.init = function ($root) {
    this._domlistener.addHandler(
        "included-element",
        util.classFromOriginalName("*"),
        function ($root, $tree, $parent,
                  $prev, $next, $el) {
            var name = util.getOriginalName($el.get(0));
            if (!this._no_element_decoration[name])
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
                $removed.filter(jqutil.textFilter).length > 0) {
                var name = util.getOriginalName($el.get(0));
                if (!this._no_element_decoration[name])
                    this.elementDecorator($root, $el);
            }
        }.bind(this));

    this._domlistener.addHandler(
        "text-changed",
        util.classFromOriginalName("*"),
        function ($root, $el) {
            var name = util.getOriginalName($el.parent().get(0));
            if (!this._no_element_decoration[name])
                this.elementDecorator($root, $el.parent());
        }.bind(this));

    Decorator.prototype.init.call(this, $root);
};

GenericDecorator.prototype.elementDecorator = function ($root, $el) {
    Decorator.prototype.elementDecorator.call(
        this, $root, $el,
        jqutil.eventHandler(this._contextMenuHandler.bind(this, true)),
        jqutil.eventHandler(this._contextMenuHandler.bind(this, false)));
};

exports.GenericDecorator = GenericDecorator;

});
