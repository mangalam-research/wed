define(function(require,exports,module){

import { shareReplay as higherOrder } from '../operators/shareReplay';
/**
 * @method shareReplay
 * @owner Observable
 */
export function shareReplay(bufferSize, windowTime, scheduler) {
    return higherOrder(bufferSize, windowTime, scheduler)(this);
}
;
//# sourceMappingURL=shareReplay.js.map
return module.exports;

});
