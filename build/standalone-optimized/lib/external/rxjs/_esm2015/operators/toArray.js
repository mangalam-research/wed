define(function(require,exports,module){

import { reduce } from './reduce';
function toArrayReducer(arr, item, index) {
    arr.push(item);
    return arr;
}
export function toArray() {
    return reduce(toArrayReducer, []);
}
//# sourceMappingURL=toArray.js.map
return module.exports;

});
