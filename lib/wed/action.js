/**
 * @module action
 * @desc Editing actions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
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
 * @param {string} desc A simple string description of the action.
 * @param {string} abbreviated_desc An abbreviated description,
 * suitable to put into a button, for instance.
 * @param {string} icon HTML code that represents an icon for this
 * action. This can be a simple string or something more complex.
 * @param {boolean} [needs_input=false] Indicates whether this action needs
 * input from the user. For instance, an action which brings up a
 * modal dialog to ask something of the user must have this parameter
 * set to ``true``. It is important to record whether an action needs
 * input because, to take one example, the ``autoinsert`` logic will
 * try to insert automatically any element it can. However, doing this
 * for elements that need user input will just confuse the user (or
 * could cause a crash). Therefore, it is important that the insertion
 * operations for such elements be marked with ``needs_input`` set to
 * ``true`` so that the ``autoinsert`` logic backs off from trying to
 * insert these elements.
 * @property {boolean} needs_input See the parameter of the same
 * name. This value should not be changed after the object is
 * initialized. Changing this value at runtime will lead to undefined
 * behavior.
 * @property {Function} bound_handler This is an event handler bound
 * to the object that contains it. See {@link
 * module.action~Action#eventHandler eventHandler}.
 * @property {Function} bound_terminal_handler This is a terminal
 * event handler bound to the object that contains it. See {@link
 * module.action~Action#terminalEventHandler terminalEventHandler}.
 */
function Action (editor, desc, abbreviated_desc, icon, needs_input) {
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
    this.needs_input = !!needs_input; // normalize value
    this._enabled = true;
    this.bound_handler = this.eventHandler.bind(this);
    this.bound_terminal_handler = this.terminalEventHandler.bind(this);
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
 * than rebind this method. This handler always returns
 * <code>undefined</code> and calls <code>preventDefault()</code> on
 * the event passed to it.
 *
 * @param {Event} e The DOM event.
 * @returns {boolean} False.
 */
Action.prototype.eventHandler = function (e) {
    this.execute(e.data);
    e.preventDefault();
};

/**
 * An event handler. By default just calls {@link
 * module:action~Action#eventHandler eventHandler}. You probably want
 * to use {@link module.action~Action#bound_terminal_handler
 * bound_terminal_handler} rather than rebind this method.  This
 * handler always returns false and calls
 * <code>preventDefault()</code> and <code>stopPropagation</code> on
 * the event passed to it.
 *
 * @param {Event} e The DOM event.
 * @returns {boolean} False.
 */
Action.prototype.terminalEventHandler = function (e) {
    this.eventHandler(e);
    e.preventDefault();
    e.stopPropagation();
    return false;
};



/**
 * Gets a description for this action.
 *
 * @returns {string} A description for the action
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
 * @returns {string} The description
 */
Action.prototype.getDescriptionFor = function (data) {
    return this.getDescription();
};

/**
 * Gets the abbreviated  description for this action.
 *
 * @returns {string} An abbreviated description
 */
Action.prototype.getAbbreviatedDescription = function () {
    return this._abbreviated_desc;
};

/**
 * Gets the icon.
 *
 * @returns {string} The icon. This is an HTML string.
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
 * @returns {string} The icon and the description, combined for
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
 * @returns {string}
 */
Action.prototype.toString = function () {
    return this.getDescription();
};

/**
 * Returns whether or not the action is currently enabled.
 *
 * @returns {boolean}
 */
Action.prototype.getEnabled = function () {
    return this._enabled;
};

exports.Action = Action;

});

//  LocalWords:  SimpleEventEmitter keybindings html oop Mangalam MPL
//  LocalWords:  Dubeau
