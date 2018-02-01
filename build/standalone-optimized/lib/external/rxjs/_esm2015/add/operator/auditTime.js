define(function(require,exports,module){

import { Observable } from '../../Observable';
import { auditTime } from '../../operator/auditTime';
Observable.prototype.auditTime = auditTime;
//# sourceMappingURL=auditTime.js.map
return module.exports;

});
