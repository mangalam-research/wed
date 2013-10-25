/**
 * @module action
 * @desc Editing actions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:action */ function (require, exports, module) {
'use strict';

var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
var oop = require("./oop");

/**
 *
 * @classdesc Actions model "things the user can do." These can be contextual
 * menu items, menu items, buttons, keybindings, etc. The base class
 * is always enabled but derived classes can set their own enabled
 * state depending on whatever conditions they choose.
 * @mixes module:lib/simple_event_emitter~SimpleEventEmitter
 *
 * @constructor
 * @param {module:wed~Editor} editor The editor to which this action
 * belongs.
 * @param {String} desc A simple string description of the action.
 * @param {String} abbreviated_desc An abbreviated description,
 * suitable to put into a button, for instance.
 * @param {String} icon HTML code that represents an icon for this
 * action. This can be a simple string or something more complex.
 * @property {Function} bound_handler This is an event handler
 * bound to the object that contains it.
 */
function Action (editor, desc, abbreviated_desc, icon) {
    /**
     * Emitted when the action is enabled.
     * @event module:action~Action#enabled
     */
    /**
     * Emitted when the action is disabled.
     * @event module:action~Action#disabled
     */
    SimpleEventEmitter.call(this);
    this._editor = editor;
    this._desc = desc;
    this._abbreviated_desc = abbreviated_desc;
    this._icon = icon || "";
    this._enabled = true;
    this.bound_handler = this.eventHandler.bind(this);
}

oop.implement(Action, SimpleEventEmitter);

/**
 * @param {Object} data Arbitrary data. What data must be passed is
 * determined by the action.
 */
Action.prototype.execute = function (data) {
    throw new Error("the execute method must be overridden.");
};

/**
 * An event handler. By default just calls {@link
 * module:action~Action#execute execute}. You probably want to use
 * {@link module.action~Action#bound_handler bound_handler} rather
 * than rebind this method. This handler always returns false and
 * calls <code>preventDefault()</code> and
 * <code>stopPropagation</code> on the event passed to it.
 *
 *
 * @param {Event} e The DOM event.
 * @returns {Boolean} False.
 */
Action.prototype.eventHandler = function (e) {
    this.execute(e.data);
    e.preventDefault();
    return false;
};

/**
 * Gets a description for this action.
 *
 * @returns {String} A description for the action
 */
Action.prototype.getDescription = function () {
    return this._desc;
};

/**
 * Gets a description for this action, contextualized by the data
 * passed.
 *
 * @param {Object} data The same data that would be passed to {@link
 * module:action~Action#execute execute}.
 * @returns {String} The description
 */
Action.prototype.getDescriptionFor = function (data) {
    return this.getDescription();
};

/**
 * Gets the abbreviated  description for this action.
 *
 * @returns {String} An abbreviated description
 */
Action.prototype.getAbbreviatedDescription = function () {
    return this._abbreviated_desc;
};

/**
 * Gets the icon.
 *
 * @returns {String} The icon. This is an HTML string.
 */
Action.prototype.getIcon = function () {
    return this._icon;
};

/**
 * This method returns the icon together with the description for the
 * data passed as parameter.
 *
 * @param {Object} data The same data that would be passed to {@link
 * module:action~Action#execute execute}.
 * @returns {String} The icon and the description, combined for
 * presentation.
 */
Action.prototype.getLabelFor = function (data) {
    var desc = this.getDescriptionFor(data);
    var icon = this.getIcon();
    if (icon && desc)
        return icon + " " + desc;

    if (icon)
        return icon;

    return desc;
};


/**
 * Converts this action to a string. By default calls {@link
 * module:action~Action#getDescription getDescription}.
 *
 * @returns {String}
 */
Action.prototype.toString = function () {
    return this.getDescription();
};

/**
 * Returns whether or not the action is currently enabled.
 *
 * @returns {Boolean}
 */
Action.prototype.getEnabled = function () {
    return this._enabled;
};

exports.Action = Action;

});

//  LocalWords:  SimpleEventEmitter keybindings html oop Mangalam MPL
//  LocalWords:  Dubeau
