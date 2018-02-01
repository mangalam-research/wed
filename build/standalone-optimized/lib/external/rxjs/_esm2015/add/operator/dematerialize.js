define(function(require,exports,module){

import { Observable } from '../../Observable';
import { dematerialize } from '../../operator/dematerialize';
Observable.prototype.dematerialize = dematerialize;
//# sourceMappingURL=dematerialize.js.map
return module.exports;

});
