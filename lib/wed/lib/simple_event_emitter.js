define(function (require, exports, module) {
"use strict";

function SimpleEventEmitter () {
    this._event_listeners = {};
}

SimpleEventEmitter.prototype.addEventListener = function (event_name,
                                                          listener) {
    var listeners = this._event_listeners[event_name];
    if (listeners === undefined)
        listeners = this._event_listeners[event_name] = [];
    listeners.push(listener);
};

SimpleEventEmitter.prototype.addOneTimeEventListener =  function (event_name,
                                                                  listener) {
    var me = function (ev) {
        listener(ev);
        this.removeEventListener(me);
    }.bind(this);
    this.addEventListener(event_name, me);
};

SimpleEventEmitter.prototype.removeEventListener = function (event_name,
                                                             listener) {
    var listeners = this._event_listeners[event_name];
    if (listeners === undefined)
        return;

    var index = listeners.lastIndexOf(listener);
    if (index !== -1)
        listeners.splice(index, 1);
};

SimpleEventEmitter.prototype.removeAllListeners = function(event_name) {
    this._event_listeners[event_name] = [];
};

SimpleEventEmitter.prototype._emit = function(event_name, ev) {
    var listeners = this._event_listeners[event_name];
    if (listeners === undefined)
        return;

    for (var i = 0; i < listeners.length; ++i) {
        var ret = listeners[i](ev);
        if (ret === false)
            return;
    }
};

exports.SimpleEventEmitter = SimpleEventEmitter;

});
