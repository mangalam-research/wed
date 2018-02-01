define(function(require,exports,module){

import { Observable } from '../../Observable';
import { debounce } from '../../operator/debounce';
Observable.prototype.debounce = debounce;
//# sourceMappingURL=debounce.js.map
return module.exports;

});
