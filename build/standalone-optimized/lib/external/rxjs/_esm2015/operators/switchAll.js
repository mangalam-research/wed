define(function(require,exports,module){

import { switchMap } from './switchMap';
import { identity } from '../util/identity';
export function switchAll() {
    return switchMap(identity);
}
//# sourceMappingURL=switchAll.js.map
return module.exports;

});
