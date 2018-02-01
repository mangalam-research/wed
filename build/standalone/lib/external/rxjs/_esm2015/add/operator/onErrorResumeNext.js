define(function(require,exports,module){

import { Observable } from '../../Observable';
import { onErrorResumeNext } from '../../operator/onErrorResumeNext';
Observable.prototype.onErrorResumeNext = onErrorResumeNext;
//# sourceMappingURL=onErrorResumeNext.js.map
return module.exports;

});
