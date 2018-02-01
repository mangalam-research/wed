define(function(require,exports,module){

import { Observable } from '../../Observable';
import { mergeMap } from '../../operator/mergeMap';
Observable.prototype.mergeMap = mergeMap;
Observable.prototype.flatMap = mergeMap;
//# sourceMappingURL=mergeMap.js.map
return module.exports;

});
