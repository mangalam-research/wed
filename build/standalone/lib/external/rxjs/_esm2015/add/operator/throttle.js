define(function(require,exports,module){

import { Observable } from '../../Observable';
import { throttle } from '../../operator/throttle';
Observable.prototype.throttle = throttle;
//# sourceMappingURL=throttle.js.map
return module.exports;

});
