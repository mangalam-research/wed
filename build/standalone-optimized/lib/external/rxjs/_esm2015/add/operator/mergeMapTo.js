define(function(require,exports,module){

import { Observable } from '../../Observable';
import { mergeMapTo } from '../../operator/mergeMapTo';
Observable.prototype.flatMapTo = mergeMapTo;
Observable.prototype.mergeMapTo = mergeMapTo;
//# sourceMappingURL=mergeMapTo.js.map
return module.exports;

});
