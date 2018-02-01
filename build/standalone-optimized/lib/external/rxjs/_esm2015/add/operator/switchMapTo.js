define(function(require,exports,module){

import { Observable } from '../../Observable';
import { switchMapTo } from '../../operator/switchMapTo';
Observable.prototype.switchMapTo = switchMapTo;
//# sourceMappingURL=switchMapTo.js.map
return module.exports;

});
