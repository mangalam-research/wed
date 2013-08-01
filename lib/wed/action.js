/**
 * @module action
 * @desc Editing actions.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:action */ function (require, exports, module) {
'use strict';

var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
var oop = require("./oop");

/**
 * Actions model "things the user can do." These can be contextual
 * menu items, menu items, buttons, keybindings, etc. The base class
 * is always enabled but derived classes can set their own enabled
 * state depending on whatever conditions they choose.
 *
 * @class
 * @param {module:wed~Editor} editor The editor to which this action
 * belongs.
 * @param {String} desc A simple string description of the action.
 * @property {Function} bound_handler This is an event handler
 * bound to the object that contains it.
 */
function Action (editor, desc) {
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
 * than rebind this method.
 */
Action.prototype.eventHandler = function (e) {
    this.execute(e.data);
};

/**
 * Gets a description for this action.
 *
 * @returns {String}
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
 * @returns {String}
 */
Action.prototype.getDescriptionFor = function (data) {
    return this.getDescription();
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
 */
Action.prototype.getEnabled = function () {
    return this._enabled;
};

exports.Action = Action;

});
