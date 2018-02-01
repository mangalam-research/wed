define(function(require,exports,module){

import { Observable } from '../../Observable';
import { letProto } from '../../operator/let';
Observable.prototype.let = letProto;
Observable.prototype.letBind = letProto;
//# sourceMappingURL=let.js.map
return module.exports;

});
