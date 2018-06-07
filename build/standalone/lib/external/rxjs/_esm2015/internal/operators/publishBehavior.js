define(function(require,exports,module){

import { BehaviorSubject } from '../BehaviorSubject';
import { multicast } from './multicast';
/**
 * @param value
 * @return {ConnectableObservable<T>}
 * @method publishBehavior
 * @owner Observable
 */
export function publishBehavior(value) {
    return (source) => multicast(new BehaviorSubject(value))(source);
}
//# sourceMappingURL=publishBehavior.js.map
return module.exports;

});
