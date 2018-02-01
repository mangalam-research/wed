define(function(require,exports,module){

import { Observable } from '../../Observable';
import { subscribeOn } from '../../operator/subscribeOn';
Observable.prototype.subscribeOn = subscribeOn;
//# sourceMappingURL=subscribeOn.js.map
return module.exports;

});
