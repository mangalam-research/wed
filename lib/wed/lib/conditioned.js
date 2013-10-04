/**
 * @module lib/conditioned
 * @desc A mixin class for objects that have conditions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:lib/conditioned */ function (require, exports,
                                                           module) {
"use strict";

/**
 * <p>This class is a mixin which adds the glue needed for an object
 * to allow other objects to know when certain conditions have been
 * met. This mixin depends on an event emitting and listening
 * framework of the sort provided by {@link
 * module:simple_event_emitter simple_event_emitter}. The object using
 * this mixin does not have to use {@link module:simple_event_emitter
 * simple_event_emitter} but must offer the same interface.</p>
 *
 * <p>Since this mixin builds on <code>simple_event_emitter</code> or
 * something similar, the following are true:
 *
 *   <ul>
 *
 *     <li>a condition name is an event name; setting the condition
 *     triggers the event.</li>
 *
 *     <li>a condition listener is an event listener, and should have
 *     the same signature: <code>listener(ev)</code> where
 *     <code>ev</code> is an object related to the event.</li>
 *
 *   </ul>
 *
 * </p>
 *
 * <p>Events and conditions live in the same namespace. Consequently,
 * classes using this mixin should take care of avoiding mixing
 * condition and event names. For instance, if a class emits an event
 * using a condition name, this may result in condition listeners
 * being executed, but the condtion won't be recorded as being in
 * effect as would be the case if {@link
 * module:conditioned~Conditioned#_setCondition _setCondition} would
 * be called.</p>
 *
 * <p>This constructor must be called by the class using this mixin.</p>
 *
 * @class
 */
function Conditioned () {
    this._conditions = {};
}

/**
 * This method is called by the class using this mixin to indicate
 * that a condition has been reached.
 *
 * @param {String} name The name of the condition that was reached.
 * @param ev The event data to provide to listeners listening to this
 * condition.
 */
Conditioned.prototype._setCondition = function (name, ev) {
    if (this._conditions[name] === undefined) {
        this._conditions[name] = true;
        this._emit(name, ev);
    }
};

/**
 * This is a convenience method to check whether a condition has been
 * reached or not. <strong>In most cases, asynchronous code should
 * call {@link module:conditioned~Conditioned#whenCondition
 * whenCondition} rather than poll repeatedly by using this
 * method.</strong> However, there are some rare situations in which
 * polling is called for.
 *
 * @param {String} name The name of the condition to check.
 * @returns {Boolean} <code>true</code> if the condition has been met
 * already, or <code>false</code> if the condition has not been met.
 */
Conditioned.prototype.getCondition = function (name) {
    return this._conditions[name];
};

/**
 * <p>This method is called so that a listener function is executed
 * when a certain condition is reached. If the condition has already
 * been reached, then the listener will be executed immediately. If
 * not, then the listener will be executed as soon as the condition is
 * reached. In any case, the listener is executed once and only
 * once per call to this method.</p>
 *
 * @param {String} name The name of the condition that the caller is
 * interested in.
 * @param {Function} listener The listener to execute when the
 * condition is reached.
 */
Conditioned.prototype.whenCondition = function (name, listener) {
    if (this._conditions[name])
        listener();
    else
        this.addOneTimeEventListener(name, listener);
};

exports.Conditioned = Conditioned;

});
