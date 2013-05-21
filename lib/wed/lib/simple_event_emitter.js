define(function (require, exports, module) {
"use strict";

function SimpleEventEmitter () {
    this._event_listeners = {};
}

(function () {
    this.addEventListener = this.on = function (event_name, listener) {
        var listeners = this._event_listeners[event_name];
        if (listeners === undefined)
            listeners = this._event_listeners[event_name] = [];
        listeners.push(listener);
    };

    this.removeEventListener = this.off = function (event_name, listener) {
        var listeners = this._event_listeners[event_name];
        if (listeners === undefined)
            return; 
        
        var index = listeners.lastIndexOf(listener);
        if (index !== -1)
            listeners.splice(index, 1);
    };

    this.removeAllListeners = function(event_name) {
        this._event_listeners[event_name] = [];
    };

    this._emit = function(event_name, ev) {
        var listeners = this._event_listeners[event_name];
        if (listeners === undefined)
            return;
        
        for (var i = 0; i < listeners.length; ++i) {
            var ret = listeners[i](ev);
            if (ret === false)
                return;
        }
    };
}).call(SimpleEventEmitter.prototype);

exports.SimpleEventEmitter = SimpleEventEmitter;

});
