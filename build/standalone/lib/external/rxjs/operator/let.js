define(function(require,exports,module){

"use strict";
/**
 * @param func
 * @return {Observable<R>}
 * @method let
 * @owner Observable
 */
function letProto(func) {
    return func(this);
}
exports.letProto = letProto;
//# sourceMappingURL=let.js.map
return module.exports;

});
