/**
 * @module lib/simple_event_emitter
 * @desc A mixin class for objects that can emit events.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:lib/simple_event_emitter */ function (require, exports,
                                                           module) {
"use strict";

/**
 * @classdesc <p>This class is a mixin which adds the glue needed for
 * an object to emit events and another object to listen on these
 * events. This constructor must be called by the classes that use
 * this mixin so that the data structure used by the mixin is
 * added. The class that uses this mixin must call {@link
 * module:lib/simple_event_emitter~SimpleEventEmitter#_emit _emit} to emit
 * events. For instance, if <code>_emit("foo", {beep: 3})</code> is
 * called, this will result in all listeners on event
 * <code>"foo"</code> being called and passed the object <code>{beep:
 * 3}</code>. Any listener returning the value <code>false</code> ends
 * the processing of the event.</p>
 *
 * <p>This mixin also supports listening on events in a generic way,
 * by listening to the event named "\*". Listeners on such events have
 * the signature <code>listener(name, ev)</code>. When the _emit call
 * above is executed such listener will be called with
 * <code>name</code> set to "foo" and <code>ev</code> set to
 * <code>{beep: 3}</code>. Listeners on "\*" are executed before the
 * other listeners. Therefore, if they return the value
 * <code>false</code>, they prevent the other listeners from
 * executing.</p>
 *
 *
 * @constructor
 */
function SimpleEventEmitter () {
    this._event_listeners = {};
    this._simple_event_emitter_trace = false;
}

/**
 * Adds a listener for an event. The order in which event listeners are
 * added matters. An earlier event listener returning
 * <code>false</code> will prevent later listeners from being called.
 *
 * @param {string} event_name The name of the event to listen to.
 * @param {Function} listener The function that will be called when
 * the event occurs.
 */
SimpleEventEmitter.prototype.addEventListener = function (event_name,
                                                          listener) {
    var listeners = this._event_listeners[event_name];
    if (listeners === undefined)
        listeners = this._event_listeners[event_name] = [];
    listeners.push(listener);
};

/**
 * Adds a one-time listener for an event. The listener will be called
 * only once. If this method is called more than once with the same
 * listener, the listener will be called for each call made to this
 * method. The order in which event listener are added matters. An
 * earlier event listener returning <code>false</code> will prevent
 * later listeners from being called.
 *
 * @param {string} event_name The name of the event to listen to.
 * @param {Function} listener The function that will be called when
 * the event occurs.
 *
 * @returns This method returns an opaque identifier which uniquely
 * identifies this addition operation. If the caller ever wants to
 * undo this addition at a later time using {@link
 * module:lib/simple_event_emitter~SimpleEventEmitter#removeEventListener
 * removeEventListener}, it can pass this return value as the listener
 * to remove. (Client code peeking at the return value and relying on
 * what it finds does so at its own risk. The way the identifier is
 * created could change in future versions of this code.)
 */
SimpleEventEmitter.prototype.addOneTimeEventListener =  function (event_name,
                                                                  listener) {
    var me = function (ev) {
        this.removeEventListener(event_name, me);
        return listener(ev);
    }.bind(this);
    this.addEventListener(event_name, me);
    return me;
};

/**
 * Removes a listener. Calling this method on a listener that is not
 * actually listening to events is a noop.
 *
 * @param {string} event_name The name of the event that was listened to.
 * @param {Function} listener The handler to remove.
 */
SimpleEventEmitter.prototype.removeEventListener = function (event_name,
                                                             listener) {
    var listeners = this._event_listeners[event_name];
    if (listeners === undefined)
        return;

    var index = listeners.lastIndexOf(listener);
    if (index !== -1)
        listeners.splice(index, 1);
};

/**
 * Removes all listeners for a specific event.
 *
 * @param {string} event_name The event whose listeners must all be
 * removed.
 */
SimpleEventEmitter.prototype.removeAllListeners = function(event_name) {
    this._event_listeners[event_name] = [];
};

/**
 * This is the function that the class using this mixin must call to
 * indicate that an event has occurred.
 *
 * @private
 * @param {string} event_name The name of the event to emit.
 * @param ev The event data to provide to handlers. The type can be
 * anything.
 */
SimpleEventEmitter.prototype._emit = function(event_name, ev) {
    if (this._simple_event_emitter_trace)
        console.log("simple_event_emitter emitting:", event_name, "with:",
                    ev);

    var i, ret; // damn hoisting.

    var listeners = this._event_listeners["*"];
    if (listeners && listeners.length > 0) {
        // We take a copy so that if any of the handlers add or remove
        // listeners, they don't disturb our work here.
        listeners = listeners.slice();

        for (i = 0; i < listeners.length; ++i) {
            ret = listeners[i](event_name, ev);
            if (ret === false)
                return;
        }
    }

    listeners = this._event_listeners[event_name];
    if (listeners && listeners.length > 0) {
        // We take a copy so that if any of the handlers add or remove
        // listeners, they don't disturb our work here.
        listeners = listeners.slice();

        for (i = 0; i < listeners.length; ++i) {
            ret = listeners[i](ev);
            if (ret === false)
                return;
        }
    }
};

exports.SimpleEventEmitter = SimpleEventEmitter;

});

//  LocalWords:  Mangalam MPL Dubeau noop ev mixin
