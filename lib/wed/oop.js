define(function (require, exports, module) {
'use strict';
//
// OOP utilities
//

function inherit(inheritor, inherited) {
    function F() {}
    F.prototype = inherited.prototype;
    inheritor.prototype = new F();
    inheritor.prototype.constructor = inheritor;
}

function implement(inheritor, inherited) {
    for(var f in inherited.prototype) {
        inheritor.prototype[f] = inherited.prototype[f];
    }
}

exports.inherit = inherit;
exports.implement = implement;
});
