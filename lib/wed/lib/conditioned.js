define(function (require, exports, module) {
"use strict";

function Conditioned () {
    this._conditions = {};
}

Conditioned.prototype.setCondition = function (name, ev) {
    if (this._conditions[name] === undefined) {
        this._conditions[name] = true;
        this._emit(name, ev);
    }
};

Conditioned.prototype.whenCondition = function (name, handler) {
    if (this._conditions[name])
        handler();
    else
        this.addOneTimeEventListener(name, handler);
};

exports.Conditioned = Conditioned;

});
