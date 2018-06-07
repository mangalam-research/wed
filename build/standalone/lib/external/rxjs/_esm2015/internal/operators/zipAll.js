define(function(require,exports,module){

import { ZipOperator } from '../observable/zip';
export function zipAll(project) {
    return (source) => source.lift(new ZipOperator(project));
}
//# sourceMappingURL=zipAll.js.map
return module.exports;

});
