define(function(require,exports,module){

import { Observable } from '../../Observable';
import { materialize } from '../../operator/materialize';
Observable.prototype.materialize = materialize;
//# sourceMappingURL=materialize.js.map
return module.exports;

});
