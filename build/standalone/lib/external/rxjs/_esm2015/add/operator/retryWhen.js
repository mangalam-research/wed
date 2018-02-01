define(function(require,exports,module){

import { Observable } from '../../Observable';
import { retryWhen } from '../../operator/retryWhen';
Observable.prototype.retryWhen = retryWhen;
//# sourceMappingURL=retryWhen.js.map
return module.exports;

});
