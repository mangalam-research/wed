define(function(require,exports,module){

"use strict";
function isScheduler(value) {
    return value && typeof value.schedule === 'function';
}
exports.isScheduler = isScheduler;
//# sourceMappingURL=isScheduler.js.map
return module.exports;

});
