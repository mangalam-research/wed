define(function(require,exports,module){

import { Observable } from '../../Observable';
import { distinctUntilChanged } from '../../operator/distinctUntilChanged';
Observable.prototype.distinctUntilChanged = distinctUntilChanged;
//# sourceMappingURL=distinctUntilChanged.js.map
return module.exports;

});
