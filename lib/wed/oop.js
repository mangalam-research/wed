define(function (require, exports, module) {
'use strict';
//
// OOP utilities
//

function inherit(inheritor, inherited) {
    inheritor.prototype = Object.create(inherited.prototype);
    inheritor.prototype.constructor = inheritor;
}

function implement(inheritor, inherited) {
    var from = (inherited.prototype !== undefined) ? inherited.prototype
            : inherited;
    for(var f in from)
        inheritor.prototype[f] = from[f];
}

exports.inherit = inherit;
exports.implement = implement;
});
