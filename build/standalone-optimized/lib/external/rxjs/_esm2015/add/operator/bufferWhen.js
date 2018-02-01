define(function(require,exports,module){

import { Observable } from '../../Observable';
import { bufferWhen } from '../../operator/bufferWhen';
Observable.prototype.bufferWhen = bufferWhen;
//# sourceMappingURL=bufferWhen.js.map
return module.exports;

});
