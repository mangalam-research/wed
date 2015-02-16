/**
 * @module modes/generic/generic_decorator
 * @desc Decorator for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic_decorator */
function (require, exports, module) {
'use strict';

var Decorator = require("wed/decorator").Decorator;
var oop = require("wed/oop");
var util = require("wed/util");
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
 * @param {module:gui_updater~GUIUpdater} gui_updater The updater to
 * use to modify the GUI tree. All modifications to the GUI must go
 * through this updater.
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
        function (root, tree, parent,
                  prev, next, el) {
        // Skip elements which would already have been removed from
        // the tree. Unlikely but...
        if (!root.contains(el))
            return;

        this.elementDecorator(root, el);

        var klass = this._meta.getAdditionalClasses(el);
        if (klass.length > 0)
            el.className += " " + klass;
    }.bind(this));

    this._domlistener.addHandler(
        "children-changed",
        util.classFromOriginalName("*"),
        function (root, added, removed, previous_sibling,
                  next_sibling, el) {
        var all = added.concat(removed);
        var found = false;
        for(var ix = 0, limit = all.length; !found && ix < limit; ++ix) {
            var child = all[ix];
            found = (child.nodeType === Node.TEXT_NODE) ||
                child.classList.contains("_real") ||
                child.classList.contains("_phantom_wrap");
        }
        if (found)
            this.elementDecorator(root, el);
    }.bind(this));

    this._domlistener.addHandler(
        "text-changed",
        util.classFromOriginalName("*"),
        function (root, el) {
        this.elementDecorator(root, el.parentNode);
    }.bind(this));

    this._domlistener.addHandler(
        "attribute-changed",
        util.classFromOriginalName("*"),
        function (root, el) {
        this.elementDecorator(root, el);
    }.bind(this));

    Decorator.prototype.addHandlers.call(this);
};

GenericDecorator.prototype.elementDecorator = function (root, el) {
    Decorator.prototype.elementDecorator.call(
        this, root, el, 1,
        log.wrap(this._contextMenuHandler.bind(this, true)),
        log.wrap(this._contextMenuHandler.bind(this, false)));
};

exports.GenericDecorator = GenericDecorator;

});

//  LocalWords:  DOM util oop Mangalam MPL Dubeau
