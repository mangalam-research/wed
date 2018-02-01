define(function(require,exports,module){

import { Observable } from '../../Observable';
import { concatMap } from '../../operator/concatMap';
Observable.prototype.concatMap = concatMap;
//# sourceMappingURL=concatMap.js.map
return module.exports;

});
